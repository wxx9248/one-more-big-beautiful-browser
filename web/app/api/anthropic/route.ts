// /web/app/api/anthropic/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          error: {
            message: "Messages array is required",
          },
        },
        { status: 400 }
      );
    }

    // Extract parameters
    const {
      messages,
      model = "claude-sonnet-4-5",
      max_tokens = 4096,
      temperature = 1,
      tools = [],
      system = undefined,
      stream = true, // Default to streaming
    } = body;

    console.log("Anthropic API request:", {
      model,
      messageCount: messages.length,
      toolCount: tools.length,
      stream,
    });

    // Call Anthropic API with streaming
    const streamResponse = await anthropic.messages.stream({
      model,
      max_tokens,
      temperature,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      system,
    });

    // Create a ReadableStream to forward the SSE events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Forward all stream events
          for await (const event of streamResponse) {
            const eventData = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
          }

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Anthropic API error:", error);

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            status: error.status,
          },
        },
        { status: error.status || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: {
          message: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
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
