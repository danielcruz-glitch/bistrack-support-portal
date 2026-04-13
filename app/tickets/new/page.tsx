import { AppShell } from '@/components/AppShell';
import { createTicketAction } from '@/app/actions';
import { getCategories, getDepartments, requireAuth } from '@/lib/data';
import { NewTicketForm } from './ticket-form';

export default async function NewTicketPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const current = await requireAuth();
  const departments = await getDepartments();
  const categories = await getCategories();
  const params = await searchParams;

  return (
    <AppShell role={current.profile?.role} userName={current.profile?.full_name || current.user.email || ''}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Submit a support ticket</h1>
        <p className="mt-1 text-slate-500">Describe the BisTrack or operational issue so support can respond and track billable work.</p>

        {params.error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</div>}

        <NewTicketForm
          action={createTicketAction}
          departments={departments}
          categories={categories}
          defaultDepartmentId={current.profile?.department_id || ''}
        />
      </div>
    </AppShell>
  );
}
