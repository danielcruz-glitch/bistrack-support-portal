"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role || null);
    }

    loadProfile();
  }, []);

  return (
    <nav className="flex gap-4 border-b bg-white p-4">
      <Link href="/dashboard" className="font-semibold">
        Dashboard
      </Link>

      <Link
        href="/dashboard/tickets"
        className="rounded px-3 py-2 hover:bg-gray-100"
      >
        Tickets
      </Link>

      {role === "admin" && (
        <>
          <Link
            href="/admin/users"
            className="rounded px-3 py-2 hover:bg-gray-100"
          >
            Users
          </Link>

          <Link
            href="/admin/companies"
            className="rounded px-3 py-2 hover:bg-gray-100"
          >
            Companies
          </Link>

          <Link
            href="/admin/invoices"
            className="rounded px-3 py-2 hover:bg-gray-100"
          >
            Invoices
          </Link>
        </>
      )}
    </nav>
  );
}