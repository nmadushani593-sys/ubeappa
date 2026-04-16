# WhatsApp Business Platform

A production-ready WhatsApp Business messaging platform built from scratch with a Node.js/Express/MongoDB backend and a React/Vite frontend. It supports multi-agent inbox workflows, per-number WhatsApp Business credentials, webhook-driven inbound messaging, AI-assisted replies via OpenRouter, Socket.io real-time events, customer CRM, templates, analytics, and Meta certificate/registration flows.

## Features

- Multi-user authentication with JWT and bootstrap admin registration
- Admin/agent roles with online, away, and offline presence
- Per-user WhatsApp phone number connection flow
- Meta webhook verification by stored `verifyToken`
- Inbound webhook routing by `metadata.phone_number_id`
- Conversation inbox with assignment, notes, filters, unread counts, and live updates
- Customer CRM with editable profiles, tags, notes, and conversation history
- AI auto-replies, intent detection, and suggested agent replies using OpenRouter
- Template management and sending through WhatsApp Cloud API
- Analytics dashboard for volumes, response times, and top agents
- Dockerized local deployment with MongoDB, backend, and frontend services

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io
- Frontend: React 18, Vite, Tailwind CSS, Recharts
- AI: OpenRouter via OpenAI SDK-compatible client
- Real-time: Socket.io
- Deployment: Docker, Docker Compose, Nginx

## Project Structure

```text
ubeappa/
├── backend/
├── frontend/
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

## Prerequisites

Choose one of the following setups.

### Local runtime

- Node.js 20+
- npm 10+
- MongoDB 7+

### Containerized runtime

- Docker
- Docker Compose

## Local Development Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your local values.

### 2. Start the backend

```bash
cd backend
npm run dev
```

### 3. Install frontend dependencies

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Webhook endpoint: `http://localhost:5000/webhook`

## Docker Setup

Run the full stack:

```bash
docker-compose up --build
```

Services:

- MongoDB: `mongodb://localhost:27017`
- Backend: `http://localhost:5000`
- Frontend: `http://localhost`

## First Run Bootstrap

The `POST /api/auth/register` endpoint is open only when no users exist. The first user is automatically assigned the `admin` role.

Example bootstrap request:

