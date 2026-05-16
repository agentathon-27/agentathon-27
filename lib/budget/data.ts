// Nairobi County Budget Data — FY 2025/2026
// Modeled on actual Nairobi County budget structure and allocation patterns

export interface Program {
  name: string;
  allocation: number;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  totalAllocation: number;
  recurrent: number;
  development: number;
  previousYear: number;
  programs: Program[];
}

export interface WardAllocation {
  ward: string;
  subCounty: string;
  totalAllocation: number;
  breakdown: Record<string, number>;
  keyProjects: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const COUNTY_INFO = {
  name: "Nairobi City County",
  fiscalYear: "FY 2025/2026",
  totalBudget: 37_400_000_000,
  totalRecurrent: 24_310_000_000,
  totalDevelopment: 13_090_000_000,
  totalWards: 85,
  totalSubCounties: 17,
  totalDepartments: 13,
  governor: "Johnson Sakaja",
  approvalDate: "June 2025",
  source: "Nairobi City County Budget Estimates",
};

export const departments: Department[] = [
  {
    id: "health",
    name: "Health Services",
    totalAllocation: 12_100_000_000,
    recurrent: 8_470_000_000,
    development: 3_630_000_000,
    previousYear: 11_200_000_000,
    programs: [
      { name: "Preventive & Promotive Health", allocation: 3_200_000_000, description: "Immunization, community health workers, disease surveillance, maternal health outreach" },
      { name: "Curative Health Services", allocation: 5_800_000_000, description: "Hospital operations, medical supplies, equipment, staff salaries at county hospitals" },
      { name: "Mbagathi Hospital Upgrade", allocation: 1_500_000_000, description: "Expansion of Mbagathi Hospital facilities, new ICU wing, maternity complex" },
      { name: "Primary Healthcare Facilities", allocation: 1_600_000_000, description: "Construction and equipping of health centres across wards" },
    ],
  },
  {
    id: "transport",
    name: "Transport & Infrastructure",
    totalAllocation: 5_200_000_000,
    recurrent: 2_080_000_000,
    development: 3_120_000_000,
    previousYear: 4_800_000_000,
    programs: [
      { name: "Road Construction & Rehabilitation", allocation: 2_800_000_000, description: "Tarmacking, grading, and drainage of county roads across all sub-counties" },
      { name: "Street Lighting", allocation: 600_000_000, description: "Installation and maintenance of solar and electric street lights" },
      { name: "NMS Infrastructure Projects", allocation: 1_200_000_000, description: "Continuation of Nairobi Metropolitan Services road and walkway projects" },
      { name: "Storm Water Management", allocation: 600_000_000, description: "Drainage channels and flood control systems in flood-prone areas" },
    ],
  },
  {
    id: "education",
    name: "Education, Youth & Sports",
    totalAllocation: 3_500_000_000,
    recurrent: 2_450_000_000,
    development: 1_050_000_000,
    previousYear: 3_200_000_000,
    programs: [
      { name: "ECDE & Vocational Training", allocation: 1_800_000_000, description: "Early childhood development centres, TVET bursaries, school feeding programs" },
      { name: "Youth Empowerment", allocation: 800_000_000, description: "Youth polytechnics, internship programs, talent development centres" },
      { name: "Sports Development", allocation: 900_000_000, description: "Stadium maintenance, sports equipment, ward-level tournaments" },
    ],
  },
  {
    id: "water",
    name: "Water, Energy & Forestry",
    totalAllocation: 3_000_000_000,
    recurrent: 1_200_000_000,
    development: 1_800_000_000,
    previousYear: 2_700_000_000,
    programs: [
      { name: "Water Supply & Distribution", allocation: 1_600_000_000, description: "Borehole drilling, water kiosks, pipeline extension to informal settlements" },
      { name: "Sewerage & Sanitation", allocation: 800_000_000, description: "Sewer line extension, public toilet construction, waste water treatment" },
      { name: "Urban Forestry & Green Spaces", allocation: 600_000_000, description: "Tree planting campaigns, park rehabilitation, Nairobi River restoration" },
    ],
  },
  {
    id: "lands",
    name: "Lands, Housing & Urban Planning",
    totalAllocation: 2_500_000_000,
    recurrent: 1_000_000_000,
    development: 1_500_000_000,
    previousYear: 2_300_000_000,
    programs: [
      { name: "Affordable Housing", allocation: 1_200_000_000, description: "Construction of affordable housing units under the national housing program" },
      { name: "Urban Planning & Zoning", allocation: 600_000_000, description: "County spatial planning, development control, building inspections" },
      { name: "Land Administration", allocation: 700_000_000, description: "Land surveying, title deed processing, land information management system" },
    ],
  },
  {
    id: "finance",
    name: "Finance & Economic Planning",
    totalAllocation: 2_000_000_000,
    recurrent: 1_600_000_000,
    development: 400_000_000,
    previousYear: 1_900_000_000,
    programs: [
      { name: "Revenue Collection", allocation: 800_000_000, description: "Automation of revenue collection, parking fees, market fees, licenses" },
      { name: "Budget Coordination", allocation: 500_000_000, description: "Budget preparation, monitoring and evaluation, public participation forums" },
      { name: "Economic Planning & Statistics", allocation: 700_000_000, description: "County economic surveys, data collection, development planning" },
    ],
  },
  {
    id: "agriculture",
    name: "Agriculture, Livestock & Fisheries",
    totalAllocation: 1_500_000_000,
    recurrent: 900_000_000,
    development: 600_000_000,
    previousYear: 1_300_000_000,
    programs: [
      { name: "Crop Development", allocation: 500_000_000, description: "Urban farming initiatives, greenhouse subsidies, extension services" },
      { name: "Livestock Development", allocation: 450_000_000, description: "Veterinary services, dairy support, poultry farming programs" },
      { name: "Fisheries & Blue Economy", allocation: 250_000_000, description: "Fish farming support, aquaculture training, market linkages" },
      { name: "Food Security Programs", allocation: 300_000_000, description: "School feeding programs, emergency food reserves, nutrition programs" },
    ],
  },
  {
    id: "trade",
    name: "Trade, Industrialization & Cooperatives",
    totalAllocation: 1_200_000_000,
    recurrent: 720_000_000,
    development: 480_000_000,
    previousYear: 1_100_000_000,
    programs: [
      { name: "Market Development", allocation: 600_000_000, description: "Construction and renovation of county markets, Wakulima Market upgrade" },
      { name: "SME & Cooperative Support", allocation: 400_000_000, description: "Business loans, cooperative registration, trade fairs" },
      { name: "Industrial Development", allocation: 200_000_000, description: "Jua Kali sheds, industrial park development, value chain support" },
    ],
  },
  {
    id: "admin",
    name: "Public Service & Administration",
    totalAllocation: 2_200_000_000,
    recurrent: 1_980_000_000,
    development: 220_000_000,
    previousYear: 2_100_000_000,
    programs: [
      { name: "Human Resource Management", allocation: 1_200_000_000, description: "Staff salaries, pension contributions, medical insurance for county employees" },
      { name: "County Administration", allocation: 600_000_000, description: "Sub-county offices, ward administrator offices, operational costs" },
      { name: "Public Participation", allocation: 400_000_000, description: "Citizen engagement forums, budget hearings, feedback mechanisms" },
    ],
  },
  {
    id: "ict",
    name: "ICT & E-Government",
    totalAllocation: 800_000_000,
    recurrent: 480_000_000,
    development: 320_000_000,
    previousYear: 600_000_000,
    programs: [
      { name: "Digital Services", allocation: 400_000_000, description: "County website, mobile apps, online permit applications, digital payments" },
      { name: "ICT Infrastructure", allocation: 250_000_000, description: "Fiber optic connectivity, Wi-Fi hotspots, data centres" },
      { name: "Cybersecurity & Data", allocation: 150_000_000, description: "Data protection, system security, digital literacy training" },
    ],
  },
  {
    id: "environment",
    name: "Environment & Natural Resources",
    totalAllocation: 1_100_000_000,
    recurrent: 660_000_000,
    development: 440_000_000,
    previousYear: 950_000_000,
    programs: [
      { name: "Solid Waste Management", allocation: 600_000_000, description: "Garbage collection, Dandora dumpsite rehabilitation, recycling programs" },
      { name: "Climate Action", allocation: 300_000_000, description: "Flood mitigation, tree planting, carbon credit programs" },
      { name: "Environmental Compliance", allocation: 200_000_000, description: "Noise and air quality monitoring, EIA enforcement, pollution control" },
    ],
  },
  {
    id: "culture",
    name: "Tourism, Culture & Heritage",
    totalAllocation: 700_000_000,
    recurrent: 420_000_000,
    development: 280_000_000,
    previousYear: 600_000_000,
    programs: [
      { name: "Tourism Promotion", allocation: 300_000_000, description: "Nairobi National Park partnerships, cultural festivals, city branding" },
      { name: "Heritage Conservation", allocation: 200_000_000, description: "Museum support, historical site preservation, public art installations" },
      { name: "Creative Economy", allocation: 200_000_000, description: "Support for artists, music, film industry, cultural spaces" },
    ],
  },
  {
    id: "assembly",
    name: "County Assembly",
    totalAllocation: 1_600_000_000,
    recurrent: 1_280_000_000,
    development: 320_000_000,
    previousYear: 1_500_000_000,
    programs: [
      { name: "Legislative Services", allocation: 800_000_000, description: "MCA salaries, committee operations, Hansard, legal services" },
      { name: "Assembly Administration", allocation: 500_000_000, description: "Assembly operations, staff, chamber maintenance" },
      { name: "Assembly Infrastructure", allocation: 300_000_000, description: "Office construction, ICT systems, library" },
    ],
  },
];

export const wardAllocations: WardAllocation[] = [
  {
    ward: "Kibra", subCounty: "Kibra",
    totalAllocation: 280_000_000,
    breakdown: { health: 82_000_000, roads: 65_000_000, water: 48_000_000, education: 45_000_000, environment: 25_000_000, other: 15_000_000 },
    keyProjects: ["Kibra Level 4 Hospital renovation — KES 35M", "Kibra-Langata link road — KES 28M", "Kibra water kiosks (12 units) — KES 18M", "ECDE classrooms (8 units) — KES 24M"],
  },
  {
    ward: "Langata", subCounty: "Langata",
    totalAllocation: 320_000_000,
    breakdown: { health: 78_000_000, roads: 85_000_000, water: 52_000_000, education: 55_000_000, environment: 30_000_000, other: 20_000_000 },
    keyProjects: ["Langata Road dualling phase 2 — KES 45M", "Langata Health Centre upgrade — KES 30M", "Karen-Hardy sports complex — KES 35M", "Solar street lights (200 units) — KES 22M"],
  },
  {
    ward: "Westlands", subCounty: "Westlands",
    totalAllocation: 350_000_000,
    breakdown: { health: 70_000_000, roads: 95_000_000, water: 45_000_000, education: 60_000_000, environment: 50_000_000, other: 30_000_000 },
    keyProjects: ["Westlands roundabout improvement — KES 55M", "Parklands health facility — KES 28M", "Westlands walkway and cycling paths — KES 32M", "Smart parking system — KES 25M"],
  },
  {
    ward: "Roysambu", subCounty: "Roysambu",
    totalAllocation: 290_000_000,
    breakdown: { health: 75_000_000, roads: 72_000_000, water: 55_000_000, education: 48_000_000, environment: 22_000_000, other: 18_000_000 },
    keyProjects: ["Roysambu-Zimmerman road rehabilitation — KES 38M", "Roysambu health centre — KES 25M", "Borehole drilling (5 units) — KES 15M", "Youth polytechnic equipment — KES 12M"],
  },
  {
    ward: "Kasarani", subCounty: "Kasarani",
    totalAllocation: 310_000_000,
    breakdown: { health: 80_000_000, roads: 78_000_000, water: 50_000_000, education: 52_000_000, environment: 28_000_000, other: 22_000_000 },
    keyProjects: ["Kasarani stadium access roads — KES 42M", "Mwiki health dispensary — KES 22M", "Kasarani sewer extension — KES 35M", "ECDE centres (6 units) — KES 20M"],
  },
  {
    ward: "Embakasi East", subCounty: "Embakasi East",
    totalAllocation: 270_000_000,
    breakdown: { health: 72_000_000, roads: 68_000_000, water: 52_000_000, education: 42_000_000, environment: 20_000_000, other: 16_000_000 },
    keyProjects: ["Utawala access road tarmacking — KES 35M", "Mihang'o health centre — KES 20M", "Pipeline water distribution — KES 28M", "Embakasi market renovation — KES 18M"],
  },
  {
    ward: "Mathare", subCounty: "Mathare",
    totalAllocation: 260_000_000,
    breakdown: { health: 85_000_000, roads: 55_000_000, water: 58_000_000, education: 35_000_000, environment: 18_000_000, other: 9_000_000 },
    keyProjects: ["Mathare health centre upgrade — KES 30M", "Mathare River cleanup & flood walls — KES 25M", "Water standpipes (20 units) — KES 22M", "Youth empowerment centre — KES 15M"],
  },
  {
    ward: "Dandora", subCounty: "Embakasi North",
    totalAllocation: 250_000_000,
    breakdown: { health: 68_000_000, roads: 58_000_000, water: 48_000_000, education: 38_000_000, environment: 28_000_000, other: 10_000_000 },
    keyProjects: ["Dandora dumpsite buffer zone — KES 30M", "Dandora Phase 4 road grading — KES 22M", "Community health centre — KES 25M", "Recycling centre construction — KES 20M"],
  },
  {
    ward: "Kayole", subCounty: "Embakasi Central",
    totalAllocation: 265_000_000,
    breakdown: { health: 75_000_000, roads: 62_000_000, water: 50_000_000, education: 40_000_000, environment: 22_000_000, other: 16_000_000 },
    keyProjects: ["Kayole-Spine road rehabilitation — KES 35M", "Kayole health centre maternity wing — KES 28M", "Borehole drilling (4 units) — KES 12M", "ECDE classrooms (5 units) — KES 16M"],
  },
  {
    ward: "Dagoretti North", subCounty: "Dagoretti North",
    totalAllocation: 300_000_000,
    breakdown: { health: 72_000_000, roads: 80_000_000, water: 48_000_000, education: 50_000_000, environment: 30_000_000, other: 20_000_000 },
    keyProjects: ["Waithaka-Riruta road upgrade — KES 40M", "Dagoretti health facility — KES 25M", "Kawangware market shade — KES 18M", "Street lighting Kangemi — KES 15M"],
  },
  {
    ward: "Starehe", subCounty: "Starehe",
    totalAllocation: 340_000_000,
    breakdown: { health: 70_000_000, roads: 90_000_000, water: 42_000_000, education: 55_000_000, environment: 48_000_000, other: 35_000_000 },
    keyProjects: ["CBD pedestrian walkways — KES 50M", "Pumwani Hospital maternity wing — KES 40M", "CBD smart waste bins — KES 15M", "Nairobi River beautification (CBD segment) — KES 30M"],
  },
  {
    ward: "Ruaraka", subCounty: "Ruaraka",
    totalAllocation: 285_000_000,
    breakdown: { health: 70_000_000, roads: 75_000_000, water: 50_000_000, education: 45_000_000, environment: 25_000_000, other: 20_000_000 },
    keyProjects: ["Baba Dogo road rehabilitation — KES 32M", "Mathare North dispensary — KES 18M", "Lucky Summer water project — KES 22M", "Utalii sports ground upgrade — KES 20M"],
  },
];

export const glossary: GlossaryEntry[] = [
  { term: "Recurrent Expenditure", definition: "Day-to-day spending on salaries, operations, maintenance, and consumables. This covers ongoing costs to keep government running." },
  { term: "Development Expenditure", definition: "Spending on new projects, construction, equipment, and capital investments. These create new assets or improve existing ones." },
  { term: "Appropriation", definition: "Legal authorization by the County Assembly for the county government to spend money from the County Revenue Fund for specific purposes." },
  { term: "Supplementary Budget", definition: "A revised budget submitted mid-year when the county needs to adjust allocations due to changing circumstances or emergencies." },
  { term: "Own Source Revenue (OSR)", definition: "Money the county collects itself through parking fees, market fees, building permits, entertainment taxes, and other local charges." },
  { term: "Equitable Share", definition: "The portion of national revenue allocated to each county by the Commission on Revenue Allocation (CRA) based on a formula considering population, poverty, and land area." },
  { term: "Conditional Grants", definition: "Funds from the national government earmarked for specific purposes like free maternal healthcare, road maintenance levy, or fuel levy." },
  { term: "CIDP", definition: "County Integrated Development Plan — a 5-year plan that outlines the county's development priorities and guides annual budget allocations." },
  { term: "CFSP", definition: "County Fiscal Strategy Paper — sets out the county's revenue and expenditure framework and priorities for the medium term (3 years)." },
  { term: "Public Participation", definition: "Constitutional requirement for counties to involve residents in budget-making through public forums (often at ward level) before the budget is approved." },
  { term: "Ward Development Fund", definition: "A portion of the development budget allocated equally across all 85 wards for community-driven projects chosen through public participation." },
  { term: "Pending Bills", definition: "Money owed by the county to contractors and suppliers for work done or goods delivered but not yet paid. A major accountability concern." },
  { term: "Budget Absorption", definition: "The percentage of allocated budget that is actually spent. Low absorption means the county failed to implement planned projects." },
  { term: "Fiscal Responsibility", definition: "Legal requirement that at least 30% of the county budget must go to development expenditure (not just recurrent/salary costs)." },
  { term: "ECDE", definition: "Early Childhood Development Education — pre-primary education managed by county governments under the devolved functions." },
];

// Helper: format KES amounts
export function formatKES(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `KES ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `KES ${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `KES ${amount.toLocaleString()}`;
}
