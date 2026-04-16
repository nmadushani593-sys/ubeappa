const { OpenAI } = require('openai');

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'WhatsApp Business Platform'
  }
});

const MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

async function generateAutoReply(customerMessage, conversationHistory = []) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful WhatsApp customer support agent. Respond concisely and professionally in 1-3 sentences. Be friendly and solution-oriented.'
      },
      ...conversationHistory.slice(-6).map((m) => ({
        role: m.fromCustomer ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: customerMessage }
    ];
    const completion = await client.chat.completions.create({ model: MODEL, messages, max_tokens: 200 });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Auto-reply generation failed:', error.message);
    return 'Thank you for your message. Our team will get back to you shortly.';
  }
}

async function generateSuggestedReplies(customerMessage, conversationHistory = []) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a WhatsApp customer support agent. Generate exactly 3 different short reply suggestions for the agent to send. Return as JSON array: ["reply1", "reply2", "reply3"]. Keep each under 100 characters.'
      },
      ...conversationHistory.slice(-4).map((m) => ({
        role: m.fromCustomer ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: customerMessage }
    ];
    const completion = await client.chat.completions.create({ model: MODEL, messages, max_tokens: 300 });
    const text = completion.choices[0].message.content.trim();
    const arr = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return arr.slice(0, 3);
  } catch (error) {
    console.error('Suggested replies generation failed:', error.message);
    return [
      'Thank you for your message!',
      'I will help you with that.',
      'Could you please provide more details?'
    ];
  }
}

async function detectIntent(message) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'Classify this customer message into one of these categories: GREETING, SUPPORT, COMPLAINT, BILLING, ORDER, QUESTION, FEEDBACK, SPAM, OTHER. Return only the category word.'
      },
      { role: 'user', content: message }
    ];
    const completion = await client.chat.completions.create({ model: MODEL, messages, max_tokens: 20 });
    const result = completion.choices[0].message.content.trim().toUpperCase();
    const valid = ['GREETING', 'SUPPORT', 'COMPLAINT', 'BILLING', 'ORDER', 'QUESTION', 'FEEDBACK', 'SPAM', 'OTHER'];
    return valid.includes(result) ? result : 'OTHER';
  } catch (error) {
    console.error('Intent detection failed:', error.message);
    return 'OTHER';
  }
}

module.exports = { generateAutoReply, generateSuggestedReplies, detectIntent };
