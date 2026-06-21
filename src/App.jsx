import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Receipt, Target, Landmark, Wallet, Database,
  Upload, Download, Plus, Trash2, Pencil, X, Check, AlertTriangle,
  TrendingUp, TrendingDown, PiggyBank, Flame, ChevronRight, Info, Sparkles,
  LogIn, LogOut, Cloud, CloudOff, Loader2, ShieldCheck, FileText, KeyRound
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import Papa from "papaparse";
import { supabase } from "./supabase.js";
import { parseStatementText } from "./chaseParse.js";

/* ============================================================ THEME */
const FONT_LINKS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </>
);

const CSS = `
:root{
  --bg:#F7F3EA; --bg2:#F1EADA; --surface:#FFFDF8; --ink:#1A2620; --muted:#6B7A70;
  --line:#E5DDCB; --line2:#D8CFB8;
  --green:#1C4B3A; --green2:#2E6B52; --leaf:#3E8E6E;
  --clay:#BD5D3A; --clay-soft:#E8C9BA; --gold:#B8862A;
  --pos:#2F7A55; --neg:#B23A26; --posbg:#E3F0E7; --negbg:#F6E2DC;
  --shadow:0 1px 2px rgba(26,38,32,.04),0 8px 24px -12px rgba(26,38,32,.18);
}
*{box-sizing:border-box}
.bapp{font-family:'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif;background:
  radial-gradient(1200px 600px at 100% -10%, #FBF7EE 0%, rgba(251,247,238,0) 60%),
  radial-gradient(900px 500px at -10% 0%, #F0E7D4 0%, rgba(240,231,212,0) 55%),
  var(--bg);
  color:var(--ink);min-height:100%;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
.serif{font-family:'Fraunces',ui-serif,Georgia,serif}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 64px}
.topbar{position:sticky;top:0;z-index:30;backdrop-filter:blur(8px);
  background:linear-gradient(180deg, rgba(247,243,234,.92), rgba(247,243,234,.7));
  border-bottom:1px solid var(--line)}
.topbar-in{max-width:1180px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px}
.brand .mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(150deg,var(--green),var(--leaf));
  display:grid;place-items:center;color:#F7F3EA;box-shadow:var(--shadow)}
.brand h1{font-size:19px;font-weight:600;letter-spacing:-.01em;margin:0;line-height:1}
.brand .sub{font-size:11.5px;color:var(--muted);margin-top:3px;letter-spacing:.02em}
.tabs{display:flex;gap:4px;overflow-x:auto;padding:8px 0 0;-ms-overflow-style:none;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:none;background:transparent;
  color:var(--muted);font-family:inherit;font-size:13.5px;font-weight:500;padding:9px 13px;border-radius:10px;cursor:pointer;transition:.15s}
.tab:hover{color:var(--ink);background:rgba(46,107,82,.07)}
.tab.on{color:var(--green);background:#fff;box-shadow:var(--shadow)}
.section-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:26px 0 14px;flex-wrap:wrap}
.section-h h2{font-size:25px;font-weight:600;letter-spacing:-.02em;margin:0}
.section-h p{color:var(--muted);font-size:13px;margin:5px 0 0;max-width:62ch}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow)}
.pad{padding:18px}
.grid{display:grid;gap:14px}
.kpis{grid-template-columns:repeat(4,1fr)}
@media(max-width:860px){.kpis{grid-template-columns:repeat(2,1fr)}}
.two{grid-template-columns:1fr 1fr}
.two-wide{grid-template-columns:1.5fr 1fr}
.three{grid-template-columns:repeat(3,1fr)}
@media(max-width:820px){.two,.two-wide,.three{grid-template-columns:1fr}}
.kpi .lbl{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}
.kpi .val{font-size:27px;font-weight:600;letter-spacing:-.02em;margin-top:6px;line-height:1}
.kpi .meta{font-size:12px;color:var(--muted);margin-top:7px;display:flex;align-items:center;gap:5px}
.pos{color:var(--pos)} .neg{color:var(--neg)}
.pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px}
.pill.g{background:var(--posbg);color:var(--pos)} .pill.r{background:var(--negbg);color:var(--neg)}
.pill.n{background:var(--bg2);color:var(--muted)}
.btn{display:inline-flex;align-items:center;gap:7px;font-family:inherit;font-size:13.5px;font-weight:600;
  padding:9px 14px;border-radius:11px;cursor:pointer;border:1px solid var(--line2);background:#fff;color:var(--ink);transition:.15s}
.btn:hover{border-color:var(--green2);color:var(--green)}
.btn.primary{background:linear-gradient(150deg,var(--green),var(--green2));color:#F7F3EA;border:none;box-shadow:var(--shadow)}
.btn.primary:hover{filter:brightness(1.06);color:#fff}
.btn.ghost{background:transparent;border-color:transparent;color:var(--muted)}
.btn.ghost:hover{background:rgba(46,107,82,.07);color:var(--green)}
.btn.danger{color:var(--neg);border-color:var(--clay-soft)}
.btn.danger:hover{background:var(--negbg);border-color:var(--neg)}
.btn.sm{padding:6px 10px;font-size:12.5px;border-radius:9px}
.row{display:flex;align-items:center;gap:10px}
.spread{display:flex;align-items:center;justify-content:space-between;gap:10px}
.bar-track{height:9px;border-radius:999px;background:var(--bg2);overflow:hidden}
.bar-fill{height:100%;border-radius:999px;transition:width .5s cubic-bezier(.2,.8,.2,1)}
table{width:100%;border-collapse:collapse}
th{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:600;text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle}
tr:last-child td{border-bottom:none}
.num{text-align:right;font-variant-numeric:tabular-nums}
.tag{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:8px;background:var(--bg2);color:var(--green);border:1px solid var(--line)}
.tag.biz{background:#EAF1FF;color:#2C4B8A;border-color:#D6E2FA}
.tag.per{background:var(--posbg);color:var(--pos);border-color:#CFE6D6}
.inp{font-family:inherit;font-size:13.5px;padding:8px 11px;border:1px solid var(--line2);border-radius:10px;background:#fff;color:var(--ink);width:100%}
.inp:focus{outline:none;border-color:var(--green2);box-shadow:0 0 0 3px rgba(46,107,82,.12)}
select.inp{cursor:pointer}
.modal-bg{position:fixed;inset:0;background:rgba(26,38,32,.42);backdrop-filter:blur(3px);z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto}
.modal{background:var(--surface);border-radius:18px;border:1px solid var(--line);box-shadow:0 30px 60px -20px rgba(26,38,32,.4);
  width:100%;max-width:560px;max-height:88vh;overflow:auto;margin:auto}
.empty{text-align:center;padding:54px 20px;color:var(--muted)}
.empty .ic{width:54px;height:54px;border-radius:15px;background:var(--bg2);display:grid;place-items:center;margin:0 auto 14px;color:var(--green2)}
.legend{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:12px}
.legend .it{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted)}
.dot{width:10px;height:10px;border-radius:3px;flex:none}
.note{font-size:12px;color:var(--muted);line-height:1.5}
.banner{display:flex;gap:11px;align-items:flex-start;padding:13px 15px;border-radius:13px;border:1px solid;font-size:13px;line-height:1.5}
.banner.warn{background:var(--negbg);border-color:var(--clay-soft);color:#7C2D16}
.banner.info{background:#EFF5FF;border-color:#D6E2FA;color:#2A3F66}
.fade{animation:fade .4s ease both}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.stagger>*{animation:fade .45s ease both}
.stagger>*:nth-child(1){animation-delay:.02s}.stagger>*:nth-child(2){animation-delay:.06s}
.stagger>*:nth-child(3){animation-delay:.1s}.stagger>*:nth-child(4){animation-delay:.14s}
`;

/* ============================================================ HELPERS */
const PALETTE = ["#1C4B3A","#3E8E6E","#BD5D3A","#B8862A","#5B8C9E","#8A6D3B","#A24B5E","#6B7A4F","#9E7BB5","#C98A4B","#4F7A6B","#B0573F"];
const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n, dec = false) => {
  if (n == null || isNaN(n)) return "—";
  const neg = n < 0; const v = Math.abs(n);
  const s = v.toLocaleString("en-US", { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 });
  return (neg ? "(" : "") + "$" + s + (neg ? ")" : "");
};
const monthKey = (d) => {
  // Parse a stored "YYYY-MM-DD" string directly — never via new Date(), which
  // treats it as UTC midnight and rolls the 1st of the month back a day in
  // negative-offset timezones (e.g. Denver), throwing it into the prior month.
  if (typeof d === "string") { const m = d.match(/^(\d{4})-(\d{2})/); if (m) return `${m[1]}-${m[2]}`; }
  const x = new Date(d); if (isNaN(x)) return ""; return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (k) => { if (!k) return ""; const [y, m] = k.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); };
const parseAmount = (s) => { if (typeof s === "number") return s; if (!s) return NaN; let t = String(s).trim().replace(/[$,\s]/g, ""); if (/^\(.*\)$/.test(t)) t = "-" + t.replace(/[()]/g, ""); return parseFloat(t); };

