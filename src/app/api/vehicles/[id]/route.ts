import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculateExpiryDate } from "@/lib/vehicle-plans";

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
      { success: false, message: "Only super admins can edit vehicles." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get current vehicle to use existing values if needed
    const currentVehicle = await db.collection("vehicles").findOne(buildQuery(id));
    if (!currentVehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 },
      );
    }
    
    const currentPlanType = currentVehicle.planType || "monthly";
    
    if (typeof body.price === "number" && body.price >= 0) {
      updates.price = body.price;
    }
    if (body.name && typeof body.name === "string") {
      updates.name = body.name;
    }
    if (body.vehicleNumber && typeof body.vehicleNumber === "string") {
      updates.vehicleNumber = body.vehicleNumber;
    }
    if (body.phone && typeof body.phone === "string") {
      updates.phone = body.phone;
    }
    
    const newPlanType = body.planType || currentPlanType;
    if (body.planType && typeof body.planType === "string") {
      updates.planType = body.planType;
    }
    
    if (body.registerDate) {
      const registerDate = new Date(body.registerDate);
      if (!Number.isNaN(registerDate.getTime())) {
        updates.registerDate = registerDate;
        // Recalculate expiry date using new or current plan type
        updates.expiresAt = calculateExpiryDate(registerDate, newPlanType);
      }
    } else if (body.planType && currentVehicle.registerDate) {
      // If only plan type changed, recalculate expiry with existing register date
      const registerDate = new Date(currentVehicle.registerDate);
      if (!Number.isNaN(registerDate.getTime())) {
        updates.expiresAt = calculateExpiryDate(registerDate, body.planType);
      }
    }
    
    if (typeof body.notes === "string") {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    await db
      .collection("vehicles")
      .updateOne(buildQuery(id), { $set: updates });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update vehicle." },
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
      { success: false, message: "Only super admins can delete vehicles." },
      { status: 403 },
    );
  }

  try {
    const client = await clientPromise;
    await client
      .db()
      .collection("vehicles")
      .deleteOne(buildQuery(id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete vehicle." },
      { status: 500 },
    );
  }
}

