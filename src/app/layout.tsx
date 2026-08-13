import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
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
      <body>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right" 
            theme="dark" 
            richColors 
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}