import { createAdminClient } from "@/lib/supabase/admin";
import WorkLogForm from "./work-log-form";

export const dynamic = "force-dynamic";

export default async function WorkLogsPage() {
  const supabase = createAdminClient();

  const [{ data: workLogs, error: logsError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase
        .from("work_logs")
        .select(`
          id,
          work_date,
          hours,
          rate,
          description,
          billed,
          created_at
        `)
        .order("work_date", { ascending: false }),

      supabase
        .from("profiles")
        .select("id, full_name, email, hourly_rate, role")
        .eq("is_active", true)
        .is("deleted_at", null)
        .in("role", ["support", "admin"])
        .order("full_name", { ascending: true }),
    ]);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Work Logs</h1>

        {usersError ? (
          <p className="text-red-600">Failed to load support staff: {usersError.message}</p>
        ) : (
          <WorkLogForm users={users ?? []} />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Log History</h2>

        {logsError ? (
          <p className="text-red-600">{logsError.message}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Hours</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Line Total</th>
                  <th className="p-3 text-left">Billed</th>
                </tr>
              </thead>
              <tbody>
                {(workLogs ?? []).map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-3">{log.work_date}</td>
                    <td className="p-3">{log.description}</td>
                    <td className="p-3">{Number(log.hours).toFixed(2)}</td>
                    <td className="p-3">${Number(log.rate).toFixed(2)}</td>
                    <td className="p-3 font-medium">
                      ${(Number(log.hours) * Number(log.rate)).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          log.billed
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {log.billed ? "Billed" : "Unbilled"}
                      </span>
                    </td>
                  </tr>
                ))}

                {(workLogs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No work logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}