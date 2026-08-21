import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

const idParamSchema = z.object({ id: z.string().uuid() });

export async function GET(_:Request, {params}:{params:Promise<{id:string}>}){
  try{
    const { id: rawId } = await params;
    const parsed = idParamSchema.safeParse({ id: rawId });
    if(!parsed.success) return Response.json({ success:false, error:'Invalid id' }, { status: 400 });

    const id = parsed.data.id;
    const sql = neon(process.env.DATABASE_URL!);

    const cabinets = await sql`SELECT * FROM cabinets WHERE id=${id} LIMIT 1`;
    if(cabinets.length===0) return Response.json({ success:false, error:'Not found' }, { status: 404 });
    const cabinet = cabinets[0];

    // di schema.sql: position bukan slot_number
    const slots = await sql`SELECT * FROM slots WHERE cabinet_id=${id} ORDER BY position ASC`;
    
    // di schema.sql: created_at bukan swapped_at
    const chart = await sql`
      SELECT date_trunc('hour', created_at) as hour, COUNT(*)::int as count
      FROM transactions 
      WHERE cabinet_id=${id} AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1 ORDER BY 1
    `;

    const recent = await sql`SELECT * FROM transactions WHERE cabinet_id=${id} ORDER BY created_at DESC LIMIT 20`;

    return Response.json({ success:true, data:{ cabinet, slots, chart, recent } });
  }catch(e:any){
    console.error(e);
    return Response.json({ success:false, error:e.message }, { status: 500 });
  }
}