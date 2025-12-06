import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

function buildQuery(id: string): { _id: ObjectId } {
  return { _id: new ObjectId(id) };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";

  if (role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Only super admins can edit sessions." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.totalPrice === "number") {
    updates.totalPrice = body.totalPrice;
  }
  if (typeof body.billableHours === "number") {
    updates.billableHours = body.billableHours;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, message: "No valid fields to update." },
      { status: 400 },
    );
  }

  updates.updatedAt = new Date();

  try {
    const client = await clientPromise;
    await client
      .db()
      .collection("hourly_sessions")
      .updateOne(buildQuery(id), { $set: updates });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update session." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";

  if (role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Only super admins can delete sessions." },
      { status: 403 },
    );
  }

  try {
    const client = await clientPromise;
    await client
      .db()
      .collection("hourly_sessions")
      .deleteOne(buildQuery(id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete session." },
      { status: 500 },
    );
  }
}

