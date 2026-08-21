import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const BRANCHES = [
  'Jakarta Selatan','Jakarta Pusat','Jakarta Barat','Jakarta Utara','Jakarta Timur',
  'Bandung','Bekasi','Depok','Tangerang','Surabaya',
  'Bali Denpasar','Bali Ubud','Yogyakarta','Semarang','Medan'
];
const STATUSES = ['ONLINE','OFFLINE','MAINTENANCE'] as const;
const SLOT_STATES = ['EMPTY','CHARGING','FULL','LOCKED','FAULT'] as const;

function randomInt(min:number,max:number){ return Math.floor(Math.random()*(max-min+1))+min; }

async function main(){
  console.log('Seeding 50 cabinets, 600 slots, 20000 transactions...');
  console.time('seed');

  // Clear in order
  await sql.query(`delete from transactions`);
  await sql.query(`delete from slots`);
  await sql.query(`delete from cabinets`);

  const cabinetIds:string[] = [];
  for(let i=1;i<=50;i++){
    const code = `CB-${String(i).padStart(3,'0')}`;
    const branch = BRANCHES[i % BRANCHES.length];
    const statusRoll = Math.random();
    const status = statusRoll < 0.75 ? 'ONLINE' : statusRoll < 0.9 ? 'OFFLINE' : 'MAINTENANCE';
    const lastHeartbeat = `now() - interval '${randomInt(0,120)} minutes'`;
    const rows:any = await sql.query(`insert into cabinets (code, branch, status, last_heartbeat) values ('${code}','${branch}','${status}', ${lastHeartbeat}) returning id`);
    cabinetIds.push(rows[0].id);
  }

  // 600 slots (12 per cabinet)
  for(const cabId of cabinetIds){
    for(let pos=1;pos<=12;pos++){
      const r = Math.random();
      let state: typeof SLOT_STATES[number] = 'FULL';
      if(r < 0.1) state='EMPTY';
      else if(r < 0.35) state='CHARGING';
      else if(r < 0.75) state='FULL';
      else if(r < 0.9) state='LOCKED';
      else state='FAULT';

      let soc = 0;
      if(state==='EMPTY') soc=0;
      else if(state==='CHARGING') soc=randomInt(5,85);
      else if(state==='FULL') soc=randomInt(90,100);
      else if(state==='LOCKED') soc=randomInt(0,100);
      else soc=randomInt(0,30);

      const batteryId = state==='EMPTY' ? 'NULL' : `'BAT-${randomInt(10000,99999)}'`;
      await sql.query(`insert into slots (cabinet_id, position, state, soc, battery_id) values ('${cabId}', ${pos}, '${state}', ${soc}, ${batteryId})`);
    }
  }

  // 20000 transactions realistic over 30 days
  console.log('Generating 20000 transactions... this will take ~20 sec');
  const batchSize = 1000;
  for(let batch=0; batch<20000/batchSize; batch++){
    const values:string[] = [];
    for(let j=0;j<batchSize;j++){
      const cabId = cabinetIds[randomInt(0,cabinetIds.length-1)];
      // realistic: more swaps in daytime 8am-8pm
      const daysAgo = Math.random()*30;
      const hourBias = Math.random() < 0.7 ? randomInt(8,20) : randomInt(0,23);
      values.push(`('${cabId}', now() - interval '${daysAgo} days ${randomInt(0,59)} minutes' + interval '${hourBias} hours' - interval '${new Date().getHours()} hours')`);
    }
    await sql.query(`insert into transactions (cabinet_id, created_at) values ${values.join(',')}`);
  }

  const stats:any = await sql.query(`
    select 
      (select count(*) from cabinets) as cabinets,
      (select count(*) from slots) as slots,
      (select count(*) from transactions) as transactions
  `);
  console.table(stats);
  console.timeEnd('seed');
  console.log('Seed done ✅');
}
main().catch(e=>{ console.error(e); process.exit(1); });
