import { redirect } from "next/navigation";

// The wishlist is shelf-wide; old per-book links land there.
export default function BookWishlistRedirect() {
  redirect("/wishlist");
}
