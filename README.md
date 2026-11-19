# ⚖️ Nyaya — AI Chargeback-Defense Teammate

> **Built for the Cashfree x Sarvam AI Hackathon**  
> *"Chargebacks defended. Not just tracked."*

Nyaya is an autonomous AI chargeback-defense teammate for Cashfree merchants. When a dispute is raised against a merchant on Cashfree PG, Nyaya ingests the dossier, deliberates with a 4-agent consensus engine, recommends **CONTEST**, **ACCEPT**, or **REFUND**, builds the complete evidence pack, and executes the action through Cashfree APIs — **only after a human ops reviewer approves**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│       (Vite · Tailwind CSS · Regional Audio Support)     │
│                                                          │
│  ┌──────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Sidebar  │  │ AI Workspace (/)│  │ History Panel  │  │
│  │ 240px    │  │ Cases (/cases)  │  │ 280px          │  │
│  │ #1C1C1E  │  │ Impact (/impact)│  │ #1C1C1E        │  │
│  └──────────┘  │ Case Detail     │  └────────────────┘  │
│                │ (/case/:id)     │                       │
│                └─────────────────┘                       │
└────────────────────────┬────────────────────────────────┘
                         │ /api/* (Vite Proxy - No Keys in UI)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Express API Server                    │
│                      Port 3001                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              4-Agent Deliberation                 │   │
│  │                                                   │   │
│  │  [Evidence Agent] ──► [Merchant Advocate]         │   │
│  │        │                      │                   │   │
│  │        ▼                      ▼                   │   │
│  │  [Cardholder Agent] ──► [Judge Agent]             │   │
│  │                               │                   │   │
│  │                     RECOMMENDATION ONLY           │   │
│  └───────────────────────────────┬──────────────────┘   │
│                                  │ Human Ops Approval   │
│                                  ▼                      │
│                Cashfree PG API Execution                │
│       (/disputes/documents · /accept · /refunds)        │
│                                                          │
│  Groq (qwen/qwen3.8-27b) · Sarvam AI (STT, Translate, TTS)│
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 4-Agent Defense Pipeline

| Agent | Role | Output |
|---|---|---|
| **Evidence Agent** | Evaluates Cashfree order records, delivery proof, OTP logs, and preferred evidence requirements | `{ evidence_strength, covered, missing, fraud_flags, summary }` |
| **Merchant Advocate** | Builds the strongest honest defense for the merchant using only verified fulfillment facts | `{ position, argument_summary, key_defenses, merchant_exposure }` |
| **Cardholder Advocate** | Represents the cardholder and issuing bank under RBI Consumer Protection & Card Network Rules | `{ position, cardholder_arguments, issuer_vulnerabilities }` |
| **Judge Agent** | Delivers a binding AI recommendation, calibrated win likelihood, and complete evidence checklist | Strict JSON: `{ recommendation, win_likelihood, confidence, evidence_checklist, reasoning }` |

### Decision Outcomes
* **`CONTEST`**: Sufficient proof on record (e.g., OTP verified + GPS delivery + invoice). Prepares contest pack with editable factual note.
* **`ACCEPT`**: Merchant has no defense (e.g. damaged goods in transit, defect acknowledged). Concedes dispute on Cashfree.
* **`REFUND`**: Early refund issued to prevent card network chargeback fees when win likelihood is low.
* **`ESCALATE`**: Confidence < 65% or fraud flags detected (e.g. stolen card, identity theft claim). Routed to senior ops investigator.

---

## 🇮🇳 Sarvam AI Integration

1. **Voice-First Defense**: Merchants speak in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, or Gujarati. Transcribed via Sarvam Saaras STT (`POST /api/sarvam/stt`) and translated to English for agent deliberation.
2. **Verdict Audio Readout**: Ops reviewers can click "Listen" to hear the verdict and reasoning spoken naturally in their chosen Indic language via Sarvam Bulbul TTS (`POST /api/sarvam/tts`).
3. **Bilingual Customer Reply Draft**: Automatically drafts polite customer communications (refund notices or contest explanations) in English alongside translated vernacular text side-by-side (`POST /api/sarvam/customer-draft`).

---

## ⚡ Cashfree PG Integration

The backend adapter (`server/cashfree/cashfreeClient.js`) supports dual execution modes:

* **Mock Mode (`CASHFREE_MODE=mock`)**: Seeded with 6 realistic disputes with complete Cashfree field shapes (including red `< 24h` deadline countdowns, fraud claims, and delivery statuses).
* **Sandbox Mode (`CASHFREE_MODE=sandbox`)**: Direct API integration with `https://sandbox.cashfree.com/pg` with retry logic and headers:
  * `x-client-id`
  * `x-client-secret`
  * `x-api-version: 2023-08-01`

### Endpoints Implemented
* `GET /api/disputes`: List disputes from Cashfree adapter.
* `GET /api/disputes/:id`: Fetch complete dispute dossier and audit history.
* `POST /api/disputes/:id/analyze`: Run 4-agent consensus engine via SSE.
* `POST /api/disputes/:id/upload`: Upload local evidence files to `/uploads/{disputeId}/`.
* `POST /api/disputes/:id/execute`: Requires `approvedBy` and valid verdict. Idempotent execution with audit logging.

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy `.env.example` to `server/.env` and supply your credentials:

```env
PORT=3001
CASHFREE_MODE=mock            # mock | sandbox
CASHFREE_CLIENT_ID=           # Your Cashfree App ID
CASHFREE_CLIENT_SECRET=       # Your Cashfree Secret Key
CASHFREE_API_VERSION=2023-08-01
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
SARVAM_API_KEY=               # Your Sarvam AI Subscription Key
GROQ_API_KEY=                 # Your Groq API Key
```

> **Security Note:** All secrets remain strictly on the backend. No secret `VITE_*` keys are exposed to the client.

### 2. Run Servers

```bash
# Terminal 1 — Backend (Port 3001)
cd server
npm start

# Terminal 2 — Frontend (Port 5173)
cd client
npm run dev
```

Visit **http://localhost:5173** to access Nyaya.

---

## 📄 License

MIT — Built for the Cashfree x Sarvam AI Hackathon.
