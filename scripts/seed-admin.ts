import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { Pool } from "pg";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const main = async () => {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: requiredEnv("POSTGRES_DATABASE"),
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const loginId = requiredEnv("ADMIN_ROOT_LOGIN_ID");
    const passwordHash = await bcrypt.hash(requiredEnv("ADMIN_ROOT_PASSWORD"), 10);

    const result = await pool.query(
      `INSERT INTO "admin" ("adminId", "loginId", "passwordHash")
       VALUES ($1, $2, $3)
       ON CONFLICT ("loginId") DO NOTHING
       RETURNING "adminId"`,
      [randomUUID(), loginId, passwordHash],
    );

    console.log(result.rowCount ? `seeded root admin: ${loginId}` : `root admin already exists: ${loginId}`);
  } finally {
    await pool.end();
  }
};

void main();
