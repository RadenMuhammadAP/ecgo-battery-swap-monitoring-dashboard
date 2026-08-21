import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

async function main(){
  const sql = neon(process.env.DATABASE_URL!);
  const schema = fs.readFileSync(path.join(process.cwd(), 'lib', 'schema.sql'), 'utf-8');
  console.log('Running schema.sql...');

  const statements = schema.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    console.log('> exec:', stmt.slice(0,60)+'...');
    await sql.query(stmt);
  }

  console.log('DB init done ✅');
}
main().catch(e=>{ console.error(e); process.exit(1); });