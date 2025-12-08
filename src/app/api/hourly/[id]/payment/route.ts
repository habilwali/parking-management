import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

function buildQuery(id: string): { _id: ObjectId } {
  return { _id: new ObjectId(id) };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";

  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Not authorized." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { amount } = body;

  if (typeof amount !== "number") {
    return NextResponse.json(
      { success: false, message: "Invalid payment amount." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("hourly_sessions");
    
    // Get current session
    const session = await collection.findOne(buildQuery(id));
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found." },
        { status: 404 },
      );
    }

    const currentPaidAmount = session.paidAmount ?? 0;
    const totalPrice = session.totalPrice ?? 0;
    const newPaidAmount = Math.max(0, currentPaidAmount + amount);
    const isFullyPaid = newPaidAmount >= totalPrice;

    // Update session with new paid amount
    await collection.updateOne(
      buildQuery(id),
      {
        $set: {
          paidAmount: newPaidAmount,
          paid: isFullyPaid,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      paidAmount: newPaidAmount,
      paid: isFullyPaid,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to record payment." },
      { status: 500 },
    );
  }
}

