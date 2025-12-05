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

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid payment amount." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("vehicles");
    
    // Get current vehicle
    const vehicle = await collection.findOne(buildQuery(id));
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 },
      );
    }

    const currentPaidAmount = vehicle.paidAmount ?? 0;
    const totalPrice = vehicle.price ?? 0;
    const newPaidAmount = currentPaidAmount + amount;
    const isFullyPaid = newPaidAmount >= totalPrice;

    // Update vehicle with new paid amount
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

