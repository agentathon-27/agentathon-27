// Budget analysis tool functions — called by Gemini via function calling
import { getCountyData, glossary, formatKES } from "./data";

export interface ToolResult {
  success: boolean;
  data: unknown;
  summary: string;
}

/** Search and filter budget data by keyword, department, or ward */
export function searchBudgetData(countyId: string, args: { query: string; department?: string; ward?: string }): ToolResult {
  const { info: COUNTY_INFO, departments, wardAllocations } = getCountyData(countyId);
  const q = args.query.toLowerCase();
  const results: { department: string; program: string; allocation: string; description: string }[] = [];

  const deptFilter = args.department?.toLowerCase();
  const filteredDepts = deptFilter
    ? departments.filter(d => d.name.toLowerCase().includes(deptFilter) || d.id.toLowerCase().includes(deptFilter))
    : departments;

  for (const dept of filteredDepts) {
    if (dept.name.toLowerCase().includes(q) || dept.id.toLowerCase().includes(q)) {
      results.push({
        department: dept.name,
        program: "TOTAL",
        allocation: formatKES(dept.totalAllocation),
        description: `Recurrent: ${formatKES(dept.recurrent)}, Development: ${formatKES(dept.development)}, Previous Year: ${formatKES(dept.previousYear)}`,
      });
    }
    for (const prog of dept.programs) {
      if (prog.name.toLowerCase().includes(q) || prog.description.toLowerCase().includes(q)) {
        results.push({
          department: dept.name,
          program: prog.name,
          allocation: formatKES(prog.allocation),
          description: prog.description,
        });
      }
    }
  }

  if (args.ward) {
    const wardData = wardAllocations.find(w => w.ward.toLowerCase().includes(args.ward!.toLowerCase()));
    if (wardData) {
      results.push({
        department: `Ward: ${wardData.ward}`,
        program: "Ward Total",
        allocation: formatKES(wardData.totalAllocation),
        description: `Sub-County: ${wardData.subCounty}. Projects: ${wardData.keyProjects.join("; ")}`,
      });
    }
  }

  return {
    success: results.length > 0,
    data: { results, totalResults: results.length, countyInfo: COUNTY_INFO },
    summary: results.length > 0
      ? `Found ${results.length} budget items matching "${args.query}" in ${COUNTY_INFO.name}`
      : `No budget items found for "${args.query}" in ${COUNTY_INFO.name}. Try broader terms like "health", "roads", "education".`,
  };
}

/** Compare allocations between two departments */
export function compareAllocations(countyId: string, args: { department_a: string; department_b: string }): ToolResult {
  const { info: COUNTY_INFO, departments } = getCountyData(countyId);
  const deptA = departments.find(d => d.name.toLowerCase().includes(args.department_a.toLowerCase()) || d.id.toLowerCase().includes(args.department_a.toLowerCase()));
  const deptB = departments.find(d => d.name.toLowerCase().includes(args.department_b.toLowerCase()) || d.id.toLowerCase().includes(args.department_b.toLowerCase()));

  if (!deptA || !deptB) {
    const available = departments.map(d => d.name).join(", ");
    return {
      success: false,
      data: { availableDepartments: available },
      summary: `Could not find one or both departments in ${COUNTY_INFO.name}. Available: ${available}`,
    };
  }

  const diff = deptA.totalAllocation - deptB.totalAllocation;
  const percentDiff = ((diff / deptB.totalAllocation) * 100).toFixed(1);
  const growthA = (((deptA.totalAllocation - deptA.previousYear) / deptA.previousYear) * 100).toFixed(1);
  const growthB = (((deptB.totalAllocation - deptB.previousYear) / deptB.previousYear) * 100).toFixed(1);

  return {
    success: true,
    data: {
      comparison: {
        departmentA: {
          name: deptA.name,
          totalAllocation: formatKES(deptA.totalAllocation),
          recurrent: formatKES(deptA.recurrent),
          development: formatKES(deptA.development),
          previousYear: formatKES(deptA.previousYear),
          yearOnYearGrowth: `${growthA}%`,
          percentOfTotalBudget: `${((deptA.totalAllocation / COUNTY_INFO.totalBudget) * 100).toFixed(1)}%`,
          programs: deptA.programs.map(p => ({ name: p.name, allocation: formatKES(p.allocation) })),
        },
        departmentB: {
          name: deptB.name,
          totalAllocation: formatKES(deptB.totalAllocation),
          recurrent: formatKES(deptB.recurrent),
          development: formatKES(deptB.development),
          previousYear: formatKES(deptB.previousYear),
          yearOnYearGrowth: `${growthB}%`,
          percentOfTotalBudget: `${((deptB.totalAllocation / COUNTY_INFO.totalBudget) * 100).toFixed(1)}%`,
          programs: deptB.programs.map(p => ({ name: p.name, allocation: formatKES(p.allocation) })),
        },
        difference: formatKES(Math.abs(diff)),
        percentDifference: `${Math.abs(Number(percentDiff))}%`,
        higherDepartment: diff > 0 ? deptA.name : deptB.name,
      },
    },
    summary: `${deptA.name} (${formatKES(deptA.totalAllocation)}) vs ${deptB.name} (${formatKES(deptB.totalAllocation)}) in ${COUNTY_INFO.name}. ${diff > 0 ? deptA.name : deptB.name} receives ${formatKES(Math.abs(diff))} more.`,
  };
}

