# Backend Server for AI Assistant Mobile App

This is the Node.js/Express backend server that provides secure API proxying for AI services and file processing.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Start the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/chat
Process chat messages with AI (Gemini → OpenAI → Local fallback)

**Request:**
```json
{
  "message": "How can I save money on groceries?"
}
```

**Response:**
```json
{
  "response": "Here are some tips to save money on groceries...",
  "provider": "Gemini",
  "timestamp": "2025-11-20T11:20:26.000Z"
}
```

### POST /api/files/statement
Upload and process bank statements with OCR

**Request:** Multipart form data with `file` field (PDF or image)

**Response:**
```json
{
  "success": true,
  "bankName": "Chase Bank",
  "transactions": [...],
  "count": 6
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T11:20:26.000Z"
}
```

## Adding to Replit Workflows

To run the backend server automatically alongside the mobile app:

1. Open the Workflows pane in Replit
2. Click "Create Workflow"
3. Name it "Start backend server"
4. Add a shell task: `cd server && npm install --silent && npm run dev`
5. Set wait for port: `3001`
6. Edit the "Project" workflow to run both "Start application" and "Start backend server" in parallel

## Security

- API keys are stored in `.env` and never bundled with the mobile app
- CORS is configured to only allow requests from your Replit domain
- Rate limiting prevents abuse (100 requests per 15 minutes)
- File uploads are validated for type and size (max 10MB)

## Architecture

```
server/
├── src/
│   ├── index.ts              # Express app setup
│   ├── routes/               # API route definitions
│   │   ├── chat.ts
│   │   └── files.ts
│   ├── controllers/          # Request handlers
│   │   ├── chatController.ts
│   │   └── filesController.ts
│   ├── services/             # Business logic
│   │   ├── aiProviderService.ts
│   │   └── ocrService.ts
│   ├── middleware/           # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   └── utils/                # Utilities
│       └── logger.ts
├── package.json
├── tsconfig.json
└── .env
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3001) | No |
| NODE_ENV | Environment (development/production) | No |
| GEMINI_API_KEY | Google Gemini API key | Yes* |
| OPENAI_API_KEY | OpenAI API key | Yes* |
| MAX_FILE_SIZE | Max upload size in bytes (default: 10MB) | No |
| ALLOWED_ORIGINS | Comma-separated CORS origins | No |

*At least one AI provider key is required (Gemini or OpenAI)
