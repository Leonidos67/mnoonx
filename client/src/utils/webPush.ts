import { API_BASE } from '../config/api';

const PUSH_API = `${API_BASE}/push`;

export type PushSubscribeErrorCode =
  | 'not_signed_in'
  | 'unsupported'
  | 'api_unreachable'
  | 'server_not_configured'
  | 'permission_denied'
  | 'sw_unavailable'
  | 'push_service_blocked'
  | 'invalid_subscription'
  | 'save_failed';

export type PushSubscribeResult =
  | { ok: true }
  | { ok: false; code: PushSubscribeErrorCode; detail?: string };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function classifySubscribeError(err: unknown): PushSubscribeErrorCode {
  const name = err instanceof DOMException ? err.name : '';
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (name === 'AbortError' || lower.includes('push service error')) {
    return 'push_service_blocked';
  }
  if (name === 'NotAllowedError' || lower.includes('permission')) {
    return 'permission_denied';
  }
  return 'push_service_blocked';
}

async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function isServiceWorkerScriptAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${window.location.origin}/sw.js`, { cache: 'no-store' });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('javascript') || contentType.includes('ecmascript')) return true;
    const snippet = (await res.text()).trimStart().slice(0, 32);
    return !snippet.startsWith('<') && snippet.includes('addEventListener');
  } catch {
    return false;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  const scriptOk = await isServiceWorkerScriptAvailable();
  if (!scriptOk) {
    console.warn('[push] /sw.js is missing or not served as JavaScript');
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[push] Service worker registration failed', err);
    return null;
  }
}

export async function getPushPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function subscribeToPush(token: string): Promise<PushSubscribeResult> {
  if (!token) return { ok: false, code: 'not_signed_in' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, code: 'unsupported' };
  }

  if (!window.isSecureContext) {
    return { ok: false, code: 'unsupported', detail: 'HTTPS required' };
  }

  let vapidRes: Response;
  try {
    vapidRes = await fetch(`${PUSH_API}/vapid-public-key`, { cache: 'no-store' });
  } catch {
    return { ok: false, code: 'api_unreachable' };
  }

  const vapid = await parseJsonResponse<{ publicKey?: string; available?: boolean }>(vapidRes);
  if (!vapidRes.ok || !vapid?.publicKey) {
    return { ok: false, code: 'server_not_configured' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, code: 'permission_denied' };

  const reg = (await navigator.serviceWorker.getRegistration('/')) || (await registerServiceWorker());
  if (!reg) {
    return { ok: false, code: 'sw_unavailable' };
  }

  await navigator.serviceWorker.ready;

  // Drop stale subscription (e.g. after VAPID key rotation) before creating a new one
  const stale = await reg.pushManager.getSubscription();
  if (stale) {
    try {
      await stale.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    });
  } catch (err) {
    console.error('[push] subscribe failed', err);
    return { ok: false, code: classifySubscribeError(err), detail: err instanceof Error ? err.message : undefined };
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, code: 'invalid_subscription' };
  }

  let res: Response;
  try {
    res = await fetch(`${PUSH_API}/subscribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    await sub.unsubscribe().catch(() => {});
    return { ok: false, code: 'save_failed' };
  }

  if (!res.ok) {
    await sub.unsubscribe().catch(() => {});
    return { ok: false, code: 'save_failed' };
  }

  return { ok: true };
}

export async function unsubscribeFromPush(token: string): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub && token) {
    await fetch(`${PUSH_API}/subscribe`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
}

export async function sendTestPush(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${PUSH_API}/test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: 'Test notification from MNOONX' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
