import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KXBYTE Suite",
  description: "KXBYTE Platform - Business Technology Ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}