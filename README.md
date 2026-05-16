# 🐕 County Budget Watchdog — GDG Nairobi Agentathon 2026

> **Challenge Track 04** — Build an AI agent that turns a 400-page county budget PDF into plain-language answers for ward residents. Monitor gazette notices for amendments. Generate SMS budget digests.

🔗 **Live demo:** _<replace with Cloud Run URL after deploy>_
📂 **Repo:** https://github.com/agentathon-27/agentathon-27

---

## 🚀 What's Built

A working **multi-agent system** that answers Kenyan citizens' questions about the **Nairobi City County FY 2025/2026 budget (KES 37.4B across 13 departments and 85 wards)**, monitors Kenya Gazette amendments, and ships SMS-sized digests via Africa's Talking.

### Architecture (as deployed)

```
                       ┌──────────────────────────────────┐
   User (web chat) ──► │  Orchestrator (root agent)        │
                       │  Plans → delegates → composes     │
                       │  Gemini 1.5 Pro · function calling│
                       └──┬───────────┬───────────┬────────┘
                          │           │           │
              delegate_to_…analyst   …monitor   …generator
                          ▼           ▼           ▼
                 ┌────────────┐ ┌──────────┐ ┌────────────┐
                 │BudgetAnalyst│ │ Gazette  │ │  Digest    │
                 │             │ │ Monitor  │ │ Generator  │
                 │ tools:      │ │ tools:   │ │ tools:     │
                 │  - search_  │ │  search_ │ │  generate_ │
                 │    budget_  │ │   gazette│ │    digest  │
                 │    data     │ │  summa-  │ │   send_sms │
                 │  - compare_ │ │   rize_  │ │            │
                 │    allocs   │ │   amend  │ │ Africa's   │
                 │  - get_ward_│ │          │ │ Talking    │
                 │    summary  │ │ Kenya    │ │            │
                 │  - explain_ │ │ Gazette  │ │            │
                 │    term     │ │ corpus   │ │            │
                 │  - PDF long-│ │          │ │            │
                 │    context  │ │          │ │            │
                 └─────────────┘ └──────────┘ └────────────┘
```

**Genuine agentic behavior (per challenge rule):**
- **Planning** — orchestrator decides which specialist(s) to invoke per turn.
- **Tool use** — each sub-agent has its own function-calling tool surface.
- **Memory** — conversational history persists across turns per session ([lib/agents/sessions.ts](lib/agents/sessions.ts)).
- **Autonomous action** — `/api/cron` (gazette scanner) runs on Cloud Scheduler and can fan out SMS alerts.

### Stack as built

| Layer | Tech | File |
|---|---|---|
| Web UI | Next.js 15 (App Router) + React 19 + Tailwind 4 | [app/page.tsx](app/page.tsx) |
| Orchestrator | Gemini 1.5 Pro + function calling (TS SDK) | [lib/agents/orchestrator.ts](lib/agents/orchestrator.ts) |
| BudgetAnalyst | Gemini + structured tools + **PDF long-context** via Gemini Files API | [lib/agents/budget-analyst.ts](lib/agents/budget-analyst.ts) |
| GazetteMonitor | Gemini + curated Kenya Gazette corpus | [lib/agents/gazette-monitor.ts](lib/agents/gazette-monitor.ts) |
| DigestGenerator | Gemini + SMS digest tool + Africa's Talking sender | [lib/agents/digest-generator.ts](lib/agents/digest-generator.ts) |
| SMS | Africa's Talking REST (sandbox + demo-mode fallback) | [lib/sms/africastalking.ts](lib/sms/africastalking.ts) |
| Validation | Zod on every API input | [lib/validation/chat.ts](lib/validation/chat.ts) |
| Production stubs | Document AI + BigQuery wired-but-deferred (see §2 below) | [lib/gcp/](lib/gcp/) |
| Deployment | Docker → Google Cloud Run | [Dockerfile](Dockerfile) |

### Production-path stubs (deliberately deferred under deadline)

Per [.agent/rules.md](.agent/rules.md) §2.1 and §2.4 the production path uses **Document AI Layout Parser** for PDF table extraction and **BigQuery** for structured budget storage. The demo ships these as documented stubs ([lib/gcp/documentai.ts](lib/gcp/documentai.ts), [lib/gcp/bigquery.ts](lib/gcp/bigquery.ts)) and routes live PDF analysis through **Gemini 1.5 Pro's long-context** instead — same user experience, half the moving parts under a 6-hour window.

