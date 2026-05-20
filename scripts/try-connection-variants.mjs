import fs from 'node:fs';

function readDatabaseUrl() {
  const lines = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('DATABASE_URL=')) continue;
    let v = line.slice('DATABASE_URL='.length).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return null;
}

function parseUrl(raw) {
  const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
  return {
    user: u.username,
    pass: u.password,
    db: u.pathname.replace(/^\//, '') || 'postgres',
  };
}

async function tryPrisma(label, url) {
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$connect();
    await client.$queryRaw`SELECT 1 AS ok`;
    await client.$disconnect();
    console.log(label, 'OK');
    return true;
  } catch (e) {
    console.log(label, 'FAIL', (e.message ?? String(e)).slice(0, 160));
    await client.$disconnect().catch(() => {});
    return false;
  }
}

const raw = readDatabaseUrl();
const { user, pass, db } = parseUrl(raw);
const encUser = encodeURIComponent(user);
const encPass = encodeURIComponent(pass);
const v6 = '2600:1f1c:825:9500:2196:58c9:55f3:8607';

const candidates = [
  ['ipv6-literal', `postgresql://${encUser}:${encPass}@[${v6}]:5432/${db}`],
  ['ipv6-hostname', `postgresql://${encUser}:${encPass}@db.glvpyezoszqltppptkht.supabase.co:5432/${db}`],
  ['pooler-aws1-use1-tx', `postgresql://${encodeURIComponent('postgres.glvpyezoszqltppptkht')}:${encPass}@aws-1-us-east-1.pooler.supabase.com:6543/${db}?pgbouncer=true`],
  ['pooler-aws1-use1-session', `postgresql://${encodeURIComponent('postgres.glvpyezoszqltppptkht')}:${encPass}@aws-1-us-east-1.pooler.supabase.com:5432/${db}`],
];

for (const [label, url] of candidates) {
  if (await tryPrisma(label, url)) process.exit(0);
}
console.log('none worked');
