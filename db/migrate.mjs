/**
 * Ejecutar: node db/migrate.mjs
 * Aplica el schema.sql a Neon PostgreSQL via HTTP (sin ws)
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_RKTl6ejZ0kWJ@ep-fragrant-cherry-ai3rgh5h-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

// Filtrar comentarios de bloque y línea, luego dividir por ;
const cleaned = schema
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");

const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 5);

console.log(`🚀 Ejecutando ${statements.length} sentencias SQL...\n`);

for (const stmt of statements) {
  try {
    await sql([stmt]);
    console.log(`✅ ${stmt.substring(0, 70).replace(/\n/g, " ")}`);
  } catch (err) {
    const preview = stmt.substring(0, 70).replace(/\n/g, " ");
    if (
      err.message.includes("already exists") ||
      err.message.includes("duplicate")
    ) {
      console.log(`⏭️  Ya existe: ${preview}`);
    } else {
      console.log(`⚠️  ${preview}`);
      console.log(`   → ${err.message}`);
    }
  }
}

console.log("\n✨ Migración completada!");
