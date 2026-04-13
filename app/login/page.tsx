import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';
import { loginAction } from '@/app/actions';

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="px-4">
      <AuthCard title="Log in" subtitle="Access the support portal and view ticket history.">
        {params.error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</div>}
        {params.message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{params.message}</div>}
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button className="w-full rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
            Log in
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Need an account? <Link href="/signup" className="font-semibold text-brand">Create one</Link>
        </p>
      </AuthCard>
    </div>
  );
}