```bash
curl -X POST http://localhost:5000/api/auth/register   -H "Content-Type: application/json"   -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

After the first user exists, only authenticated admins can create additional users.

## Connecting WhatsApp Numbers

1. Sign in to the frontend
2. Open `/phone-numbers`
3. Click `Connect Number`
4. Enter:
   - Display Name
   - Phone Number
   - Phone Number ID
   - WABA ID
   - Access Token
   - Verify Token
5. Fetch the certificate
6. Complete code verification and registration

## Meta Webhook Configuration

Set the webhook URL in Meta Developer Console:

```text
https://your-domain.com/webhook
```

Use the same `verifyToken` entered in the Phone Numbers page. Verification is resolved dynamically from the `PhoneNumber` collection.

## API Reference

All responses use the shape:

```json
{
  "success": true,
  "...": "payload"
}
```

### Auth

#### `POST /api/auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "status": "online"
  }
}
```

#### `POST /api/auth/register`

- First user: public bootstrap
- Subsequent users: admin only with `Authorization: Bearer <token>`

#### `GET /api/auth/me`
Returns current user profile.

#### `PUT /api/auth/me`
Update `name`, `email`, `status`, `avatar`.

#### `GET /api/auth/users`
Admin-only list of users with assigned conversation counts.

### Phone Numbers

#### `GET /api/phone-numbers`
List available phone number connections.

#### `POST /api/phone-numbers`
Connect a number.

```json
{
  "displayName": "Hexa bbh",
  "phoneNumber": "+94771234567",
  "phoneNumberId": "12345678901234",
  "wabaId": "9876543210",
  "accessToken": "EA...",
  "verifyToken": "secret-token"
}
```

#### `GET /api/phone-numbers/:id/certificate`
Fetch latest certificate from Meta and persist it.

#### `POST /api/phone-numbers/:id/request-code`

```json
{ "method": "SMS" }
```

#### `POST /api/phone-numbers/:id/verify-code`

```json
{ "code": "123456" }
```

#### `POST /api/phone-numbers/:id/register`

```json
{ "pin": "123456", "certificate": "base64-certificate" }
```

#### `DELETE /api/phone-numbers/:id`
Admin-only delete.

### Conversations

#### `GET /api/conversations?page=1&limit=20&status=open&search=john`
List inbox conversations.

#### `GET /api/conversations/search?q=invoice`
Search by customer name, phone, or message text.

#### `GET /api/conversations/:id`
Get a single conversation with populated relations.

#### `PUT /api/conversations/:id/assign`

```json
{ "agentId": "userId-or-null" }
```

#### `PUT /api/conversations/:id/status`

```json
{ "status": "resolved" }
```

#### `GET /api/conversations/:id/messages?page=1&limit=20&includeNotes=true`
Fetch paginated messages.

#### `POST /api/conversations/:id/messages`

```json
{
  "content": "Hello from support",
  "type": "text"
}
```

#### `POST /api/conversations/:id/notes`

```json
{ "content": "Customer asked for billing follow-up tomorrow." }
```

#### `POST /api/conversations/:id/suggest`

```json
{
  "message": "Can you update me on my order?",
  "conversationId": "conversation-id"
}
```

### Customers

#### `GET /api/customers?search=jane&page=1&limit=20`
List customers.

#### `GET /api/customers/:id`
Get full customer profile plus conversations.

#### `PUT /api/customers/:id`
Update `name`, `email`, `company`, `notes`, `country`, `avatar`.

#### `POST /api/customers/:id/tags`

```json
{ "name": "VIP", "color": "#25D366" }
```

#### `DELETE /api/customers/:id/tags/:tagId`
Remove a tag from the customer.

### Messages + AI

#### `POST /api/messages/suggest-reply`

```json
{
  "message": "I need help with billing",
  "conversationId": "conversation-id"
}
```

Response:

```json
{
  "success": true,
  "suggestions": [
    "I can help with billing.",
    "Can you share your invoice number?",
    "Let me check that for you."
  ]
}
```

#### `POST /api/messages/detect-intent`

```json
{ "message": "Where is my order?" }
```

Response:

```json
{ "success": true, "intent": "ORDER" }
```

#### `GET /api/messages/tags`
List global tags.

#### `POST /api/messages/tags`
Create a tag.

#### `DELETE /api/messages/tags/:id`
Delete a tag.

### Templates

#### `GET /api/templates`
List templates.

#### `POST /api/templates`

```json
{
  "name": "order_update",
  "category": "UTILITY",
  "language": "en_US",
  "body": "Hello {{1}}, your order is on the way.",
  "phoneNumber": "phone-number-id"
}
```

#### `POST /api/templates/:id/send`

```json
{
  "to": "94771234567",
  "phoneNumber": "phone-number-id",
  "components": []
}
```

#### `DELETE /api/templates/:id`
Delete a template.

### Analytics

#### `GET /api/analytics/overview`
Returns:

```json
{
  "success": true,
  "overview": {
    "totalConversations": 12,
    "openConversations": 5,
    "resolvedConversations": 4,
    "totalCustomers": 10,
    "totalMessages": 248,
    "messagesLast24h": 31,
    "avgResponseTimeMinutes": 4.8,
    "onlineAgents": 2
  }
}
```

#### `GET /api/analytics/messages-per-day`
Last 7 days message counts.

#### `GET /api/analytics/top-agents`
Agents sorted by handled conversations.

#### `GET /api/analytics/response-times`
Average response time by agent.

### Webhook

#### `GET /webhook`
Meta verification handshake. Looks up `hub.verify_token` against stored phone number records.

#### `POST /webhook`
Processes:

- Incoming customer messages
- New customer creation
- Conversation auto-creation
- Message status receipts
- Socket notifications
- Auto-reply scheduling
- Mark-as-read requests

## Socket.io Events Reference

### Client emits

- `agent:join` → `{userId}`
- `conversation:join` → `{conversationId}`
- `conversation:leave` → `{conversationId}`
- `typing:start` → `{conversationId}`
- `typing:stop` → `{conversationId}`
- `agent:status` → `{userId, status}`

### Server emits

- `message:new`
- `message:status`
- `conversation:new`
- `conversation:updated`
- `notification`
- `agent:typing`
- `agents:online`
- `agent:statusUpdate`

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Backend port, default `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI features |
| `OPENROUTER_MODEL` | No | OpenRouter model, default `mistralai/mistral-7b-instruct:free` |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS and sockets |
| `META_APP_SECRET` | No | Optional webhook signature verification secret |

## AI Features

The platform uses the OpenAI SDK with `baseURL=https://openrouter.ai/api/v1` so it can call OpenRouter-compatible models.

Implemented AI workflows:

- Suggested replies for the latest customer message
- Intent detection for the conversation view
- Auto-reply generation after a configurable timer if no agent responds

Graceful fallbacks are included when the AI provider is unavailable.

## Architecture Diagram

```text
                         ┌────────────────────────────┐
                         │       React Frontend       │
                         │  Vite + Tailwind + Charts  │
                         └──────────────┬─────────────┘
                                        │ REST + WS
                              ┌─────────▼─────────┐
                              │  Express Backend  │
                              │ Auth/API/Webhook  │
                              └───────┬─────┬─────┘
                                      │     │
                            Socket.io │     │ Mongoose
                                      │     │
                     ┌────────────────▼┐   ┌▼────────────────┐
                     │ Real-time Events │   │     MongoDB     │
                     │ rooms + presence │   │ users/messages  │
                     └─────────────────┘   └─────────────────┘
                                      │
                                      │ HTTPS
                         ┌────────────▼────────────┐
                         │ WhatsApp Cloud API /    │
                         │ Meta Webhooks           │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │ OpenRouter AI Models    │
                         │ auto-reply + intent     │
                         └─────────────────────────┘
```

## Notes

- WhatsApp credentials are stored per phone number record, never globally in environment variables.
- Auto-reply timers are stored in-memory and are appropriate for a single backend instance.
- The repository leaves `dl_sms_client/` untouched and places all new application code inside `backend/` and `frontend/`.
