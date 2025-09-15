# n8n Gmail Automation Dashboard

Full-stack app to generate leads, write them to Google Sheets, and send templated emails. React + Vite frontend with Firebase Auth/OAuth. Firebase Cloud Functions proxy n8n webhooks and manage Google tokens. Optional AI-based name classification.

## Project Structure

**Frontend:** `frontend/`
- Key UI: `FormatGrid`, `StartEmailScrapping`, `MailFormat`, `StartEmailSending`, `SmsResult`, `GridLayout`

**Backend:** `functions/`
- Entrypoint: `index.js`
- Routes: OAuth `auth.js`, Tokens `tokens.js`, n8n Proxy `n8n.js`
- Token utils: `tokenUtils.js`, Service: `tokenService.js`

## Features

- Google OAuth connect/disconnect, token storage/refresh in Firestore
- Pick Google Drive files and Sheets; auto-load sheet tab names
- Upload JSON queries, run n8n lead generation, write back to Sheets
- Compose dynamic/static email templates and subject
- Send emails via n8n; show send summary
- Optional AI classification with Gemini API key

## Architecture

- **Hosting:** Firebase Hosting serves built frontend (`firebase.json`)
- **Functions:** Express app with long timeouts; proxies to n8n
- **Frontend:** Vite + React + Tailwind (`vite.config.js`, `index.css`)
- **Context:** Gmail state in `useGmail`

## Prerequisites

- Node 22+ for Functions (`functions/package.json`)
- Firebase project with Firestore
- n8n instance reachable from Functions (HTTP)
- Google Cloud OAuth credentials (Client ID/Secret)
- Optional: Gemini API key for AI classification

## Environment Variables

Create these files (do not commit secrets):

- Frontend dev: `.env`
- Frontend prod: `.env.production`
- Functions: `.env`

### Required Keys

**Frontend:**
```
VITE_API_URL
VITE_N8N_WEBHOOK_URL
VITE_N8N_SHEET_WEBHOOK_URL
VITE_N8N_EMAIL_WEBHOOK_URL
VITE_N8N_API_KEY
```

**Functions:**
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
ENCRYPTION_KEY
N8N_API_KEY
```

### Example (dev)

```env
VITE_API_URL=http://localhost:5001/your-project/us-central1/api
VITE_N8N_WEBHOOK_URL=https://your-n8n.domain/webhook/lead-generation
VITE_N8N_SHEET_WEBHOOK_URL=https://your-n8n.domain/webhook/sheet-write
VITE_N8N_EMAIL_WEBHOOK_URL=https://your-n8n.domain/webhook/send-emails
VITE_N8N_API_KEY=your-n8n-api-key
```

Prod: see `.env.production`.

## Local Development

### Install
```bash
# Frontend
cd frontend
npm install

# Functions
cd functions
npm install
```

### Run Functions emulator
```bash
cd functions
npm run serve
```

### Run frontend
```bash
cd frontend
npm run dev
```

Ensure `VITE_API_URL` points to your local Functions emulator. Frontend dev will use `.env`; prod build uses `.env.production`.

## n8n Proxy

Functions proxy to n8n in `n8n.js`. Update `N8N_BASE_URL` to your instance. It returns whatever n8n responds, so frontend can parse status/message in `StartEmailScrapping`.

### Endpoints (Functions)

- `POST /auth/initiate` → start OAuth (`auth.js`)
- `POST /auth/callback` → exchange code, save tokens
- `GET /auth/status/:userId` → connection status
- `DELETE /auth/revoke/:userId` → disconnect
- `GET /tokens/:userId/google` → get valid access token (requires `Authorization: Bearer N8N_API_KEY`)
- `POST /n8n/webhook/lead-generation`
- `POST /n8n/webhook/sheet-write`
- `POST /n8n/webhook/send-emails`

## Using the App

1. Sign in with Google (Login)
2. Connect Gmail (OAuth runs via Functions)
3. Pick a Drive file and a Google Sheet, then a sheet tab (`FileSelectDropDown`)
4. Upload queries JSON in `FormatGrid` (format: `[{ "query": "..." }]`)
5. Optional: Enable AI classification and validate Gemini key in `StartEmailScrapping`
6. Start lead generation; wait for status/message
7. Review Sheet link (`SheetLink`)
8. Set email subject/template in `MailFormat`
9. Send emails in `StartEmailSending`; view summary in `SmsResult`

## Build and Deploy

### Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Functions
```bash
cd functions
firebase deploy --only functions
```

## Contribution Guide

- Fork and create feature branches from `main`
- Keep changes focused; add clear PR descriptions
- Code style: ESLint configs in `eslint.config.js` and `.eslintrc.js`
- UI: Tailwind (v4) utilities in `index.css`
- Do not commit secrets (`.env` files, keys). Ensure `.gitignore` excludes them; relocate any committed secrets out of VCS

### Test

- **Frontend:** `npm run dev` (Vite) and manual flows
- **Functions:** emulator `npm run serve`, call routes with curl/Postman

### Todo

- Prefer configuring N8N base URL via env (todo): replace constant in `n8n.js` with `process.env`

## Troubleshooting

- **404 from n8n:** verify `VITE_N8N_*` URLs and workflow endpoints
- **No response/hanging:** ensure n8n workflow ends with "Respond to Webhook", Functions proxy reachable, and n8n base URL correct (`n8n.js`)
- **CORS:** add your origin to CORS list in `index.js`
- **OAuth failures:** confirm `GOOGLE_CLIENT_ID`/`SECRET` in `.env`, and `redirectUri` matches `${window.location.origin}/auth/callback` used in `gmailService`

## License

Add a LICENSE file if you want to open source
