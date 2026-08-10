import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Kalam } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });
const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Adventure Book",
  description: "Buku kenangan interaktif untuk cerita kita berdua.",
};

// The design is light-only. "only light" also opts out of Chrome Android's
// forced auto-dark theming, which otherwise mangles the colors.
export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#ff97d0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${caveat.variable} ${kalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
