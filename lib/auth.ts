import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { BASE_PATH } from "./basePath";

const COOKIE_NAME = "ab_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // ~30 days

type SessionPayload = { bookId: string; role: "editor" };

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createEditorSession(bookId: string): Promise<void> {
  const token = await new SignJWT({ bookId, role: "editor" } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Scoped to the subpath: other apps on the shared hostname never see it.
    path: BASE_PATH,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearEditorSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: BASE_PATH, maxAge: 0 });
}

/** Returns the bookId the current session may edit, or null. */
export async function getEditorBookId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey());
    if (payload.role !== "editor" || typeof payload.bookId !== "string") return null;
    return payload.bookId;
  } catch {
    return null;
  }
}

/**
 * Guard for every mutation: call before any DB/disk side effect.
 * Throws when the session is missing or scoped to another book.
 */
export async function requireEditor(bookId: string): Promise<void> {
  const sessionBookId = await getEditorBookId();
  if (sessionBookId !== bookId) {
    throw new Error("Unauthorized: editor session required");
  }
}
