import { NextRequest, NextResponse } from "next/server";
import {
  loginUserController,
  cookieConfig,
} from "@/controller/auth-controller";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // Use controller function to handle login logic
    const result = await loginUserController({ identifier, password });

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
            message: result.message || "Login failed",
          },
        },
        { status: 400 }
      );
    }

    // Create response with JWT
    const response = NextResponse.json({
      jwt: result.jwt,
      user: result.user,
      message: result.message,
    });

    // Set JWT cookie
    response.cookies.set("jwt", result.jwt!, cookieConfig);

    return response;
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
