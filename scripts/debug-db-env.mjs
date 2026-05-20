import fs from 'node:fs';
import dns from 'node:dns/promises';
import net from 'node:net';

const envPath = new URL('../.env', import.meta.url);
if (!fs.existsSync(envPath)) {
  console.log(JSON.stringify({ error: 'api/.env missing' }));
  process.exit(0);
}

const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const env = {};
for (const line of lines) {
  const m = line.match(/^(DATABASE_URL|DIRECT_URL|SUPABASE_URL|NODE_ENV)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[m[1]] = v;
}

function parseDb(key, value) {
  if (!value) return { key, set: false };
  try {
    const u = new URL(value.replace(/^postgresql:/, 'postgres:'));
    return {
      key,
      set: true,
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname.replace(/^\//, ''),
      params: u.search,
      hasUser: Boolean(u.username),
      hasPass: Boolean(u.password),
    };
  } catch (e) {
    return { key, set: true, parseError: e.message };
  }
}

const parsed = {
  nodeEnv: env.NODE_ENV ?? null,
  databaseUrl: parseDb('DATABASE_URL', env.DATABASE_URL),
  directUrl: parseDb('DIRECT_URL', env.DIRECT_URL),
  supabaseUrl: env.SUPABASE_URL
    ? { set: true, host: new URL(env.SUPABASE_URL).hostname }
    : { set: false },
};

console.log('ENV', JSON.stringify(parsed, null, 2));

const hosts = new Set(
  [parsed.databaseUrl.host, parsed.directUrl.host, parsed.supabaseUrl.host].filter(Boolean),
);

for (const host of hosts) {
  try {
    const records = await dns.lookup(host, { all: true });
    console.log('DNS_OK', host, JSON.stringify(records));
  } catch (e) {
    console.log('DNS_FAIL', host, e.code ?? e.message);
  }
}

async function probe(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve({ host, port, ok: true });
    });
    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({ host, port, ok: false, err: 'timeout' });
    });
    socket.on('error', (err) => resolve({ host, port, ok: false, err: err.message }));
  });
}

for (const host of hosts) {
  for (const port of [5432, 6543]) {
    console.log('TCP', JSON.stringify(await probe(host, port)));
  }
}
