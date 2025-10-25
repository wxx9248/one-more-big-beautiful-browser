import { NextRequest, NextResponse } from "next/server";
import { findUser, createUser, generateToken } from "@/lib/fake-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        {
          error: {
            message: "Username, email, and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = findUser(username) || findUser(email);
    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            message: "Username or email already exists",
          },
        },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = createUser(username, email, password);

    // Generate JWT token
    const jwt = generateToken(newUser);

    // Return success response
    return NextResponse.json({
      jwt,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
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