---

## 🏃 How to Run Locally

```bash
# 1. Clone and install
git clone https://github.com/agentathon-27/agentathon-27.git
cd agentathon-27
npm install

# 2. Configure environment
cp .env.example .env.local
# Set GOOGLE_API_KEY (Gemini API key from https://aistudio.google.com)
# Optionally set AT_USERNAME and AT_API_KEY for real SMS (defaults to demo mode)

# 3. Run dev server
npm run dev
# Open http://localhost:3000
```

**Try these queries:**
- *"Compare health and transport infrastructure spending"* → routes to BudgetAnalyst
- *"What are the latest Kenya Gazette amendments to the Nairobi budget?"* → routes to GazetteMonitor
- *"SMS me a digest about roads spending"* → routes to DigestGenerator
- Upload a real county budget PDF via the **📄 Upload Budget PDF** button → BudgetAnalyst answers from the document

## ☁️ How to Interact with the Deployed Version

1. Open the **Live demo** URL above.
2. Try the quick-action chips to see all three sub-agents fire.
3. Click **📄 Upload Budget PDF** to attach a real Kenyan county budget PDF — subsequent questions will be answered from that document via Gemini's 1M-token context window.
4. Click **📱 Send SMS Digest** to deliver a budget summary to any Kenyan number (demo mode by default; set `AT_API_KEY` for real delivery).

## ☁️ Deploy to Cloud Run

The project is configured for one-click deployment via **Google Cloud Build** or manual deployment via `gcloud`.

### Option 1: Automated Deployment (Cloud Build)

This is the recommended way. It uses the [cloudbuild.yaml](cloudbuild.yaml) file to build the image and deploy it.

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE_NAME=budget-watchdog,_REGION=africa-south1
```

### Option 2: Manual Deployment

```bash
# From repo root, with gcloud authenticated to your GCP project:
gcloud run deploy budget-watchdog \
  --source . \
  --region africa-south1 \
  --allow-unauthenticated
```

Cloud Run will use the [Dockerfile](Dockerfile) (multi-stage, Next.js standalone output, port 8080).

### Environment Variables

Ensure the following environment variables are set in Cloud Run (either via `--set-env-vars` or Secret Manager):

- `GOOGLE_API_KEY`: Your Gemini API key.
- `AT_USERNAME`: Africa's Talking username (defaults to `sandbox`).
- `AT_API_KEY`: Africa's Talking API key.
- `CRON_SECRET`: Secret token for the `/api/cron` endpoint.

To schedule the gazette-amendment scanner:

```bash
gcloud scheduler jobs create http gazette-scan \
  --schedule="0 7 * * *" \
  --uri="https://<CLOUD_RUN_URL>/api/cron?secret=$CRON_SECRET" \
  --http-method=GET
