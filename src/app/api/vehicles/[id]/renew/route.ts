import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculateExpiryDate, PlanType } from "@/lib/vehicle-plans";

type RouteParams = {
  id: string;
};

export async function POST(
  _: Request,
  context: { params: Promise<RouteParams> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";

  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Not authorized to renew vehicles." },
      { status: 403 },
    );
  }

  const query = { _id: new ObjectId(id) };

  try {
    const client = await clientPromise;
    const db = client.db();
    const vehicles = db.collection("vehicles");

    const vehicle = await vehicles.findOne<{
      _id: ObjectId | string;
      planType: PlanType;
      expiresAt: Date;
      registerDate: Date;
    }>(query);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 },
      );
    }

    const currentExpiry = new Date(vehicle.expiresAt ?? vehicle.registerDate);
    const now = new Date();

    if (currentExpiry > now) {
      return NextResponse.json(
        { success: false, message: "Vehicle has not expired yet." },
        { status: 400 },
      );
    }

    const newRegisterDate = currentExpiry;
    const newExpiry = calculateExpiryDate(newRegisterDate, vehicle.planType);

    await vehicles.updateOne(query, {
      $set: {
        registerDate: newRegisterDate,
        expiresAt: newExpiry,
        updatedAt: new Date(),
        renewedBy: cookieStore.get("userEmail")?.value ?? "unknown",
      },
      $push: {
        renewals: {
          renewedAt: new Date(),
          previousExpiry: currentExpiry,
          newExpiry,
        },
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Vehicle renewed successfully.",
      registerDate: newRegisterDate,
      expiresAt: newExpiry,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to renew vehicle." },
      { status: 500 },
    );
  }
}

