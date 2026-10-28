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

/**
 * The shelf a session may edit, or null. A v1 token (book only, from before
 * shelves existed) counts for the shelf its book sits on, as long as it was
 * unlocked with the shelf's password (the shelf took its hash from that
 * book), so nobody has to unlock again after the switch.
 */
async function sessionShelfId(s: SessionPayload): Promise<string | null> {
  if (typeof s.shelfId === "string") return s.shelfId;
  const book = await prisma.book.findUnique({
    where: { id: s.bookId },
    select: { editPasswordHash: true, shelf: { select: { id: true, editPasswordHash: true } } },
  });
  return book?.shelf && book.shelf.editPasswordHash === book.editPasswordHash ? book.shelf.id : null;
}

export async function getEditorShelfId(): Promise<string | null> {
  const s = await readSession();
  return s ? sessionShelfId(s) : null;
}

/** Whether the session may edit this book: unlocked from it, or from its shelf. */
export async function canEditBook(bookId: string): Promise<boolean> {
  const s = await readSession();
  if (!s) return false;
  if (s.bookId === bookId) return true;
  const shelfId = await sessionShelfId(s);
  if (!shelfId) return false;
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { shelfId: true } });
  return book?.shelfId === shelfId;
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