/* ---- categorization engine (ported from our statement analysis) ---- */
const RULES = [
  // income / sign-aware
  { re: /\balma\b/i, flow: "income", g: "Income — Practice", c: "Alma (insurance payouts)" },
  { re: /headway/i, flow: "income", g: "Income — Practice", c: "Headway (insurance)" },
  { re: /fullscript/i, flow: "income", g: "Income — Practice", c: "Fullscript payouts" },
  { re: /greenlight/i, flow: "income", g: "Income — Other", c: "Greenlight" },
  { re: /psychedelic|mindmed|maps\b/i, flow: "income", g: "Income — Practice", c: "Research contract" },
  // specific payees (override generic payment-method rules below)
  { re: /kam gentry|gentry/i, flow: "expense", g: "Practice / Business", c: "Office rent", biz: "Business" },
  { re: /payment thank you|card payment received|automatic payment - thank/i, flow: "transfer", g: "Transfers & Savings", c: "Card payment (transfer)" },
  { re: /interest charge/i, flow: "expense", g: "Debt service", c: "Card interest" },
  { re: /square\s*inc|sq\*?\d|squareup/i, flow: "auto", g: "Income — Practice", c: "Square (card payments)", expG: "Practice / Business", expC: "Square fee" },
  { re: /venmo/i, flow: "auto", g: "Income — Other", c: "Venmo in", expG: "Payments to Individuals", expC: "Venmo out" },
  { re: /paypal/i, flow: "auto", g: "Income — Other", c: "PayPal in", expG: "Shopping & Retail", expC: "PayPal purchase" },
  { re: /zelle/i, flow: "auto", g: "Income — Other", c: "Zelle in", expG: "Payments to Individuals", expC: "Zelle out" },
  { re: /remote (online )?deposit|mobile deposit|deposit\b.*(check|aba)|edeposit/i, flow: "income", g: "Income — Other", c: "Check deposit" },
  { re: /interest (paid|payment)/i, flow: "income", g: "Income — Other", c: "Interest" },
  { re: /\brefund|return\b|reversal/i, flow: "income", g: "Income — Other", c: "Refund / return" },
  // housing & utilities
  { re: /mr\s*cooper|rocket mortgage|nsm dbamr|\bcooper\b|mortgage/i, flow: "expense", g: "Housing & Utilities", c: "Mortgage" },
  { re: /xcel|energy\b|electric/i, flow: "expense", g: "Housing & Utilities", c: "Electric / gas" },
  { re: /verizon|t-?mobile|at&t|comcast|xfinity|centurylink|internet/i, flow: "expense", g: "Housing & Utilities", c: "Phone / internet" },
  { re: /water|sanitation|\bwaste\b|district/i, flow: "expense", g: "Housing & Utilities", c: "Water / waste" },
  { re: /allen services|plumb|hvac|home depot|lowe'?s|ace hardware|handyman|roofing/i, flow: "expense", g: "Housing & Utilities", c: "Home / repairs" },
  // debt service
  { re: /discover.*(e-?payment|payment)|disc\s*e-?pay/i, flow: "expense", g: "Debt service", c: "Discover payment" },
  { re: /chase (credit crd|card).*(autopay|epay|payment)|payment to .*card|cardmember serv|card payment|crd\s*autopay/i, flow: "expense", g: "Debt service", c: "Credit card payment" },
  { re: /\bciti\b|citibank|bank of america|\bboa\b|capital one|amex|american express|synchrony|barclay/i, flow: "expense", g: "Debt service", c: "Credit card payment" },
  { re: /loan pmt|loanpmt|installment|sofi|upstart|lendingclub/i, flow: "expense", g: "Debt service", c: "Loan payment" },
  // practice / business
  { re: /intakeq|optimantra|spruce|heidi health|simplepractice|jane app|therapynotes/i, flow: "expense", g: "Practice / Business", c: "Practice software", biz: "Business" },
  { re: /squarespace|sqsp|godaddy|wix|domain|mailchimp|google.*workspace|g suite|zoom/i, flow: "expense", g: "Practice / Business", c: "Web / software", biz: "Business" },
  { re: /pdffiller|legalzoom|secretary.*state|np ?business|npbusiness|netce|continuing ed|license|board of/i, flow: "expense", g: "Practice / Business", c: "Licensing / admin", biz: "Business" },
  { re: /tailored tax|wealth|bookkeep|quickbooks|gusto|adp\b/i, flow: "expense", g: "Practice / Business", c: "Accounting / payroll", biz: "Business" },
  { re: /fullscript|wholesale|dispensary|supplement.*invent|mckesson/i, flow: "expense", g: "Practice / Business", c: "Inventory / supplies", biz: "Business" },
  { re: /facebook|meta\b|google ads|adwords|advertis/i, flow: "expense", g: "Practice / Business", c: "Advertising", biz: "Business" },
  // taxes & insurance
  { re: /irs|us treasury|tax pymt|estimated tax|dept of revenue|dept revenue/i, flow: "expense", g: "Taxes", c: "Tax payment" },
  { re: /travelers|geico|state farm|progressive|allstate|goto premium|premium finance|nationwide|libertymut/i, flow: "expense", g: "Insurance", c: "Insurance" },
  // transportation
  { re: /mazda|toyota fin|honda fin|ford credit|gm financial|auto\s*loan|car payment/i, flow: "expense", g: "Transportation", c: "Auto loan" },
  { re: /shell|conoco|chevron|exxon|sinclair|phillips 66|sunoco|costco gas|king soop.*fuel|7-?eleven|\bfuel\b|\bgas\b|loaf.*jug/i, flow: "expense", g: "Transportation", c: "Gas / fuel" },
  { re: /uber|lyft/i, flow: "expense", g: "Transportation", c: "Rideshare" },
  { re: /e-?470|toll|express ?toll|breeze thru|car wash|jiffy lube|midas|firestone|discount tire|les schwab/i, flow: "expense", g: "Transportation", c: "Tolls / auto" },
  // groceries / dining
  { re: /safeway|king soopers|kroger|sprouts|natural grocers|trader joe|costco|sam'?s club|whole foods|walmart|target.*grocery|aldi|food lion/i, flow: "expense", g: "Groceries & Household", c: "Groceries" },
  { re: /starbucks|dutch bros|peet'?s|coffee|\bcafe\b|chipotle|mcdonald|chick-?fil|panera|subway|restaurant|grill|pizza|taco|sushi|thai|ramen|\bbrew\b|kitchen|bagel|deli|bar &|cantina|noodle/i, flow: "expense", g: "Dining & Coffee", c: "Dining / coffee" },
  // shopping
  { re: /amazon|amzn|\btarget\b|best buy|\bross\b|tjmaxx|t\.?j\.? ?maxx|marshalls|kohl'?s|old navy|nordstrom|nike|etsy|ebay|wayfair|ikea/i, flow: "expense", g: "Shopping & Retail", c: "Shopping" },
  // kids
  { re: /poudre|jostens|\bsoccer\b|volleyball|wrestling|\bninja\b|gofan|school|tuition|daycare|childcare|kindercare|montessori|camp\b/i, flow: "expense", g: "Kids & Activities", c: "Kids / school", biz: "Personal" },
  // health / personal
  { re: /\bcvs\b|walgreens|pharmacy|\bdental\b|dentist|\bclinic\b|\bmedical\b|optometr|vision|\bvet\b|veterin|hospital|urgent care/i, flow: "expense", g: "Health & Medical", c: "Health / medical" },
  { re: /raintree|\byoga\b|\bgym\b|fitness|peloton|salon|\bspa\b|barber|haircut|nails/i, flow: "expense", g: "Personal Care", c: "Personal care" },
  // subscriptions / donations
  { re: /netflix|spotify|hulu|disney\+?|\bhbo\b|max\b|apple\.com|prime video|patreon|youtube prem|audible|nytimes|new york times|adobe/i, flow: "expense", g: "Subscriptions", c: "Subscription" },
  { re: /united way|actblue|noco humane|humane society|donation|\bchurch\b|red cross|gofundme/i, flow: "expense", g: "Donations", c: "Donation" },
  // cash / transfers
  { re: /\batm\b|cash withdrawal|withdrawal\b/i, flow: "expense", g: "Groceries & Household", c: "Cash / ATM" },
  { re: /online transfer|transfer to|transfer from|to savings|from savings|\bfnbo\b|to sav |xfer/i, flow: "transfer", g: "Transfers & Savings", c: "Transfer" },
];

/* Infer business vs personal from the category group when a rule doesn't say. */
const BIZ_BY_GROUP = {
  "Income — Practice": "Business", "Practice / Business": "Business",
  "Groceries & Household": "Personal", "Dining & Coffee": "Personal", "Kids & Activities": "Personal",
  "Health & Medical": "Personal", "Personal Care": "Personal", "Shopping & Retail": "Personal",
  "Subscriptions": "Personal", "Donations": "Personal",
};
const bizForGroup = (g) => BIZ_BY_GROUP[g] || "Mixed";

function categorize(desc, amount, customRules = []) {
  const d = desc || "";
  const dl = d.toLowerCase();
  // user-taught rules win over built-ins
  for (const r of (customRules || [])) {
    if (r.match && dl.includes(r.match)) {
      return { flow: r.flow || (amount >= 0 ? "income" : "expense"), group: r.group, category: r.category, biz: r.biz || bizForGroup(r.group) };
    }
  }
  for (const r of RULES) {
    if (r.re.test(d)) {
      if (r.flow === "auto") {
        if (amount >= 0) return { flow: "income", group: r.g, category: r.c, biz: r.biz || bizForGroup(r.g) };
        return { flow: "expense", group: r.expG, category: r.expC, biz: r.biz || bizForGroup(r.expG) };
      }
      // sign sanity: a positive amount tagged as an expense-fee is really income
      if (amount > 0 && r.flow === "expense" && /fee|return|refund/i.test(r.c)) {
        return { flow: "income", group: "Income — Other", category: "Refund / return", biz: "Mixed" };
      }
      return { flow: r.flow, group: r.g, category: r.c, biz: r.biz || bizForGroup(r.g) };
    }
  }
  if (amount > 0) return { flow: "income", group: "Income — Other", category: "Uncategorized income", biz: "Mixed" };
  return { flow: "expense", group: "Other / Uncategorized", category: "Uncategorized", biz: "Mixed" };
}

const EXPENSE_GROUPS = ["Housing & Utilities","Debt service","Practice / Business","Taxes","Insurance","Transportation","Groceries & Household","Dining & Coffee","Shopping & Retail","Kids & Activities","Health & Medical","Personal Care","Subscriptions","Donations","Payments to Individuals","Other / Uncategorized"];
const ALL_GROUPS = ["Income — Practice", "Income — Other", ...EXPENSE_GROUPS, "Transfers & Savings"];
const flowForGroup = (g) => /^Income/i.test(g) ? "income" : /Transfer/i.test(g) ? "transfer" : "expense";
const KW_NOISE = new Set(["mktp","llc","inc","the","store","online","com","www","pos","debit","purchase","payment","des","ppd","ach","autopay","epayment","recurring","corp","co"]);
function keywordFromDesc(d) {
  const toks = (d || "").toLowerCase()
    .replace(/card\s*\d+.*$/i, "")
    .replace(/#?\d{2,}/g, " ")
    .replace(/[^a-z\s&]/g, " ")
    .replace(/\s+/g, " ").trim()
    .split(" ")
    .filter((w) => w.length > 2 && !KW_NOISE.has(w));
  const seen = new Set();
  const uniq = toks.filter((w) => (seen.has(w) ? false : seen.add(w)));
  return uniq.slice(0, 2).join(" ");
}

/* ---- auto debt tracking: derive a debt's live balance from its payments ----
   When a debt is "linked" (auto + a match keyword), we sum the expense
   transactions whose description contains the keyword (on/after an optional
   start date) and treat them as payments. The estimated balance is the
   starting balance minus those payments — a floor that ignores new interest
   and new charges, so the lender's statement remains the source of truth. */
function debtStats(debt, txns) {
  const linked = !!(debt && debt.auto && debt.match);
  if (!linked) return { linked: false, balance: debt?.balance || 0, paid: 0, paidThisMonth: 0, count: 0, lastDate: null, start: debt?.balance || 0 };
  const m = debt.match.toLowerCase();
  const sd = debt.startDate || null;
  const thisMonth = monthKey(new Date().toISOString());
  let paid = 0, paidThisMonth = 0, count = 0, lastDate = null;
  for (const t of txns || []) {
    if (t.flow !== "expense") continue;
    if (!(t.description || "").toLowerCase().includes(m)) continue;
    if (sd && t.date < sd) continue;
    const amt = Math.abs(t.amount);
    paid += amt; count++;
    if (!lastDate || t.date > lastDate) lastDate = t.date;
    if (monthKey(t.date) === thisMonth) paidThisMonth += amt;
  }
  const start = debt.startBalance != null ? debt.startBalance : (debt.balance || 0);
  const balance = Math.max(0, start - paid);
  return { linked: true, balance, paid, paidThisMonth, count, lastDate, start };
}

/* Resolve a goal's progress, auto-linking to a debt when goal.debtId is set. */
function goalView(goal, state) {
  if (goal.debtId) {
    const d = (state.debts || []).find((x) => x.id === goal.debtId);
    if (d) {
      const st = debtStats(d, state.transactions);
      const start = st.linked ? st.start : (d.balance || 0);
      const current = st.linked ? st.balance : (d.balance || 0);
      const pct = start > 0 ? ((start - current) / start) * 100 : (current === 0 ? 100 : 0);
      return { kind: "payoff", start, current, target: 0, pct: Math.max(0, Math.min(100, pct)), linkedTo: d.name, paid: st.paid };
    }
  }
  const pct = goal.kind === "payoff"
    ? (goal.start > goal.target ? ((goal.start - goal.current) / (goal.start - goal.target)) * 100 : 0)
    : (goal.target > 0 ? (goal.current / goal.target) * 100 : 0);
  return { kind: goal.kind, start: goal.start, current: goal.current, target: goal.target, pct: Math.max(0, Math.min(100, pct)), linkedTo: null };
}

/* ---- seed: their real figures from our analysis ---- */
const SEED_BUDGETS = {
  "Housing & Utilities": 2700, "Debt service": 2780, "Practice / Business": 1860, "Taxes": 500,
  "Insurance": 440, "Transportation": 860, "Groceries & Household": 970, "Dining & Coffee": 360,
  "Shopping & Retail": 520, "Kids & Activities": 750, "Health & Medical": 300, "Personal Care": 120,
  "Subscriptions": 120, "Donations": 90, "Payments to Individuals": 1650, "Other / Uncategorized": 120,
};
const SEED_DEBTS = [
  { id: uid(), name: "Discover CC", owner: "Shannon", balance: 3224, apr: 21.0, min: 196 },
  { id: uid(), name: "Chase Sapphire", owner: "Shannon", balance: 20318, apr: 19.49, min: 500 },
  { id: uid(), name: "Discover loan", owner: "Shannon", balance: 33787, apr: 17.9, min: 1209 },
  { id: uid(), name: "FNBO credit line", owner: "Shannon", balance: 6830, apr: 17.74, min: 250 },
  { id: uid(), name: "Unlabeled line", owner: "Shannon", balance: 4542, apr: 17.0, min: 120 },
  { id: uid(), name: "Credit card(s)", owner: "Cole", balance: 20000, apr: 22.0, min: 600 },
  { id: uid(), name: "IRS back taxes", owner: "Shannon", balance: 26279, apr: 8.0, min: 481 },
  { id: uid(), name: "Student loans", owner: "Shannon", balance: 55000, apr: 6.5, min: 0 },
  { id: uid(), name: "Student loans (forbearance)", owner: "Cole", balance: 110000, apr: 6.5, min: 0 },
];
const SEED_GOALS = [
  { id: uid(), name: "Crush high-interest debt (≥15%)", kind: "payoff", start: 88701, current: 88701, target: 0, color: "#BD5D3A", note: "Sapphire, Discover×2, FNBO, unlabeled, Cole's card. The ~18% money-fire." },
  { id: uid(), name: "Fund current-year taxes", kind: "save", start: 0, current: 0, target: 36000, color: "#B8862A", note: "Set aside ~$3k/mo so next April isn't another hole. Most urgent." },
  { id: uid(), name: "Pay off IRS back taxes", kind: "payoff", start: 26279, current: 26279, target: 0, color: "#1C4B3A", note: "Existing balance — get on an installment agreement." },
  { id: uid(), name: "Starter emergency fund", kind: "save", start: 0, current: 0, target: 5000, color: "#3E8E6E", note: "First cushion before aggressive payoff." },
];

const DEFAULT_STATE = {
  v: 2, transactions: [], imports: [], budgets: { ...SEED_BUDGETS }, debts: SEED_DEBTS, goals: SEED_GOALS,
  accounts: ["Chase Checking ••3217", "Chase Sapphire ••8618", "Discover ••1908", "Cole — personal"],
  customRules: [],
};

/* ---- demo transactions (two months, representative) ---- */
function makeDemo() {
  const mk = (daysAgo, desc, amount, account) => {
    const dt = new Date(); dt.setDate(dt.getDate() - daysAgo);
    const cat = categorize(desc, amount);
    return { id: uid(), date: dt.toISOString().slice(0, 10), account: account || "Chase Checking ••3217", description: desc, amount, ...cat };
  };
  const rows = [];
  for (const off of [3, 33]) {
    rows.push(
      mk(off + 0, "Alma Health Payout PPD", 4720.5),
      mk(off + 1, "Alma Health Payout PPD", 3980.0),
      mk(off + 2, "Square Inc Sq Deposit", 1610.25),
      mk(off + 3, "Headway EFT Payment", 840.0),
      mk(off + 4, "Mr Cooper Mortgage", -2565.0),
      mk(off + 5, "Mazda Financial Auto Loan", -772.0),
      mk(off + 6, "Zelle Payment to Kam Gentry", -1278.0),
      mk(off + 7, "IntakeQ Subscription", -119.0),
      mk(off + 8, "Optimantra Software", -149.0),
      mk(off + 9, "Discover E-Payment", -1209.0),
      mk(off + 10, "Chase Credit Crd Autopay", -500.0),
      mk(off + 11, "King Soopers #023", -214.37),
      mk(off + 12, "Costco Whse", -188.4),
      mk(off + 13, "Dutch Bros Coffee", -9.25),
      mk(off + 14, "Chipotle Online", -31.8),
      mk(off + 15, "Xcel Energy", -128.0),
      mk(off + 16, "Verizon Wireless", -156.0),
      mk(off + 17, "Poudre School District Lunch", -60.0),
      mk(off + 18, "UNCO Volleyball Camp", -180.0),
      mk(off + 19, "Shell Oil Fuel", -58.2),
      mk(off + 20, "Amazon Mktp", -74.99),
      mk(off + 21, "Travelers Insurance", -214.0),
      mk(off + 22, "Netflix.com", -22.99),
      mk(off + 23, "Venmo Payment", -600.0),
      mk(off + 24, "United Way Donation", -25.0),
    );
  }
  return rows;
}

/* ============================================================ STORAGE */
const KEY = "budget_app_v2";
// Persistence. Local cache (works offline + as a Claude artifact) plus, when a
// Supabase client is configured, a per-user server row that syncs across devices.
async function loadLocal() {
  try { if (typeof window !== "undefined" && window.storage?.get) { const r = await window.storage.get(KEY); if (r?.value) return JSON.parse(r.value); } } catch (e) {}
  try { const v = localStorage.getItem(KEY); if (v) return JSON.parse(v); } catch (e) {}
  return null;
}
async function saveLocal(s) {
  try { if (typeof window !== "undefined" && window.storage?.set) { await window.storage.set(KEY, JSON.stringify(s)); } } catch (e) {}
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}
async function fetchServer(hid) {
  if (!supabase) return undefined;
  try {
    const { data, error } = await supabase.from("budgets").select("data").eq("household_id", hid).maybeSingle();
    if (error) { console.warn("fetch:", error.message); return undefined; }
    return data ? data.data : undefined;
  } catch (e) { console.warn(e); return undefined; }
}
async function upsertServer(hid, state) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("budgets").upsert(
      { household_id: hid, data: state, updated_at: new Date().toISOString() }, { onConflict: "household_id" });
    if (error) { console.warn("save:", error.message); return false; }
    return true;
  } catch (e) { console.warn(e); return false; }
}
const hasCloud = !!supabase;

/* ============================================================ SMALL UI */
function Card({ children, className = "" }) { return <div className={"card " + className}>{children}</div>; }
function ProgressBar({ value, color = "#3E8E6E" }) {
  const w = Math.max(0, Math.min(100, value || 0));
  return <div className="bar-track"><div className="bar-fill" style={{ width: w + "%", background: color }} /></div>;
}
function Modal({ title, onClose, children }) {
  // Rendered in a portal at <body> so it always centers on the VIEWPORT —
  // never lost mid-page in a long transactions list — with background scroll locked.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return createPortal(
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal fade" onClick={(e) => e.stopPropagation()}>
        <div className="spread pad" style={{ borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{title}</h3>
          <button className="btn ghost sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="pad">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ============================================================ APP SHELL */
function AppShell({ session, localOnly, household, onHouseholdChange }) {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("dash");
  const [month, setMonth] = useState(null);
  const [sync, setSync] = useState(localOnly ? "local" : "idle");
  const saveTimer = useRef(null);
  const lastWritten = useRef("");
  const householdId = household?.id;
  const email = session?.user?.email;
  const valid = (d) => d && Array.isArray(d.transactions);

  // initial load: local cache first (instant/offline), then server (source of truth)
  useEffect(() => {
    let alive = true;
    (async () => {
      const cached = await loadLocal();
      if (alive && valid(cached)) { setState(cached); lastWritten.current = JSON.stringify(cached); }
      if (!localOnly && householdId) {
        const remote = await fetchServer(householdId);
        if (!alive) return;
        if (valid(remote)) {
          setState(remote); lastWritten.current = JSON.stringify(remote); saveLocal(remote); setSync("synced");
        } else {
          const seed = valid(cached) ? cached : DEFAULT_STATE;   // seed the shared budget on first use
          setState(seed); lastWritten.current = JSON.stringify(seed);
          const ok = await upsertServer(householdId, seed); setSync(ok ? "synced" : "error");
        }
      } else if (alive && !valid(cached)) {
        setState(DEFAULT_STATE); lastWritten.current = JSON.stringify(DEFAULT_STATE);
      }
    })();
    return () => { alive = false; };
  }, [householdId, localOnly]);

  // save on change (always cache; debounce-push to the shared household budget)
  useEffect(() => {
    if (!state) return;
    const json = JSON.stringify(state);
    if (json === lastWritten.current) return;
    saveLocal(state);
    if (localOnly || !householdId) { lastWritten.current = json; return; }
    setSync("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await upsertServer(householdId, state);
      lastWritten.current = json;
      setSync(ok ? "synced" : "error");
    }, 600);
  }, [state, householdId, localOnly]);

  // cross-device sync: refetch on focus, plus realtime if enabled
  useEffect(() => {
    if (localOnly || !householdId) return;
    const apply = (d) => { if (!valid(d)) return; const j = JSON.stringify(d); if (j !== lastWritten.current) { setState(d); lastWritten.current = j; saveLocal(d); setSync("synced"); } };
    const refetch = async () => { const r = await fetchServer(householdId); if (r) apply(r); };
    const onVis = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    let channel;
    try {
      channel = supabase.channel("budgets-" + householdId)
        .on("postgres_changes", { event: "*", schema: "public", table: "budgets", filter: "household_id=eq." + householdId },
          (payload) => { if (payload.new?.data) apply(payload.new.data); })
        .subscribe();
    } catch (e) {}
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); if (channel) { try { supabase.removeChannel(channel); } catch (e) {} } };
  }, [householdId, localOnly]);

  const months = useMemo(() => {
    if (!state) return [];
    const set = new Set(state.transactions.map((t) => monthKey(t.date)).filter(Boolean));
    return [...set].sort().reverse();
  }, [state]);
  useEffect(() => { if (months.length && !month) setMonth(months[0]); }, [months, month]);

  if (!state) return <Splash />;

  /* mutators */
  const patch = (p) => setState((s) => ({ ...s, ...p }));
  const addTxns = (rows) => setState((s) => ({ ...s, transactions: [...s.transactions, ...rows] }));
  const importBatch = (rows, meta = {}) => setState((s) => {
    const id = uid();
    const tagged = rows.map((r) => ({ ...r, imp: id }));
    const rec = { id, when: new Date().toISOString(), count: rows.length, label: meta.label || "Import", account: meta.account || "", source: meta.source || "csv" };
    return { ...s, transactions: [...s.transactions, ...tagged], imports: [...(s.imports || []), rec] };
  });
  const deleteImport = (id) => setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.imp !== id), imports: (s.imports || []).filter((r) => r.id !== id) }));
  const updateTxn = (id, p) => setState((s) => ({ ...s, transactions: s.transactions.map((t) => t.id === id ? { ...t, ...p } : t) }));
  const delTxn = (id) => setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  const applyCategorization = ({ txnId, cat, rule, applyExisting }) => setState((s) => {
    let transactions = s.transactions.map((t) => t.id === txnId ? { ...t, ...cat } : t);
    let customRules = s.customRules || [];
    if (rule) {
      customRules = [...customRules.filter((r) => r.match !== rule.match), rule];
      if (applyExisting) {
        transactions = transactions.map((t) => (t.description || "").toLowerCase().includes(rule.match)
          ? { ...t, flow: rule.flow, group: rule.group, category: rule.category, biz: rule.biz } : t);
      }
    }
    return { ...s, transactions, customRules };
  });
  const deleteRule = (id) => setState((s) => ({ ...s, customRules: (s.customRules || []).filter((r) => r.id !== id) }));
  const signOut = async () => { try { await supabase.auth.signOut(); } catch (e) {} };

  const TABS = [
    ["dash", "Dashboard", LayoutDashboard], ["txns", "Transactions", Receipt], ["budget", "Budgets", Wallet],
    ["goals", "Goals", Target], ["debts", "Debts", Landmark], ["data", "Data", Database],
  ];

  return (
    <div className="bapp">
      <div className="topbar">
        <div className="topbar-in">
          <div className="brand" style={{ flex: 1 }}>
            <div className="mark"><PiggyBank size={20} /></div>
            <div>
              <h1 className="serif">Hearth <span style={{ color: "var(--clay)" }}>·</span> Household Finances</h1>
              <div className="sub">Butler / Darling{localOnly ? " · this device only" : household ? " · " + household.name : " · synced to your account"}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            {months.length > 0 && (tab === "dash" || tab === "budget") && (
              <select className="inp" style={{ width: "auto" }} value={month || ""} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            )}
            <SyncBadge sync={sync} />
            {!localOnly && (
              <div className="row" style={{ gap: 7 }}>
                <span className="note" title={email} style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
                <button className="btn ghost sm" onClick={signOut} title="Sign out"><LogOut size={15} /></button>
              </div>
            )}
          </div>
        </div>
        <div className="topbar-in" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="tabs">
            {TABS.map(([id, label, Icon]) => (
              <button key={id} className={"tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap">
        {tab === "dash" && <Dashboard state={state} month={month} months={months} />}
        {tab === "txns" && <Transactions state={state} addTxns={addTxns} importBatch={importBatch} updateTxn={updateTxn} delTxn={delTxn} applyCategorization={applyCategorization} />}
        {tab === "budget" && <Budgets state={state} month={month} patch={patch} />}
        {tab === "goals" && <Goals state={state} patch={patch} />}
        {tab === "debts" && <Debts state={state} patch={patch} />}
        {tab === "data" && <DataTab state={state} setState={setState} addTxns={addTxns} importBatch={importBatch} deleteImport={deleteImport} deleteRule={deleteRule} household={household} onHouseholdChange={onHouseholdChange} session={session} localOnly={localOnly} />}
      </div>
    </div>
  );
}

/* ============================================================ AUTH WRAPPER */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!hasCloud) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);   // user arrived via a reset-email link
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  let content;
  if (!hasCloud) content = <AppShell localOnly />;
  else if (session === undefined) content = <Splash />;
  else if (!session) content = <AuthScreen />;
  else if (recovery) content = <ResetPasswordScreen onDone={() => setRecovery(false)} />;
  else content = <CloudGate session={session} key={session.user.id} />;

  return (<>{FONT_LINKS}<style>{CSS}</style>{content}</>);
}

