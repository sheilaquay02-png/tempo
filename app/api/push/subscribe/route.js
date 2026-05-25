import { createClient } from '@supabase/supabase-js';
import { readJsonBody, sanitizePushSubscriptionPayload } from '../../../../lib/tempo/validation.js';

export async function POST(request) {
  try {
    const { subscription, userId } = sanitizePushSubscriptionPayload(await readJsonBody(request));
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!subscription?.endpoint || !userId || !token) {
      return Response.json({ error: 'Missing subscription, userId, or auth token' }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return Response.json({ error: 'Missing Supabase server env vars' }, { status: 500 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || userData?.user?.id !== userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { error } = await admin.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe failed', err);
    return Response.json({ error: process.env.NODE_ENV === 'production' ? 'Push subscribe failed' : (err?.message || 'Push subscribe failed') }, { status: err?.status || 500 });
  }
}
