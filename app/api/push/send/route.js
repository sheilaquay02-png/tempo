import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const secret = request.headers.get('x-tempo-push-secret');
    if (!process.env.TEMPO_PUSH_SECRET || secret !== process.env.TEMPO_PUSH_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, title = 'Tempo reminder 🌸', body = 'Open Tempo to check your day.', url = '/' } = await request.json();
    if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:hello@example.com';
    if (!publicKey || !privateKey) return Response.json({ error: 'Missing VAPID keys' }, { status: 500 });
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await admin.from('push_subscriptions').select('endpoint,subscription').eq('user_id', userId);
    if (error) throw error;
    const payload = JSON.stringify({ title, body, url });
    const results = await Promise.allSettled((data || []).map(row => webpush.sendNotification(row.subscription, payload)));
    return Response.json({ ok: true, sent: results.filter(r => r.status === 'fulfilled').length, total: results.length });
  } catch (err) {
    console.error('Push send failed', err);
    return Response.json({ error: err?.message || 'Push send failed' }, { status: 500 });
  }
}
