"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center justify-center rounded-lg border border-nexus-300 bg-white px-4 py-2 text-sm font-medium text-nexus-700 transition hover:bg-nexus-50 hover:text-nexus-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
    >
      Logout
    </button>
  );
}