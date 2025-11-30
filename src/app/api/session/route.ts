import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const { email, password }: { email?: string; password?: string } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const user = await client
      .db()
      .collection("users")
      .findOne<{ email: string; password: string; role?: string }>({
        email: email.toLowerCase(),
      });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();

    const role = user.role === "super-admin" ? "super-admin" : "admin";

    cookieStore.set("role", role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60,
    });

    cookieStore.set("userEmail", user.email, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60,
    });

    return NextResponse.json({
      success: true,
      message: `Signed in as ${user.email}.`,
      role,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("role");
  cookieStore.delete("userEmail");

  return NextResponse.json({
    success: true,
    message: "Signed out.",
  });
}

