import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "ERP Support Ticketing System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
  <NavBar />
  {children}
</body>
    </html>
  );
}