```

## 👥 Team

_Add team members and roles here before submission._

| Name | Role |
|---|---|
| TBD | Orchestrator / Backend |
| TBD | Frontend / UX |
| TBD | Data / Gazette corpus |
| TBD | DevOps / Cloud Run |
| TBD | Product / Demo |

## 📸 Screenshots

_Add screenshots of the chat UI, multi-agent badges, and SMS modal before submission._

---

## 📋 Competition Details

| Field | Detail |
|---|---|
| **Event** | GDG Nairobi Agentathon 2026 |
| **Date** | 16 May 2026 |
| **Venue** | Simba Corp, Nairobi |
| **Time** | 08:00 – 17:00 EAT |
| **Submission Deadline** | **15:30 EAT sharp** (no extensions) |
| **Team Size** | 5 members (assigned at registration) |
| **Challenge Track** | 04 — The County Budget Watchdog |

### Competition Rules Source
- Full rules doc: https://docs.google.com/document/u/0/d/1AOyNCzRxbeEa_vwTcs57EigFb3K2LljTsmZSA1u70Uo/mobilebasic?pli=1

---

## 🎯 Challenge Description (Verbatim from Rules)

> *Every Kenyan county publishes a budget. Almost nobody reads it. Billions leak between allocation and expenditure with no accountability.*
>
> *Build an agent that turns a 400-page county budget PDF into plain-language answers for ward residents. Monitor gazette notices for amendments. Generate SMS budget digests.*
>
> **Suggested stack:** Vertex AI Agent Builder · Document AI · Gemini 1.5 Pro (long context) · Antigravity · BigQuery.

---

## ✅ Mandatory Technical Requirements (ALL must be met)

These are non-negotiable. Projects failing any of these are **disqualified regardless of quality**.

| Requirement | Detail |
|---|---|
| **Tooling** | Must use Google AI Studio, Gemini CLI, Google ADK, Vertex AI Agent Builder, or Antigravity for development. Other Google Cloud services allowed as supporting infrastructure. |
| **Credit Redemption** | All attendees must redeem Google Cloud credits. Credits must be attached to the Cloud project used for development. Redemption link: https://trygcp.dev/claim/deveco-gdg-3e33508424b |
| **Gemini Models** | Applications **must** leverage Gemini models (Pro or Flash) to power **core logic**. Using Gemini only for a minor/decorative feature is NOT sufficient. |
| **Version Control** | Public GitHub repository, accessible by judges at submission time. |
| **Deployment** | Must be deployed to **Google Cloud Run** (or Firebase Hosting for web-only). A working deployment URL is a **prerequisite** for final demo. Local-only = not eligible for top prizes. |
| **Agent Architecture** | Must be a **genuine AI agent** — not merely a chat interface or simple API wrapper. Must demonstrate **planning, tool use, memory, or autonomous action**. Judges are GDEs who build production agents; they will know the difference. |

---

## 📦 Submission Requirements

All four must be submitted via the submission form (shared on-screen during event):

1. **Public GitHub repository URL** — must be public and accessible
2. **Live Cloud Run (or Firebase Hosting) deployment URL** — judges must be able to click and interact
3. **README** (this file — see required sections below)
4. **Demo** (live demo during pitching)

### README Must Include:
- [x] The problem being solved (plain language)
- [x] Agent architecture — which agents, what tools, how they communicate (see top of README)
- [x] How to run locally (see top of README)
- [x] How to interact with the deployed version (see top of README)
- [ ] Screenshots or demo video link (placeholder near top — fill in before submission)
- [ ] Team members and roles (placeholder near top — fill in before submission)

---

## 🏗️ Decided Technical Stack

| Component | Technology | Purpose |
|---|---|---|
| **Agent Framework** | Google ADK (Python) | Multi-agent orchestration, tool use, memory |
| **LLM** | Gemini 1.5 Pro | Core reasoning, long-context PDF analysis, Q&A |
| **PDF Processing** | Gemini 1.5 Pro (long context) / Document AI | Extract text from 400-page budget PDFs |
| **Data Storage** | BigQuery | Store parsed budget data, enable structured queries |
| **SMS** | Africa's Talking API (sandbox) | Send SMS budget digests to residents |
| **Gazette Monitoring** | Web scraping + Gemini analysis | Monitor Kenya Gazette for budget amendments |
| **Deployment** | Google Cloud Run | Production deployment (mandatory) |
| **Web Interface** | Web chat UI | For judges to interact with the agent |

---

## 🧠 Proposed Multi-Agent Architecture

The solution uses Google ADK's hierarchical multi-agent pattern to demonstrate **genuine agentic behavior** (planning, tool use, memory, autonomous action):

```
┌─────────────────────────────────────────┐
│           Orchestrator (Root Agent)       │
│   Routes user queries to specialists     │
│   Manages conversation context/memory    │
└──────────┬──────────┬──────────┬────────┘
           │          │          │
    ┌──────▼──┐ ┌─────▼────┐ ┌──▼───────────┐
    │ Budget  │ │ Gazette  │ │   Digest     │
    │ Analyst │ │ Monitor  │ │  Generator   │
    └─────────┘ └──────────┘ └──────────────┘