/* Resolves which household the signed-in user belongs to, then renders the app. */
function CloudGate({ session }) {
  const [household, setHousehold] = useState(undefined); // undefined=loading, null=none, obj=joined
  const load = async () => {
    try {
      const { data, error } = await supabase.rpc("get_my_household");
      if (error) throw error;
      setHousehold(data && data.length ? data[0] : null);
    } catch (e) { console.warn(e?.message || e); setHousehold(null); }
  };
  useEffect(() => { load(); }, [session?.user?.id]);

  if (household === undefined) return <Splash />;
  if (!household) return <HouseholdOnboarding session={session} onReady={load} />;
  return <AppShell session={session} household={household} onHouseholdChange={load} />;
}

function HouseholdOnboarding({ session, onReady }) {
  const [mode, setMode] = useState(null); // null | create | join
  const [name, setName] = useState("Our Household");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const run = async (fn) => {
    setBusy(true); setErr(null);
    try { const { error } = await fn(); if (error) throw error; await onReady(); }
    catch (e) { setErr(e?.message || String(e)); setBusy(false); }
  };
  const create = () => run(() => supabase.rpc("create_household", { p_name: name }));
  const join = () => run(() => supabase.rpc("join_household", { p_code: code }));
  const signOut = async () => { try { await supabase.auth.signOut(); } catch (e) {} };

  return (
    <div className="bapp" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <div className="card fade" style={{ width: "100%", maxWidth: 460 }}>
        <div className="pad" style={{ textAlign: "center", borderBottom: "1px solid var(--line)" }}>
          <div className="mark" style={{ margin: "0 auto 12px", width: 46, height: 46 }}><PiggyBank size={24} /></div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Set up your household</h1>
          <div className="note" style={{ marginTop: 5 }}>A household holds one shared budget that everyone in it can see and edit.</div>
        </div>
        <div className="pad">
          {!mode && (
            <div className="grid" style={{ gap: 10 }}>
              <button className="btn primary" style={{ justifyContent: "center" }} onClick={() => { setMode("create"); setErr(null); }}><Plus size={15} /> Create a new household</button>
              <button className="btn" style={{ justifyContent: "center" }} onClick={() => { setMode("join"); setErr(null); }}><LogIn size={15} /> Join with an invite code</button>
              <div className="note" style={{ textAlign: "center", marginTop: 4 }}>One of you creates it; the other joins with the code.</div>
            </div>
          )}
          {mode === "create" && (
            <div className="grid" style={{ gap: 12 }}>
              <Field label="Household name"><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Butler–Darling Household" /></Field>
              <button className="btn primary" style={{ justifyContent: "center" }} disabled={busy} onClick={create}>{busy ? <><Loader2 size={15} className="spin" /> Creating…</> : <><Check size={15} /> Create household</>}</button>
              <button className="btn ghost sm" style={{ justifyContent: "center" }} onClick={() => setMode(null)}>← Back</button>
            </div>
          )}
          {mode === "join" && (
            <div className="grid" style={{ gap: 12 }}>
              <Field label="Invite code"><input className="inp" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 9F3A2B7C" style={{ letterSpacing: "0.15em", fontFamily: "ui-monospace,monospace" }} /></Field>
              <button className="btn primary" style={{ justifyContent: "center" }} disabled={busy || !code} onClick={join}>{busy ? <><Loader2 size={15} className="spin" /> Joining…</> : <><Check size={15} /> Join household</>}</button>
              <button className="btn ghost sm" style={{ justifyContent: "center" }} onClick={() => setMode(null)}>← Back</button>
            </div>
          )}
          {err && <div className="banner warn" style={{ marginTop: 12 }}><AlertTriangle size={15} style={{ flex: "none", marginTop: 1 }} /><span>{err}</span></div>}
        </div>
        <div className="pad" style={{ borderTop: "1px solid var(--line)", background: "var(--bg2)", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="note" title={session?.user?.email} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</span>
          <button className="btn ghost sm" onClick={signOut}><LogOut size={14} /> Sign out</button>
        </div>
      </div>
    </div>
  );
}

function Splash() {
  return <div className="bapp" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}><div className="note">Loading your workspace…</div></div>;
}

function SyncBadge({ sync }) {
  if (sync === "local") return <span className="pill n"><Database size={12} /> Local only</span>;
  if (sync === "saving") return <span className="pill n"><Loader2 size={12} className="spin" /> Saving…</span>;
  if (sync === "synced") return <span className="pill g"><Cloud size={12} /> Synced</span>;
  if (sync === "error") return <span className="pill r"><CloudOff size={12} /> Sync error</span>;
  return <span className="pill n"><Cloud size={12} /> Connecting…</span>;
}

function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [ok, setOk] = useState(null);

  const submit = async () => {
    if (busy || !email || (mode !== "forgot" && !pw)) return;
    setBusy(true); setMsg(null); setOk(null);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) setMsg(error.message);
        else setOk("Reset link sent — check your email, then follow the link back here to choose a new password.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setMsg(error.message);
        else if (!data.session) setOk("Account created — check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg(error.message);
      }
    } catch (e) { setMsg(String(e?.message || e)); }
    setBusy(false);
  };

  return (
    <div className="bapp" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <div className="card fade" style={{ width: "100%", maxWidth: 400 }}>
        <div className="pad" style={{ textAlign: "center", borderBottom: "1px solid var(--line)" }}>
          <div className="mark" style={{ margin: "0 auto 12px", width: 46, height: 46 }}><PiggyBank size={24} /></div>
          <h1 className="serif" style={{ margin: 0, fontSize: 25, fontWeight: 600 }}>Hearth</h1>
          <div className="note" style={{ marginTop: 5 }}>{mode === "signin" ? "Sign in to your household finances" : mode === "signup" ? "Create your account" : "Reset your password"}</div>
        </div>
        <div className="pad">
          <Field label="Email"><input className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && mode === "forgot") submit(); }} placeholder="you@example.com" /></Field>
          {mode !== "forgot" && <>
            <div style={{ height: 11 }} />
            <Field label="Password"><input className="inp" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="••••••••" /></Field>
          </>}
          {msg && <div className="banner warn" style={{ marginTop: 12 }}><AlertTriangle size={15} style={{ flex: "none", marginTop: 1 }} /><span>{msg}</span></div>}
          {ok && <div className="banner info" style={{ marginTop: 12 }}><Check size={15} style={{ flex: "none", marginTop: 1 }} /><span>{ok}</span></div>}
          <button className="btn primary" onClick={submit} disabled={busy || !email || (mode !== "forgot" && !pw)} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
            {busy ? <><Loader2 size={15} className="spin" /> Working…</> : mode === "signin" ? <><LogIn size={15} /> Sign in</> : mode === "signup" ? <><ShieldCheck size={15} /> Create account</> : <><KeyRound size={15} /> Send reset link</>}
          </button>
          <div className="note" style={{ textAlign: "center", marginTop: 14 }}>
            {mode === "signin" ? "No account yet? " : "Back to "}
            <button className="btn ghost sm" style={{ display: "inline-flex" }} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); setOk(null); }}>{mode === "signin" ? "Create one" : "Sign in"}</button>
            {mode === "signin" && <> · <button className="btn ghost sm" style={{ display: "inline-flex" }} onClick={() => { setMode("forgot"); setMsg(null); setOk(null); }}>Forgot password?</button></>}
          </div>
        </div>
        <div className="pad" style={{ borderTop: "1px solid var(--line)", background: "var(--bg2)", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
          <div className="note" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><ShieldCheck size={14} style={{ flex: "none", marginTop: 1, color: "var(--green2)" }} /><span>Protected by row-level security — only your account can read your data, and it's encrypted in transit.</span></div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ onDone }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async () => {
    if (busy) return;
    if (pw.length < 6) { setMsg("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setMsg("Passwords don't match."); return; }
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) { setMsg(error.message); setBusy(false); return; }
      onDone();
    } catch (e) { setMsg(String(e?.message || e)); setBusy(false); }
  };
  return (
    <div className="bapp" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <div className="card fade" style={{ width: "100%", maxWidth: 400 }}>
        <div className="pad" style={{ textAlign: "center", borderBottom: "1px solid var(--line)" }}>
          <div className="mark" style={{ margin: "0 auto 12px", width: 46, height: 46 }}><KeyRound size={22} /></div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Choose a new password</h1>
          <div className="note" style={{ marginTop: 5 }}>You followed a reset link — set your new password below.</div>
        </div>
        <div className="pad">
          <Field label="New password"><input className="inp" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></Field>
          <div style={{ height: 11 }} />
          <Field label="Confirm new password"><input className="inp" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="••••••••" /></Field>
          {msg && <div className="banner warn" style={{ marginTop: 12 }}><AlertTriangle size={15} style={{ flex: "none", marginTop: 1 }} /><span>{msg}</span></div>}
          <button className="btn primary" onClick={submit} disabled={busy || !pw || !pw2} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
            {busy ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Check size={15} /> Set new password</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ DASHBOARD */
function Dashboard({ state, month, months }) {
  const txns = state.transactions;
  const inMonth = useMemo(() => txns.filter((t) => monthKey(t.date) === month), [txns, month]);
  const income = inMonth.filter((t) => t.flow === "income").reduce((a, t) => a + t.amount, 0);
  const expense = inMonth.filter((t) => t.flow === "expense").reduce((a, t) => a + Math.abs(t.amount), 0);
  const net = income - expense;
  const saveRate = income > 0 ? (net / income) * 100 : 0;

  const byGroup = useMemo(() => {
    const m = {};
    inMonth.filter((t) => t.flow === "expense").forEach((t) => { m[t.group] = (m[t.group] || 0) + Math.abs(t.amount); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [inMonth]);

  const trend = useMemo(() => {
    const order = [...months].sort();
    return order.map((mk) => {
      const rows = txns.filter((t) => monthKey(t.date) === mk);
      return {
        month: monthLabel(mk),
        Income: rows.filter((t) => t.flow === "income").reduce((a, t) => a + t.amount, 0),
        Expenses: rows.filter((t) => t.flow === "expense").reduce((a, t) => a + Math.abs(t.amount), 0),
      };
    });
  }, [txns, months]);

  const bizSplit = useMemo(() => {
    const m = { Business: 0, Personal: 0, Mixed: 0 };
    inMonth.filter((t) => t.flow === "expense").forEach((t) => { m[t.biz === "Business" ? "Business" : t.biz === "Personal" ? "Personal" : "Mixed"] += Math.abs(t.amount); });
    return m;
  }, [inMonth]);

  if (txns.length === 0) return <EmptyDash />;

  const kpis = [
    { lbl: "Income", val: money(income), color: "var(--pos)", icon: <TrendingUp size={14} />, meta: monthLabel(month) },
    { lbl: "Expenses", val: money(expense), color: "var(--neg)", icon: <TrendingDown size={14} />, meta: `${inMonth.filter(t=>t.flow==="expense").length} transactions` },
    { lbl: "Net", val: money(net), color: net >= 0 ? "var(--pos)" : "var(--neg)", icon: net >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />, meta: net >= 0 ? "surplus" : "shortfall" },
    { lbl: "Savings rate", val: (saveRate >= 0 ? "" : "−") + Math.abs(saveRate).toFixed(0) + "%", color: saveRate >= 0 ? "var(--pos)" : "var(--neg)", icon: <PiggyBank size={14} />, meta: "of income kept" },
  ];

  return (
    <div className="fade">
      <div className="section-h"><div><h2 className="serif">Dashboard</h2><p>Your money in {monthLabel(month)}, measured against where you want it to go.</p></div></div>

      <div className="grid kpis stagger" style={{ marginBottom: 14 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} className="kpi pad">
            <div className="lbl">{k.lbl}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
            <div className="meta">{k.icon}{k.meta}</div>
          </Card>
        ))}
      </div>

      <div className="grid two-wide" style={{ marginBottom: 14 }}>
        <Card className="pad">
          <div className="spread" style={{ marginBottom: 8 }}><strong style={{ fontWeight: 600 }}>Income vs. Expenses</strong><span className="note">across {trend.length} month{trend.length>1?"s":""}</span></div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={trend} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7A70" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7A70" }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + (v / 1000) + "k"} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E5DDCB", fontSize: 12, fontFamily: "Hanken Grotesk" }} />
              <Bar dataKey="Income" fill="#3E8E6E" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Expenses" fill="#BD5D3A" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="pad">
          <div className="spread" style={{ marginBottom: 8 }}><strong style={{ fontWeight: 600 }}>Where it went</strong><span className="note">{monthLabel(month)}</span></div>
          {byGroup.length === 0 ? <div className="note">No expenses this month.</div> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byGroup} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {byGroup.map((e, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E5DDCB", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {byGroup.slice(0, 6).map((g, i) => (
                  <div className="it" key={g.name}><span className="dot" style={{ background: PALETTE[i % PALETTE.length] }} />{g.name.replace(/ &.*/, "")} · {money(g.value)}</div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid two" style={{ marginBottom: 14 }}>
        <Card className="pad">
          <div className="spread" style={{ marginBottom: 12 }}><strong style={{ fontWeight: 600 }}>Budget vs. actual</strong><span className="note">{monthLabel(month)}</span></div>
          <div className="grid" style={{ gap: 12 }}>
            {byGroup.slice(0, 7).map((g) => {
              const target = state.budgets[g.name] || 0;
              const pct = target > 0 ? (g.value / target) * 100 : 100;
              const over = target > 0 && g.value > target;
              return (
                <div key={g.name}>
                  <div className="spread" style={{ marginBottom: 5, fontSize: 13 }}>
                    <span>{g.name}</span>
                    <span className={over ? "neg" : ""} style={{ fontWeight: 600 }}>{money(g.value)} <span className="note">/ {target ? money(target) : "—"}</span></span>
                  </div>
                  <ProgressBar value={pct} color={over ? "#B23A26" : "#3E8E6E"} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="pad">
          <div className="spread" style={{ marginBottom: 12 }}><strong style={{ fontWeight: 600 }}>Goals at a glance</strong><span className="note">{state.goals.length} active</span></div>
          <div className="grid" style={{ gap: 13 }}>
            {state.goals.slice(0, 4).map((g) => {
              const gv = goalView(g, state);
              return (
                <div key={g.id}>
                  <div className="spread" style={{ marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{g.name}</span>
                    <span className="note">{gv.pct.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={gv.pct} color={g.color} />
                  <div className="note" style={{ marginTop: 4 }}>{gv.kind === "payoff" ? `${money(gv.current)} left` : `${money(gv.current)} of ${money(gv.target)}`}{gv.linkedTo ? " · auto" : ""}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="pad">
        <div className="spread" style={{ marginBottom: 10 }}><strong style={{ fontWeight: 600 }}>Business vs. personal spending</strong><span className="note">helps with taxes · {monthLabel(month)}</span></div>
        <div className="row" style={{ gap: 18, flexWrap: "wrap" }}>
          {Object.entries(bizSplit).map(([k, v], i) => (
            <div key={k} style={{ flex: 1, minWidth: 150 }}>
              <div className="spread" style={{ fontSize: 13, marginBottom: 5 }}><span><span className={"tag " + (k === "Business" ? "biz" : k === "Personal" ? "per" : "")}>{k}</span></span><strong>{money(v)}</strong></div>
              <ProgressBar value={expense > 0 ? (v / expense) * 100 : 0} color={k === "Business" ? "#2C4B8A" : k === "Personal" ? "#2F7A55" : "#B8862A"} />
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}>Tip: re-tag transactions on the Transactions tab. Clean business tagging makes your quarterly tax estimate far easier.</div>
      </Card>
    </div>
  );
}

function EmptyDash() {
  return (
    <div className="fade">
      <div className="section-h"><div><h2 className="serif">Dashboard</h2><p>Once you import transactions, this fills with your income, spending, and progress.</p></div></div>
      <Card className="empty">
        <div className="ic"><Sparkles size={24} /></div>
        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 16, marginBottom: 6 }}>Your workspace is ready</div>
        <div style={{ maxWidth: 440, margin: "0 auto 18px" }}>Your debts, budgets, and goals are already loaded from our analysis. Add transactions to see the dashboard come alive — import a bank CSV, or load demo data to explore first.</div>
        <div className="row" style={{ justifyContent: "center" }}>
          <span className="note">Go to <strong>Transactions</strong> to import · or <strong>Data</strong> to load a demo</span>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ TRANSACTIONS */
function Transactions({ state, addTxns, importBatch, updateTxn, delTxn, applyCategorization }) {
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [categorizing, setCategorizing] = useState(null);
  const [fGroup, setFGroup] = useState("all");
  const [fFlow, setFFlow] = useState("all");
  const [fMonth, setFMonth] = useState("all");
  const [q, setQ] = useState("");

  const months = useMemo(() => [...new Set(state.transactions.map((t) => monthKey(t.date)))].sort().reverse(), [state.transactions]);
  const rows = useMemo(() => {
    return [...state.transactions]
      .filter((t) => fGroup === "all" || t.group === fGroup)
      .filter((t) => fFlow === "all" || t.flow === fFlow)
      .filter((t) => fMonth === "all" || monthKey(t.date) === fMonth)
      .filter((t) => !q || (t.description || "").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.transactions, fGroup, fFlow, fMonth, q]);

  return (
    <div className="fade">
      <div className="section-h">
        <div><h2 className="serif">Transactions</h2><p>{state.transactions.length} total. Import bank CSVs or Chase statement PDFs, fix any category, and the rest of the app updates instantly.</p></div>
        <div className="row">
          <button className="btn" onClick={() => setAdding(true)}><Plus size={15} /> Add</button>
          <button className="btn primary" onClick={() => setImporting(true)}><Upload size={15} /> Import CSV</button>
        </div>
      </div>

      {notice && <div className="banner info" style={{ marginBottom: 14 }}><Check size={16} style={{ flex: "none", marginTop: 1 }} /><span style={{ flex: 1 }}>{notice}</span><button className="btn ghost sm" onClick={() => setNotice("")}><X size={14} /></button></div>}

      <Card className="pad" style={{ marginBottom: 14 }}>
        <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
          <input className="inp" style={{ flex: 1, minWidth: 160 }} placeholder="Search description…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp" style={{ width: "auto" }} value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
            <option value="all">All months</option>{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select className="inp" style={{ width: "auto" }} value={fFlow} onChange={(e) => setFFlow(e.target.value)}>
            <option value="all">All flows</option><option value="income">Income</option><option value="expense">Expense</option><option value="transfer">Transfer</option>
          </select>
          <select className="inp" style={{ width: "auto" }} value={fGroup} onChange={(e) => setFGroup(e.target.value)}>
            <option value="all">All categories</option>{EXPENSE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <div className="empty"><div className="ic"><Receipt size={24} /></div><div style={{ color: "var(--ink)", fontWeight: 600, marginBottom: 4 }}>No transactions yet</div><div>Import a CSV to get started.</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Account</th><th>Category</th><th>Tag</th><th className="num">Amount</th><th></th></tr></thead>
              <tbody>
                {rows.slice(0, 400).map((t) => <TxnRow key={t.id} t={t} updateTxn={updateTxn} delTxn={delTxn} onCategorize={setCategorizing} />)}
              </tbody>
            </table>
            {rows.length > 400 && <div className="note" style={{ padding: 12, textAlign: "center" }}>Showing first 400 of {rows.length}. Use filters to narrow.</div>}
          </div>
        )}
      </Card>

      {importing && <ImportModal state={state} addTxns={addTxns} importBatch={importBatch} onClose={() => setImporting(false)} onDone={(n) => { setImporting(false); setNotice(`Imported ${n} transaction${n === 1 ? "" : "s"}.`); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
      {adding && <AddTxnModal state={state} addTxns={addTxns} onClose={() => setAdding(false)} />}
      {categorizing && <CategorizeModal txn={categorizing} state={state} onApply={applyCategorization} onClose={() => setCategorizing(null)} />}
    </div>
  );
}

function TxnRow({ t, updateTxn, delTxn, onCategorize }) {
  return (
    <tr>
      <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{t.date}</td>
      <td style={{ maxWidth: 280 }}>{t.description}</td>
      <td className="note" style={{ whiteSpace: "nowrap" }}>{(t.account || "").replace("••", "·")}</td>
      <td>
        <button className="tag" onClick={() => onCategorize(t)} title="Click to recategorize / remember this merchant" style={{ cursor: "pointer" }}>{t.category || t.group}</button>
      </td>
      <td>
        <button className={"tag " + (t.biz === "Business" ? "biz" : t.biz === "Personal" ? "per" : "")} style={{ cursor: "pointer" }}
          onClick={() => updateTxn(t.id, { biz: t.biz === "Business" ? "Personal" : t.biz === "Personal" ? "Mixed" : "Business" })}>{t.biz || "Mixed"}</button>
      </td>
      <td className="num" style={{ color: t.amount >= 0 ? "var(--pos)" : "var(--ink)", fontWeight: 600, whiteSpace: "nowrap" }}>{money(t.amount, true)}</td>
      <td className="num"><button className="btn ghost sm" onClick={() => delTxn(t.id)}><Trash2 size={14} /></button></td>
    </tr>
  );
}

function AddTxnModal({ state, addTxns, onClose }) {
  const [d, setD] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [acct, setAcct] = useState(state.accounts[0]);
  const save = () => {
    const a = parseAmount(amt); if (!desc || isNaN(a)) return;
    addTxns([{ id: uid(), date: d, description: desc, amount: a, account: acct, ...categorize(desc, a, state.customRules) }]);
    onClose();
  };
  return (
    <Modal title="Add transaction" onClose={onClose}>
      <div className="grid" style={{ gap: 12 }}>
        <div><div className="note" style={{ marginBottom: 4 }}>Date</div><input type="date" className="inp" value={d} onChange={(e) => setD(e.target.value)} /></div>
        <div><div className="note" style={{ marginBottom: 4 }}>Description</div><input className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. King Soopers" /></div>
        <div><div className="note" style={{ marginBottom: 4 }}>Amount (negative = expense)</div><input className="inp" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="-124.50" /></div>
        <div><div className="note" style={{ marginBottom: 4 }}>Account</div><select className="inp" value={acct} onChange={(e) => setAcct(e.target.value)}>{state.accounts.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}><Check size={15} /> Add</button></div>
      </div>
    </Modal>
  );
}

/* ---------- CATEGORIZE + REMEMBER MERCHANT ---------- */
function CategorizeModal({ txn, state, onApply, onClose }) {
  const [group, setGroup] = useState(txn.group);
  const [category, setCategory] = useState(txn.category || "");
  const [biz, setBiz] = useState(txn.biz || "Mixed");
  const [remember, setRemember] = useState(true);
  const [keyword, setKeyword] = useState(keywordFromDesc(txn.description));
  const [applyExisting, setApplyExisting] = useState(true);

  const kw = keyword.trim().toLowerCase();
  const matchCount = kw ? state.transactions.filter((t) => (t.description || "").toLowerCase().includes(kw)).length : 0;
  const alreadyRule = (state.customRules || []).some((r) => r.match === kw);

  const apply = () => {
    const flow = flowForGroup(group);
    const cat = { flow, group, category: (category.trim() || group), biz };
    let rule = null;
    if (remember && kw) rule = { id: uid(), match: kw, flow, group, category: cat.category, biz };
    onApply({ txnId: txn.id, cat, rule, applyExisting: applyExisting && !!rule });
    onClose();
  };

  return (
    <Modal title="Categorize transaction" onClose={onClose}>
      <div className="grid" style={{ gap: 13 }}>
        <div className="card pad" style={{ background: "var(--bg2)", border: "none" }}>
          <div className="note" style={{ marginBottom: 3 }}>{txn.date} · {(txn.account || "").replace("••", "·")}</div>
          <div className="spread"><span style={{ fontWeight: 600 }}>{txn.description}</span><span style={{ fontWeight: 600, color: txn.amount >= 0 ? "var(--pos)" : "var(--ink)" }}>{money(txn.amount, true)}</span></div>
        </div>

        <div className="grid two" style={{ gap: 10 }}>
          <Field label="Category group"><select className="inp" value={group} onChange={(e) => setGroup(e.target.value)}>{ALL_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Label (optional)"><input className="inp" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={group} /></Field>
        </div>
        <Field label="Business / personal">
          <div className="row" style={{ gap: 7 }}>
            {["Business", "Personal", "Mixed"].map((b) => (
              <button key={b} className={"tag " + (b === "Business" ? "biz" : b === "Personal" ? "per" : "")} style={{ cursor: "pointer", opacity: biz === b ? 1 : 0.5, outline: biz === b ? "2px solid var(--green2)" : "none" }} onClick={() => setBiz(b)}>{b}</button>
            ))}
          </div>
        </Field>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 13 }}>
          <label className="row" style={{ gap: 9, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 7 }}><Sparkles size={15} style={{ color: "var(--gold)" }} /><strong style={{ fontWeight: 600, fontSize: 14 }}>Remember this merchant</strong></div>
              <div className="note" style={{ marginTop: 3 }}>Future imports matching this keyword get categorized automatically.</div>
            </div>
          </label>
          {remember && (
            <div style={{ marginTop: 11, paddingLeft: 27 }}>
              <Field label="Match when description contains">
                <input className="inp" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. king soopers" />
              </Field>
              {alreadyRule && <div className="note" style={{ marginTop: 6, color: "var(--clay)" }}>You already have a rule for "{kw}". Saving will update it.</div>}
              {matchCount > 1 && (
                <label className="row" style={{ gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={applyExisting} onChange={(e) => setApplyExisting(e.target.checked)} />
                  Also fix the <strong>{matchCount}</strong> matching transaction{matchCount === 1 ? "" : "s"} already in my history
                </label>
              )}
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={apply}><Check size={15} /> {remember && kw ? "Apply & remember" : "Apply"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- CSV IMPORT ---------- */
function ImportModal({ state, addTxns, importBatch, onClose, onDone }) {
  const [raw, setRaw] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [map, setMap] = useState({ date: "", desc: "", amount: "", debit: "", credit: "" });
  const [twoCol, setTwoCol] = useState(false);
  const [flipSign, setFlipSign] = useState(false);
  const [acct, setAcct] = useState(state.accounts[0]);
  const [preview, setPreview] = useState([]);
  const [pdfRows, setPdfRows] = useState(null);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [srcLabel, setSrcLabel] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef(null);

  const ingestStatementText = (text) => {
    const res = parseStatementText(text);
    if (!res.rows.length) { setErrMsg("Couldn't find transactions in that statement. If it's a scanned/image PDF, try the CSV download from your bank's website instead."); return false; }
    setPdfRows(res.rows); setPdfMeta(res.meta); setErrMsg("");
    return true;
  };

  const ingest = (text) => {
    // Heuristic: comma-separated with a header row → CSV; otherwise treat as pasted statement text.
    const firstLine = (text.split("\n").find((l) => l.trim()) || "");
    if (!firstLine.includes(",")) { ingestStatementText(text); return; }
    const res = PapaParse(text);
    if (!res || !res.data?.length) { ingestStatementText(text); return; }
    const hs = res.meta.fields || Object.keys(res.data[0] || {});
    setHeaders(hs); setRaw(res.data);
    // Match by candidate PRIORITY (not column order), so a real "Description"
    // column always wins over Chase's "Details" (DEBIT/CREDIT) column.
    const find = (cands) => { for (const c of cands) { const h = hs.find((x) => x.toLowerCase().includes(c)); if (h) return h; } return ""; };
    const dCol = find(["date", "posting"]);
    const descCol = find(["description", "payee", "name", "memo", "merchant", "details"]);
    const amtCol = find(["amount", "value"]);
    const debCol = find(["debit", "withdrawal", "charge"]);
    const credCol = find(["credit", "deposit", "payment"]);
    const two = !amtCol && (debCol || credCol);
    setTwoCol(two);
    setMap({ date: dCol, desc: descCol, amount: amtCol, debit: debCol, credit: credCol });
  };

  useEffect(() => {
    if (pdfRows) {
      setPreview(pdfRows.map((r) => {
        const amount = flipSign ? -r.amount : r.amount;
        return { id: uid(), date: r.date, description: r.description, amount, account: acct, ...categorize(r.description, amount, state.customRules) };
      }));
      return;
    }
    if (!raw) return;
    const out = raw.map((r) => {
      const dateStr = r[map.date]; const desc = (r[map.desc] || "").toString().replace(/\s+/g, " ").trim();
      let amount;
      if (twoCol) {
        const deb = parseAmount(r[map.debit]); const cred = parseAmount(r[map.credit]);
        amount = (isNaN(cred) ? 0 : cred) - (isNaN(deb) ? 0 : Math.abs(deb));
      } else { amount = parseAmount(r[map.amount]); }
      if (flipSign) amount = -amount;
      const dt = new Date(dateStr);
      if (isNaN(dt) || !desc || isNaN(amount)) return null;
      return { id: uid(), date: dt.toISOString().slice(0, 10), description: desc, amount, account: acct, ...categorize(desc, amount, state.customRules) };
    }).filter(Boolean);
    setPreview(out);
  }, [raw, map, twoCol, flipSign, acct, pdfRows]);

  const existingKeys = useMemo(() => new Set(state.transactions.map((t) => t.date + "|" + t.amount.toFixed(2) + "|" + (t.description || "").slice(0, 20))), [state.transactions]);
  const fresh = preview.filter((t) => !existingKeys.has(t.date + "|" + t.amount.toFixed(2) + "|" + (t.description || "").slice(0, 20)));
  const dupes = preview.length - fresh.length;

  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setErrMsg(""); setSrcLabel(f.name);
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
      setParsing(true);
      try {
        const { extractPdfText } = await import("./pdfImport.js");
        const text = await extractPdfText(f);
        ingestStatementText(text);
      } catch (err) {
        setErrMsg("Couldn't read that PDF (" + (err?.message || err) + "). Try the CSV download from your bank instead.");
      }
      setParsing(false);
      return;
    }
    const rd = new FileReader(); rd.onload = () => ingest(rd.result); rd.readAsText(f);
  };

  const commit = () => { const n = fresh.length; if (n) importBatch(fresh, { label: srcLabel || (pdfRows ? (pdfMeta?.kind || "PDF statement") : "CSV import"), account: acct, source: pdfRows ? "pdf" : (raw ? "csv" : "paste") }); if (onDone) onDone(n); else onClose(); };

  return (
    <Modal title="Import bank transactions" onClose={onClose}>
      {!raw && !pdfRows ? (
        <div>
          <div className="banner info" style={{ marginBottom: 14 }}><Info size={16} style={{ flex: "none", marginTop: 1 }} />
            <span><strong>CSV or PDF statement.</strong> Chase's website offers CSV under the download icon above your transaction list (desktop site) — or just upload the monthly <strong>statement PDF</strong> directly and it'll be parsed here. Nothing is uploaded anywhere; it's all read in your browser.</span></div>
          {errMsg && <div className="banner warn" style={{ marginBottom: 14 }}><AlertTriangle size={16} style={{ flex: "none", marginTop: 1 }} /><span>{errMsg}</span></div>}
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".csv,.pdf,text/csv,application/pdf" onChange={onFile} style={{ display: "none" }} />
            <button className="btn primary" disabled={parsing} onClick={() => fileRef.current?.click()}>{parsing ? <><Loader2 size={15} className="spin" /> Reading PDF…</> : <><Upload size={15} /> Choose CSV or PDF</>}</button>
            <span className="note">or paste CSV / statement text below</span>
          </div>
          <textarea className="inp" style={{ marginTop: 12, minHeight: 120, fontFamily: "ui-monospace,monospace", fontSize: 12 }} placeholder={"Date,Description,Amount\n2026-06-01,King Soopers,-84.20\n2026-06-02,Alma Payout,4200.00"} onChange={(e) => { if (e.target.value.trim().length > 20) ingest(e.target.value); }} />
        </div>
      ) : pdfRows ? (
        <div className="grid" style={{ gap: 14 }}>
          <div className="banner info"><FileText size={16} style={{ flex: "none", marginTop: 1 }} />
            <span>Parsed <strong>{pdfRows.length}</strong> transactions from a <strong>{pdfMeta?.kind}</strong>{pdfMeta?.periodLabel ? <> ({pdfMeta.periodLabel})</> : null}.{pdfMeta?.yearAssumed ? " Couldn't detect the statement period, so the current year was assumed — double-check dates below." : ""}{pdfMeta?.generic ? " Layout wasn't recognized as Chase, so amounts default to money-out — use the sign flip if needed." : ""}{pdfMeta?.skipped ? ` ${pdfMeta.skipped} line(s) couldn't be parsed.` : ""}</span></div>
          <div className="grid two" style={{ gap: 10 }}>
            <Field label="Assign to account"><select className="inp" value={acct} onChange={(e) => setAcct(e.target.value)}>{state.accounts.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Sign convention"><label className="row" style={{ fontSize: 13, gap: 8, paddingTop: 8 }}><input type="checkbox" checked={flipSign} onChange={(e) => setFlipSign(e.target.checked)} /> Flip +/− (if signs look inverted)</label></Field>
          </div>
          <div>
            <div className="spread" style={{ marginBottom: 6 }}><strong style={{ fontWeight: 600, fontSize: 13 }}>Preview</strong><span className="note">{fresh.length} new{dupes > 0 ? ` · ${dupes} duplicate(s) skipped` : ""}</span></div>
            <div style={{ maxHeight: 220, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
              <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th></tr></thead>
                <tbody>{preview.slice(0, 60).map((t) => <tr key={t.id}><td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{t.date}</td><td style={{ maxWidth: 200 }}>{t.description}</td><td><span className="tag">{t.category}</span></td><td className="num" style={{ color: t.amount >= 0 ? "var(--pos)" : "var(--ink)" }}>{money(t.amount, true)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn ghost" onClick={() => { setPdfRows(null); setPdfMeta(null); setPreview([]); setErrMsg(""); }}>← Start over</button>
            <button className="btn primary" disabled={!fresh.length} onClick={commit}><Check size={15} /> Import {fresh.length} transactions</button>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          <div className="banner info"><Info size={16} style={{ flex: "none", marginTop: 1 }} /><span>Found <strong>{raw.length}</strong> rows. Confirm the columns below — we auto-detected them.</span></div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Date column"><select className="inp" value={map.date} onChange={(e) => setMap({ ...map, date: e.target.value })}><Opts hs={headers} /></select></Field>
            <Field label="Description column"><select className="inp" value={map.desc} onChange={(e) => setMap({ ...map, desc: e.target.value })}><Opts hs={headers} /></select></Field>
          </div>
          <label className="row" style={{ fontSize: 13, gap: 8 }}><input type="checkbox" checked={twoCol} onChange={(e) => setTwoCol(e.target.checked)} /> Bank uses separate debit/credit columns</label>
          {twoCol ? (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Debit / withdrawal column"><select className="inp" value={map.debit} onChange={(e) => setMap({ ...map, debit: e.target.value })}><Opts hs={headers} /></select></Field>
              <Field label="Credit / deposit column"><select className="inp" value={map.credit} onChange={(e) => setMap({ ...map, credit: e.target.value })}><Opts hs={headers} /></select></Field>
            </div>
          ) : (
            <Field label="Amount column"><select className="inp" value={map.amount} onChange={(e) => setMap({ ...map, amount: e.target.value })}><Opts hs={headers} /></select></Field>
          )}
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Assign to account"><select className="inp" value={acct} onChange={(e) => setAcct(e.target.value)}>{state.accounts.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Sign convention"><label className="row" style={{ fontSize: 13, gap: 8, paddingTop: 8 }}><input type="checkbox" checked={flipSign} onChange={(e) => setFlipSign(e.target.checked)} /> Flip +/− (if expenses show positive)</label></Field>
          </div>

          <div>
            <div className="spread" style={{ marginBottom: 6 }}><strong style={{ fontWeight: 600, fontSize: 13 }}>Preview</strong><span className="note">{fresh.length} new{dupes > 0 ? ` · ${dupes} duplicate(s) skipped` : ""}</span></div>
            <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
              <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th></tr></thead>
                <tbody>{preview.slice(0, 40).map((t) => <tr key={t.id}><td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{t.date}</td><td style={{ maxWidth: 200 }}>{t.description}</td><td><span className="tag">{t.category}</span></td><td className="num" style={{ color: t.amount >= 0 ? "var(--pos)" : "var(--ink)" }}>{money(t.amount, true)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn ghost" onClick={() => { setRaw(null); setPreview([]); }}>← Start over</button>
            <button className="btn primary" disabled={!fresh.length} onClick={commit}><Check size={15} /> Import {fresh.length} transactions</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
const Field = ({ label, children }) => <div><div className="note" style={{ marginBottom: 4 }}>{label}</div>{children}</div>;
const Opts = ({ hs }) => <>{["", ...hs].map((h) => <option key={h} value={h}>{h || "— none —"}</option>)}</>;

/* tiny CSV parser via papaparse (imported) */
function PapaParse(text) {
  try { return Papa.parse(text.trim(), { header: true, skipEmptyLines: true, dynamicTyping: false }); }
  catch (e) { return null; }
}

/* ============================================================ BUDGETS */
function Budgets({ state, month, patch }) {
  const actuals = useMemo(() => {
    const m = {};
    state.transactions.filter((t) => t.flow === "expense" && (!month || monthKey(t.date) === month)).forEach((t) => { m[t.group] = (m[t.group] || 0) + Math.abs(t.amount); });
    return m;
  }, [state.transactions, month]);
  const totalTarget = Object.values(state.budgets).reduce((a, b) => a + (b || 0), 0);
  const totalActual = Object.values(actuals).reduce((a, b) => a + b, 0);
  const setBudget = (g, v) => patch({ budgets: { ...state.budgets, [g]: parseAmount(v) || 0 } });

  return (
    <div className="fade">
      <div className="section-h"><div><h2 className="serif">Budgets</h2><p>Monthly targets per category (seeded from your 6-month averages). Tighten the ones you want to attack. Bars show {month ? monthLabel(month) : "this month"}.</p></div></div>
      <div className="grid three" style={{ marginBottom: 14 }}>
        <Card className="kpi pad"><div className="lbl">Total budget</div><div className="val">{money(totalTarget)}</div><div className="meta">across {Object.keys(state.budgets).length} categories</div></Card>
        <Card className="kpi pad"><div className="lbl">Actual ({monthLabel(month)})</div><div className="val" style={{ color: totalActual > totalTarget ? "var(--neg)" : "var(--pos)" }}>{money(totalActual)}</div><div className="meta">{totalActual > totalTarget ? "over budget" : "within budget"}</div></Card>
        <Card className="kpi pad"><div className="lbl">Difference</div><div className="val" style={{ color: totalTarget - totalActual >= 0 ? "var(--pos)" : "var(--neg)" }}>{money(totalTarget - totalActual)}</div><div className="meta">{totalTarget - totalActual >= 0 ? "under target" : "over target"}</div></Card>
      </div>
      <Card className="pad">
        <div className="grid" style={{ gap: 16 }}>
          {EXPENSE_GROUPS.map((g) => {
            const target = state.budgets[g] || 0; const actual = actuals[g] || 0;
            const pct = target > 0 ? (actual / target) * 100 : (actual > 0 ? 100 : 0);
            const over = target > 0 && actual > target;
            return (
              <div key={g}>
                <div className="spread" style={{ marginBottom: 6, gap: 12 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{g}</span>
                  <div className="row" style={{ gap: 10 }}>
                    <span className={over ? "neg" : "note"} style={{ fontSize: 13 }}>{money(actual)} spent</span>
                    <div className="row" style={{ gap: 5 }}>
                      <span className="note" style={{ fontSize: 12 }}>target</span>
                      <input className="inp" style={{ width: 96, padding: "6px 9px", textAlign: "right" }} value={target || ""} onChange={(e) => setBudget(g, e.target.value)} />
                    </div>
                  </div>
                </div>
                <ProgressBar value={pct} color={over ? "#B23A26" : "#3E8E6E"} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ GOALS */
function Goals({ state, patch }) {
  const [editing, setEditing] = useState(null);
  const save = (goal) => {
    const exists = state.goals.find((g) => g.id === goal.id);
    patch({ goals: exists ? state.goals.map((g) => g.id === goal.id ? goal : g) : [...state.goals, goal] });
    setEditing(null);
  };
  const del = (id) => patch({ goals: state.goals.filter((g) => g.id !== id) });

  return (
    <div className="fade">
      <div className="section-h">
        <div><h2 className="serif">Goals</h2><p>What the money is <em>for</em>. Update the current amount as you make progress — the dashboard tracks it.</p></div>
        <button className="btn primary" onClick={() => setEditing({ id: uid(), name: "", kind: "save", start: 0, current: 0, target: 1000, color: PALETTE[state.goals.length % PALETTE.length], note: "" })}><Plus size={15} /> New goal</button>
      </div>
      <div className="grid two">
        {state.goals.map((g) => {
          const gv = goalView(g, state);
          const p = gv.pct;
          return (
            <Card key={g.id} className="pad">
              <div className="spread" style={{ alignItems: "flex-start", marginBottom: 10 }}>
                <div className="row" style={{ gap: 9 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: g.color, marginTop: 3, flex: "none" }} />
                  <div><div style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</div><div className="note" style={{ marginTop: 2 }}>{gv.linkedTo ? <><Landmark size={11} style={{ verticalAlign: "middle" }} /> Auto · tracking {gv.linkedTo}</> : gv.kind === "payoff" ? "Debt payoff" : "Savings goal"}</div></div></div>
                <div className="row"><button className="btn ghost sm" onClick={() => setEditing(g)}><Pencil size={14} /></button><button className="btn ghost sm" onClick={() => del(g.id)}><Trash2 size={14} /></button></div>
              </div>
              <div className="spread" style={{ marginBottom: 6 }}>
                <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{p.toFixed(0)}%</span>
                <span className="note">{gv.kind === "payoff" ? `${money(gv.current)} remaining` : `${money(gv.current)} / ${money(gv.target)}`}</span>
              </div>
              <ProgressBar value={p} color={g.color} />
              {gv.linkedTo && <div className="note" style={{ marginTop: 8 }}>{money(gv.paid)} paid so far · updates automatically as payments import</div>}
              {g.note && <div className="note" style={{ marginTop: 8 }}>{g.note}</div>}
            </Card>
          );
        })}
      </div>
      {editing && <GoalModal goal={editing} state={state} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function GoalModal({ goal, state, onSave, onClose }) {
  const [g, setG] = useState(goal);
  const up = (p) => setG({ ...g, ...p });
  const debts = (state?.debts) || [];
  const linkedDebt = g.debtId ? debts.find((d) => d.id === g.debtId) : null;
  const chooseDebt = (id) => {
    if (!id) { up({ debtId: null }); return; }
    const d = debts.find((x) => x.id === id);
    setG({ ...g, debtId: id, kind: "payoff", target: 0, name: g.name && goal.name ? g.name : `Pay off ${d.name}` });
  };
  return (
    <Modal title={goal.name ? "Edit goal" : "New goal"} onClose={onClose}>
      <div className="grid" style={{ gap: 12 }}>
        <Field label="Name"><input className="inp" value={g.name} onChange={(e) => up({ name: e.target.value })} placeholder="e.g. Roof repair fund" /></Field>

        <Field label="Track a debt automatically (optional)">
          <select className="inp" value={g.debtId || ""} onChange={(e) => chooseDebt(e.target.value)}>
            <option value="">No — set progress manually</option>
            {debts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.owner})</option>)}
          </select>
        </Field>

        {linkedDebt ? (
          <div className="banner info"><Landmark size={15} style={{ flex: "none", marginTop: 1 }} /><span>Progress is pulled from <strong>{linkedDebt.name}</strong> and updates on its own as payments import. {linkedDebt.auto && linkedDebt.match ? "" : "Tip: turn on \u201cauto-update from transactions\u201d for this debt (Debts tab) so its balance falls automatically too."}</span></div>
        ) : (
          <>
            <Field label="Type">
              <select className="inp" value={g.kind} onChange={(e) => up({ kind: e.target.value })}><option value="save">Savings (build up to a target)</option><option value="payoff">Debt payoff (pay down to zero)</option></select>
            </Field>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {g.kind === "payoff" && <Field label="Starting balance"><input className="inp" value={g.start} onChange={(e) => up({ start: parseAmount(e.target.value) || 0 })} /></Field>}
              <Field label={g.kind === "payoff" ? "Current balance" : "Saved so far"}><input className="inp" value={g.current} onChange={(e) => up({ current: parseAmount(e.target.value) || 0 })} /></Field>
              <Field label={g.kind === "payoff" ? "Target (usually 0)" : "Target amount"}><input className="inp" value={g.target} onChange={(e) => up({ target: parseAmount(e.target.value) || 0 })} /></Field>
            </div>
          </>
        )}

        <Field label="Note (optional)"><input className="inp" value={g.note || ""} onChange={(e) => up({ note: e.target.value })} /></Field>
        <Field label="Color"><div className="row" style={{ flexWrap: "wrap", gap: 7 }}>{PALETTE.map((c) => <button key={c} onClick={() => up({ color: c })} style={{ width: 26, height: 26, borderRadius: 8, background: c, border: g.color === c ? "3px solid var(--ink)" : "2px solid #fff", cursor: "pointer", boxShadow: "var(--shadow)" }} />)}</div></Field>
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!g.name} onClick={() => onSave(g)}><Check size={15} /> Save</button></div>
      </div>
    </Modal>
  );
}

/* ============================================================ DEBTS */
function Debts({ state, patch }) {
  const [extra, setExtra] = useState(500);
  const [editing, setEditing] = useState(null);
  const debts = state.debts;
  const txns = state.transactions;
  const stat = (d) => debtStats(d, txns);
  const bal = (d) => stat(d).balance;
  const sorted = [...debts].sort((a, b) => b.apr - a.apr);
  const totalBal = debts.reduce((a, d) => a + bal(d), 0);
  const totalMin = debts.reduce((a, d) => a + d.min, 0);
  const totalInt = debts.reduce((a, d) => a + bal(d) * d.apr / 100, 0);
  const paidThisMonth = debts.reduce((a, d) => a + stat(d).paidThisMonth, 0);
  const hiTarget = sorted.find((d) => bal(d) > 0);

  // months to pay off the avalanche target with min+extra (simple amortization)
  const payoffMonths = (d, pay) => {
    if (!d || pay <= 0) return null; const r = d.apr / 100 / 12; let b = bal(d), m = 0;
    if (r === 0) return Math.ceil(b / pay);
    if (pay <= b * r) return Infinity;
    while (b > 0 && m < 600) { b = b * (1 + r) - pay; m++; } return m;
  };
  const mTarget = hiTarget ? payoffMonths(hiTarget, hiTarget.min + extra) : null;

  const save = (d) => { const ex = debts.find((x) => x.id === d.id); patch({ debts: ex ? debts.map((x) => x.id === d.id ? d : x) : [...debts, d] }); setEditing(null); };
  const del = (id) => patch({ debts: debts.filter((d) => d.id !== id) });

  return (
    <div className="fade">
      <div className="section-h">
        <div><h2 className="serif">Debts</h2><p>Avalanche view — highest rate first. Link a debt to its payments (the pencil) and its balance falls on its own as you import.</p></div>
        <button className="btn primary" onClick={() => setEditing({ id: uid(), name: "", owner: "Shannon", balance: 0, apr: 0, min: 0 })}><Plus size={15} /> Add debt</button>
      </div>

      <div className="grid three" style={{ marginBottom: 14 }}>
        <Card className="kpi pad"><div className="lbl">Total balance</div><div className="val">{money(totalBal)}</div><div className="meta">{paidThisMonth > 0 ? `${money(paidThisMonth)} paid this month` : `${debts.length} debts`}</div></Card>
        <Card className="kpi pad"><div className="lbl">Monthly minimums</div><div className="val">{money(totalMin)}</div><div className="meta">required each month</div></Card>
        <Card className="kpi pad"><div className="lbl">Interest / year</div><div className="val neg">{money(totalInt)}</div><div className="meta">≈ {money(totalInt / 12)}/mo to stand still</div></Card>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>#</th><th>Debt</th><th>Owner</th><th className="num">Balance</th><th className="num">APR</th><th className="num">Min/mo</th><th className="num">Paid (mo)</th><th className="num">Interest/yr</th><th></th></tr></thead>
            <tbody>
              {sorted.map((d, i) => {
                const hot = d.apr >= 15; const s = stat(d);
                return (
                  <tr key={d.id} style={hot ? { background: "var(--negbg)" } : {}}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}{hot && <Flame size={12} style={{ color: "var(--clay)", marginLeft: 4, verticalAlign: "middle" }} />}</td>
                    <td style={{ fontWeight: 500 }}>{d.name}{s.linked && <span title={`Auto: ${money(s.paid)} paid since ${d.startDate || "start"}`} style={{ marginLeft: 6, color: "var(--green2)", verticalAlign: "middle", display: "inline-flex" }}><Cloud size={12} /></span>}</td>
                    <td className="note">{d.owner}</td>
                    <td className="num">{money(s.balance)}</td>
                    <td className="num" style={{ color: hot ? "var(--neg)" : "var(--ink)", fontWeight: hot ? 600 : 400 }}>{d.apr.toFixed(2)}%</td>
                    <td className="num">{money(d.min)}</td>
                    <td className="num" style={{ color: s.linked && s.paidThisMonth ? "var(--pos)" : "var(--muted)" }}>{s.linked ? money(s.paidThisMonth) : "—"}</td>
                    <td className="num neg">{money(s.balance * d.apr / 100)}</td>
                    <td className="num"><span className="row" style={{ justifyContent: "flex-end" }}><button className="btn ghost sm" onClick={() => setEditing(d)}><Pencil size={13} /></button><button className="btn ghost sm" onClick={() => del(d.id)}><Trash2 size={13} /></button></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="pad">
        <div className="row" style={{ gap: 9, marginBottom: 10 }}><Flame size={18} style={{ color: "var(--clay)" }} /><strong style={{ fontWeight: 600 }}>Avalanche plan</strong></div>
        {hiTarget ? (
          <div>
            <div className="note" style={{ marginBottom: 12 }}>Throw every spare dollar at the highest-rate debt first; pay minimums on the rest. When it's gone, roll its payment onto the next. Mathematically the cheapest way out.</div>
            <div className="banner warn" style={{ marginBottom: 14 }}><Flame size={16} style={{ flex: "none", marginTop: 1 }} />
              <span>Attack first: <strong>{hiTarget.name}</strong> ({hiTarget.owner}) at <strong>{hiTarget.apr.toFixed(2)}%</strong>, {money(bal(hiTarget))} balance.</span></div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Field label="Extra payment / month"><input className="inp" style={{ width: 130 }} value={extra} onChange={(e) => setExtra(parseAmount(e.target.value) || 0)} /></Field>
              <div className="card pad" style={{ flex: 1, minWidth: 200, background: "var(--bg2)", border: "none" }}>
                <div className="note">Paying {money(hiTarget.min + extra)}/mo on {hiTarget.name}:</div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                  {mTarget === Infinity ? "Won't cover interest — raise the payment" : mTarget ? `Gone in ~${mTarget} months` : "—"}
                </div>
              </div>
            </div>
          </div>
        ) : <div className="note">No outstanding balances. 🎉</div>}
      </Card>

      {editing && <DebtModal debt={editing} state={state} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function DebtModal({ debt, state, onSave, onClose }) {
  const [d, setD] = useState(debt);
  const up = (p) => setD({ ...d, ...p });
  const today = new Date().toISOString().slice(0, 10);
  const enableAuto = (on) => {
    if (on) setD({ ...d, auto: true, match: d.match || keywordFromDesc(d.name), startBalance: d.startBalance != null ? d.startBalance : (d.balance || 0), startDate: d.startDate || today });
    else up({ auto: false });
  };
  // suggestions from existing debt-service payment descriptions
  const chips = useMemo(() => {
    const m = new Map();
    (state?.transactions || []).filter((t) => t.flow === "expense" && t.group === "Debt service").forEach((t) => { const k = keywordFromDesc(t.description); if (k && !m.has(k)) m.set(k, true); });
    return [...m.keys()].slice(0, 8);
  }, [state]);
  const preview = d.auto && d.match ? debtStats({ ...d, auto: true }, state?.transactions || []) : null;

  return (
    <Modal title={debt.name ? "Edit debt" : "Add debt"} onClose={onClose}>
      <div className="grid" style={{ gap: 12 }}>
        <Field label="Name"><input className="inp" value={d.name} onChange={(e) => up({ name: e.target.value })} /></Field>
        <Field label="Owner"><select className="inp" value={d.owner} onChange={(e) => up({ owner: e.target.value })}><option>Shannon</option><option>Cole</option><option>Joint</option></select></Field>
        <div className="grid" style={{ gridTemplateColumns: d.auto ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
          {!d.auto && <Field label="Balance"><input className="inp" value={d.balance} onChange={(e) => up({ balance: parseAmount(e.target.value) || 0 })} /></Field>}
          <Field label="APR %"><input className="inp" value={d.apr} onChange={(e) => up({ apr: parseAmount(e.target.value) || 0 })} /></Field>
          <Field label="Min /mo"><input className="inp" value={d.min} onChange={(e) => up({ min: parseAmount(e.target.value) || 0 })} /></Field>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <label className="row" style={{ gap: 9, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={!!d.auto} onChange={(e) => enableAuto(e.target.checked)} style={{ marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 7 }}><Cloud size={15} style={{ color: "var(--green2)" }} /><strong style={{ fontWeight: 600, fontSize: 14 }}>Auto-update balance from transactions</strong></div>
              <div className="note" style={{ marginTop: 3 }}>Counts matching payments and subtracts them from a starting balance.</div>
            </div>
          </label>

          {d.auto && (
            <div style={{ marginTop: 11, paddingLeft: 27 }} className="grid">
              <Field label="Count payments whose description contains">
                <input className="inp" value={d.match || ""} onChange={(e) => up({ match: e.target.value })} placeholder="e.g. discover e-payment" />
              </Field>
              {chips.length > 0 && (
                <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                  <span className="note">From your payments:</span>
                  {chips.map((c) => <button key={c} className="tag" style={{ cursor: "pointer", fontFamily: "ui-monospace,monospace" }} onClick={() => up({ match: c })}>{c}</button>)}
                </div>
              )}
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Starting balance"><input className="inp" value={d.startBalance != null ? d.startBalance : ""} onChange={(e) => up({ startBalance: parseAmount(e.target.value) || 0 })} /></Field>
                <Field label="As of (statement date)"><input className="inp" type="date" value={d.startDate || ""} onChange={(e) => up({ startDate: e.target.value })} /></Field>
              </div>
              <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => up({ startBalance: d.startBalance != null ? d.startBalance : (d.balance || 0), startDate: today })} title="Reset the anchor to today">↻ Re-anchor to today</button>
              {preview && (
                <div className="banner info"><Info size={15} style={{ flex: "none", marginTop: 1 }} />
                  <span>{preview.count} payment{preview.count === 1 ? "" : "s"} matched · {money(preview.paid)} paid{d.startDate ? ` since ${d.startDate}` : ""} → estimated balance <strong>{money(preview.balance)}</strong>. This ignores new interest and new charges, so check it against your statement and use “Re-anchor” when you get a fresh one.</span></div>
              )}
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!d.name} onClick={() => onSave(d)}><Check size={15} /> Save</button></div>
      </div>
    </Modal>
  );
}

/* ============================================================ DATA TAB */
function DataTab({ state, setState, addTxns, importBatch, deleteImport, deleteRule, household, onHouseholdChange, session, localOnly }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `hearth-finances-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const obj = JSON.parse(rd.result); if (obj.transactions) { setState(obj); setMsg("Restored from backup."); } } catch (err) { setMsg("Couldn't read that file."); } };
    rd.readAsText(f);
  };
  const loadDemo = () => { importBatch(makeDemo(), { label: "Demo data", account: "—", source: "demo" }); setMsg("Loaded ~2 months of demo transactions. Delete them anytime from Uploads below."); };
  const clearTxns = () => { if (confirm("Delete all transactions? Your budgets, debts, and goals stay.")) setState({ ...state, transactions: [] }); };
  const resetAll = () => { if (confirm("Reset EVERYTHING back to defaults? This wipes the budget" + (household ? " for everyone in this household." : " on this device."))) setState(DEFAULT_STATE); };
  const addAccount = () => { const n = prompt("Account name (e.g. 'Chase Checking ••1234')"); if (n) setState({ ...state, accounts: [...state.accounts, n] }); };

  const copyCode = async () => { try { await navigator.clipboard.writeText(household.invite_code); setMsg("Invite code copied — send it to whoever you want to share with."); } catch (e) { setMsg("Code: " + household.invite_code); } };
  const regenerate = async () => {
    if (!confirm("Generate a new invite code? The old one stops working.")) return;
    setBusy(true);
    try { const { error } = await supabase.rpc("regenerate_invite_code"); if (error) throw error; await onHouseholdChange(); setMsg("New invite code generated."); }
    catch (e) { setMsg(e?.message || "Couldn't regenerate."); }
    setBusy(false);
  };
  const leave = async () => {
    if (!confirm("Leave this household? You'll lose access to its budget unless you rejoin with the code.")) return;
    setBusy(true);
    try { await supabase.from("household_members").delete().eq("user_id", session.user.id).eq("household_id", household.id); await onHouseholdChange(); }
    catch (e) { setMsg(e?.message || "Couldn't leave."); setBusy(false); }
  };

  return (
    <div className="fade">
      <div className="section-h"><div><h2 className="serif">Data & backup</h2><p>{hasCloud ? "Your data syncs to your household automatically across every device anyone signs in on. Export a snapshot anytime for an extra offline copy." : "Everything lives in this browser via secure local storage. Export a backup regularly so your history is never trapped."}</p></div></div>

      {msg && <div className="banner info" style={{ marginBottom: 14 }}><Check size={16} style={{ flex: "none", marginTop: 1 }} /><span>{msg}</span></div>}

      {household && (
        <Card className="pad" style={{ marginBottom: 14 }}>
          <div className="spread" style={{ marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div className="row" style={{ gap: 9 }}><ShieldCheck size={18} style={{ color: "var(--green2)" }} /><div><strong style={{ fontWeight: 600 }}>{household.name}</strong><div className="note">{household.member_count} member{household.member_count === 1 ? "" : "s"} · you're the {household.role}</div></div></div>
          </div>
          <div className="note" style={{ marginBottom: 8 }}>Share this code so someone can join — they create their own login, then enter it. Everyone in the household sees and edits this one budget.</div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", background: "var(--bg2)", padding: "10px 16px", borderRadius: 12, border: "1px solid var(--line)" }}>{household.invite_code}</div>
            <button className="btn" onClick={copyCode}><Download size={15} style={{ transform: "rotate(0deg)" }} /> Copy code</button>
            <button className="btn ghost sm" disabled={busy} onClick={regenerate}>Regenerate</button>
            <div style={{ flex: 1 }} />
            <button className="btn danger sm" disabled={busy} onClick={leave}><LogOut size={14} /> Leave household</button>
          </div>
        </Card>
      )}

      <div className="grid two" style={{ gap: 14 }}>
        <Card className="pad">
          <strong style={{ fontWeight: 600 }}>Backup & restore</strong>
          <p className="note" style={{ margin: "8px 0 14px" }}>Download a full snapshot (transactions, budgets, debts, goals) or restore one. Use this to move between devices or share with Shannon.</p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn primary" onClick={exportJSON}><Download size={15} /> Export backup</button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Restore backup</button>
          </div>
        </Card>

        <Card className="pad">
          <strong style={{ fontWeight: 600 }}>Accounts</strong>
          <p className="note" style={{ margin: "8px 0 12px" }}>Label the accounts you import from. Tagging keeps Shannon's practice money and personal money separate.</p>
          <div className="row" style={{ flexWrap: "wrap", gap: 7, marginBottom: 12 }}>{state.accounts.map((a) => <span key={a} className="tag">{a}</span>)}</div>
          <button className="btn sm" onClick={addAccount}><Plus size={14} /> Add account</button>
        </Card>

        <Card className="pad">
          <strong style={{ fontWeight: 600 }}>Demo data</strong>
          <p className="note" style={{ margin: "8px 0 14px" }}>Not ready to import yet? Load two months of representative transactions to explore the dashboard, then clear them before adding your real data.</p>
          <div className="row"><button className="btn" onClick={loadDemo}><Sparkles size={15} /> Load demo</button><button className="btn ghost" onClick={clearTxns}>Clear transactions</button></div>
        </Card>

        <Card className="pad" style={{ borderColor: "var(--clay-soft)" }}>
          <strong style={{ fontWeight: 600, color: "var(--neg)" }}>Danger zone</strong>
          <p className="note" style={{ margin: "8px 0 14px" }}>Reset wipes everything on this device back to the seeded defaults. Export a backup first if unsure.</p>
          <button className="btn danger" onClick={resetAll}><AlertTriangle size={15} /> Reset everything</button>
        </Card>
      </div>

      <Card className="pad" style={{ marginTop: 14 }}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <div className="row" style={{ gap: 9 }}><Upload size={17} style={{ color: "var(--green2)" }} /><strong style={{ fontWeight: 600 }}>Uploads</strong></div>
          <span className="note">{(state.imports || []).length} import{(state.imports || []).length === 1 ? "" : "s"}</span>
        </div>
        {(state.imports || []).length === 0 ? (
          <div className="note" style={{ lineHeight: 1.6 }}>Each CSV or PDF you import is tracked here as a batch. If you import the wrong file or mislabel an account, delete the whole batch in one click and re-import — no starting over. (Transactions imported before this update aren't grouped into a batch.)</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Imported</th><th>Source</th><th>Account</th><th className="num">Rows still present</th><th></th></tr></thead>
              <tbody>
                {[...(state.imports || [])].sort((a, b) => (a.when < b.when ? 1 : -1)).map((r) => {
                  const live = state.transactions.filter((t) => t.imp === r.id).length;
                  const when = new Date(r.when);
                  const dstr = isNaN(when) ? "" : when.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  return (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight: 500, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div><div className="note">{dstr}</div></td>
                      <td><span className="tag">{r.source}</span></td>
                      <td className="note" style={{ whiteSpace: "nowrap" }}>{(r.account || "—").replace("••", "·")}</td>
                      <td className="num">{live}{live !== r.count ? <span className="note"> / {r.count}</span> : ""}</td>
                      <td className="num"><button className="btn danger sm" onClick={() => { if (confirm(`Delete this import and its ${live} remaining transaction${live === 1 ? "" : "s"}? Your budgets, debts, goals, and other imports stay.`)) { deleteImport(r.id); setMsg(`Removed "${r.label}" (${live} transaction${live === 1 ? "" : "s"}).`); } }}><Trash2 size={13} /> Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="note" style={{ marginTop: 10, lineHeight: 1.5 }}>"Rows still present" can be lower than the original count if you deleted individual transactions or they were skipped as duplicates. Deleting a batch removes only the transactions that came from it.</div>
          </div>
        )}
      </Card>

      <Card className="pad" style={{ marginTop: 14 }}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <div className="row" style={{ gap: 9 }}><Sparkles size={17} style={{ color: "var(--gold)" }} /><strong style={{ fontWeight: 600 }}>Learned merchant rules</strong></div>
          <span className="note">{(state.customRules || []).length} saved</span>
        </div>
        {(state.customRules || []).length === 0 ? (
          <div className="note" style={{ lineHeight: 1.6 }}>This is empty for now. On the <strong>Transactions</strong> tab, click any category and check <em>"Remember this merchant"</em> — the rule lands here and every future import gets it right automatically. Your rules always win over the built-in categorizer.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>When description contains</th><th>Becomes</th><th>Tag</th><th className="num">Matches now</th><th></th></tr></thead>
              <tbody>
                {(state.customRules || []).map((r) => {
                  const count = state.transactions.filter((t) => (t.description || "").toLowerCase().includes(r.match)).length;
                  return (
                    <tr key={r.id}>
                      <td><span className="tag" style={{ fontFamily: "ui-monospace,monospace" }}>{r.match}</span></td>
                      <td>{r.category} <span className="note">· {r.group}</span></td>
                      <td><span className={"tag " + (r.biz === "Business" ? "biz" : r.biz === "Personal" ? "per" : "")}>{r.biz}</span></td>
                      <td className="num note">{count}</td>
                      <td className="num"><button className="btn ghost sm" onClick={() => deleteRule(r.id)} title="Delete rule"><Trash2 size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="pad" style={{ marginTop: 14 }}>
        <div className="row" style={{ gap: 9, marginBottom: 8 }}>{hasCloud ? <Cloud size={17} style={{ color: "var(--green2)" }} /> : <Info size={17} style={{ color: "var(--green2)" }} />}<strong style={{ fontWeight: 600 }}>{hasCloud ? "Cloud sync is on" : "Want true auto-sync from your banks?"}</strong></div>
        {hasCloud ? (
          <p className="note" style={{ margin: 0, lineHeight: 1.6 }}>
            You're signed in, so the budget is saved to your household's private row in the database and syncs to every device anyone in the household signs in on — and it survives clearing your browser. To add Shannon: she creates her own login, then enters your household's invite code (above) to join. You'll both see and edit the same budget with your own separate logins. Edits use last-write-wins, so avoid editing the exact same thing on two devices at once while offline.
          </p>
        ) : (
          <p className="note" style={{ margin: 0, lineHeight: 1.6 }}>
            That requires a bank-aggregation service (Plaid / MX) plus a hosted, secured backend — more than a single app can safely hold. If auto-sync matters, the cleanest paths are: a commercial app that already has it built in (Monarch, Copilot, YNAB, or Empower), or a self-hosted open-source tool (Actual Budget, Firefly III) you run on a small server and connect via a bank-sync add-on. This app is the no-credentials, you-hold-the-data alternative: export CSVs monthly and drop them in.
          </p>
        )}
      </Card>
    </div>
  );
}
