import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { calculateExpiryDate, PlanType } from "@/lib/vehicle-plans";

type VehiclePayload = {
  name?: string;
  vehicleNumber?: string;
  phone?: string;
  registerDate?: string;
  planType?: PlanType;
  price?: number | string;
  notes?: string;
};

export async function POST(request: Request) {
  const payload: VehiclePayload = await request.json();
  const {
    name,
    vehicleNumber,
    phone,
    registerDate,
    planType = "monthly",
    price,
    notes,
  } = payload;

  if (!name || !vehicleNumber || !phone || !registerDate || price === undefined || price === null || price === "") {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const parsedDate = new Date(registerDate);
  const numericPrice = Number(price);
  const expiresAt = calculateExpiryDate(parsedDate, planType);

  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { success: false, message: "Invalid register date." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return NextResponse.json(
      { success: false, message: "Invalid price." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const createdBy = cookieStore.get("userEmail")?.value ?? "unknown";
  const role = cookieStore.get("role")?.value ?? "guest";

  try {
    const client = await clientPromise;
    const db = client.db();
    const vehicles = db.collection("vehicles");

    const record = {
      name,
      vehicleNumber,
      phone,
      registerDate: parsedDate,
      planType,
      price: numericPrice,
      expiresAt,
      notes: notes ?? "",
      createdBy,
      createdByRole: role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await vehicles.insertOne(record);

    return NextResponse.json({
      success: true,
      message: "Vehicle registered successfully.",
      id: result.insertedId,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to register vehicle." },
      { status: 500 },
    );
  }
}

