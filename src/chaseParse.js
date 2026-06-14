// Parses the text layer of bank/credit-card statement PDFs (built for Chase
// checking + Chase credit cards, with a Discover and a generic fallback).
// Input: plain text (one statement). Output: { rows, meta }.
//   rows: [{ date: "YYYY-MM-DD", description, amount }]  (negative = money out)
//   meta: { kind, periodLabel, yearAssumed, skipped, generic }

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const num = (s) => parseFloat(String(s).replace(/[$,]/g, ""));

export function parseStatementText(raw) {
  const text = (raw || "").replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.replace(/\s+/g, " ").trim());

  // ---- statement period → year for MM/DD dates ------------------------------
  let endM = null, endY = null, periodLabel = null;
  let m = text.match(/through\s+([A-Za-z]+)\s+\d{1,2},\s*(\d{4})/i);
  if (m && MONTHS[m[1].toLowerCase()]) { endM = MONTHS[m[1].toLowerCase()]; endY = +m[2]; periodLabel = m[0].replace(/\s+/g, " "); }
  if (!endY) {
    m = text.match(/Opening\/Closing Date\s+(\d{2})\/(\d{2})\/(\d{2})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{2})/i);
    if (m) { endM = +m[4]; endY = 2000 + +m[6]; periodLabel = `${m[1]}/${m[2]}/${m[3]} – ${m[4]}/${m[5]}/${m[6]}`; }
  }
  const yearAssumed = !endY;
  if (!endY) { const now = new Date(); endM = now.getMonth() + 1; endY = now.getFullYear(); }
  const yearFor = (mm) => (mm > endM ? endY - 1 : endY);

  // ---- document type --------------------------------------------------------
  const isCard = /Opening\/Closing Date|Minimum Payment Due|Payment Due Date|ACCOUNT ACTIVITY/i.test(text);
  const isChecking = /TRANSACTION DETAIL|Deposits and Additions|Total Checking|Electronic Withdrawals/i.test(text);
  const isDiscoverYtd = /\d{2}\/\d{2}\/\d{2}\s+\d{2}\/\d{2}\/\d{2}\s+\S/.test(text) && /Discover/i.test(text);

  const SKIP = /beginning balance|ending balance|previous balance|new balance|minimum payment|payment due date|account number|page \d|daily ending|^total\b|balance$/i;

  const AMT = "(-?\\$?[\\d,]+\\.\\d{2})";
  const rxChecking = new RegExp(`^(\\d{2})/(\\d{2})\\s+(.+?)\\s+${AMT}\\s+${AMT}$`);     // date desc amount balance
  const rxCard = new RegExp(`^(\\d{2})/(\\d{2})\\s+(.+?)\\s+${AMT}$`);                    // date desc amount
  const rxDiscover = new RegExp(`^(\\d{2})/(\\d{2})/(\\d{2})\\s+\\d{2}/\\d{2}/\\d{2}\\s+(.+?)\\s+\\$?\\s*${AMT}(\\s+[A-Za-z /]+)?$`);

  const rows = []; let skipped = 0; let generic = false;

  const pushContinuation = (line) => {
    // wrapped description fragment (e.g. a lone "1601" after "...WA Card"),
    // but never an ALL-CAPS section header like "PURCHASE" or "INTEREST CHARGED"
    if (/^[A-Z][A-Z &/\-]*$/.test(line)) return false;
    if (rows.length && !/\d\.\d{2}\s*$/.test(line) && /^[\w#*.,'&/\- ]{1,40}$/.test(line)) {
      rows[rows.length - 1].description = (rows[rows.length - 1].description + " " + line).replace(/\s+/g, " ").trim();
      return true;
    }
    return false;
  };

  if (isDiscoverYtd) {
    for (const line of lines) {
      if (!line || SKIP.test(line)) continue;
      const g = line.match(rxDiscover);
      if (!g) continue;
      const mm = +g[1], dd = +g[2], yy = 2000 + +g[3];
      const desc = g[4].trim(); const amt = num(g[5]);
      if (!/[A-Za-z]/.test(desc)) { skipped++; continue; }
      // Discover lists charges positive, payments/credits negative
      rows.push({ date: iso(yy, mm, dd), description: desc, amount: -amt });
    }
    return { rows, meta: { kind: "Discover statement", periodLabel, yearAssumed: false, skipped, generic } };
  }

  if (isChecking && !isCard) {
    for (const line of lines) {
      if (!line) continue;
      if (SKIP.test(line)) continue;
      const g = line.match(rxChecking);
      if (!g) { pushContinuation(line); continue; }
      const mm = +g[1], dd = +g[2];
      const desc = g[3].trim();
      if (!/[A-Za-z]/.test(desc)) { skipped++; continue; }      // daily-balance style rows
      const amount = num(g[4]);                                  // signed; g[5] is the running balance
      if (isNaN(amount)) { skipped++; continue; }
      rows.push({ date: iso(yearFor(mm), mm, dd), description: desc, amount });
    }
    return { rows, meta: { kind: "Chase bank statement", periodLabel, yearAssumed, skipped, generic } };
  }

  if (isCard) {
    for (const line of lines) {
      if (!line) continue;
      if (SKIP.test(line)) continue;
      const g = line.match(rxCard);
      if (!g) { pushContinuation(line); continue; }
      const mm = +g[1], dd = +g[2];
      let desc = g[3].trim();
      if (!/[A-Za-z]/.test(desc)) { skipped++; continue; }
      const lineAmt = num(g[4]);
      if (isNaN(lineAmt)) { skipped++; continue; }
      // On a card: positive = charge (money out), negative = payment/credit in.
      let amount = -lineAmt;
      if (/payment thank you|automatic payment/i.test(desc)) desc = "Card payment received - " + desc;
      rows.push({ date: iso(yearFor(mm), mm, dd), description: desc, amount });
    }
    return { rows, meta: { kind: "Credit card statement", periodLabel, yearAssumed, skipped, generic } };
  }

  // ---- generic fallback: any "MM/DD[/YY] desc amount" line -------------------
  generic = true;
  for (const line of lines) {
    if (!line || SKIP.test(line)) continue;
    const g = line.match(new RegExp(`^(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?\\s+(.+?)\\s+${AMT}$`));
    if (!g) continue;
    const mm = +g[1], dd = +g[2];
    const y = g[3] ? (g[3].length === 2 ? 2000 + +g[3] : +g[3]) : yearFor(mm);
    const desc = g[4].trim();
    if (!/[A-Za-z]/.test(desc)) { skipped++; continue; }
    const a = num(g[5]);
    rows.push({ date: iso(y, mm, dd), description: desc, amount: a < 0 ? a : -a }); // assume money out unless flipped in UI
  }
  return { rows, meta: { kind: "Statement (generic)", periodLabel, yearAssumed, skipped, generic } };
}
