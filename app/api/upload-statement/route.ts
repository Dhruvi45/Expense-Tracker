import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
}

// Common Indian bank statement date patterns: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
const DATE_PATTERNS = [
  /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/,
  /\b(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i,
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(raw: string): string | null {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const m1 = raw.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm}-${dd}`;
  }
  // Try DD Mon YYYY
  const m2 = raw.match(/\b(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i);
  if (m2) {
    const [, dd, mon, yyyy] = m2;
    const mm = String((MONTH_MAP[mon.toLowerCase()] ?? 0) + 1).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  // Remove currency symbols, commas
  const cleaned = raw.replace(/[₹$,\s]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// Heuristic line parser for common Indian bank statement formats
function parseStatementText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip header / summary lines
    if (/opening|closing|balance|statement|account|branch|ifsc|narration|description|particulars/i.test(line)) continue;

    const date = parseDate(line);
    if (!date) continue;

    // Extract amounts — look for number patterns like 1,234.56 or 1234.56
    const amountMatches = [...line.matchAll(/[\d,]+\.\d{2}/g)];
    if (amountMatches.length === 0) continue;

    // Take last 1 or 2 amounts (debit / credit columns)
    const amounts = amountMatches.map((m) => parseAmount(m[0])).filter((v): v is number => v !== null);
    if (amounts.length === 0) continue;

    // Remove the date portion and amounts from line to get description
    let desc = line
      .replace(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/, "")
      .replace(/\b\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i, "")
      .replace(/[\d,]+\.\d{2}/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!desc || desc.length < 2) desc = "Transaction";

    // Determine debit vs credit — if line contains "Dr" or amounts in debit column
    const isDebit = /\bDr\b/i.test(line) || !/\bCr\b/i.test(line);

    transactions.push({
      date,
      description: desc,
      amount: amounts[0],
      type: isDebit ? "debit" : "credit",
    });
  }

  return transactions;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamically import pdf-parse to avoid build issues with Next.js
    type PdfParseResult = { text: string; numpages: number };
    type PdfParseFn = (buf: Buffer) => Promise<PdfParseResult>;
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = ((pdfParseModule as unknown as { default: PdfParseFn }).default ?? pdfParseModule) as unknown as PdfParseFn;
    const data = await pdfParse(buffer);

    const transactions = parseStatementText(data.text);

    return NextResponse.json({
      success: true,
      pages: data.numpages,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. Please ensure it is a text-based (not scanned) bank statement." },
      { status: 500 }
    );
  }
}
