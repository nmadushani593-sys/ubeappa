const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

async function sendTextMessage(phoneNumberId, accessToken, to, body) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body }
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function sendMediaMessage(phoneNumberId, accessToken, to, type, link, caption = '') {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type,
    [type]: { link }
  };

  if (caption && ['image', 'video', 'document'].includes(type)) {
    payload[type].caption = caption;
  }

  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  return response.data;
}

async function sendTemplateMessage(phoneNumberId, accessToken, to, templateName, languageCode, components = []) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components }
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function getPhoneNumberDetails(phoneNumberId, accessToken) {
  const response = await axios.get(
    `${GRAPH_API_BASE}/${phoneNumberId}`,
    {
      params: {
        fields: 'certificate,display_phone_number,verified_name,quality_rating,code_verification_status,status',
        access_token: accessToken
      }
    }
  );
  return response.data;
}

async function registerPhoneNumber(phoneNumberId, accessToken, pin, certificate) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/register`,
    {
      messaging_product: 'whatsapp',
      pin,
      certificate
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function requestVerificationCode(phoneNumberId, accessToken, codeMethod) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/request_code`,
    { code_method: codeMethod, language: 'en_US' },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function verifyCode(phoneNumberId, accessToken, code) {
  const response = await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/verify_code`,
    { code },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function markMessageAsRead(phoneNumberId, accessToken, messageId) {
  await axios.post(
    `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
    { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

async function getMediaUrl(mediaId, accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data.url;
}

module.exports = {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  getPhoneNumberDetails,
  registerPhoneNumber,
  requestVerificationCode,
  verifyCode,
  markMessageAsRead,
  getMediaUrl
};
