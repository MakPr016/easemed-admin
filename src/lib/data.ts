// Mock data for Easemed Admin — TypeScript port of data.js

export const INDUSTRIES = ["Manufacturing","Logistics","Construction","Food & Beverage","Pharma","Retail","Energy","Agriculture","Textiles","Electronics","Automotive","Hospitality"];
export const COUNTRIES = ["United States","Germany","United Kingdom","France","Netherlands","Singapore","Japan","Canada","Australia","Brazil","Mexico","India","Spain","Italy","Sweden"];
const COUNTRY_CODES: Record<string,string> = {"United States":"US","Germany":"DE","United Kingdom":"GB","France":"FR","Netherlands":"NL","Singapore":"SG","Japan":"JP","Canada":"CA","Australia":"AU","Brazil":"BR","Mexico":"MX","India":"IN","Spain":"ES","Italy":"IT","Sweden":"SE"};
export const CATEGORIES = ["Industrial Supplies","Safety Equipment","Office Supplies","Packaging","Raw Materials","Tooling","Chemicals","Electronics","Logistics Services","IT Services"];

export interface Manager { id: string; name: string; email: string; }
export const MANAGERS: Manager[] = [
  { id: "m1", name: "Sarah Chen", email: "sarah.chen@easemed.co" },
  { id: "m2", name: "Marcus Okafor", email: "marcus.o@easemed.co" },
  { id: "m3", name: "Priya Sharma", email: "priya.s@easemed.co" },
  { id: "m4", name: "Diego Alvarez", email: "diego.a@easemed.co" },
  { id: "m5", name: "Hannah Weber", email: "hannah.w@easemed.co" },
];

export interface Admin { id: string; name: string; email: string; role: string; lastLogin: string; status: string; }
export const ADMINS: Admin[] = [
  { id: "a1", name: "Sarah Chen", email: "sarah.chen@easemed.co", role: "Super Admin", lastLogin: "2026-04-20T08:12:00Z", status: "active" },
  { id: "a2", name: "Marcus Okafor", email: "marcus.o@easemed.co", role: "Operations Admin", lastLogin: "2026-04-20T07:44:00Z", status: "active" },
  { id: "a3", name: "Priya Sharma", email: "priya.s@easemed.co", role: "Compliance Admin", lastLogin: "2026-04-19T16:22:00Z", status: "active" },
  { id: "a4", name: "Diego Alvarez", email: "diego.a@easemed.co", role: "Operations Admin", lastLogin: "2026-04-18T11:08:00Z", status: "active" },
  { id: "a5", name: "Hannah Weber", email: "hannah.w@easemed.co", role: "Compliance Admin", lastLogin: "2026-04-20T09:01:00Z", status: "active" },
  { id: "a6", name: "Leo Tanaka", email: "leo.t@easemed.co", role: "Read-Only", lastLogin: "2026-04-15T14:40:00Z", status: "active" },
  { id: "a7", name: "Rachel Park", email: "rachel.p@easemed.co", role: "Operations Admin", lastLogin: "2026-04-10T12:00:00Z", status: "inactive" },
];
export const CURRENT_ADMIN = ADMINS[0];

export interface Client {
  id: string; name: string; type: "buyer" | "seller"; industry: string;
  country: string; countryCode: string; status: string; kycStatus: string;
  createdAt: string; submittedAt: string | null; assignedManager: Manager;
  orders: number; totalSpend: number; revenue: number;
  creditLimit: number; currentBalance: number;
  paymentTerms: string; payoutSchedule: string;
  rating: number | null; compliance: number | null; categories: string[];
  documentExpiry: string; disputeCount: number; riskScore: number;
  contact: { name: string; email: string; phone: string; title: string; };
  address: { street: string; city: string; postalCode: string; };
}

