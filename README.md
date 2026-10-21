# ⚖️ Nyaya — AI Dispute Resolution System

> **Paytm Build for India Hackathon · Track 3: AI in Fintech**

Nyaya is a fully autonomous, multi-agent AI dispute resolution platform for payment disputes. It replaces the traditional 48–72 hour manual arbitration process with a **3.4-second AI verdict**, powered by a 4-agent deliberation system running on Groq's LLaMA inference engine.

---

## 📸 Screenshots

| AI Dispute Assistant | Dispute Cases Queue | Resolution Analytics |
|---|---|---|
| Chat-based dispute filing with real-time 4-agent verdict | Full case queue with status tracking | ROI metrics, resolution distribution, outperformance data |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│          (Vite · Tailwind CSS · React Router)            │
│                                                          │
│  ┌──────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Sidebar  │  │ AI Chat (/)     │  │ History Panel  │  │
│  │ 240px    │  │ Cases (/cases)  │  │ 280px          │  │
│  │ #0F172A  │  │ Analytics       │  │ #0F172A        │  │
│  └──────────┘  │ (/impact)       │  └────────────────┘  │
│                │ Case Detail     │                       │
│                │ (/case/:id)     │                       │
│                └─────────────────┘                       │
└────────────────────────┬────────────────────────────────┘
                         │ /api/* (Vite proxy)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Express API Server                    │
│                      Port 3001                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              4-Agent Pipeline                     │   │
│  │                                                   │   │
│  │  [Evidence Agent] ──► [Merchant Advocate]         │   │
│  │        │                      │                   │   │
│  │        ▼                      ▼                   │   │
│  │  [Customer Advocate] ──► [Judge Agent]            │   │
│  │                               │                   │   │
│  │                         VERDICT + ACTION          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Groq API (qwen/qwen3.8-27b) · AWS S3 · Rekognition     │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 How the 4-Agent System Works

Each dispute passes through four AI agents sequentially, each with a dedicated Groq API key:

| Agent | Role | Output |
|---|---|---|
| **Evidence Agent** | Analyzes transaction records, delivery status, OTP data, proof attachments | Evidence confidence score + key facts |
| **Merchant Advocate** | Constructs the strongest possible case for the merchant | Merchant verdict + supporting points |
| **Customer Advocate** | Constructs the strongest possible case for the customer | Customer verdict + supporting points |
| **Judge Agent** | Weighs all evidence and positions, delivers a binding verdict | Decision + amount + confidence + reasoning |

### Verdict Outcomes

| Decision | Condition | Action |
|---|---|---|
| `FULL_REFUND` | Confidence ≥ 90% | Auto-executed — UPI reversal initiated |
| `PARTIAL_REFUND` | Confidence 60–89% | Pending human approval |
| `DENY` | Evidence supports merchant | Merchant position upheld |
| `ESCALATE` | Fraud flag or confidence < 60% | Routed to human investigator |

### Refund Pathways

- **Escrow Withhold** — dispute filed within 48h, Paytm withholds merchant payout
- **Merchant Chargeback** — dispute after 48h, formal chargeback through payment network
- **Paytm Goodwill Credit** — merchant unresponsive, amount < ₹500, strong evidence

---

## 📁 Project Structure

```
NYAYA/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AIChatWorkspace.jsx   # Main chat + 4-agent verdict UI
│   │   │   ├── Dashboard.jsx         # Dispute cases queue
│   │   │   ├── Impact.jsx            # Resolution analytics
│   │   │   ├── CaseDetail.jsx        # Individual case view
│   │   │   └── LiveDispute.jsx       # Live dispute filing
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation (240px dark)
│   │   │   ├── TopHeader.jsx         # 60px header bar
│   │   │   ├── HistoryPanel.jsx      # Dispute history (280px dark)
│   │   │   ├── StatCard.jsx          # KPI metric card
│   │   │   ├── CaseListItem.jsx      # Case row component
│   │   │   ├── VerdictCard.jsx       # Verdict display card
│   │   │   ├── AgentMessage.jsx      # Agent output card
│   │   │   ├── ApprovalActionBar.jsx # Human review buttons
│   │   │   └── Stepper.jsx           # Pipeline progress bar
│   │   ├── lib/
│   │   │   └── api.js                # All API calls + SSE streaming
│   │   ├── index.css                 # Tailwind + design tokens
│   │   └── App.jsx                   # Router + 3-column grid layout
│   ├── vite.config.js                # Vite + /api proxy to :3001
│   └── index.html                    # Inter + DM Sans Google Fonts
│
├── server/                        # Node.js / Express API
│   ├── agents/
│   │   ├── pipeline.js            # Orchestrates all 4 agents
│   │   ├── evidence.js            # Evidence analysis agent
│   │   ├── merchant.js            # Merchant advocate agent
│   │   ├── customer.js            # Customer advocate agent
│   │   └── judge.js               # Neutral judge agent
│   ├── data/
│   │   ├── disputes.json          # Mock dispute records
│   │   ├── transactions.json      # Mock transaction records
│   │   └── resolutions.json       # Resolved case log
│   ├── index.js                   # Express server entry point
│   ├── routes.js                  # All API route handlers
│   ├── db.js                      # JSON-based mock database
│   └── mockApi.js                 # Mock data helpers
│
├── .env                           # API keys (not committed)
├── .env.example                   # Key template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com/) (5 keys for best performance — one per agent)

### 1. Clone & install

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
# Required — shared fallback key
GROQ_API_KEY=gsk_your_key_here

# Optional but recommended — one key per agent avoids rate limits
GROQ_API_KEY_EVIDENCE=gsk_...
GROQ_API_KEY_MERCHANT=gsk_...
GROQ_API_KEY_CUSTOMER=gsk_...
GROQ_API_KEY_JUDGE=gsk_...

# Optional — AWS for image evidence analysis
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
USE_AWS=false
S3_BUCKET_NAME=
```

### 3. Run the servers

Open two terminals:

```bash
# Terminal 1 — Backend API server (port 3001)
cd server
node index.js

# Terminal 2 — Frontend dev server (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173**

> ⚠️ Do NOT open `localhost:3001` — that is the API server only. The UI is always at `localhost:5173` (or `5174` if 5173 is in use).

---

## 🖥️ Pages & Features

### AI Dispute Assistant (`/`)
- Chat interface — describe your dispute in plain language
- Scenario preset pills for quick testing (Damaged Unboxing, Counterfeit, Non-Delivery, Wrong Item)
- **File a New Dispute** collapsible form — structured input with product, amount, merchant, description, and file attachment
- Chat history persisted in `localStorage` — survives page refresh
- 4-Agent Resolution Card — dark header strip, confidence ring, decision display, agent vote grid
- Underline tab navigation — Neutral Verdict / Evidence Dossier / Merchant Case / Customer Case
- Footer actions — Copy Summary, Download, Re-Adjudicate

### Dispute Cases Queue (`/cases`)
- Live cases fetched from server
- 4 stat cards — Total / Pending / Resolved / Escalated (with left-border color accents)
- Case rows with 80px monospace ID, product name, buyer/seller, amount, date, status pill

### Resolution Analytics (`/impact`)
- KPI row — Total Resolved / Avg Confidence / Auto-Resolution Rate / Time Saved
- Resolution tier distribution — horizontal bars with counts
- Queue health — 3 mini-cards
- Total Disputed Volume Protected
- Why Nyaya Outperforms — 3 comparison cards

### Case Detail (`/case/:id`)
- Full transaction summary grid
- Customer claim vs Merchant claim (side-by-side, color-coded)
- Step-by-step agent analysis (4 agent cards with colored left borders)
- Verdict card — confidence ring, decision, refund amount, reasoning bullets
- Human approval/rejection buttons for medium-confidence verdicts
- Chat history replay with proper left/right bubbles

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases` | List all dispute cases |
| `GET` | `/api/cases/:id` | Get single case details |
| `POST` | `/api/cases/:id/resolve` | Run 4-agent pipeline (SSE stream) |
| `POST` | `/api/cases/:id/approve` | Human approves medium-confidence verdict |
| `POST` | `/api/cases/:id/reject` | Human rejects verdict → escalate |
| `POST` | `/api/chat-assistant` | AI chat copilot response |
| `POST` | `/api/custom-dispute/resolve` | File + resolve new dispute (SSE stream) |
| `GET` | `/api/stats` | Aggregate analytics data |
| `GET` | `/api/evidence/upload-url` | Get S3 presigned upload URL |
| `POST` | `/api/evidence/analyze` | Analyze image with AWS Rekognition |

### SSE Event Stream Format

`/resolve` endpoints stream Server-Sent Events:

```json
{ "type": "start",          "case_id": "PTM-88213" }
{ "type": "agent_start",    "step": 0, "agent": "evidence" }
{ "type": "agent_complete", "step": 1, "agent": "evidence", "output": {...} }
{ "type": "agent_start",    "step": 1, "agent": "merchant" }
{ "type": "agent_complete", "step": 2, "agent": "merchant", "output": {...} }
{ "type": "agent_start",    "step": 2, "agent": "customer" }
{ "type": "agent_complete", "step": 3, "agent": "customer", "output": {...} }
{ "type": "agent_start",    "step": 3, "agent": "judge" }
{ "type": "agent_complete", "step": 4, "agent": "judge",    "output": {...} }
{ "type": "complete",       "verdict": {...}, "agent_outputs": [...] }
```

---

## ⚡ Performance

| Metric | Nyaya AI | Traditional Manual |
|---|---|---|
| Resolution time | ~3.4 seconds | 48–72 hours |
| Auto-resolution rate | ~85% | 0% |
| Human review required | ~15% (medium confidence) | 100% |
| Fraud detection | Real-time (serial offender check) | Post-facto audit |
| Availability | 24/7 | Business hours only |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| UI Icons | Lucide React |
| Backend | Node.js 26, Express 4 |
| AI Inference | Groq API — `qwen/qwen3.8-27b` |
| Image Analysis | AWS Rekognition |
| File Storage | AWS S3 |
| Fonts | Inter + DM Sans (Google Fonts) |
| Database | JSON flat-file (mock — no external DB required) |

---

## 🔐 Security Notes

- API keys are loaded from `.env` — never committed to version control
- `.env` is listed in `.gitignore`
- Each agent uses a separate API key to avoid cross-agent rate limiting
- The `.env.example` file contains no real credentials

---

## 📄 License

MIT — built for the Paytm Build for India Hackathon.

---

<div align="center">
  <strong>⚖️ Nyaya — Justice, delivered in 3.4 seconds.</strong>
</div>
