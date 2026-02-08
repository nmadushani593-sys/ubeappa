# 🛰️ DL SMS CLIENT: Operational Tutorial

Welcome to the Death Legion SMS Interception Workspace. This guide will walk you through deploying and using the system.

## 🚀 Deployment (Netlify)
1. **Prepare**: Ensure your `dl_sms_client` folder contains `index.html`, `client.html`, and `bridge.js`.
2. **Upload**: Drag and drop the entire project folder into [Netlify Drop](https://app.netlify.com/drop).
3. **Configure**: The `netlify.toml` file already handles the routing.
4. **Link**: Once deployed, share the URL with your team.

## 📥 How to Use
### 1. The Vault (Inventory)
- Go to the **"The Vault"** tab in the sidebar.
- Here you can see all available phone nodes.
- **Auto-Sync**: The system automatically pulls new numbers from **IVA SMS** every time the sync engine runs.
- **Manual Add**: Use the "Authorize New Node" form at the top of the vault to add a number manually.

### 2. Starting a Session
- Find a number in **The Vault** and click it.
- The number will move to your **Sessions** tab and appear in the main Inbox.
- You can now monitor this number in real-time.

### 3. Captured Codes
- When a code arrives, it will appear in the **Inbox**.
- **Request Code**: Click the "Request Code" button to start a **20-minute capture timer**.
- **Auto-Capture**: If "Bridge Mode" is ON (in Settings), the system will automatically copy any code that arrives to your clipboard.

### 4. Code Cleanup
- If a code is received during an active timer, the number is marked as **Used** and removed from the Vault to prevent reuse.
- If the timer expires (20 mins), the number stays in the Vault for another attempt.

## 🛠️ Tactical Config (Settings)
- **Privacy Shield**: Blurs message content until you hover over it (Use for public streaming).
- **Audio Intercept**: Plays a siren sound when a new packet is captured.
- **Bridge Mode**: Enables instant clipboard transfer for received codes.

---
*Death Legion Intelligence - Stay Anonymous.*
