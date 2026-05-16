// Document AI Layout Parser integration — production path.
//
// Per .agent/rules.md §2.1, structured table extraction from county budget
// PDFs should go through Document AI. For the Agentathon demo we feed PDFs
// directly to Gemini 1.5 Pro's long context (see lib/agents/budget-analyst.ts),
// which works well for Q&A but is less reliable for line-item table extraction.
//
// To enable Document AI in production:
//   1. Create a Layout Parser processor in the GCP console.
//   2. Set DOCUMENT_AI_PROCESSOR_ID and GCP_PROJECT_ID / GCP_LOCATION.
//   3. Install @google-cloud/documentai and wire the call below.
//   4. Map extracted tables to the BigQuery schema in lib/gcp/bigquery.ts.

export interface ExtractedTable {
  pageNumber: number;
  headers: string[];
  rows: string[][];
}

export interface DocAiResult {
  text: string;
  tables: ExtractedTable[];
}

export async function extractWithDocumentAI(): Promise<DocAiResult> {
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
  if (!processorId) {
    throw new Error(
      "Document AI processor not configured. Set DOCUMENT_AI_PROCESSOR_ID, GCP_PROJECT_ID, and GCP_LOCATION, " +
      "then install @google-cloud/documentai. The Agentathon demo uses Gemini long-context PDF Q&A instead.",
    );
  }
  // Production wiring lives here — intentionally not shipped for the demo
  // to keep the surface area minimal under the deadline.
  throw new Error("Document AI integration stub — implement using @google-cloud/documentai Layout Parser.");
}
