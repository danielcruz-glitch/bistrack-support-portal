"use client";

import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="flex gap-4 border-b bg-white p-4">
      <Link href="/" className="font-semibold">
        Dashboard
      </Link>

      <Link href="/admin/users" className="rounded px-3 py-2 hover:bg-gray-100">
        User Management
      </Link>

      <Link href="/admin/work-logs" className="rounded px-3 py-2 hover:bg-gray-100">
        Work Logs
      </Link>

      <Link href="/admin/invoices" className="rounded px-3 py-2 hover:bg-gray-100">
        Invoices
      </Link>
    </nav>
  );
}