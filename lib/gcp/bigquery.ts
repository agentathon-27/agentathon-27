// BigQuery integration — production path.
//
// Per .agent/rules.md §2.4, structured budget line items should be stored in
// BigQuery to enable full-text search and analytical queries. For the
// Agentathon demo we ship a curated dataset in lib/budget/data.ts so the agent
// has reliable ground truth without depending on external infra.
//
// To enable BigQuery in production:
//   1. Create a dataset (default name: BIGQUERY_DATASET=budget_watchdog).
//   2. Create the schema below.
//   3. Install @google-cloud/bigquery and wire the calls below.
//   4. Run Document AI extraction (lib/gcp/documentai.ts) and stream rows here.

export const BUDGET_LINE_ITEM_SCHEMA = [
  { name: "county", type: "STRING", mode: "REQUIRED" },
  { name: "fiscal_year", type: "STRING", mode: "REQUIRED" },
  { name: "department", type: "STRING", mode: "REQUIRED" },
  { name: "program", type: "STRING", mode: "NULLABLE" },
  { name: "ward", type: "STRING", mode: "NULLABLE" },
  { name: "allocation_kes", type: "NUMERIC", mode: "REQUIRED" },
  { name: "recurrent_kes", type: "NUMERIC", mode: "NULLABLE" },
  { name: "development_kes", type: "NUMERIC", mode: "NULLABLE" },
  { name: "previous_year_kes", type: "NUMERIC", mode: "NULLABLE" },
  { name: "description", type: "STRING", mode: "NULLABLE" },
  { name: "source_pdf", type: "STRING", mode: "NULLABLE" },
  { name: "source_page", type: "INT64", mode: "NULLABLE" },
  { name: "ingested_at", type: "TIMESTAMP", mode: "REQUIRED" },
] as const;

export interface BudgetLineItem {
  county: string;
  fiscal_year: string;
  department: string;
  program?: string;
  ward?: string;
  allocation_kes: number;
  recurrent_kes?: number;
  development_kes?: number;
  previous_year_kes?: number;
  description?: string;
  source_pdf?: string;
  source_page?: number;
  ingested_at: string;
}

export async function insertBudgetLineItems(_rows: BudgetLineItem[]): Promise<void> {
  const dataset = process.env.BIGQUERY_DATASET;
  if (!dataset) {
    throw new Error(
      "BigQuery not configured. Set BIGQUERY_DATASET and GCP_PROJECT_ID, install @google-cloud/bigquery, " +
      "and create a table using BUDGET_LINE_ITEM_SCHEMA. The Agentathon demo uses lib/budget/data.ts.",
    );
  }
  throw new Error("BigQuery integration stub — implement using @google-cloud/bigquery streaming inserts.");
}

export async function queryBudgetLineItems(_sql: string): Promise<BudgetLineItem[]> {
  throw new Error("BigQuery integration stub — implement using @google-cloud/bigquery query API.");
}
