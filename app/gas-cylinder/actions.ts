"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { GasCylinder } from "@/lib/types";

function computeCylinder(doc: {
  id: string;
  startDate: Date;
  endDate: Date | null;
  price: number;
  createdAt: Date;
}): GasCylinder {
  const start = doc.startDate;
  const end = doc.endDate;
  let daysUsed: number | null = null;
  let costPerDay: number | null = null;

  if (end) {
    daysUsed = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    costPerDay = Math.round((doc.price / daysUsed) * 100) / 100;
  }

  return {
    _id: doc.id,
    startDate: start.toISOString(),
    endDate: end ? end.toISOString() : null,
    price: doc.price,
    daysUsed,
    costPerDay,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getGasCylinders(): Promise<GasCylinder[]> {
  const docs = await prisma.gasCylinder.findMany({ orderBy: { startDate: "desc" } });
  return docs.map(computeCylinder);
}

export async function addGasCylinder(formData: FormData) {
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const price = parseFloat(formData.get("price") as string);

  if (!startDate || isNaN(price)) {
    return { error: "Start date and price are required" };
  }

  await prisma.gasCylinder.create({
    data: {
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      price,
    },
  });

  revalidatePath("/gas-cylinder");
  return { success: true };
}

export async function updateGasCylinder(formData: FormData) {
  const id = formData.get("id") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const price = parseFloat(formData.get("price") as string);

  if (!id || !startDate || isNaN(price)) {
    return { error: "ID, start date and price are required" };
  }

  await prisma.gasCylinder.update({
    where: { id },
    data: {
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      price,
    },
  });

  revalidatePath("/gas-cylinder");
  return { success: true };
}

export async function deleteGasCylinder(id: string) {
  await prisma.gasCylinder.delete({ where: { id } });
  revalidatePath("/gas-cylinder");
  return { success: true };
}
