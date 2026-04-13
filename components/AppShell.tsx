import Link from 'next/link';
import { logoutAction } from '@/app/actions';
import { UserRole } from '@/lib/types';

export function AppShell({
  children,
  role,
  userName
}: {
  children: React.ReactNode;
  role?: UserRole;
  userName?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/dashboard" className="text-xl font-bold text-brand">
              BisTrack Support Portal
            </Link>
            <p className="text-sm text-slate-500">Ticketing, support history, time tracking, and invoices</p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-3 text-sm md:flex">
              <Link href="/dashboard" className="text-slate-600 hover:text-brand">Dashboard</Link>
              <Link href="/tickets/new" className="text-slate-600 hover:text-brand">New Ticket</Link>
              {(role === 'support' || role === 'admin') && (
                <>
                  <Link href="/admin" className="text-slate-600 hover:text-brand">Admin</Link>
                  <Link href="/invoices" className="text-slate-600 hover:text-brand">Invoices</Link>
                </>
              )}
            </nav>
            <div className="text-right text-sm">
              <div className="font-semibold text-slate-700">{userName}</div>
              <div className="capitalize text-slate-500">{role || 'user'}</div>
            </div>
            <form action={logoutAction}>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
