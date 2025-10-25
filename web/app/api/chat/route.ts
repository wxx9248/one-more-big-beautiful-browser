// /web/src/app/api/chat/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Messages array is required",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get server URL from environment or use default
    const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
    const chatEndpoint = `${serverUrl}/api/chat/`;

    console.log("Forwarding request to:", chatEndpoint);
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Forward the request to your Python server
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward any authorization headers if needed
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
      body: JSON.stringify(body),
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Handle error responses
    if (!response.ok) {
      // For error responses, we can safely read the body
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorText = await response.text();
        errorMessage = `${errorMessage} - ${errorText}`;
      } catch (e) {
        console.warn("Could not read error response body:", e);
      }

      return new Response(
        JSON.stringify({
          error: {
            message: errorMessage,
          },
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For successful responses, check if it's a streaming response
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/event-stream")) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Expected streaming response but got: ${contentType}`,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the streaming response from the server
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        // Forward CORS headers if needed
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
