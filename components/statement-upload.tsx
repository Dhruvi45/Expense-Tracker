"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkAddExpenses } from "@/app/expenses/bulk-actions";
import type { Account, Category } from "@/lib/types";
import { FileUp, CheckSquare, Square, Upload, X } from "lucide-react";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
}

interface StatementUploadProps {
  categories: Category[];
  accounts: Account[];
}

export function StatementUpload({ categories, accounts }: StatementUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setParseError("");
    setTransactions([]);
    setSelected(new Set());
    setImportResult("");
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setParseError("");
    setTransactions([]);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload-statement", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setParseError(data.error ?? "Failed to parse PDF");
      } else {
        setTransactions(data.transactions);
        // Pre-select all debits
        const debits = new Set<number>();
        data.transactions.forEach((tx: ParsedTransaction, i: number) => {
          if (tx.type === "debit") debits.add(i);
        });
        setSelected(debits);
      }
    } catch {
      setParseError("Network error. Please try again.");
    }
    setParsing(false);
  }

  function toggleAll() {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map((_, i) => i)));
    }
  }

  function toggleOne(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  async function handleImport() {
    if (!defaultCategoryId) {
      setImportResult("Please select a default category.");
      return;
    }
    setImporting(true);
    setImportResult("");

    const items = [...selected].map((i) => ({
      title: transactions[i].description.slice(0, 80),
      amount: transactions[i].amount,
      date: transactions[i].date,
      categoryId: defaultCategoryId,
      accountId: defaultAccountId || undefined,
      description: "PDF Import",
    }));

    const result = await bulkAddExpenses(items);
    setImporting(false);

    if (result.error) {
      setImportResult(result.error);
    } else {
      setImportResult(`Successfully imported ${result.count} expense${result.count !== 1 ? "s" : ""}!`);
      setTransactions([]);
      setSelected(new Set());
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileUp className="mr-2 h-4 w-4" />
        Upload Statement
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Bank Statement (PDF)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1">
          {/* File picker */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith(".pdf")) { setFile(f); setParseError(""); }
            }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setTransactions([]); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag & drop a PDF bank statement here, or click to browse
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setParseError(""); } }}
            />
          </div>

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}

          {file && transactions.length === 0 && (
            <Button onClick={handleParse} disabled={parsing}>
              {parsing ? "Parsing..." : "Parse PDF"}
            </Button>
          )}

          {/* Config for import */}
          {transactions.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Found <strong>{transactions.length}</strong> transactions. Select which to import.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Default Category</Label>
                  <select
                    value={defaultCategoryId}
                    onChange={(e) => setDefaultCategoryId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">— Select category —</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Account (optional)</Label>
                  <select
                    value={defaultAccountId}
                    onChange={(e) => setDefaultAccountId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">— None —</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transactions table */}
              <div className="rounded-lg border overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <button onClick={toggleAll} className="flex items-center">
                          {selected.size === transactions.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, i) => (
                      <TableRow
                        key={i}
                        className={`cursor-pointer ${selected.has(i) ? "bg-primary/5" : ""}`}
                        onClick={() => toggleOne(i)}
                      >
                        <TableCell>
                          {selected.has(i) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {tx.date}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "debit"
                                ? "border-red-500 text-red-700 dark:text-red-400"
                                : "border-green-500 text-green-700 dark:text-green-400"
                            }
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">
                {selected.size} of {transactions.length} selected
              </p>
            </>
          )}

          {importResult && (
            <p className={`text-sm font-medium ${importResult.startsWith("Successfully") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {importResult}
            </p>
          )}
        </div>

        {transactions.length > 0 && selected.size > 0 && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !defaultCategoryId}>
              {importing ? "Importing..." : `Import ${selected.size} Expense${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
