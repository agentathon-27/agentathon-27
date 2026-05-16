// Thin facade preserved for backward compatibility. The real work happens in
// lib/agents/orchestrator.ts, which delegates to BudgetAnalyst, GazetteMonitor,
// and DigestGenerator sub-agents.
export { runOrchestrator as chatWithAgent, type AgentResponse } from "./agents/orchestrator";
export { clearSession } from "./agents/sessions";
