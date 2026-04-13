import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Missing auth code.`);
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Authentication failed.')}`);
  }

  const fullName = data.user.user_metadata.full_name || data.user.email;
  const departmentId = data.user.user_metadata.department_id || null;

  await admin.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email,
    full_name: fullName,
    department_id: departmentId,
    role: 'user'
  });

  return NextResponse.redirect(`${origin}/dashboard`);
}
