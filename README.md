<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-Paytm%20Build%20for%20India-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Track%203-Autonomous%20Teammate-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-4%20Agent%20Court-green?style=for-the-badge" />
</p>

# ⚖️ Nyaya — AI-Powered Autonomous Dispute Resolution Engine

> **Nyaya** (न्याय — Sanskrit for *Justice*) is an autonomous AI teammate that resolves Paytm payment disputes in real-time using a **4-Agent Adversarial Court System**. Instead of a single AI making decisions, Nyaya simulates a full courtroom — with an Evidence Analyst, Merchant Advocate, Customer Advocate, and an impartial Judge — producing transparent, explainable, confidence-scored verdicts in under 30 seconds.

---

## 🎯 Problem Statement

E-commerce platforms like Paytm process **millions of payment disputes** daily. Current manual review processes are:
- **Slow** — Average resolution takes 7-14 business days
- **Expensive** — Each dispute costs ₹200-500 in human reviewer time
- **Inconsistent** — Different reviewers reach different conclusions for identical cases
- **Opaque** — Customers rarely understand why their claim was approved or denied

## 💡 Our Solution

Nyaya acts as an **Autonomous Dispute Teammate** that:

1. **Accepts disputes via natural language chat** — customers describe their issue, attach evidence photos
2. **Runs a 4-Agent Adversarial Trial** — four specialized AI agents analyze, argue, and judge each case
3. **Produces an explainable verdict** — with confidence scores, reasoning chains, and recommended actions
4. **Routes intelligently** — auto-executes high-confidence verdicts, escalates uncertain ones to humans
5. **Learns from history** — Cognee-powered memory layer detects fraud patterns and repeat claimants

---

## 🏛️ How the 4-Agent Court Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    📋 DISPUTE FILED                             │
│         "My headphones arrived broken, box was crushed"         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  🔍 EVIDENCE AGENT                                              │
│  Analyzes: Photos, delivery tracking, OTP status, receipts      │
│  Output: Neutral fact summary + evidence strength score (0-100) │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│  🏪 MERCHANT AGENT   │  │  👤 CUSTOMER AGENT   │
│  Argues merchant's   │  │  Argues customer's   │
│  strongest defense    │  │  strongest case      │
│  using policies &     │  │  using RBI consumer  │
│  fulfillment records  │  │  protection rules    │
└──────────┬───────────┘  └──────────┬───────────┘
           └────────────┬────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  ⚖️ JUDGE AGENT                                                 │
│  Weighs both sides + evidence + fraud patterns + memory          │
│  Issues: FULL_REFUND | PARTIAL_REFUND | DENY | ESCALATE          │
│  With: Confidence %, reasoning chain, fraud flags                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ≥ 90%        60-89%        < 60%
      Auto-Execute   Human HITL    Escalate
       (Instant)     (Approve/     (Full
                      Override)    Review)
```

### Confidence-Based Routing

| Confidence | Action | Description |
|:----------:|--------|-------------|
| **≥ 90%** | 🟢 Auto-executed | Refund/denial processed instantly |
| **60–89%** | 🟡 Human-in-the-loop | Verdict prepared, human approves or overrides |
| **< 60%** | 🔴 Escalated | Flagged for senior investigator |

---

## ✨ Key Features

### 🤖 AI Chat Workspace
- Natural language dispute filing with context-aware responses
- Drag & drop evidence upload (photos → **AWS S3** → **Rekognition** auto-analysis)
- Preset dispute templates for quick testing
- Real-time streaming "agent thinking" animation during resolution

### 🧠 Cognee Memory Layer
- **Fraud detection**: Flags repeat claimants with 3+ disputes as HIGH risk
- **Precedent matching**: Recalls similar past cases for consistent verdicts
- **Buyer/merchant history**: Builds profiles over time for smarter decisions

### 📊 Resolution Analytics Dashboard
- Live dispute queue with status tracking
- Confidence distribution charts
- Approval/override/escalation metrics
- Per-agent voting breakdown

### 🏪 Merchant Simulation
- AI-simulated merchant responses to verdicts (ACCEPT/NEGOTIATE/DISPUTE/IGNORE)
- Escalation risk assessment
- Counter-offer prediction

### 👨‍💼 Human-in-the-Loop Approval
- One-click approve/override for medium-confidence verdicts
- Override reason tracking for compliance
- Proactive alerts for aging cases and high-value disputes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express |
| **LLM Engine** | Groq Cloud (LLaMA 3.3 70B for Judge, LLaMA 3.1 8B for others) |
| **Evidence Storage** | AWS S3 (presigned uploads) |
| **Image Analysis** | AWS Rekognition (label detection on evidence photos) |
| **Memory/RAG** | Cognee (buyer/merchant history, fraud patterns) |
| **Database** | AWS DynamoDB (cases) + in-memory mock for demo |
| **Streaming** | Server-Sent Events (SSE) for real-time agent progress |
| **Hosting** | Firebase Hosting (frontend) + Render.com (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm
- A free [Groq API key](https://console.groq.com/)

### 1. Clone & Install

```bash
git clone https://github.com/Anupk17/Nyaya.git
cd Nyaya

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Groq API key(s)
```

**Required environment variables:**

```env
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: separate keys per agent (avoids rate limits)
GROQ_API_KEY_EVIDENCE=gsk_...
GROQ_API_KEY_MERCHANT=gsk_...
GROQ_API_KEY_CUSTOMER=gsk_...
GROQ_API_KEY_JUDGE=gsk_...

