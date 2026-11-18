import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalog API — Produkty",
  description: "Panel wyszukiwania produktów i REST API w Next.js",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
