import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculateExpiryDate, PlanType } from "@/lib/vehicle-plans";

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

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid payment amount." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const vehicles = db.collection("vehicles");

    const vehicle = await vehicles.findOne<{
      _id: ObjectId | string;
      planType: PlanType;
      expiresAt: Date;
      registerDate: Date;
      price: number;
    }>(buildQuery(id));

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 },
      );
    }

    const currentExpiry = new Date(vehicle.expiresAt ?? vehicle.registerDate);
    const now = new Date();

    // Calculate new dates for renewal
    const newRegisterDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = calculateExpiryDate(newRegisterDate, vehicle.planType);
    
    const totalPrice = vehicle.price ?? 0;
    const isFullyPaid = amount >= totalPrice;

    // Renew subscription and set payment amount (not add to existing)
    await vehicles.updateOne(buildQuery(id), {
      $set: {
        registerDate: newRegisterDate,
        expiresAt: newExpiry,
        paidAmount: amount, // Set to payment amount, not add
        paid: isFullyPaid,
        updatedAt: new Date(),
        renewedBy: cookieStore.get("userEmail")?.value ?? "unknown",
      },
      $push: {
        renewals: {
          renewedAt: new Date(),
          previousExpiry: currentExpiry,
          newExpiry,
          paymentAmount: amount,
        },
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Vehicle renewed and payment recorded successfully.",
      registerDate: newRegisterDate,
      expiresAt: newExpiry,
      paidAmount: amount,
      paid: isFullyPaid,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to renew vehicle and record payment." },
      { status: 500 },
    );
  }
}

