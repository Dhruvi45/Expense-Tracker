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
  date: Date;
  createdAt: Date;
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
  categoryName?: string;
  categoryColor?: string;
  date: string;
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
  quantity: number; // liters
  pricePerUnit: number; // price per liter
  createdAt: Date;
}

export interface MilkEntry {
  _id: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  total: number; // computed: quantity * pricePerUnit
  createdAt: string;
}

export interface MilkMonthlySummary {
  month: string;
  label: string;
  totalQuantity: number;
  totalCost: number;
  avgPricePerUnit: number;
  entries: number;
}

export interface MilkSettings {
  pricePerUnit: number;
}
