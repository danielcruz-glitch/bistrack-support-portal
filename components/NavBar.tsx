"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/admin", label: "Admin" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-nexus-800 bg-nexus-900 text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-nexus-800">
              <div className="absolute h-1.5 w-1.5 rounded-full bg-blue-400" />
              <div className="absolute -left-1 top-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
              <div className="absolute -right-1 bottom-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
              <div className="absolute h-px w-5 rotate-12 bg-blue-400/50" />
              <div className="absolute h-px w-5 -rotate-12 bg-slate-400/40" />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[0.18em] text-white">
                ERP NEXUS
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-nexus-400">
                Control Hub
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-nexus-800 text-white"
                      : "text-nexus-300 hover:bg-nexus-800/80 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 sm:block">
            ERP Support
          </div>

          <div className="h-8 w-px bg-nexus-700" />

          <Link
            href="/dashboard/account"
            className="rounded-lg border border-nexus-700 bg-nexus-800 px-3 py-2 text-sm font-medium text-nexus-200 transition hover:border-nexus-600 hover:bg-nexus-700 hover:text-white"
          >
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}