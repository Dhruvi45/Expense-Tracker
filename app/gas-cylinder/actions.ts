"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { GasCylinder, GasCylinderDoc } from "@/lib/types";

function computeCylinder(doc: GasCylinderDoc): GasCylinder {
  const start = new Date(doc.startDate);
  const end = doc.endDate ? new Date(doc.endDate) : null;

  let daysUsed: number | null = null;
  let costPerDay: number | null = null;

  if (end) {
    daysUsed = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    costPerDay = Math.round((doc.price / daysUsed) * 100) / 100;
  }

  return {
    _id: doc._id.toHexString(),
    startDate: start.toISOString(),
    endDate: end ? end.toISOString() : null,
    price: doc.price,
    daysUsed,
    costPerDay,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getGasCylinders(): Promise<GasCylinder[]> {
  const db = await getDb();
  const docs = await db
    .collection<GasCylinderDoc>("gasCylinders")
    .find()
    .sort({ startDate: -1 })
    .toArray();

  return docs.map(computeCylinder);
}

export async function addGasCylinder(formData: FormData) {
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const price = parseFloat(formData.get("price") as string);

  if (!startDate || isNaN(price)) {
    return { error: "Start date and price are required" };
  }

  const db = await getDb();
  await db.collection("gasCylinders").insertOne({
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    price,
    createdAt: new Date(),
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

  const db = await getDb();
  await db.collection("gasCylinders").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        price,
      },
    }
  );

  revalidatePath("/gas-cylinder");
  return { success: true };
}

export async function deleteGasCylinder(id: string) {
  const db = await getDb();
  await db.collection("gasCylinders").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/gas-cylinder");
  return { success: true };
}
