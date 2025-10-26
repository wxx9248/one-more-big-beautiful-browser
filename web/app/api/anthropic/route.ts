// /web/app/api/anthropic/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import jwt from "jsonwebtoken";
import { getFirestoreDb } from "@/lib/firebase-admin";

// Ensure this route runs in the Node.js runtime (not Edge),
// because firebase-admin is not supported in Edge runtime
export const runtime = "nodejs";

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
      // custom logging fields from the extension
      conversation = undefined,
      conversation_messages = undefined,
    } = body as any;

    console.log("Anthropic API request:", {
      model,
      messageCount: messages.length,
      toolCount: tools.length,
      stream,
    });

    // Optionally capture auth user info from Authorization header (JWT)
    let user: { id?: string; username?: string; email?: string } | undefined;
    try {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;
      const secret =
        process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production";
      if (token && secret) {
        const decoded: any = jwt.verify(token, secret);
        user = {
          id: decoded?.id,
          username: decoded?.username,
          email: decoded?.email,
        };
      }
    } catch (e) {
      console.warn("JWT verification failed or missing", e);
    }

    // Firestore: persist conversation start and request context if configured
    const db = await getFirestoreDb();
    const convId: string =
      (conversation && conversation.id) ||
      `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startedAt: number = Number(conversation?.startedAt) || Date.now();

    if (db) {
      try {
        const convRef = (db as any).collection("conversations").doc(convId);
        await convRef.set(
          {
            id: convId,
            user: user || null,
            startedAt,
            createdAt: Date.now(),
            model,
            temperature,
            toolCount: Array.isArray(tools) ? tools.length : 0,
            status: "streaming",
            messages: Array.isArray(conversation_messages)
              ? conversation_messages
              : [],
            messageCount: Array.isArray(messages) ? messages.length : 0,
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Failed to persist conversation start to Firestore:", e);
      }
    }

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
          let assistantText = "";
          // Forward all stream events
          for await (const event of streamResponse) {
            const eventData = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));

            // Accumulate assistant text from text deltas for logging
            try {
              if (
                event?.type === "content_block_delta" &&
                event?.delta?.type === "text_delta" &&
                typeof event?.delta?.text === "string"
              ) {
                assistantText += event.delta.text;
              }
            } catch {
              // ignore
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

          // Update Firestore with final result
          if (db) {
            try {
              const convRef = (db as any)
                .collection("conversations")
                .doc(convId);
              await convRef.set(
                {
                  status: "completed",
                  endedAt: Date.now(),
                  assistantText,
                },
                { merge: true }
              );
            } catch (e) {
              console.warn(
                "Failed to update conversation completion in Firestore:",
                e
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          // Attempt to mark conversation as failed
          if (db) {
            try {
              const convRef = (db as any)
                .collection("conversations")
                .doc(convId);
              await convRef.set(
                {
                  status: "error",
                  endedAt: Date.now(),
                  error: error instanceof Error ? error.message : String(error),
                },
                { merge: true }
              );
            } catch {}
          }
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
