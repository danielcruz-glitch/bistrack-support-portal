import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';
import { getDepartments } from '@/lib/data';
import { signUpAction } from '@/app/actions';

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const departments = await getDepartments();
  const params = await searchParams;

  return (
    <div className="px-4">
      <AuthCard title="Create account" subtitle="Staff can sign up here to submit and track support issues.">
        {params.error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</div>}
        <form action={signUpAction} className="space-y-4">
          <div>
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" required />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div>
            <label htmlFor="departmentId">Department</label>
            <select id="departmentId" name="departmentId" required defaultValue="">
              <option value="" disabled>Select a department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength={8} required />
          </div>
          <button className="w-full rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
            Create account
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already registered? <Link href="/login" className="font-semibold text-brand">Log in</Link>
        </p>
      </AuthCard>
    </div>
  );
}
