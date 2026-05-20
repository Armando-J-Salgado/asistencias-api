import fs from 'node:fs';

const ref = 'glvpyezoszqltppptkht';
const host = 'aws-1-us-west-1.pooler.supabase.com';
const rawLine = fs
  .readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .find((l) => l.startsWith('DATABASE_URL='));

let raw = rawLine.slice('DATABASE_URL='.length).trim();
if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
  raw = raw.slice(1, -1);
}

const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
const passFromUrl = u.password;

const passVariants = [
  ['url-parser', passFromUrl],
  ['before-first-at', raw.split('@')[0].split(':').slice(2).join(':')],
  ['manual-full', 'Emprendimiento2026@ESEN'],
  ['manual-no-at', 'Emprendimiento2026'],
];

async function tryConnect(label, pass, port, qs) {
  const user = encodeURIComponent(`postgres.${ref}`);
  const encPass = encodeURIComponent(pass);
  const url = `postgresql://${user}:${encPass}@${host}:${port}/postgres${qs}`;
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$connect();
    await client.$queryRaw`SELECT 1 AS ok`;
    await client.$disconnect();
    console.log('OK', JSON.stringify({ label, port, passLen: pass.length }));
    return true;
  } catch (e) {
    console.log('FAIL', JSON.stringify({ label, port, passLen: pass.length, err: (e.message ?? '').slice(0, 100) }));
    await client.$disconnect().catch(() => {});
    return false;
  }
}

console.log('parsed password length', passFromUrl.length);
for (const [label, pass] of passVariants) {
  for (const [port, qs] of [[6543, '?pgbouncer=true'], [5432, '']]) {
    if (await tryConnect(label, pass, port, qs)) process.exit(0);
  }
}