# AWS (optional — enables S3 evidence uploads + Rekognition)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

### 3. Start Development

```bash
# Start both server and client concurrently
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |

---

## 📁 Project Structure

```
Nyaya/
├── server/                     # Express backend API
│   ├── agents/                 # 4 AI agent modules
│   │   ├── evidence.js         # 🔍 Evidence analysis agent
│   │   ├── merchant.js         # 🏪 Merchant advocate agent
│   │   ├── customer.js         # 👤 Customer advocate agent
│   │   ├── judge.js            # ⚖️ Judge agent (final verdict)
│   │   └── pipeline.js         # Orchestrates all 4 agents
│   ├── lib/
│   │   └── aws.js              # S3, Rekognition, DynamoDB clients
│   ├── data/                   # Mock transaction & dispute data
│   ├── db.js                   # Database layer (DynamoDB + mock)
│   ├── mockApi.js              # Fallback mock data
│   ├── routes.js               # All API endpoints
│   └── index.js                # Server entry point
│
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AIChatWorkspace.jsx   # Main AI chat + resolution UI
│   │   │   ├── Dashboard.jsx         # Dispute queue overview
│   │   │   ├── CaseDetail.jsx        # Individual case view
│   │   │   ├── Impact.jsx            # Analytics dashboard
│   │   │   └── LiveDispute.jsx       # Alternative dispute filing
│   │   ├── components/
│   │   │   ├── VerdictCard.jsx       # Verdict display with breakdown
│   │   │   ├── ApprovalActionBar.jsx # Approve/override controls
│   │   │   ├── StatCard.jsx          # Dashboard stat cards
│   │   │   └── ui/                   # Animated UI components
│   │   ├── lib/
│   │   │   ├── api.js                # API client
│   │   │   ├── agentContext.ts       # Memory-enriched agent context
│   │   │   ├── cogneeMemory.ts       # Cognee memory integration
│   │   │   └── proactiveMonitor.ts   # Proactive alerting system
│   │   └── store/
│   │       └── disputeStore.js       # Zustand state management
│   ├── firebase.json           # Firebase Hosting config
│   └── .env.production         # Production API URL (Render)
│
├── cognee_server.py            # Cognee memory microservice
├── render.yaml                 # Render.com deployment config
├── .env.example                # Environment template
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cases` | List all disputes |
| `GET` | `/api/cases/:id` | Get case details |
| `POST` | `/api/cases/:id/resolve` | Run 4-agent pipeline (SSE) |
| `POST` | `/api/cases/:id/approve` | Approve a verdict |
| `POST` | `/api/cases/:id/reject` | Reject a verdict |
| `POST` | `/api/custom-dispute/resolve` | Resolve custom dispute (SSE) |
| `POST` | `/api/chat-assistant` | AI chat copilot |
| `POST` | `/api/merchant-simulate` | Simulate merchant response |
| `GET` | `/api/evidence/upload-url` | Get S3 presigned upload URL |
| `POST` | `/api/evidence/analyze` | Rekognition image analysis |
| `GET` | `/api/stats` | Aggregate analytics |
| `GET` | `/api/health` | Health check |

---

## 🚢 Deployment

### Frontend → Firebase Hosting
```bash
cd client
npm run build
firebase deploy --only hosting
```

### Backend → Render.com
1. Connect this repo on [render.com](https://render.com)
2. Set **Root Directory** to `server`
3. Add environment variables (Groq keys, AWS keys)
4. Deploy as a **Web Service** (free tier)

See [`render.yaml`](render.yaml) for the deployment blueprint.

---

## 🎥 Demo Flow

1. **Open the app** → You land on the AI Chat Workspace
2. **Describe your dispute** or pick a preset (e.g., "Damaged Unboxing")
3. **Attach evidence** (optional) → auto-uploaded to S3, analyzed by Rekognition
4. **Click "⚡ Run Resolution"** → Watch the 4 agents think in real-time
5. **See the verdict** → Confidence score, reasoning, recommended action
6. **Approve or Override** → Human-in-the-loop for medium-confidence cases
7. **Check Analytics** → See resolution trends and agent performance

---

## 👥 Team

Built for the **Paytm Build for India Hackathon — Track 3: Autonomous Teammate**

---

<p align="center">
  <b>⚖️ Nyaya</b> — Because every dispute deserves a fair trial.<br/>
  <i>AI that doesn't just decide — it deliberates.</i>
</p>
