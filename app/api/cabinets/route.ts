import { sql } from '@/lib/db';
import { cabinetsQuerySchema, errorResponse } from '@/lib/validators';

export async function GET(req: Request){
  try {
    const url = new URL(req.url);
    const parsed = cabinetsQuerySchema.safeParse({
      q: url.searchParams.get('q') || undefined,
      status: url.searchParams.get('status') || undefined,
      sort: url.searchParams.get('sort') || 'swap_desc',
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '10',
    });
    if(!parsed.success){
      return errorResponse('Invalid query params', 400, parsed.error.flatten());
    }
    const { q, status, sort, page, limit } = parsed.data;

    // Build where clause - server side filtering, no N+1
    const conditions:string[] = [];
    if(q){
      const safeQ = q.replace(/'/g,"''");
      conditions.push(`(c.code ILIKE '%${safeQ}%' OR c.branch ILIKE '%${safeQ}%')`);
    }
    if(status){
      conditions.push(`c.status = '${status}'`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap: Record<string,string> = {
      swap_desc: 'swaps_24h DESC',
      swap_asc: 'swaps_24h ASC',
      code_asc: 'c.code ASC',
      code_desc: 'c.code DESC',
      heartbeat_desc: 'c.last_heartbeat DESC',
    };
    const orderBy = sortMap[sort] || sortMap.swap_desc;

    const offset = (page-1)*limit;

    // Main query - aggregated in DB, not in JS
    const dataQuery = `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM slots s WHERE s.cabinet_id=c.id AND s.state='FULL') as full_count,
        (SELECT COUNT(*)::int FROM slots s WHERE s.cabinet_id=c.id) as total_slots,
        (SELECT COUNT(*)::int FROM transactions t WHERE t.cabinet_id=c.id AND t.created_at > now() - interval '24 hours') as swaps_24h
      FROM cabinets c
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `SELECT COUNT(*)::int as total FROM cabinets c ${where}`;

    const [data, countResult] = await Promise.all([
      sql.query(dataQuery),
      sql.query(countQuery)
    ]) as any[];

    const total = countResult[0]?.total || 0;

    return Response.json({
      success:true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total/limit),
        hasNext: page*limit < total,
        hasPrev: page>1
      }
    });
  } catch(e:any){
    console.error(e);
    return errorResponse('Internal server error', 500);
  }
}
