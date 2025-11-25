import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value ?? "guest";

    if (role !== "admin" && role !== "super-admin") {
      return NextResponse.json(
        { success: false, message: "Not authorized." },
        { status: 403 },
      );
    }

    const client = await clientPromise;
    const activeVehicles = await client
      .db()
      .collection("active_hourly_vehicles")
      .find({})
      .sort({ startTime: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      vehicles: activeVehicles.map((vehicle) => ({
        id: vehicle._id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        hourlyRate: vehicle.hourlyRate,
        startTime: vehicle.startTime,
        createdBy: vehicle.createdBy,
      })),
    });
  } catch (error) {
    console.error("[active-hourly:GET]", error);
    return NextResponse.json(
      { success: false, message: "Failed to load active vehicles." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const createdBy = cookieStore.get("userEmail")?.value ?? "unknown";

  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Not authorized." },
      { status: 403 },
    );
  }

  const payload = await request.json();
  const { vehicleNumber, hourlyRate } = payload;

  if (!vehicleNumber || !hourlyRate) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("active_hourly_vehicles");

    // Check if vehicle already exists
    const existing = await collection.findOne({ vehicleNumber });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Vehicle already active." },
        { status: 400 },
      );
    }

    const record = {
      vehicleNumber,
      hourlyRate: Number(hourlyRate),
      startTime: new Date(),
      createdBy,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(record);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("[active-hourly:POST]", error);
    return NextResponse.json(
      { success: false, message: "Failed to add vehicle." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";

  if (role !== "admin" && role !== "super-admin") {
    return NextResponse.json(
      { success: false, message: "Not authorized." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing vehicle id." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const { ObjectId } = await import("mongodb");
    const result = await client
      .db()
      .collection("active_hourly_vehicles")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[active-hourly:DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove vehicle." },
      { status: 500 },
    );
  }
}

