import { NextResponse } from "next/server";
import { getFirestoreDb, getFirestoreFieldValue } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  const db = await getFirestoreDb();
  const FieldValue = await getFirestoreFieldValue();

  if (!db) {
    return NextResponse.json(
      { ok: false, reason: "firebase-admin not initialized (db=null)" },
      { status: 500 }
    );
  }

  try {
    const diagRef = (db as any).collection("diagnostics").doc();
    await diagRef.set({
      created_at: FieldValue?.serverTimestamp?.() || new Date(),
    });
    const snap = await diagRef.get();
    const exists = snap.exists;
    return NextResponse.json({ ok: true, wrote: exists }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
