// /web/app/api/anthropic/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import jwt from "jsonwebtoken";
import {
  getFirestoreDb,
  getFirestoreFieldValue,
  getAdminAuth,
} from "@/lib/firebase-admin";

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

    // Optionally capture auth user info from Authorization header
    // Prefer verifying Firebase ID tokens via Admin SDK; fall back to decode.
    let user:
      | { id?: string; username?: string; email?: string; uid?: string }
      | undefined;
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;
    if (bearer) {
      let verified = false;
      try {
        const adminAuth = await getAdminAuth();
        if (adminAuth) {
          const decoded = await (adminAuth as any).verifyIdToken(bearer);
          user = { id: decoded?.uid, uid: decoded?.uid, email: decoded?.email };
          verified = true;
        }
      } catch (e) {
        console.warn("Firebase ID token verification failed", e);
      }

      if (!verified) {
        try {
          // As a fallback, attempt decode without verification to extract claims
          const decoded: any = jwt.decode(bearer);
          if (decoded) {
            user = { id: decoded?.uid || decoded?.id, email: decoded?.email };
          }
        } catch (e) {
          console.warn("JWT decode failed", e);
        }
      }
    }

    // Firestore: persist conversation start and request context if configured
    const db = await getFirestoreDb();
    const FieldValue = await getFirestoreFieldValue();
    const convId: string =
      (conversation && conversation.id) ||
      `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startedAt: number = Number(conversation?.startedAt) || Date.now();

    if (db) {
      try {
        const convRef = (db as any).collection("conversations").doc(convId);
        const existing = await convRef.get();
        if (!existing.exists) {
          await convRef.set(
            {
              conversation_id: convId,
              user_id: user?.id || (user as any)?.uid || null,
              started_at: FieldValue?.serverTimestamp?.() || new Date(),
              status: "active",
              model,
              temperature,
              toolCount: Array.isArray(tools) ? tools.length : 0,
              createdAt: Date.now(),
              user_saved_count: 0,
            },
            { merge: true }
          );
        } else {
          await convRef.set(
            {
              model,
              temperature,
              toolCount: Array.isArray(tools) ? tools.length : 0,
            },
            { merge: true }
          );
        }

        // Persist all new user-typed messages since last saved
        const alreadySaved: number = existing.exists
          ? Number(existing.data()?.user_saved_count || 0)
          : 0;
        const userMsgs: Array<{ role: string; content: string }> =
          Array.isArray(conversation_messages) ? conversation_messages : [];
        const newMsgs = userMsgs
          .slice(alreadySaved)
          .filter(
            (m) =>
              m && typeof m.content === "string" && m.content.trim().length > 0
          );

        if (newMsgs.length > 0) {
          const coll = (db as any)
            .collection("conversations")
            .doc(convId)
            .collection("messages");
          for (const m of newMsgs) {
            await coll.add({
              conversation_id: convId,
              sender: "user",
              content: m.content,
              created_at: FieldValue?.serverTimestamp?.() || new Date(),
            });
          }
          await convRef.set(
            { user_saved_count: alreadySaved + newMsgs.length },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn("Failed to persist conversation start to Firestore:", e);
      }
    } else {
      // Fallback: use Firebase client SDK if Admin SDK is not configured
      try {
        const { db: clientDb } = await import("@/lib/firebase/config");
        const firestore = await import("firebase/firestore");
        const convRef = firestore.doc(clientDb as any, "conversations", convId);
        const existing = await firestore.getDoc(convRef);
        if (!existing.exists()) {
          await firestore.setDoc(
            convRef,
            {
              conversation_id: convId,
              user_id: user?.id || (user as any)?.uid || null,
              started_at: firestore.serverTimestamp(),
              status: "active",
              model,
              temperature,
              toolCount: Array.isArray(tools) ? tools.length : 0,
              user_saved_count: 0,
            },
            { merge: true }
          );
        } else {
          await firestore.setDoc(
            convRef,
            {
              model,
              temperature,
              toolCount: Array.isArray(tools) ? tools.length : 0,
            },
            { merge: true }
          );
        }

        const alreadySaved: number = existing.exists()
          ? Number((existing.data() as any)?.user_saved_count || 0)
          : 0;
        const userMsgs: Array<{ role: string; content: string }> =
          Array.isArray(conversation_messages) ? conversation_messages : [];
        const newMsgs = userMsgs
          .slice(alreadySaved)
          .filter(
            (m) =>
              m && typeof m.content === "string" && m.content.trim().length > 0
          );

        if (newMsgs.length > 0) {
          for (const m of newMsgs) {
            await firestore.addDoc(
              firestore.collection(
                clientDb as any,
                "conversations",
                convId,
                "messages"
              ),
              {
                conversation_id: convId,
                sender: "user",
                content: m.content,
                created_at: firestore.serverTimestamp(),
              }
            );
          }
          await firestore.setDoc(
            convRef,
            { user_saved_count: alreadySaved + newMsgs.length },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn("Client Firestore fallback failed to persist start:", e);
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
                  status: "closed",
                  ended_at:
                    (FieldValue as any)?.serverTimestamp?.() || new Date(),
                },
                { merge: true }
              );

              // Save assistant message as a new entry in messages subcollection
              if (assistantText && assistantText.trim().length > 0) {
                await (db as any)
                  .collection("conversations")
                  .doc(convId)
                  .collection("messages")
                  .add({
                    conversation_id: convId,
                    sender: "assistant",
                    content: assistantText,
                    created_at: FieldValue?.serverTimestamp?.() || new Date(),
                  });
              }
            } catch (e) {
              console.warn(
                "Failed to update conversation completion in Firestore:",
                e
              );
            }
          } else {
            // Fallback using client SDK
            try {
              const { db: clientDb } = await import("@/lib/firebase/config");
              const firestore = await import("firebase/firestore");
              const convRef = firestore.doc(
                clientDb as any,
                "conversations",
                convId
              );
              await firestore.setDoc(
                convRef,
                {
                  status: "closed",
                  ended_at: firestore.serverTimestamp(),
                },
                { merge: true }
              );

              if (assistantText && assistantText.trim().length > 0) {
                await firestore.addDoc(
                  firestore.collection(
                    clientDb as any,
                    "conversations",
                    convId,
                    "messages"
                  ),
                  {
                    conversation_id: convId,
                    sender: "assistant",
                    content: assistantText,
                    created_at: firestore.serverTimestamp(),
                  }
                );
              }
            } catch (e) {
              console.warn(
                "Client Firestore fallback failed to persist end:",
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
                  ended_at:
                    (FieldValue as any)?.serverTimestamp?.() || new Date(),
                  error: error instanceof Error ? error.message : String(error),
                },
                { merge: true }
              );
            } catch {}
          } else {
            try {
              const { db: clientDb } = await import("@/lib/firebase/config");
              const firestore = await import("firebase/firestore");
              const convRef = firestore.doc(
                clientDb as any,
                "conversations",
                convId
              );
              await firestore.setDoc(
                convRef,
                {
                  status: "error",
                  ended_at: firestore.serverTimestamp(),
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
