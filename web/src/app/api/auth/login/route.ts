import { NextRequest, NextResponse } from "next/server";
import { findUser, generateToken } from "@/lib/fake-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        {
          error: {
            message: "Identifier and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = findUser(identifier);

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid credentials",
          },
        },
        { status: 401 }
      );
    }

    // Check password (in production, compare hashed passwords!)
    if (user.password !== password) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid credentials",
          },
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwt = generateToken(user);

    // Return success response
    return NextResponse.json({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: {
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
