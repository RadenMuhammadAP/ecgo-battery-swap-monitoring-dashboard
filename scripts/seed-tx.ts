import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

async function main(){
  console.log('Seeding transactions...');
  const cabinets:any = await sql.query(`select id, code from cabinets`);

  // bikin 80 transaksi random dalam 24 jam terakhir
  for(let i=0;i<80;i++){
    const cab = cabinets[Math.floor(Math.random()*cabinets.length)];
    const hoursAgo = Math.random()*24;
    await sql.query(`
      insert into transactions (cabinet_id, created_at) 
      values ('${cab.id}', now() - interval '${hoursAgo} hours')
    `);
  }

  // kalo schema lu punya kolom type / status, uncomment ini:
  // await sql.query(`update transactions set type='SWAP' where type is null`);

  console.log('Transactions seeded ✅ 80 rows');
  const stats:any = await sql.query(`
    select c.code, count(t.id) as swaps_24h 
    from cabinets c left join transactions t on t.cabinet_id=c.id and t.created_at > now() - interval '24 hours'
    group by c.code order by c.code
  `);
  console.table(stats);
}
main().catch(console.error);