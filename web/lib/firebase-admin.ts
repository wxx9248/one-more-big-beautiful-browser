// Server-side Firebase Admin initialization for Next.js API routes
// Supports multiple credential sources: service account JSON, individual env keys, or ADC.

type Firestore = any;
type AdminAuth = any;

let initialized = false;
let cachedFieldValue: any | null = null;
let cachedAuth: AdminAuth | null = null;

async function initFirebaseAdmin(): Promise<{
  getFirestore: () => Firestore;
  getAuth: () => AdminAuth;
} | null> {
  try {
    const appMod = await import("firebase-admin/app");
    const firestoreMod = await import("firebase-admin/firestore");
    const authMod = await import("firebase-admin/auth");
    const { initializeApp, getApps, cert, applicationDefault } = appMod as any;

    if (!initialized && getApps().length === 0) {
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      let credential: any;
      if (saJson) {
        try {
          const parsed = JSON.parse(saJson);
          credential = cert(parsed);
        } catch (e) {
          console.warn(
            "[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back to other creds"
          );
        }
      }

      if (!credential && projectId && clientEmail && privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
        credential = cert({ projectId, clientEmail, privateKey });
      }

      if (!credential) {
        credential = applicationDefault();
      }

      // Explicitly pass projectId to avoid "Unable to detect a Project Id"
      const explicitProjectId =
        projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      initializeApp({ credential, projectId: explicitProjectId });
      initialized = true;
    }

    cachedFieldValue = (firestoreMod as any).FieldValue;
    const getFirestore = () => (firestoreMod as any).getFirestore();
    const getAuth = () => (authMod as any).getAuth();
    return { getFirestore, getAuth };
  } catch (err) {
    console.warn(
      "[firebase-admin] Not initialized – package missing or misconfigured"
    );
    return null;
  }
}

export async function getFirestoreDb(): Promise<Firestore | null> {
  const mod = await initFirebaseAdmin();
  if (!mod) return null;
  try {
    return mod.getFirestore();
  } catch (e) {
    console.warn("[firebase-admin] Failed to get Firestore:", e);
    return null;
  }
}

export async function getFirestoreFieldValue(): Promise<any | null> {
  if (cachedFieldValue) return cachedFieldValue;
  try {
    const mod = await import("firebase-admin/firestore");
    cachedFieldValue = (mod as any).FieldValue;
    return cachedFieldValue;
  } catch (e) {
    console.warn("[firebase-admin] FieldValue unavailable:", e);
    return null;
  }
}

export async function getAdminAuth(): Promise<AdminAuth | null> {
  if (cachedAuth) return cachedAuth;
  const mod = await initFirebaseAdmin();
  if (!mod) return null;
  try {
    cachedAuth = mod.getAuth();
    return cachedAuth;
  } catch (e) {
    console.warn("[firebase-admin] Failed to get Auth:", e);
    return null;
  }
}
