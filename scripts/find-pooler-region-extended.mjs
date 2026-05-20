import fs from 'node:fs';

const ref = 'glvpyezoszqltppptkht';
const regions = [
  'us-east-1','us-east-2','us-west-1','us-west-2','ca-central-1',
  'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-central-2','eu-north-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','ap-south-1',
  'sa-east-1','af-south-1','me-south-1',
];
const prefixes = ['aws-0', 'aws-1'];

function readPass() {
  const lines = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('DATABASE_URL=')) continue;
    let v = line.slice('DATABASE_URL='.length).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const u = new URL(v.replace(/^postgresql:/, 'postgres:'));
    return u.password;
  }
  throw new Error('missing DATABASE_URL');
}

async function tryPrisma(url) {
  const { PrismaClient } = await import('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$connect();
    await client.$queryRaw`SELECT 1 AS ok`;
    await client.$disconnect();
    return 'connected';
  } catch (e) {
    await client.$disconnect().catch(() => {});
    const msg = e.message ?? String(e);
    if (msg.includes("Can't reach database server")) return 'unreachable';
    if (msg.includes('Tenant or user not found')) return 'tenant-not-found';
    if (msg.includes('password authentication failed')) return 'bad-password';
    if (msg.includes('ENOTFOUND')) return 'tenant-not-found';
    return msg.slice(0, 80);
  }
}

const pass = encodeURIComponent(readPass());
const user = encodeURIComponent(`postgres.${ref}`);

for (const prefix of prefixes) {
  for (const region of regions) {
    for (const [port, qs] of [[6543, '?pgbouncer=true'], [5432, '']]) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const url = `postgresql://${user}:${pass}@${host}:${port}/postgres${qs}`;
      const result = await tryPrisma(url);
      if (result === 'connected') {
        console.log('WINNER', JSON.stringify({ prefix, region, port }));
        process.exit(0);
      }
      if (result !== 'unreachable' && result !== 'tenant-not-found') {
        console.log('NOTE', JSON.stringify({ prefix, region, port, result }));
      }
    }
  }
}
console.log('exhausted regions');
