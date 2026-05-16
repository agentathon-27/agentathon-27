# 🐕 County Budget Watchdog — GDG Nairobi Agentathon 2026

> **Challenge Track 04** — Build an AI agent that turns a 400-page county budget PDF into plain-language answers for ward residents. Monitor gazette notices for amendments. Generate SMS budget digests.

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
- [ ] Agent architecture — which agents, what tools, how they communicate
- [ ] How to run locally
- [ ] How to interact with the deployed version
- [ ] Screenshots or demo video link
- [ ] Team members and roles

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
