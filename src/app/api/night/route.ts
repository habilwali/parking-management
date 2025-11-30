import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const entries = await client
      .db()
      .collection("night_sessions")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      entries: entries.map((entry) => ({
        ...entry,
        _id: entry._id.toString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load night sessions." },
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
  const { vehicleNumber, timestamp, price } = payload;

  if (!vehicleNumber || !timestamp || typeof price !== "number") {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const record = {
      vehicleNumber,
      timestamp: new Date(timestamp),
      price,
      createdBy,
      createdAt: new Date(),
    };

    const result = await client
      .db()
      .collection("night_sessions")
      .insertOne(record);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to store night session." },
      { status: 500 },
    );
  }
}

