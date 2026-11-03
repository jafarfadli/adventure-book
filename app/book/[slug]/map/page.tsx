import { redirect } from "next/navigation";

// The map is shelf-wide; old per-book links land there.
export default function BookMapRedirect() {
  redirect("/map");
}
