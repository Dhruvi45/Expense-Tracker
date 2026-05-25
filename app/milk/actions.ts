"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { MilkEntry, MilkMonthlySummary, MilkSettings } from "@/lib/types";

function toMilkEntry(doc: {
  id: string;
  date: Date;
  packets: number;
  volumePerPacket: number;
  pricePerPacket: number;
  createdAt: Date;
}): MilkEntry {
  return {
    _id: doc.id,
    date: doc.date.toISOString(),
    packets: doc.packets,
    liters: Math.round(doc.packets * doc.volumePerPacket * 100) / 100,
    volumePerPacket: doc.volumePerPacket,
    pricePerPacket: doc.pricePerPacket,
    total: Math.round(doc.packets * doc.pricePerPacket * 100) / 100,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getMilkEntries(month?: string): Promise<MilkEntry[]> {
  const where: Prisma.MilkEntryWhereInput = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = { gte: new Date(year, m - 1, 1), lte: new Date(year, m, 0, 23, 59, 59, 999) };
  }

  const docs = await prisma.milkEntry.findMany({ where, orderBy: { date: "desc" } });
  return docs.map(toMilkEntry);
}

// ---- Settings ----

export async function getMilkSettings(): Promise<MilkSettings> {
  const doc = await prisma.milkSettings.findFirst();
  return {
    volumePerPacket: doc?.volumePerPacket ?? 0.5,
    pricePerPacket: doc?.pricePerPacket ?? 0,
  };
}

export async function updateMilkSettings(formData: FormData) {
  const volumePerPacket = parseFloat(formData.get("volumePerPacket") as string);
  const pricePerPacket = parseFloat(formData.get("pricePerPacket") as string);

  if (isNaN(volumePerPacket) || volumePerPacket <= 0) {
    return { error: "Valid volume per packet is required" };
  }
  if (isNaN(pricePerPacket) || pricePerPacket < 0) {
    return { error: "Valid price per packet is required" };
  }

  const existing = await prisma.milkSettings.findFirst();
  if (existing) {
    await prisma.milkSettings.update({ where: { id: existing.id }, data: { volumePerPacket, pricePerPacket } });
  } else {
    await prisma.milkSettings.create({ data: { volumePerPacket, pricePerPacket } });
  }

  revalidatePath("/milk");
  return { success: true };
}

// ---- Entries ----

export async function addMilkEntry(formData: FormData) {
  const date = formData.get("date") as string;
  const packets = parseFloat(formData.get("packets") as string);

  if (!date || isNaN(packets) || packets <= 0) {
    return { error: "Date and number of packets are required" };
  }

  const settings = await getMilkSettings();

  await prisma.milkEntry.create({
    data: {
      date: new Date(date),
      packets,
      volumePerPacket: settings.volumePerPacket,
      pricePerPacket: settings.pricePerPacket,
    },
  });

  revalidatePath("/milk");
  return { success: true };
}

export async function updateMilkEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const date = formData.get("date") as string;
  const packets = parseFloat(formData.get("packets") as string);

  if (!id || !date || isNaN(packets) || packets <= 0) {
    return { error: "All fields are required" };
  }

  await prisma.milkEntry.update({
    where: { id },
    data: { date: new Date(date), packets },
  });

  revalidatePath("/milk");
  return { success: true };
}

export async function deleteMilkEntry(id: string) {
  await prisma.milkEntry.delete({ where: { id } });
  revalidatePath("/milk");
  return { success: true };
}

// ---- Monthly Summaries ----

export async function getMilkMonthlySummaries(): Promise<MilkMonthlySummary[]> {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const entries = await prisma.milkEntry.findMany({
    select: { date: true, packets: true, volumePerPacket: true, pricePerPacket: true },
    orderBy: { date: "desc" },
  });

  const map = new Map<string, { packets: number; liters: number; cost: number; count: number }>();

  for (const e of entries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { packets: 0, liters: 0, cost: 0, count: 0 };
    existing.packets += e.packets;
    existing.liters += e.packets * e.volumePerPacket;
    existing.cost += e.packets * e.pricePerPacket;
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .slice(0, 12)
    .map(([key, val]) => {
      const [year, mon] = key.split("-").map(Number);
      return {
        month: key,
        label: `${monthNames[mon - 1]} ${year}`,
        totalPackets: Math.round(val.packets * 100) / 100,
        totalLiters: Math.round(val.liters * 100) / 100,
        totalCost: Math.round(val.cost * 100) / 100,
        entries: val.count,
      };
    });
}
