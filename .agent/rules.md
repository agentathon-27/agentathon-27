# Agent Instructions: The County Budget Watchdog

## "Where did the 50 million for our ward's water project go?"

> Stack: Next.js · TypeScript · Vertex AI Agent Builder · Document AI · Gemini 1.5 Pro · BigQuery · Africa's Talking SMS · Docker

---

## 0. Purpose & Mental Model

You are building **The County Budget Watchdog**, a platform designed to bring transparency to Kenyan county budgets. These documents are often 400+ pages of complex PDFs that ward residents cannot easily parse.

The agent's job is to:

1.  **Ingest & Structure**: Use Document AI to extract data from budget PDFs and gazette notices.
2.  **Analyze**: Use Gemini 1.5 Pro to reason over the data, identifying allocations, expenditures, and discrepancies.
3.  **Communicate**: Provide a natural language interface (Web + SMS) for residents to ask specific questions about their wards.
4.  **Monitor**: Automatically track amendments in gazette notices and alert users.

Think of the system as a data-heavy pipeline:

- **Source**: County PDFs / Gazette Notices
- **Processor**: Document AI (Layout/OCR) -> Gemini (Structuring) -> BigQuery (Storage)
- **Interface**: Next.js Dashboard + SMS Gateway

---

## 1. Project Directory Structure

```
.
├── app/                       # Next.js App Router (Dashboard)
├── api/                       # API Routes
│   ├── query/                 # Natural language budget queries
│   ├── upload/                # PDF ingestion endpoint
│   ├── sms/                   # SMS inbound/outbound
│   └── cron/                  # Gazette monitoring triggers
├── lib/
│   ├── gcp/                   # Vertex AI, Document AI, BigQuery clients
│   ├── budget/                # Logic for budget analysis
│   ├── sms/                   # SMS delivery logic
│   └── validation/            # Zod schemas
├── components/                # React components
│   ├── dashboard/             # Visualizations for budget data
│   └── ui/                    # shadcn/ui components
├── types/                     # Shared TS types
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 2. Technical Standards

### 2.1 Data Ingestion (Document AI)

- Use **Document AI Layout Parser** for extracting tables from PDFs.
- Standardize all financial figures to a unified BigQuery schema.

### 2.2 LLM Reasoning (Gemini 1.5 Pro)

- Use Gemini's long context window to analyze entire budget sections.
- Prompts must focus on "ward-level granularity" and "plain language translation."

### 2.3 SMS Integration

- Use **Africa's Talking** for SMS digests.
- Responses must be concise (< 160 chars per segment) and support Swahili/English.

### 2.4 Database (BigQuery)

- Store structured budget line items.
- Enable full-text search on budget descriptions.

---

## 3. Development Rules

- **Strict TypeScript**: No `any`. Define schemas for all budget items.
- **Zod Validation**: Every API input and Document AI output must be validated.
- **Environment Safety**: Secrets (GCP keys, AT keys) must never be committed.

---

_Project instructions updated for The County Budget Watchdog pivot._
