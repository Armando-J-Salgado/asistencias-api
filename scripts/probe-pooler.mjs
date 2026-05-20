import fs from 'node:fs';
import dns from 'node:dns/promises';
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
  return { user: u.username, pass: u.password, db: u.pathname.replace(/^\//, '') || 'postgres' };
}

async function dnsOk(host) {
  try {
    const v4 = await dns.resolve4(host).catch(() => []);
    const v6 = await dns.resolve6(host).catch(() => []);
    return { host, v4, v6, ok: v4.length + v6.length > 0 };
  } catch {
    return { host, v4: [], v6: [], ok: false };
  }
}

async function tcpOk(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

const dbUrl = readEnv();
if (!dbUrl) {
  console.log('NO_DATABASE_URL');
  process.exit(1);
}
const creds = parseUrl(dbUrl);

console.log('IPv6 direct probe');
const v6 = await dns.resolve6(`db.${ref}.supabase.co`).catch(() => []);
console.log('AAAA', v6[0] ?? 'none');
if (v6[0]) console.log('TCPv6', await tcpOk(v6[0], 5432));

console.log('Pooler DNS scan');
for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const d = await dnsOk(host);
  if (!d.ok) continue;
  const p5432 = await tcpOk(host, 5432);
  const p6543 = await tcpOk(host, 6543);
  console.log(JSON.stringify({ region, host, v4: d.v4[0], p5432, p6543 }));
}
