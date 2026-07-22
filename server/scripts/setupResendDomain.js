/**
 * Configure Resend for mnoonx.fun:
 * - fetch/create domain in Resend
 * - add DNS records at reg.ru (if REG_RU_USERNAME + REG_RU_PASSWORD in .env)
 * - trigger verification and optionally send a test email
 *
 * Usage:
 *   node scripts/setupResendDomain.js
 *   node scripts/setupResendDomain.js --verify-only
 *   node scripts/setupResendDomain.js --test=wotbmadgamesexe@gmail.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const DOMAIN = (process.env.RESEND_DOMAIN || 'mnoonx.fun').trim().toLowerCase();
const API_KEY = process.env.RESEND_API_KEY;
const REG_RU_USER = process.env.REG_RU_USERNAME?.trim();
const REG_RU_PASS = process.env.REG_RU_PASSWORD?.trim();
const VERIFY_ONLY = process.argv.includes('--verify-only');
const TEST_EMAIL = process.argv.find((a) => a.startsWith('--test='))?.split('=')[1]?.trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function resend(path, options = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Resend ${path} → ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function regRuCall(method, params) {
  const body = new URLSearchParams({
    username: REG_RU_USER,
    password: REG_RU_PASS,
    output_content_type: 'json',
    ...params,
  });
  const res = await fetch(`https://api.reg.ru/api/regru2/zone/${method}`, {
    method: 'POST',
    body,
  });
  const data = await res.json();
  const answer = data?.answer?.domains?.[0];
  if (!answer || answer.result === 'error') {
    const code = answer?.error_code || 'unknown';
    const text = answer?.error_text || JSON.stringify(data);
    throw new Error(`reg.ru ${method} → ${code}: ${text}`);
  }
  return answer;
}

async function regRuAddTxt(subdomain, text) {
  return regRuCall('add_txt', {
    dname: DOMAIN,
    subdomain,
    text,
  });
}

async function regRuAddRecord(subdomain, recordType, content, priority) {
  const params = {
    dname: DOMAIN,
    subdomain,
    record_type: recordType,
    content,
  };
  if (priority != null) params.priority = String(priority);
  return regRuCall('add_record', params);
}

async function ensureResendDomain() {
  const list = await resend('/domains');
  let domain = list.data?.find((d) => d.name === DOMAIN);
  if (!domain) {
    console.log(`Creating Resend domain ${DOMAIN}…`);
    domain = await resend('/domains', {
      method: 'POST',
      body: JSON.stringify({ name: DOMAIN, region: 'eu-west-1' }),
    });
  }
  return resend(`/domains/${domain.id}`);
}

async function syncDnsRecords(records) {
  if (!REG_RU_USER || !REG_RU_PASS) {
    console.log('\n⚠ REG_RU_USERNAME / REG_RU_PASSWORD not set — skipping DNS automation.');
    printManualRecords(records);
    return false;
  }

  console.log('\nAdding DNS records at reg.ru…');
  for (const rec of records) {
    const name = rec.name === DOMAIN ? '@' : rec.name.replace(`.${DOMAIN}`, '');
    if (rec.type === 'TXT') {
      console.log(`  TXT  ${name}`);
      await regRuAddTxt(name, rec.value);
    } else if (rec.type === 'MX') {
      console.log(`  MX   ${name} → ${rec.value}`);
      await regRuAddRecord(name, 'MX', rec.value, rec.priority ?? 10);
    } else {
      console.log(`  Skip unsupported ${rec.type} ${name}`);
    }
  }
  console.log('DNS records submitted. Waiting 30s for propagation…');
  await sleep(30_000);
  return true;
}

function printManualRecords(records) {
  console.log('\nAdd these records in reg.ru → DNS for mnoonx.fun:\n');
  for (const rec of records) {
    const host = rec.name === DOMAIN ? '@' : rec.name.replace(`.${DOMAIN}`, '');
    if (rec.type === 'TXT') {
      console.log(`  TXT  ${host}  →  ${rec.value}`);
    } else if (rec.type === 'MX') {
      console.log(`  MX   ${host}  →  ${rec.value}  (priority ${rec.priority ?? 10})`);
    }
  }
  console.log('');
}

async function verifyDomain(domainId, attempts = 6) {
  for (let i = 1; i <= attempts; i += 1) {
    await resend(`/domains/${domainId}/verify`, { method: 'POST', body: '{}' });
    await sleep(i === 1 ? 5_000 : 15_000);
    const domain = await resend(`/domains/${domainId}`);
    console.log(`Verification attempt ${i}/${attempts}: status = ${domain.status}`);
    if (domain.status === 'verified') return domain;
  }
  return resend(`/domains/${domainId}`);
}

async function sendTestEmail() {
  if (!TEST_EMAIL) return;
  const from = process.env.RESEND_FROM || `MNOONX <noreply@${DOMAIN}>`;
  const result = await resend('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from,
      to: [TEST_EMAIL],
      subject: 'MNOONX — test email',
      html: '<p>Resend is configured for <strong>mnoonx.fun</strong>.</p>',
    }),
  });
  console.log('Test email queued:', result.id || result);
}

async function main() {
  if (!API_KEY) {
    console.error('RESEND_API_KEY is missing in server/.env');
    process.exit(1);
  }

  console.log(`Resend setup for ${DOMAIN}`);
  const domain = await ensureResendDomain();
  console.log(`Domain id: ${domain.id}, status: ${domain.status}`);

  if (!VERIFY_ONLY && domain.status !== 'verified') {
    await syncDnsRecords(domain.records || []);
  }

  if (domain.status !== 'verified') {
    const updated = await verifyDomain(domain.id);
    if (updated.status !== 'verified') {
      printManualRecords(updated.records || domain.records || []);
      console.log('Domain not verified yet. DNS can take up to 72h; re-run: npm run setup:resend');
      process.exitCode = 1;
      return;
    }
  }

  console.log('\n✓ Domain verified — emails can be sent from noreply@mnoonx.fun');
  await sendTestEmail();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
