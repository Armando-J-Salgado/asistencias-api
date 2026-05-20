import fs from 'node:fs';
import net from 'node:net';

const ref = 'glvpyezoszqltppptkht';
const regions = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'sa-east-1',
];

function readEnv() {
  const lines = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^(DATABASE_URL)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function parseUrl(raw) {
  const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
  return { pass: u.password, db: u.pathname.replace(/^\//, '') || 'postgres' };
}

function buildPoolerUrl(region, pass, db, port, pgbouncer) {
  const user = encodeURIComponent(`postgres.${ref}`);
  const encodedPass = encodeURIComponent(pass);
  const qs = pgbouncer ? '?pgbouncer=true' : '';
  return `postgresql://${user}:${encodedPass}@aws-0-${region}.pooler.supabase.com:${port}/${db}${qs}`;
}

async function tryPrisma(url) {
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$connect();
    await client.$queryRaw`SELECT 1 AS ok`;
    await client.$disconnect();
    return true;
  } catch (e) {
    await client.$disconnect().catch(() => {});
    return e?.message?.slice(0, 120) ?? 'failed';
  }
}

const env = readEnv();
const { pass, db } = parseUrl(env.DATABASE_URL);

console.log('Testing pooler regions with Prisma (no secrets logged)...');
for (const region of regions) {
  for (const mode of [
    { port: 6543, pgbouncer: true, label: 'tx' },
    { port: 5432, pgbouncer: false, label: 'session' },
  ]) {
    const url = buildPoolerUrl(region, pass, db, mode.port, mode.pgbouncer);
    const result = await tryPrisma(url);
    console.log(JSON.stringify({ region, mode: mode.label, ok: result === true, detail: result === true ? 'connected' : result }));
    if (result === true) {
      console.log('WINNER', JSON.stringify({ region, port: mode.port, pgbouncer: mode.pgbouncer }));
      process.exit(0);
    }
  }
}
console.log('No working pooler region found');