```

### Agent Descriptions

#### 1. Orchestrator (Root Agent)
- **Role:** Entry point for all user interactions
- **Behavior:** Understands user intent, routes to the appropriate specialist agent
- **Demonstrates:** Planning, delegation, memory (session context)

#### 2. BudgetAnalyst Agent
- **Role:** RAG over parsed budget PDF; answers budget questions in plain language
- **Tools:**
  - `query_budget_data` — searches parsed budget data in BigQuery
  - `analyze_allocation` — compares allocations across departments/wards
  - `explain_budget_item` — translates budget jargon to plain language
- **Example queries:**
  - *"How much did Nairobi County allocate to Kibra ward health clinics?"*
  - *"Compare education spending between Langata and Westlands"*
  - *"What percentage of the budget goes to roads?"*

#### 3. GazetteMonitor Agent
- **Role:** Checks Kenya Gazette notices for budget amendments
- **Tools:**
  - `search_gazette` — searches gazette data for amendments related to the county budget
  - `summarize_amendment` — explains what changed and its impact
- **Data sources:** Kenya Law (kenyalaw.org), Government Press (governmentpress.go.ke), National Treasury

#### 4. DigestGenerator Agent
- **Role:** Creates SMS-friendly budget summaries and sends them via Africa's Talking
- **Tools:**
  - `generate_digest` — creates a concise SMS-length summary of budget highlights
  - `send_sms` — sends the digest via Africa's Talking API
- **Constraint:** SMS is 160 chars; agent must distill complex budget data into bite-sized messages

---

## ⏱️ Proposed Time/Priority Allocation

The rules explicitly state: *"A focused, working, well-demonstrated solution scores higher than an ambitious, half-built one."*

| Priority | Component | Time | Percentage |
|---|---|---|---|
| 🔴 P0 | PDF ingestion + BudgetAnalyst Q&A agent | ~3.5 hours | 60% |
| 🟡 P1 | Web chat interface for judge interaction | ~1 hour | 20% |
| 🟢 P2 | SMS digest generation via Africa's Talking | ~30 min | 10% |
| 🔵 P3 | Gazette monitoring (can simulate with sample PDF) | ~30 min | 10% |

---

## 🔧 Technical Implementation Plan (Pre-Research Completed)

### Google ADK Setup
```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows

# Install ADK
pip install google-adk

# Initialize project
adk create budget_watchdog
```

### ADK Project Structure
```
budget_watchdog/
├── __init__.py              # Package marker
├── agent.py                 # Root agent definition (must export root_agent)
├── agents/
│   ├── budget_analyst.py    # Budget Q&A agent
│   ├── gazette_monitor.py   # Gazette monitoring agent
│   └── digest_generator.py  # SMS digest agent
├── tools/
│   ├── budget_tools.py      # BigQuery queries, PDF parsing
│   ├── gazette_tools.py     # Gazette search/scraping
│   └── sms_tools.py         # Africa's Talking SMS
├── data/
│   └── (budget PDFs go here)
├── .env                     # API keys (GOOGLE_API_KEY, AT credentials)
├── requirements.txt
├── Dockerfile               # For Cloud Run deployment
└── README.md
```

### Deployment to Cloud Run
```bash
# Option 1: ADK CLI (recommended)
adk deploy cloud_run --with_ui

# Option 2: Manual gcloud
gcloud run deploy budget-watchdog --source .
```

### Africa's Talking SMS (Sandbox)
```python
import africastalking

username = "sandbox"
api_key = "YOUR_SANDBOX_API_KEY"
africastalking.initialize(username, api_key)
sms = africastalking.SMS

