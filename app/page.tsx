import { redirect } from "next/navigation";

// v1 hosts a single book: the landing page just forwards to it.
export default function Home() {
  redirect(`/book/${process.env.DEFAULT_SLUG ?? "our-story"}`);
}
