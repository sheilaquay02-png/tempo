import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../../lib/tempo/google/server';
import { readJsonBody, sanitizePushSendPayload } from '../../../../lib/tempo/validation.js';

export async function POST(request) {
  try {
    rateLimit(request, { key: 'push-send', limit: 30, windowMs: 60_000 });
    const secret = request.headers.get('x-tempo-push-secret');
    if (!process.env.TEMPO_PUSH_SECRET || secret !== process.env.TEMPO_PUSH_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, title, body, url } = sanitizePushSendPayload(await readJsonBody(request));
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:hello@example.com';
    if (!publicKey || !privateKey) return Response.json({ error: 'Missing VAPID keys' }, { status: 500 });
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await admin.from('push_subscriptions').select('endpoint,subscription').eq('user_id', userId);
    if (error) throw error;
    const payload = JSON.stringify({ title, body, url });
    const rows = data || [];
    const results = await Promise.allSettled(rows.map(row => webpush.sendNotification(row.subscription, payload)));
    const invalidEndpoints = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const statusCode = result.reason?.statusCode;
        if (statusCode === 404 || statusCode === 410) invalidEndpoints.push(rows[index].endpoint);
      }
    });
    if (invalidEndpoints.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', invalidEndpoints);
    }
    return Response.json({ ok: true, sent: results.filter(r => r.status === 'fulfilled').length, total: results.length, cleaned: invalidEndpoints.length });
  } catch (err) {
    console.error('Push send failed', err);
    return Response.json({ error: process.env.NODE_ENV === 'production' ? 'Push send failed' : (err?.message || 'Push send failed') }, { status: err?.status || 500 });
  }
}