function seeded(n: number) { let s = n; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const r = seeded(42);
function pick<T>(arr: T[]): T { return arr[Math.floor(r() * arr.length)]; }
function range(n: number) { return Array.from({ length: n }, (_, i) => i); }
function daysAgo(d: number) { const t = new Date("2026-04-20T10:00:00Z"); t.setDate(t.getDate() - d); return t.toISOString(); }

const COMPANY_PARTS = {
  prefix: ["Atlas","North","Meridian","Harbor","Summit","Keystone","Vertex","Copper","Pioneer","Foundry","Delta","Beacon","Orbit","Sterling","Ironwood","Crescent","Westbridge","Clarity","Anvil","Mercator","Parallel","Halcyon","Vanguard","Rockway","Northgate","Lumen","Prism","Granite","Hollow","Arbor"],
  suffix: ["Industrial","Logistics","Supply Co.","Trading Group","Manufacturing","Distribution","Works","Materials","Partners","Global","Systems","Holdings","Group","Co.","International","Ventures","Solutions"],
};
const PEOPLE_FIRST = ["Alex","Taylor","Jordan","Morgan","Sam","Jamie","Casey","Riley","Avery","Quinn","Rowan","Kai","Noa","Ezra","Zara","Omar","Leila","Yusuf","Mei","Ravi","Nina","Tobias","Elena","Marco","Aisha"];
const PEOPLE_LAST = ["Reyes","Kovac","Walsh","Hassan","Dupont","Nakamura","Bauer","Kim","Moreau","Singh","Oyelaran","Svensson","Rizzo","Okonkwo","Chen","Patel","Brandt","Navarro","Larsen","Ortiz"];

const generated: Client[] = range(64).map(i => {
  const type: "buyer" | "seller" = r() < 0.55 ? "buyer" : "seller";
  const name = `${pick(COMPANY_PARTS.prefix)} ${pick(COMPANY_PARTS.suffix)}`;
  const industry = pick(INDUSTRIES); const country = pick(COUNTRIES);
  const createdDaysAgo = Math.floor(r() * 420);
  const statusRoll = r();
  let status: string, kycStatus: string;
  if (statusRoll < 0.62) { status = "active"; kycStatus = "verified"; }
  else if (statusRoll < 0.82) { status = "pending"; kycStatus = r() < 0.4 ? "not_submitted" : "submitted"; }
  else if (statusRoll < 0.92) { status = "suspended"; kycStatus = r() < 0.5 ? "failed" : "verified"; }
  else { status = "inactive"; kycStatus = "verified"; }
  const manager = pick(MANAGERS);
  const orders = status === "active" ? Math.floor(r() * 240) : Math.floor(r() * 40);
  const avgOrderValue = 2000 + Math.floor(r() * 18000);
  const totalSpend = type === "buyer" ? orders * avgOrderValue : 0;
  const revenue = type === "seller" ? orders * avgOrderValue : 0;
  const creditLimit = type === "buyer" ? Math.ceil((50000 + Math.floor(r() * 750000)) / 10000) * 10000 : 0;
  const currentBalance = type === "buyer" ? Math.floor(creditLimit * r() * 1.05) : 0;
  const rating = type === "seller" ? 3.5 + r() * 1.5 : null;
  const compliance = type === "seller" ? Math.floor(40 + r() * 60) : null;
  const cats = type === "seller" ? Array.from({length: 1 + Math.floor(r() * 3)}, () => pick(CATEGORIES)) : [];
  return {
    id: `C-${10200 + i}`, name, type, industry, country, countryCode: COUNTRY_CODES[country] || "??",
    status, kycStatus, createdAt: daysAgo(createdDaysAgo),
    submittedAt: status === "pending" ? daysAgo(Math.floor(r() * 12)) : null,
    assignedManager: manager, orders, totalSpend, revenue, creditLimit, currentBalance,
    paymentTerms: pick(["Net 30","Net 60","Net 90"]), payoutSchedule: pick(["Weekly","Bi-weekly","Monthly"]),
    rating, compliance, categories: [...new Set(cats)],
    documentExpiry: daysAgo(-Math.floor(r() * 365 - 60)),
    disputeCount: Math.floor(r() * 8), riskScore: Math.floor(15 + r() * 75),
    contact: { name: `${pick(PEOPLE_FIRST)} ${pick(PEOPLE_LAST)}`, email: `${pick(PEOPLE_FIRST).toLowerCase()}@${name.toLowerCase().replace(/[^a-z]/g,"")}.com`, phone: `+1 ${Math.floor(200+r()*700)} ${Math.floor(100+r()*800)} ${Math.floor(1000+r()*9000)}`, title: pick(["Head of Procurement","CFO","Operations Director","COO","VP Supply Chain","Procurement Lead"]) },
    address: { street: `${Math.floor(100+r()*9000)} ${pick(["Market St","Industrial Ave","Commerce Blvd","Kingsway","Meridian Rd","Harbor Dr"])}`, city: pick(["San Francisco","Berlin","London","Rotterdam","Singapore","Tokyo","Toronto","Madrid","Milan","Sydney"]), postalCode: `${Math.floor(10000+r()*89999)}` },
  };
});

const featured: Client[] = [
  { id: "C-10001", name: "Northwind Industrial", type: "buyer", industry: "Manufacturing", country: "Germany", countryCode: "DE", status: "active", kycStatus: "verified", createdAt: daysAgo(412), submittedAt: null, assignedManager: MANAGERS[0], orders: 342, totalSpend: 8420000, revenue: 0, creditLimit: 1500000, currentBalance: 1280000, paymentTerms: "Net 60", payoutSchedule: "Monthly", rating: null, compliance: null, categories: [], documentExpiry: daysAgo(-128), disputeCount: 2, riskScore: 28, contact: { name: "Taylor Brandt", email: "taylor@northwind.com", phone: "+49 30 1234 5678", title: "VP Procurement" }, address: { street: "42 Unter den Linden", city: "Berlin", postalCode: "10117" } },
  { id: "C-10002", name: "Harbor Logistics Co.", type: "buyer", industry: "Logistics", country: "Netherlands", countryCode: "NL", status: "active", kycStatus: "verified", createdAt: daysAgo(280), submittedAt: null, assignedManager: MANAGERS[1], orders: 189, totalSpend: 2940000, revenue: 0, creditLimit: 500000, currentBalance: 420000, paymentTerms: "Net 30", payoutSchedule: "Monthly", rating: null, compliance: null, categories: [], documentExpiry: daysAgo(-22), disputeCount: 0, riskScore: 18, contact: { name: "Nina Moreau", email: "nina@harborlog.nl", phone: "+31 10 555 0122", title: "CFO" }, address: { street: "14 Wilhelminakade", city: "Rotterdam", postalCode: "3072" } },
  { id: "C-10003", name: "Meridian Manufacturing", type: "seller", industry: "Manufacturing", country: "United States", countryCode: "US", status: "active", kycStatus: "verified", createdAt: daysAgo(520), submittedAt: null, assignedManager: MANAGERS[0], orders: 428, totalSpend: 0, revenue: 11240000, creditLimit: 0, currentBalance: 0, paymentTerms: "—", payoutSchedule: "Weekly", rating: 4.8, compliance: 92, categories: ["Industrial Supplies","Tooling"], documentExpiry: daysAgo(-200), disputeCount: 1, riskScore: 14, contact: { name: "Marco Rizzo", email: "marco@meridianmfg.com", phone: "+1 415 555 0180", title: "CEO" }, address: { street: "900 Industrial Pkwy", city: "Oakland", postalCode: "94607" } },
  { id: "C-10004", name: "Clarity Chemicals", type: "seller", industry: "Chemicals", country: "Singapore", countryCode: "SG", status: "pending", kycStatus: "submitted", createdAt: daysAgo(4), submittedAt: daysAgo(2), assignedManager: MANAGERS[2], orders: 0, totalSpend: 0, revenue: 0, creditLimit: 0, currentBalance: 0, paymentTerms: "—", payoutSchedule: "Bi-weekly", rating: null, compliance: 68, categories: ["Chemicals","Raw Materials"], documentExpiry: daysAgo(-180), disputeCount: 0, riskScore: 55, contact: { name: "Mei Chen", email: "mei@claritychem.sg", phone: "+65 6555 0133", title: "COO" }, address: { street: "8 Marina Boulevard", city: "Singapore", postalCode: "018981" } },
  { id: "C-10005", name: "Ironwood Construction", type: "buyer", industry: "Construction", country: "Canada", countryCode: "CA", status: "suspended", kycStatus: "failed", createdAt: daysAgo(180), submittedAt: null, assignedManager: MANAGERS[3], orders: 48, totalSpend: 420000, revenue: 0, creditLimit: 200000, currentBalance: 198000, paymentTerms: "Net 30", payoutSchedule: "Monthly", rating: null, compliance: null, categories: [], documentExpiry: daysAgo(14), disputeCount: 9, riskScore: 78, contact: { name: "Avery Walsh", email: "avery@ironwood.ca", phone: "+1 416 555 0144", title: "Procurement Director" }, address: { street: "220 King St W", city: "Toronto", postalCode: "M5H 1K4" } },
];

export const CLIENTS: Client[] = [...featured, ...generated];

export interface Message { id: string; role: "client" | "admin" | "system"; content: string; attachments: { name: string; size: string; }[]; sentAt: string; }
export interface Conversation { id: string; clientId: string; clientName: string; clientType: string; subject: string; status: string; priority: string; readByAdmin: boolean; assignedTo: string | null; lastMessageAt: string; messages: Message[]; }

const CONV_TEMPLATES = [
  { clientId: "C-10001", subject: "Credit limit increase request", priority: "urgent", status: "in_progress", messages: [
    { role: "client" as const, content: "Hi team — we're onboarding three new factories in Q2 and our current $1.5M credit line won't cover expected Q2-Q3 purchasing. Can we discuss bumping to $2.5M? We have Q1 financials ready to share.", hoursAgo: 26 },
    { role: "admin" as const, content: "Hi Taylor — thanks for the heads up. Happy to review. Can you share the Q1 financials and a rough monthly volume projection through September? I'll loop in credit ops once I have those.", hoursAgo: 24 },
    { role: "client" as const, content: "Attached. Also including the signed LOIs from two of the three new factories. Let me know if you need more.", hoursAgo: 20, attachments: [{ name: "Northwind_Q1_2026_Financials.pdf", size: "2.4 MB" }, { name: "LOI_Hamburg_Plant.pdf", size: "184 KB" }] },
    { role: "system" as const, content: "Conversation assigned to Sarah Chen", hoursAgo: 18 },
    { role: "admin" as const, content: "Got it — reviewing with credit ops this afternoon. You should hear back from me by EOD Thursday.", hoursAgo: 4 },
  ]},
  { clientId: "C-10004", subject: "KYC documents uploaded — please review", priority: "normal", status: "open", messages: [
    { role: "client" as const, content: "All KYC documents are now uploaded via the portal. Please confirm review timeline.", hoursAgo: 3 },
  ]},
  { clientId: "C-10005", subject: "Suspension appeal — documents attached", priority: "urgent", status: "escalated", messages: [
    { role: "client" as const, content: "Our account was suspended this morning — we believe this is due to an expired insurance certificate. Renewed copy attached. Please reactivate ASAP, we have two shipments held up.", hoursAgo: 6, attachments: [{ name: "Insurance_Cert_2026.pdf", size: "512 KB" }] },
    { role: "admin" as const, content: "Received. Escalating to compliance for review — I'll keep you posted. In the meantime, I've flagged the two pending shipments so you don't lose your slot.", hoursAgo: 5 },
    { role: "system" as const, content: "Escalated to Compliance Admin", hoursAgo: 5 },
  ]},
  { clientId: "C-10003", subject: "Payout schedule change request", priority: "normal", status: "resolved", messages: [
    { role: "client" as const, content: "Can we switch from weekly to bi-weekly payouts? Our ops team prefers the cadence.", hoursAgo: 72 },
    { role: "admin" as const, content: "Done — switched effective next cycle. First bi-weekly payout will land April 28.", hoursAgo: 60 },
    { role: "client" as const, content: "Perfect, thanks!", hoursAgo: 56 },
    { role: "system" as const, content: "Marked as resolved by Marcus Okafor", hoursAgo: 50 },
  ]},
  { clientId: "C-10002", subject: "Dispute on invoice #INV-44821", priority: "normal", status: "in_progress", messages: [
    { role: "client" as const, content: "We were charged twice for shipment #SH-9928 — once on the base invoice and once on the amendment. Can you check?", hoursAgo: 36 },
    { role: "admin" as const, content: "Confirmed — you're right, duplicate line. Crediting $4,280 back to your account today, should show by EOD.", hoursAgo: 28 },
  ]},
  { clientId: "C-10200", subject: "Onboarding checklist question", priority: "normal", status: "open", messages: [
    { role: "client" as const, content: "What format does the annual revenue statement need to be in? PDF or can it be Excel?", hoursAgo: 1 },
  ]},
  { clientId: "C-10207", subject: "Rate negotiation — bulk steel orders", priority: "normal", status: "in_progress", messages: [
    { role: "client" as const, content: "Looking to negotiate volume pricing for steel orders >500 tons/mo. Is this something we should take up with sales or directly with sellers?", hoursAgo: 48 },
    { role: "admin" as const, content: "Both — for platform-wide discount bands come to us; for specific seller contracts we can introduce you directly. How much volume are we talking Q2-Q4?", hoursAgo: 40 },
  ]},
  { clientId: "C-10215", subject: "API integration help", priority: "normal", status: "resolved", messages: [
    { role: "client" as const, content: "The orders API is returning 403 for some of our staging keys.", hoursAgo: 120 },
    { role: "admin" as const, content: "Rotated your staging keys — try the new set. 403 was a stale scope.", hoursAgo: 110 },
    { role: "client" as const, content: "All good now.", hoursAgo: 100 },
  ]},
  { clientId: "C-10222", subject: "Add new shipping address", priority: "normal", status: "resolved", messages: [
    { role: "client" as const, content: "Please add our new warehouse in Hamburg to our account.", hoursAgo: 200 },
    { role: "admin" as const, content: "Added, and set as a secondary shipping location. Let us know if you want it promoted to primary.", hoursAgo: 180 },
  ]},
  { clientId: "C-10230", subject: "Certification upload failing", priority: "urgent", status: "open", messages: [
    { role: "client" as const, content: "I can't upload our ISO cert — portal throws an error after 80%. Tried Chrome and Safari.", hoursAgo: 2 },
  ]},
];

export const CONVERSATIONS: Conversation[] = CONV_TEMPLATES.map((t, i) => {
  const client = CLIENTS.find(c => c.id === t.clientId) || CLIENTS[i];
  const messages: Message[] = t.messages.map((m, mi) => ({
    id: `m-${i}-${mi}`, role: m.role, content: m.content,
    attachments: (m as { attachments?: {name:string;size:string}[] }).attachments || [],
    sentAt: new Date(Date.now() - (m.hoursAgo ?? 0) * 3600 * 1000).toISOString(),
  }));
  const lastMsg = messages[messages.length - 1];
  const unread = lastMsg.role === "client" && (t.status === "open" || t.status === "in_progress");
  return {
    id: `conv-${1000 + i}`, clientId: client.id, clientName: client.name, clientType: client.type,
    subject: t.subject, status: t.status, priority: t.priority, readByAdmin: !unread,
    assignedTo: t.status === "resolved" ? "a2" : (i % 3 === 0 ? "a1" : i % 3 === 1 ? "a2" : null),
    lastMessageAt: lastMsg.sentAt, messages,
  };
});

export interface Transaction { id: string; buyerId: string | null; sellerId: string | null; type: string; amount: number; status: string; createdAt: string; linkedParty: string; }
const r2 = seeded(99);
function pick2<T>(arr: T[]): T { return arr[Math.floor(r2() * arr.length)]; }
export const TRANSACTIONS: Transaction[] = [];
CLIENTS.slice(0, 20).forEach((c, ci) => {
  const n = 4 + Math.floor(r2() * 8);
  for (let i = 0; i < n; i++) {
    const amt = Math.floor((c.orders > 0 ? (c.totalSpend || c.revenue) / c.orders : 5000) * (0.6 + r2()));
    TRANSACTIONS.push({ id: `TX-${58000 + ci * 100 + i}`, buyerId: c.type === "buyer" ? c.id : null, sellerId: c.type === "seller" ? c.id : null, type: pick2(["invoice","payment","refund","fee"]), amount: amt, status: pick2(["completed","completed","completed","pending","failed"]), createdAt: daysAgo(Math.floor(r2() * 90)), linkedParty: pick2(["Harbor Logistics Co.","Meridian Manufacturing","Atlas Works","Summit Supply Co."]) });
  }
});

export interface AuditLog { id: string; actor: string; actorEmail: string; actorType: string; action: string; entity: string; entityId: string; entityName: string; ipAddress: string; timestamp: string; before: Record<string,string> | null; after: Record<string,string> | null; }
const r3 = seeded(77);
function pick3<T>(arr: T[]): T { return arr[Math.floor(r3() * arr.length)]; }
export const AUDIT_LOG: AuditLog[] = range(48).map(i => {
  const a = pick3(ADMINS); const action = pick3(["Create","Update","Delete","Login","Approve","Reject","Export","Suspend","Activate"]); const client = pick3(CLIENTS.slice(0, 30));
  return { id: `AL-${90000 + i}`, actor: a.name, actorEmail: a.email, actorType: r3() < 0.1 ? "System" : r3() < 0.2 ? "Client" : "Admin", action, entity: pick3(["Client","Client","Client","Message","Document","User"]), entityId: client.id, entityName: client.name, ipAddress: `192.168.${Math.floor(r3()*255)}.${Math.floor(r3()*255)}`, timestamp: daysAgo(Math.floor(r3() * 30)), before: action === "Update" ? { status: "pending" } : null, after: action === "Update" ? { status: "active" } : null };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

const r4 = seeded(55);
export const MONTHLY_ACTIVITY = range(12).map(i => {
  const monthIdx = (new Date("2026-04-20").getMonth() - 11 + i + 12) % 12;
  const label = new Date(2025, monthIdx, 1).toLocaleString("en", { month: "short" });
  return { month: label, buyers: Math.floor(8 + r4() * 20 + i * 0.6), sellers: Math.floor(5 + r4() * 14 + i * 0.4) };
});

export const CANNED_TEMPLATES = [
  { id: "t1", title: "Welcome Message", preview: "Welcome to the Easemed platform...", body: "Hi {{name}},\n\nWelcome to Easemed. Your account has been activated and your dedicated manager will reach out within 24 hours to walk you through onboarding.\n\nIf you have questions in the meantime, reply here — we monitor this inbox from 9-6 GMT.\n\nThanks,\nEasemed Support" },
  { id: "t2", title: "Document Request", preview: "We need a few additional documents...", body: "Hi,\n\nThanks for submitting your application. To complete review, we'll need:\n\n• Certificate of incorporation\n• Proof of banking details\n• Most recent annual report\n\nUpload them to your portal and reply here when done. Thanks!" },
  { id: "t3", title: "KYC Reminder", preview: "Your KYC review is still pending...", body: "Hi,\n\nJust a reminder that your KYC submission is still pending. Please complete the outstanding steps in your portal within 5 business days to avoid account suspension.\n\nLet us know if you need help." },
  { id: "t4", title: "Account Suspended Notice", preview: "Your account has been temporarily suspended...", body: "Hi,\n\nYour account has been temporarily suspended pending review. This usually resolves within 2 business days once we have the required documentation.\n\nReach out if urgent." },
  { id: "t5", title: "Payment Overdue Reminder", preview: "Invoice #### is past due...", body: "Hi,\n\nThis is a friendly reminder that invoice {{invoice}} is now {{days}} days past due. Please remit payment at your earliest convenience.\n\nLet us know if there's an issue we can help resolve." },
  { id: "t6", title: "Issue Resolved Confirmation", preview: "We've resolved your issue...", body: "Hi,\n\nGood news — we've resolved the issue you reported. Please confirm everything is working as expected on your end, and don't hesitate to reach out if you see anything else.\n\nThanks for your patience." },
];