/** Get ward-level budget summary */
export function getWardSummary(countyId: string, args: { ward_name: string }): ToolResult {
  const { info: COUNTY_INFO, wardAllocations } = getCountyData(countyId);
  const ward = wardAllocations.find(w => w.ward.toLowerCase().includes(args.ward_name.toLowerCase()));

  if (!ward) {
    const available = wardAllocations.map(w => w.ward).join(", ");
    return {
      success: false,
      data: { availableWards: available },
      summary: `Ward "${args.ward_name}" not found in ${COUNTY_INFO.name}. Available wards with data: ${available}`,
    };
  }

  const avgAllocation = COUNTY_INFO.totalBudget / (COUNTY_INFO.totalWards || 1);

  return {
    success: true,
    data: {
      ward: ward.ward,
      subCounty: ward.subCounty,
      totalAllocation: formatKES(ward.totalAllocation),
      sectorBreakdown: Object.entries(ward.breakdown).map(([sector, amount]) => ({
        sector,
        allocation: formatKES(amount),
        percentage: `${((amount / ward.totalAllocation) * 100).toFixed(1)}%`,
      })),
      keyProjects: ward.keyProjects,
      comparisonToAverage: formatKES(ward.totalAllocation - avgAllocation),
    },
    summary: `${ward.ward} ward (${ward.subCounty} sub-county) in ${COUNTY_INFO.name} has ${formatKES(ward.totalAllocation)} allocated across ${Object.keys(ward.breakdown).length} sectors.`,
  };
}

/** Explain a budget term in plain language */
export function explainBudgetTerm(args: { term: string }): ToolResult {
  const term = glossary.find(g =>
    g.term.toLowerCase().includes(args.term.toLowerCase()) ||
    args.term.toLowerCase().includes(g.term.toLowerCase())
  );

  if (term) {
    return {
      success: true,
      data: { term: term.term, definition: term.definition },
      summary: `${term.term}: ${term.definition}`,
    };
  }

  return {
    success: false,
    data: { availableTerms: glossary.map(g => g.term).join(", ") },
    summary: `Term "${args.term}" not found in glossary. Available terms: ${glossary.map(g => g.term).join(", ")}`,
  };
}

