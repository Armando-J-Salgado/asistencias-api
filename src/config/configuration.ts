export default () => {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  return {
  port,
  apiPublicUrl:
    process.env.API_PUBLIC_URL?.replace(/\/$/, '') ??
    `http://localhost:${port}`,
  webOrigins: (process.env.WEB_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  webPublicUrl: process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  jwtScanSecret: process.env.JWT_SCAN_SECRET ?? '',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseStudentPhotosBucket:
    process.env.SUPABASE_STUDENT_PHOTOS_BUCKET ?? 'student-photos',
  throttle: {
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '15', 10),
    authTtl: parseInt(process.env.AUTH_THROTTLE_TTL_SECONDS ?? '60', 10),
  },
  studentImportDefaultPassword: process.env.STUDENT_IMPORT_DEFAULT_PASSWORD ?? '',
  mailer: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'no-reply@localhost',
  },
};
};
