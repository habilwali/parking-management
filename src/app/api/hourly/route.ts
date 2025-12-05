import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DEFAULT_HOURLY_RATE = 5;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const totalOnly = searchParams.get("total") === "true";

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("hourly_sessions");

    if (totalOnly) {
      const result = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$paidAmount", 0] } },
            },
          },
        ])
        .toArray();
      const total = result[0]?.total ?? 0;
      return NextResponse.json({ success: true, total });
    }

    const entries = await collection
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
      { success: false, message: "Failed to load hourly sessions." },
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
  const {
    vehicleNumber,
    hourlyRate,
    startTime,
    endTime,
    elapsedMinutes,
    billableMinutes,
    billableHours,
    totalPrice,
    bufferApplied,
    paid = false,
  } = payload;

  if (!vehicleNumber || !startTime || !totalPrice) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const record = {
      vehicleNumber,
      hourlyRate: hourlyRate ?? DEFAULT_HOURLY_RATE,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : new Date(),
      elapsedMinutes,
      billableMinutes,
      billableHours,
      totalPrice,
      bufferApplied,
      paid: paid === true,
      paidAmount: paid === true ? totalPrice : 0,
      createdBy,
      createdAt: new Date(),
    };

    const result = await client
      .db()
      .collection("hourly_sessions")
      .insertOne(record);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to store hourly session." },
      { status: 500 },
    );
  }
}

