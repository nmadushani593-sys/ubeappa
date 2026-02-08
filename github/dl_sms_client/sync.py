import requests
import json
import hashlib
import re
import time
import os
from datetime import datetime

# --- DEATH LEGION CLOUD INTERCEPTOR (GITHUB SECURE VERSION) ---

CONFIG = {
    "LOGIN": {
        "email": os.environ.get("IVA_EMAIL"), 
        "pass": os.environ.get("IVA_PASS")
    },
    "HOST": "https://www.ivasms.com",
    "FIREBASE": {
        "projectId": os.environ.get("FB_PROJECT_ID"),
        "apiKey": os.environ.get("FB_API_KEY")
    },
    "SUPABASE": {
        "url": os.environ.get("SB_URL"),
        "key": os.environ.get("SB_KEY")
    }
}

session = requests.Session()
seen = set()

def get_token():
    r = session.get(f"{CONFIG['HOST']}/login")
    match = re.search(r'name="_token" value="(.+?)"', r.text)
    return match.group(1) if match else None

def login():
    token = get_token()
    if not token: return False
    payload = {"email": CONFIG["LOGIN"]["email"], "password": CONFIG["LOGIN"]["pass"], "_token": token}
    session.post(f"{CONFIG['HOST']}/login", data=payload)
    return True

def get_csrf():
    r = session.get(f"{CONFIG['HOST']}/portal/dashboard")
    match = re.search(r'name="csrf-token" content="(.+?)"', r.text)
    return match.group(1) if match else None

def scrape():
    csrf = get_csrf()
    if not csrf: return [], []
    
    day = datetime.now().strftime('%m/%d/%Y')
    r = session.post(f"{CONFIG['HOST']}/portal/sms/received/getsms", data={"from": day, "to": day, "_token": csrf})
    
    groups = re.findall(r"getDetials\('(.+?)'\)", r.text)
    incoming = []
    nodes = []

    for gid in groups:
        nr = session.post(f"{CONFIG['HOST']}/portal/sms/received/getsms/number", data={"start": day, "end": day, "range": gid, "_token": csrf})
        phones = re.findall(r"getDetialsNumber\('(.+?)'", nr.text)
        
        for phone in phones:
            nodes.append({"number": phone, "type": gid})
            sr = session.post(f"{CONFIG['HOST']}/portal/sms/received/getsms/number/sms", data={"start": day, "end": day, "Number": phone, "Range": gid, "_token": csrf})
            msgs = re.findall(r'<p class="mb-0">([\s\S]+?)<\/p>', sr.text)
            
            for m in msgs:
                txt = re.sub('<[^<]+?>', '', m).strip()
                hid = hashlib.md5(f"{phone}{txt}".encode()).hexdigest()
                
                if hid not in seen:
                    code = (re.findall(r'\d{3}-?\d{3}', txt) or re.findall(r'\d{4,8}', txt) or ["N/A"])[0]
                    incoming.append({
                        "id": hid, "num": phone, "msg": txt, "code": code,
                        "srv": "WhatsApp" if "whatsapp" in txt.lower() else "SMS",
                        "time": datetime.now().isoformat()
                    })
                    seen.add(hid)
    
    return incoming, nodes

def sync_firebase(msgs, nodes):
    # Simplified Firebase Sync via REST
    url = f"https://firestore.googleapis.com/v1/projects/{CONFIG['FIREBASE']['projectId']}/databases/(default)/documents/sms_sync/latest?key={CONFIG['FIREBASE']['apiKey']}"
    
    fields = {
        "msgs": {"arrayValue": {"values": [{"mapValue": {"fields": {k: {"stringValue": str(v)} for k, v in m.items()}}} for m in msgs]}},
        "nums": {"arrayValue": {"values": [{"mapValue": {"fields": {"number": {"stringValue": n["number"]}, "type": {"stringValue": n["type"]}}}} for n in nodes]}}
    }
    
    requests.patch(url, json={"fields": fields})

def sync_supabase(msgs, nodes):
    headers = {"apikey": CONFIG["SUPABASE"]["key"], "Authorization": f"Bearer {CONFIG['SUPABASE']['key']}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}
    
    if msgs:
        history = [{"msg_id": m["id"], "phone_number": m["num"], "content": m["msg"], "otp_code": m["code"], "service": m["srv"], "received_at": m["time"]} for m in msgs]
        requests.post(f"{CONFIG['SUPABASE']['url']}/rest/v1/dl_sms_history", headers=headers, json=history)
    
    if nodes:
        active = [{"phone_number": n["number"], "provider_type": n["type"], "last_active": datetime.now().isoformat()} for n in nodes]
        requests.post(f"{CONFIG['SUPABASE']['url']}/rest/v1/dl_phone_nodes", headers=headers, json=active)
        
        # Auto-add to Vault (dl_number_sets) if new
        vault_entries = [{"phone_number": n["number"], "set_name": f"IVA-{n['type']}", "service_tag": n['type']} for n in nodes]
        requests.post(f"{CONFIG['SUPABASE']['url']}/rest/v1/dl_number_sets", headers=headers, json=vault_entries)

if __name__ == "__main__":
    print("DL SYNC ENGINE: STARTING...")
    
    # Validation
    required = ["IVA_EMAIL", "IVA_PASS", "FB_PROJECT_ID", "FB_API_KEY", "SB_URL", "SB_KEY"]
    missing = [r for r in required if not os.environ.get(r)]
    if missing:
        print(f"FAILED: Missing GitHub Secrets: {', '.join(missing)}")
        exit(1)

    if login():
        msgs, nodes = scrape()
        print(f"Captured {len(msgs)} new signals. Syncing...")
        sync_firebase(msgs, nodes)
        sync_supabase(msgs, nodes)
        print("SYNC COMPLETE.")
    else:
        print("LOGIN FAILED.")
