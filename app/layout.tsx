import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "ERP Support Ticketing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="page-shell">
        <NavBar />
        <main className="page-content">{children}</main>
      </body>
    </html>
  );
}