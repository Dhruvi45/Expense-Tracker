import { ObjectId } from "mongodb";

// ---- MongoDB Document Types ----

export interface CategoryDoc {
  _id: ObjectId;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ExpenseDoc {
  _id: ObjectId;
  title: string;
  amount: number;
  description: string;
  categoryId: ObjectId;
  accountId?: ObjectId;
  date: Date;
  dateRangeEnd?: Date;
  createdAt: Date;
}

// ---- Account / Budget Bucket types ----

export type AccountType = "dharmik" | "household" | "longterm" | "travel";

export interface AccountDoc {
  _id: ObjectId;
  name: string;
  type: AccountType;
  color: string;
  monthlyAllocation: number;
  currentBalance: number;
  createdAt: Date;
}

export interface Account {
  _id: string;
  name: string;
  type: AccountType;
  color: string;
  monthlyAllocation: number;
  currentBalance: number;
  createdAt: string;
}

export type TransactionReason =
  | "monthly_allocation"
  | "expense"
  | "manual"
  | "income_split"
  | "pdf_import"
  | "expense_reversal";

export interface AccountTransactionDoc {
  _id: ObjectId;
  accountId: ObjectId;
  type: "credit" | "debit";
  amount: number;
  reason: TransactionReason;
  note: string;
  date: Date;
  expenseId?: ObjectId;
  createdAt: Date;
}

export interface AccountTransaction {
  _id: string;
  accountId: string;
  type: "credit" | "debit";
  amount: number;
  reason: TransactionReason;
  note: string;
  date: string;
  expenseId?: string;
  createdAt: string;
}

// ---- Income types ----

export interface IncomeEntryDoc {
  _id: ObjectId;
  amount: number;
  month: string; // YYYY-MM
  source: string;
  note: string;
  createdAt: Date;
}

export interface IncomeEntry {
  _id: string;
  amount: number;
  month: string;
  source: string;
  note: string;
  createdAt: string;
}

// ---- Savings types ----

export type SavingsReason =
  | "monthly_auto"
  | "manual"
  | "income_split"
  | "goal_withdrawal";

export interface SavingsEntryDoc {
  _id: ObjectId;
  type: "deposit" | "withdrawal";
  amount: number;
  reason: SavingsReason;
  note: string;
  goalId?: ObjectId;
  date: Date;
  createdAt: Date;
}

export interface SavingsEntry {
  _id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  reason: SavingsReason;
  note: string;
  goalId?: string;
  goalName?: string;
  date: string;
  createdAt: string;
}

export interface SavingsGoalDoc {
  _id: ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  createdAt: Date;
}

export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  createdAt: string;
}

export interface SavingsConfigDoc {
  monthlyAutoDeposit: number;
  updatedAt: Date;
}

export interface SavingsConfig {
  monthlyAutoDeposit: number;
  updatedAt: string;
}

export interface SavingsSummary {
  totalBalance: number;
  thisMonthDeposited: number;
  thisMonthWithdrawn: number;
}

// ---- Serialized types (for client components) ----

export interface Category {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  description: string;
  categoryId: string;
  accountId?: string;
  accountName?: string;
  categoryName?: string;
  categoryColor?: string;
  date: string;
  dateRangeEnd?: string;
  createdAt: string;
}

// ---- Report/Chart types ----

export interface MonthlySummary {
  totalThisMonth: number;
  totalLastMonth: number;
  percentChange: number;
  topCategories: { name: string; color: string; total: number }[];
  totalCount: number;
  categoryCount: number;
}

export interface MonthlyTrend {
  month: string; // e.g. "2026-03"
  label: string; // e.g. "Mar 2026"
  total: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

export interface CategoryMonthComparison {
  month: string;
  label: string;
  [categoryName: string]: string | number; // dynamic keys for each category
}

// ---- Gas Cylinder types ----

export interface GasCylinderDoc {
  _id: ObjectId;
  startDate: Date;
  endDate: Date | null;
  price: number;
  createdAt: Date;
}

export interface GasCylinder {
  _id: string;
  startDate: string;
  endDate: string | null;
  price: number;
  daysUsed: number | null; // computed: difference between start and end
  costPerDay: number | null; // computed: price / daysUsed
  createdAt: string;
}

// ---- Milk Management types ----

export interface MilkEntryDoc {
  _id: ObjectId;
  date: Date;
  packets: number;          // number of packets received
  volumePerPacket: number;  // liters per packet (snapshot from settings at entry time)
  pricePerPacket: number;   // price per packet (snapshot from settings at entry time)
  createdAt: Date;
}

export interface MilkEntry {
  _id: string;
  date: string;
  packets: number;
  liters: number;           // computed: packets × volumePerPacket
  volumePerPacket: number;
  pricePerPacket: number;
  total: number;            // computed: packets × pricePerPacket
  createdAt: string;
}

export interface MilkMonthlySummary {
  month: string;
  label: string;
  totalPackets: number;
  totalLiters: number;
  totalCost: number;
  entries: number;
}

export interface MilkSettings {
  volumePerPacket: number;  // liters per packet
  pricePerPacket: number;   // price per packet
}
