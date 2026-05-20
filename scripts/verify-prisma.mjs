import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();
try {
  await client.$connect();
  await client.$queryRaw`SELECT 1 AS ok`;
  console.log('PRISMA_OK');
} catch (e) {
  console.log('PRISMA_FAIL', e.message);
  process.exitCode = 1;
} finally {
  await client.$disconnect().catch(() => {});
}