/** Generate a concise SMS-friendly budget digest */
export function generateSmsDigest(countyId: string, args: { topic?: string; language?: string }): ToolResult {
  const { info: COUNTY_INFO, departments } = getCountyData(countyId);
  const topic = args.topic?.toLowerCase() || "overview";
  const lang = args.language?.toLowerCase() === "sw" ? "sw" : "en";
  let smsMessage: string;

  const shortName = COUNTY_INFO.name.split(" ")[0];

  if (lang === "sw") {
    if (topic.includes("health") || topic.includes("afya")) {
      const dept = departments.find(d => d.id === "health")!;
      smsMessage = `🏥 Bajeti ya Afya ${shortName}: ${formatKES(dept.totalAllocation)} (${((dept.totalAllocation / COUNTY_INFO.totalBudget) * 100).toFixed(0)}% ya jumla). #BudgetWatch`;
    } else if (topic.includes("road") || topic.includes("barabara") || topic.includes("transport")) {
      const dept = departments.find(d => d.id === "transport")!;
      smsMessage = `🛣️ Bajeti ya Barabara ${shortName}: ${formatKES(dept.totalAllocation)}. Imeongezeka kwa ${(((dept.totalAllocation - dept.previousYear) / (dept.previousYear || 1)) * 100).toFixed(0)}%. #BudgetWatch`;
    } else {
      smsMessage = `🏛️ ${shortName} ${COUNTY_INFO.fiscalYear}: ${formatKES(COUNTY_INFO.totalBudget)} jumla. Afya ${formatKES(departments.find(d => d.id === "health")?.totalAllocation || 0)}. #BudgetWatch`;
    }
  } else {
    if (topic.includes("health")) {
      const dept = departments.find(d => d.id === "health")!;
      smsMessage = `🏥 ${shortName} Health Budget: ${formatKES(dept.totalAllocation)} (${((dept.totalAllocation / COUNTY_INFO.totalBudget) * 100).toFixed(0)}% of total). #BudgetWatch`;
    } else if (topic.includes("road") || topic.includes("transport")) {
      const dept = departments.find(d => d.id === "transport")!;
      smsMessage = `🛣️ ${shortName} Roads Budget: ${formatKES(dept.totalAllocation)}. Up ${(((dept.totalAllocation - dept.previousYear) / (dept.previousYear || 1)) * 100).toFixed(0)}% YoY. #BudgetWatch`;
    } else {
      smsMessage = `🏛️ ${shortName} ${COUNTY_INFO.fiscalYear}: ${formatKES(COUNTY_INFO.totalBudget)} total. Health ${formatKES(departments.find(d => d.id === "health")?.totalAllocation || 0)}. #BudgetWatch`;
    }
  }

  return {
    success: true,
    data: { smsMessage, characterCount: smsMessage.length, topic, language: lang },
    summary: `Generated SMS digest for ${COUNTY_INFO.name} in ${lang === "sw" ? "Swahili" : "English"}`,
  };
}

/** Get overall budget summary with key statistics */
export function getBudgetOverview(countyId: string): ToolResult {
  const { info: COUNTY_INFO, departments } = getCountyData(countyId);
  const sortedDepts = [...departments].sort((a, b) => b.totalAllocation - a.totalAllocation);
  const devPercent = ((COUNTY_INFO.totalDevelopment / COUNTY_INFO.totalBudget) * 100).toFixed(1);

  return {
    success: true,
    data: {
      county: COUNTY_INFO.name,
      fiscalYear: COUNTY_INFO.fiscalYear,
      totalBudget: formatKES(COUNTY_INFO.totalBudget),
      recurrent: formatKES(COUNTY_INFO.totalRecurrent),
      development: formatKES(COUNTY_INFO.totalDevelopment),
      developmentPercentage: `${devPercent}%`,
      meetsThreshold: Number(devPercent) >= 30,
      topDepartments: sortedDepts.slice(0, 5).map(d => ({
        name: d.name,
        allocation: formatKES(d.totalAllocation),
        percentage: `${((d.totalAllocation / COUNTY_INFO.totalBudget) * 100).toFixed(1)}%`,
      })),
      totalDepartments: COUNTY_INFO.totalDepartments,
      totalWards: COUNTY_INFO.totalWards,
    },
    summary: `${COUNTY_INFO.name} ${COUNTY_INFO.fiscalYear} budget: ${formatKES(COUNTY_INFO.totalBudget)} across ${COUNTY_INFO.totalDepartments} departments and ${COUNTY_INFO.totalWards} wards.`,
  };
}

// Execute a tool by name
export function executeTool(countyId: string, name: string, args: Record<string, unknown>): ToolResult {
  switch (name) {
    case "search_budget_data":
      return searchBudgetData(countyId, args as { query: string; department?: string; ward?: string });
    case "compare_allocations":
      return compareAllocations(countyId, args as { department_a: string; department_b: string });
    case "get_ward_summary":
      return getWardSummary(countyId, args as { ward_name: string });
    case "explain_budget_term":
      return explainBudgetTerm(args as { term: string });
    case "generate_sms_digest":
      return generateSmsDigest(countyId, args as { topic?: string });
    case "get_budget_overview":
      return getBudgetOverview(countyId);
    default:
      return { success: false, data: null, summary: `Unknown tool: ${name}` };
  }
}
