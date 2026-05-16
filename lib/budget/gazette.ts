// Sample Kenya Gazette notices for the GazetteMonitor agent.
// Production path: scrape kenyalaw.org / governmentpress.go.ke on a Cloud
// Scheduler cron and store entries in BigQuery (see lib/gcp/bigquery.ts).
// For the hackathon demo, we ship a small curated set so judges can see the
// agent reason over real-shaped data.

export interface GazetteNotice {
  id: string;
  date: string;          // ISO date
  title: string;
  noticeType: "Supplementary Appropriation" | "Public Finance" | "Allocation Adjustment" | "Other";
  county: string | "National";
  body: string;          // 1–3 sentence excerpt
  impact: {
    department?: string;
    delta: number;       // KES, positive = increase, negative = cut
    summary: string;
  };
  source: string;        // canonical URL
}

export const gazetteNotices: GazetteNotice[] = [
  {
    id: "GZ-2026-014",
    date: "2026-03-12",
    title: "Nairobi City County Supplementary Appropriation Act, 2026 (No. 1)",
    noticeType: "Supplementary Appropriation",
    county: "Nairobi City County",
    body: "An Act of the County Assembly of Nairobi City to authorise the issue of an additional KES 1,800,000,000 from the County Revenue Fund to supplement the appropriation for the year ending 30th June, 2026, and to appropriate that sum for certain services and purposes.",
    impact: {
      department: "Health Services",
      delta: 1_800_000_000,
      summary: "Top-up to Health Services for emergency response and Mbagathi maternity expansion; raises Health from KES 12.1B to KES 13.9B.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14210",
  },
  {
    id: "GZ-2026-021",
    date: "2026-04-03",
    title: "Reallocation Notice — Transport & Infrastructure",
    noticeType: "Allocation Adjustment",
    county: "Nairobi City County",
    body: "Notice is given that, pursuant to section 154 of the Public Finance Management Act, KES 420,000,000 has been re-allocated from Storm Water Management to Road Construction & Rehabilitation within the Transport & Infrastructure vote.",
    impact: {
      department: "Transport & Infrastructure",
      delta: 0,
      summary: "Intra-department shift: drainage budget cut by KES 420M, roads budget grown by the same. Net department total unchanged.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14288",
  },
  {
    id: "GZ-2026-029",
    date: "2026-04-21",
    title: "Public Finance Management (County Governments) (Amendment) Regulations, 2026",
    noticeType: "Public Finance",
    county: "National",
    body: "The Cabinet Secretary for the National Treasury makes amendments to the PFM (County Governments) Regulations clarifying ward-level reporting requirements for development expenditure absorption.",
    impact: {
      delta: 0,
      summary: "Affects how all 47 counties report ward-level project absorption. No direct allocation change; tightens accountability.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14310",
  },
  {
    id: "GZ-2026-033",
    date: "2026-05-02",
    title: "Withdrawal Notice — Education, Youth & Sports",
    noticeType: "Allocation Adjustment",
    county: "Nairobi City County",
    body: "KES 220,000,000 originally appropriated to Sports Development has been withdrawn following non-implementation of the Karen-Hardy sports complex contract.",
    impact: {
      department: "Education, Youth & Sports",
      delta: -220_000_000,
      summary: "Sports Development line cut by KES 220M; funds revert to County Revenue Fund pending reallocation.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14342",
  },
];

import { getCountyName } from "./counties";

export function searchGazette(countyId: string, query: string): GazetteNotice[] {
  const countyName = getCountyName(countyId);
  const q = query.toLowerCase().trim();
  
  // Filter by county (matching the selected one OR National)
  const countyFiltered = gazetteNotices.filter((n) => 
    n.county === "National" || 
    n.county.toLowerCase().includes(countyName.toLowerCase()) ||
    countyName.toLowerCase().includes(n.county.toLowerCase())
  );

  if (!q) return countyFiltered;

  return countyFiltered.filter((n) =>
    n.title.toLowerCase().includes(q) ||
    n.body.toLowerCase().includes(q) ||
    n.impact.summary.toLowerCase().includes(q) ||
    n.impact.department?.toLowerCase().includes(q) ||
    n.noticeType.toLowerCase().includes(q)
  );
}

export const gazetteNotices: GazetteNotice[] = [
  {
    id: "GZ-2026-014",
    date: "2026-03-12",
    title: "Nairobi City Supplementary Appropriation Act, 2026 (No. 1)",
    noticeType: "Supplementary Appropriation",
    county: "Nairobi City",
    body: "An Act of the County Assembly of Nairobi City to authorise the issue of an additional KES 1,800,000,000 from the County Revenue Fund to supplement the appropriation for the year ending 30th June, 2026, and to appropriate that sum for certain services and purposes.",
    impact: {
      department: "Health Services",
      delta: 1_800_000_000,
      summary: "Top-up to Health Services for emergency response and Mbagathi maternity expansion; raises Health from KES 12.1B to KES 13.9B.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14210",
  },
  {
    id: "GZ-2026-021",
    date: "2026-04-03",
    title: "Reallocation Notice — Transport & Infrastructure",
    noticeType: "Allocation Adjustment",
    county: "Nairobi City",
    body: "Notice is given that, pursuant to section 154 of the Public Finance Management Act, KES 420,000,000 has been re-allocated from Storm Water Management to Road Construction & Rehabilitation within the Transport & Infrastructure vote.",
    impact: {
      department: "Transport & Infrastructure",
      delta: 0,
      summary: "Intra-department shift: drainage budget cut by KES 420M, roads budget grown by the same. Net department total unchanged.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14288",
  },
  {
    id: "GZ-2026-029",
    date: "2026-04-21",
    title: "Public Finance Management (County Governments) (Amendment) Regulations, 2026",
    noticeType: "Public Finance",
    county: "National",
    body: "The Cabinet Secretary for the National Treasury makes amendments to the PFM (County Governments) Regulations clarifying ward-level reporting requirements for development expenditure absorption.",
    impact: {
      delta: 0,
      summary: "Affects how all 47 counties report ward-level project absorption. No direct allocation change; tightens accountability.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14310",
  },
  {
    id: "GZ-2026-033",
    date: "2026-05-02",
    title: "Withdrawal Notice — Education, Youth & Sports",
    noticeType: "Allocation Adjustment",
    county: "Nairobi City",
    body: "KES 220,000,000 originally appropriated to Sports Development has been withdrawn following non-implementation of the Karen-Hardy sports complex contract.",
    impact: {
      department: "Education, Youth & Sports",
      delta: -220_000_000,
      summary: "Sports Development line cut by KES 220M; funds revert to County Revenue Fund pending reallocation.",
    },
    source: "https://kenyalaw.org/kl/index.php?id=14342",
  },
];
