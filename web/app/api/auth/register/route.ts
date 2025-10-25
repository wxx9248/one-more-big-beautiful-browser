import { NextRequest, NextResponse } from "next/server";
import { registerUserController } from "@/controller/auth-controller";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Use controller function to handle registration logic
    const result = await registerUserController({ username, email, password });

    if (!result.success) {
      // Handle validation errors
      if (result.zodErrors) {
        return NextResponse.json(
          {
            error: {
              message: "Validation failed",
              details: result.zodErrors,
            },
          },
          { status: 400 }
        );
      }

      // Handle API errors
      if (result.strapiErrors) {
        return NextResponse.json(
          {
            error: result.strapiErrors,
          },
          { status: 400 }
        );
      }

      // Handle general errors
      return NextResponse.json(
        {
          error: {
            message: result.message || "Registration failed",
          },
        },
        { status: 400 }
      );
    }

    // Return success response with JWT
    return NextResponse.json({
      jwt: result.jwt,
      user: result.user,
      message: result.message,
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
