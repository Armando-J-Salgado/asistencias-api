INSERT INTO "users" (
    "id",
    "name",
    "lastname",
    "password_hash",
    "email",
    "active_token",
    "is_active",
    "is_admin",
    "created_at",
    "updated_at",
    "deleted_at"
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Admin',
    'User',
    '$argon2id$v=19$m=65536,t=3,p=4$6qKEeXiq3v7CmRAzjuIcWQ$Z/KKvVsR5bHjqXNcBFEbOwZhbHNwmE8Ff5J0o8ABUck',
    'admin@example.com',
    NULL,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL
) ON CONFLICT ("email") DO UPDATE SET
    "password_hash" = EXCLUDED."password_hash",
    "name" = EXCLUDED."name",
    "lastname" = EXCLUDED."lastname",
    "active_token" = NULL,
    "is_active" = TRUE,
    "is_admin" = TRUE,
    "deleted_at" = NULL,
    "updated_at" = CURRENT_TIMESTAMP;