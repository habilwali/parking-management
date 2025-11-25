import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

function buildQuery(id: string) {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
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
  if (typeof body.price === "number") {
    updates.price = body.price;
  }
  if (body.timestamp) {
    updates.timestamp = new Date(body.timestamp);
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
      .collection("night_sessions")
      .updateOne(buildQuery(id), { $set: updates });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[night:PATCH]", error);
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
    await client.db().collection("night_sessions").deleteOne(buildQuery(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[night:DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete session." },
      { status: 500 },
    );
  }
}

