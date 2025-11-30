import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const spaces = await db
      .collection("parking_spaces")
      .find({})
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      count: spaces.length,
      spaces,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch parking spaces." },
      { status: 500 },
    );
  }
}