# Send budget digest
sms.send("🏛️ Nairobi Budget Alert: Health allocated KES 4.2B...", ["+2547XXXXXXXX"])
```

---

## 📚 Research Completed — Key Findings

### Kenya County Budget PDFs
- **Primary source:** Office of the Controller of Budget — https://cob.go.ke
- **Individual counties:** Format is usually `[countyname].go.ke`
- **Parliament library:** https://libraryir.parliament.go.ke
- **Bajeti Hub:** Aggregates budget transparency data — https://bajetihub.org
- For demo: Target **Nairobi County** budget (most impactful for judges at Simba Corp venue)

### Kenya Gazette Access
- **No public API exists** for Kenya Gazette
- **Kenya Law:** https://www.kenyalaw.org — primary repository, has search tools
- **Government Press:** https://www.governmentpress.go.ke
- **Approach:** For demo, pre-load a sample gazette notice; agent can demonstrate the *capability* to monitor and analyze amendments
- **Keywords to search:** "Public Finance Management", "Appropriation Act", "Budget Policy Statement", "Supplementary Appropriation"

### Gemini 1.5 Pro — Long Context Advantage
- Gemini 1.5 Pro supports **up to 1M+ tokens** context window
- A 400-page PDF is roughly ~200K tokens — fits comfortably in a single context
- This means we can potentially skip complex chunking/RAG and just feed the entire PDF to Gemini for analysis
- **Strategy:** Use Gemini's native long context for direct Q&A; use BigQuery for structured queries on extracted data

### Google ADK Key Patterns
- **LlmAgent class** — define agents with model, tools, instructions
- **Hierarchical composition** — root agent delegates to sub-agents
- **SequentialAgent** — execute sub-agents in order
- **ParallelAgent** — run sub-agents concurrently
- **Agent-as-a-Tool** — register an agent as a tool for another agent
- **Session state** — shared state across agents for memory
- **`adk web`** — built-in dev UI at localhost:8000 for testing
- **`adk deploy cloud_run`** — one-command deployment

---

## 🏆 Judging Criteria Notes

- All solutions graded; **top 3 per challenge** pitch to judges
- Judges are **Google Developer Experts (GDEs)** who build production agents
- They will evaluate:
  - **Genuine agent behavior** — not a chatbot wrapper
  - **Tool use** — agents must use tools meaningfully
  - **Architecture** — clear multi-agent design
  - **Working deployment** — must be live on Cloud Run
  - **README quality** — architecture diagram, run instructions, screenshots
  - **Demo quality** — focused, working, well-demonstrated

---

## ❓ Open Questions (Must Answer Before Building)

These questions were asked but **not yet answered** by the team. They must be resolved before coding begins:

### 1. Budget PDF Source
- **Which county's budget** are we targeting for the demo? (Nairobi recommended)
- **Do we have a budget PDF file**, or need to find one online?

### 2. GCP Project & Credentials
- Is the **Google Cloud project** set up with credits redeemed?
- Is a **Gemini API key** from AI Studio ready?
- Are these APIs enabled: **Document AI, Vertex AI, BigQuery, Cloud Run, Artifact Registry**?

### 3. Africa's Talking SMS
- Is an **Africa's Talking sandbox account** set up?
- Using **sandbox simulator** for demo or production shortcode?

### 4. Interaction Channel Confirmation
- Proposed: **Web chat UI** (primary, for judges) + **SMS** (secondary, for demo)
- Aligned with team's vision?

### 5. Scope Prioritization Confirmation
- Agree with P0-P3 priority order above?

### 6. Team Composition
- How many developers vs non-technical members?
- Is AI (Antigravity) the primary builder, or are others coding in parallel?

### 7. Agent Architecture Confirmation
- Agree with the 4-agent architecture (Orchestrator + BudgetAnalyst + GazetteMonitor + DigestGenerator)?

---

## 🔗 Key Resources & Links

| Resource | URL |
|---|---|
| Competition Rules | https://docs.google.com/document/u/0/d/1AOyNCzRxbeEa_vwTcs57EigFb3K2LljTsmZSA1u70Uo |
| Google Cloud Credits | https://trygcp.dev/claim/deveco-gdg-3e33508424b |
| Credits Redemption Guide | https://docs.google.com/presentation/d/1jdLkb1JPsHRp3NnovI7ZW9Uc1fgykrm_Dbw0hFnRRHQ |
| Google AI Studio | https://aistudio.google.com |
| Google ADK Quickstart | https://adk.dev |
| ADK GitHub (Python) | https://github.com/google/adk-python |
| Vertex AI Agent Builder | https://cloud.google.com/vertex-ai/docs/agents |
| Africa's Talking Sandbox | https://account.africastalking.com/sandbox |
| Kenya Law (Gazette) | https://www.kenyalaw.org |
| Controller of Budget | https://cob.go.ke |
| Project Submission Form | https://forms.gle/6gScDq4yRKJHdJpP8 |

---

## 📌 Pre-Event Checklist

- [ ] Redeem Google Cloud credits
- [ ] Set up GCP project with billing
- [ ] Enable APIs: Cloud Run, Artifact Registry, Cloud Build, Vertex AI, Document AI, BigQuery
- [ ] Get Gemini API key from AI Studio
- [ ] Set up Africa's Talking sandbox account + get API key
- [ ] Install: Python 3.10+, Google Cloud SDK, Git, `google-adk`
- [ ] Configure GitHub SSH/HTTPS access
- [ ] Download target county budget PDF
- [ ] Find a sample Kenya Gazette notice PDF for demo
- [ ] Test `adk web` locally to confirm setup works

---

## 🚫 Code of Conduct Reminders

- All core agent logic **must be written on the day** (pre-existing utility libraries and open-source packages are fine)
- No plagiarism — original work only
- Demos must be **live** (not recorded)
- Respect submission deadline — no pushing code after 15:30
- A **partial but submitted** project beats a complete but unsubmitted one

---

*This README will be updated with architecture diagrams, screenshots, team members, and deployment URLs during the event.*
