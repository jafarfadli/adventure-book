import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { BASE_PATH } from "./basePath";
import { prisma } from "./db";

const COOKIE_NAME = "ab_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // ~30 days

/**
 * v1 tokens carry the unlocked book; v2 also carries the shelf, whose one
 * password opens every book on it. Both stay valid side by side.
 */
type SessionPayload = { bookId: string; shelfId?: string; role: "editor" };

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createEditorSession(bookId: string, shelfId?: string | null): Promise<void> {
  const payload: SessionPayload = shelfId ? { bookId, shelfId, role: "editor" } : { bookId, role: "editor" };
  const token = await new SignJWT(payload)
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

async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey());
    if (payload.role !== "editor" || typeof payload.bookId !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Returns the bookId the current session was unlocked from, or null. */
export async function getEditorBookId(): Promise<string | null> {
  return (await readSession())?.bookId ?? null;
}

/** The shelf the current session may edit (v2 sessions only), or null. */
export async function getEditorShelfId(): Promise<string | null> {
  const s = await readSession();
  return typeof s?.shelfId === "string" ? s.shelfId : null;
}

/** Whether the session may edit this book: unlocked from it, or from its shelf. */
export async function canEditBook(bookId: string): Promise<boolean> {
  const s = await readSession();
  if (!s) return false;
  if (s.bookId === bookId) return true;
  if (!s.shelfId) return false;
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { shelfId: true } });
  return book?.shelfId === s.shelfId;
}

/**
 * Guard for every mutation: call before any DB/disk side effect.
 * Throws when the session is missing or scoped to another book / shelf.
 */
export async function requireEditor(bookId: string): Promise<void> {
  if (!(await canEditBook(bookId))) {
    throw new Error("Unauthorized: editor session required");
  }
}

/** Guard for shelf-level mutations (new books, the shared wishlist). */
export async function requireShelfEditor(shelfId: string): Promise<void> {
  if ((await getEditorShelfId()) !== shelfId) {
    throw new Error("Unauthorized: shelf editor session required");
  }
}
