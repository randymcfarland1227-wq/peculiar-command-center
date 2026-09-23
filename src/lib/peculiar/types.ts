export const STATUSES = [
  "NOT STARTED",
  "PLANNING",
  "IN PROGRESS",
  "WAITING",
  "TESTING",
  "DECIDED",
  "ORDERED",
  "COMPLETE",
  "BLOCKED",
] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const PRIORITIES = ["NOW", "NEXT", "LATER"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const WORKSTREAMS = [
  "company",
  "product-lab",
  "brand",
  "commerce",
  "launch",
  "research",
] as const;
export type Workstream = (typeof WORKSTREAMS)[number];

export const WORKSTREAM_LABEL: Record<Workstream, string> = {
  company: "Company",
  "product-lab": "Product Lab",
  brand: "Brand Studio",
  commerce: "Commerce",
  launch: "Launch",
  research: "Research",
};

export const LAUNCH_AREAS = [
  "Product",
  "Safety",
  "Admin",
  "Storefront",
  "Packaging",
  "Inventory",
  "Content",
  "Customer Validation",
] as const;
export type LaunchArea = (typeof LAUNCH_AREAS)[number];

export const COST_SOURCES = ["ESTIMATE", "QUOTE", "ACTUAL"] as const;
export type CostSource = (typeof COST_SOURCES)[number];

export const SIZES = ["Small", "Medium", "Large"] as const;
export type Size = (typeof SIZES)[number];

export const COST_FIELDS = [
  ["wax", "Wax"],
  ["fragrance", "Fragrance"],
  ["wick", "Wick"],
  ["vessel", "Vessel"],
  ["prepLabor", "Prep labor"],
  ["closure", "Closure"],
  ["labels", "Labels"],
  ["packaging", "Packaging"],
  ["paymentFees", "Payment fees"],
  ["shippingMaterials", "Shipping materials"],
  ["defectAllowance", "Defect allowance"],
  ["labor", "Founder labor"],
] as const;
export type CostKey = (typeof COST_FIELDS)[number][0];

export const SUPPLIER_CATEGORIES = [
  "Wax",
  "Fragrance",
  "Wicks",
  "Recycled Glass",
  "Closures",
  "Labels",
  "Packaging",
  "Shipping",
] as const;
export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export const DECISION_STATUSES = ["WORKING ASSUMPTION", "DECIDED", "SUPERSEDED"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const PILLARS = [
  "Vessel Sourcing",
  "Before / After",
  "Scent Lab",
  "Pour Process",
  "Testing / QC",
  "Mystery Vessel Reveals",
  "Circularity",
  "Founder Journey",
  "Styling",
  "Customer Unboxings",
] as const;

export interface Task {
  id: string;
  title: string;
  workstream: Workstream;
  status: TaskStatus;
  priority: Priority;
  section: string;
  due: string;
  notes: string;
  dependencies: string;
  link: string;
  cost: string;
  owner: string;
  completedDate: string;
  relatedExperiment: string;
  relatedSupplier: string;
  relatedDocument: string;
  launchArea: LaunchArea | "";
}

export interface Decision {
  id: string;
  date: string;
  decision: string;
  category: string;
  reason: string;
  evidence: string;
  status: DecisionStatus;
  revisitWhen: string;
  workstreams: Workstream[];
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  method: string;
  materials: string;
  startDate: string;
  result: string;
  cost: string;
  nextAction: string;
  status: TaskStatus;
  workstream: Workstream;
  photoNote: string;
}

export interface Scent {
  slot: string;
  workingName: string;
  role: string;
  mood: string;
  inspiration: string;
  keyNotes: string;
  supplier: string;
  materials: string;
  formula: string;
  load: string;
  coldThrow: string;
  hotThrow: string;
  approved: boolean;
  costPerCandle: string;
  notes: string;
}

export interface Vessel {
  id: string;
  vesselId: string;
  sizeClass: Size;
  diameter: string;
  profile: string;
  color: string;
  pigment: "Clear" | "Color";
  source: string;
  cost: string;
  condition: string;
  acceptance: "Accepted" | "Needs Testing" | "Rejected";
  wick: string;
  testStatus: string;
  notes: string;
}

export interface BurnTest {
  id: string;
  testId: string;
  batch: string;
  vesselProfile: string;
  vesselDimensions: string;
  wax: string;
  wick: string;
  scent: string;
  fragranceLoad: string;
  pourDate: string;
  testDate: string;
  cureDays: string;
  flame: string;
  meltPool: string;
  soot: string;
  mushrooming: string;
  glass: string;
  hotThrow: string;
  endResult: string;
  passFail: "UNTESTED" | "PASS" | "FAIL";
  notes: string;
  photoNote: string;
}

export interface Supplier {
  id: string;
  category: SupplierCategory;
  name: string;
  product: string;
  website: string;
  sampleOrdered: boolean;
  approved: boolean;
  moq: string;
  unitCost: string;
  shipping: string;
  landedCost: string;
  leadTime: string;
  safetyDocs: string;
  notes: string;
  backup: string;
}

export interface MoneyCell {
  amount: number;
  source: CostSource;
}

export interface SizeModel {
  size: Size;
  band: string;
  retail: MoneyCell;
  lines: Record<CostKey, MoneyCell>;
}

export interface BudgetLine {
  id: string;
  label: string;
  estimated: number;
  actual: number;
  paid: number;
  workstreams: Workstream[];
}

export interface LaunchSku {
  id: string;
  scent: string;
  size: Size;
  planned: number;
  poured: number;
  curing: number;
  ready: number;
  sold: number;
}

export interface ContentItem {
  id: string;
  title: string;
  pillar: (typeof PILLARS)[number];
  platform: string;
  status: TaskStatus;
  footage: string;
  caption: string;
  publishDate: string;
  result: string;
}

export interface ResearchQuestion {
  id: string;
  question: string;
  category: string;
  why: string;
  evidenceNeeded: string;
  link: string;
  owner: string;
  due: string;
  status: TaskStatus;
  decisionAffected: string;
  workstreams: Workstream[];
}

export interface DocLink {
  id: string;
  title: string;
  group: string;
  detail: string;
  url: string;
  workstreams: Workstream[];
}

export interface Blocker {
  id: string;
  title: string;
  detail: string;
  resolved: boolean;
}

export const ACQUIRE_STATUSES = ["NEED", "CONSIDERING", "ORDERED", "STAPLE"] as const;
export type AcquireStatus = (typeof ACQUIRE_STATUSES)[number];

export interface Acquisition {
  id: string;
  name: string;
  category: string;
  purpose: string;
  url: string;
  price: string;
  thoughts: string;
  details: string;
  status: AcquireStatus;
  notes: string;
}

export interface PeculiarData {
  tasks: Task[];
  decisions: Decision[];
  experiments: Experiment[];
  scents: Scent[];
  vessels: Vessel[];
  tests: BurnTest[];
  suppliers: Supplier[];
  economics: SizeModel[];
  budget: BudgetLine[];
  skus: LaunchSku[];
  content: ContentItem[];
  questions: ResearchQuestion[];
  documents: DocLink[];
  blockers: Blocker[];
  acquisitions: Acquisition[];
}
