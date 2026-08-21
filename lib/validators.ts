import { z } from 'zod';

export const cabinetsQuerySchema = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(['ONLINE','OFFLINE','MAINTENANCE']).optional(),
  sort: z.enum(['swap_asc','swap_desc','code_asc','code_desc','heartbeat_desc']).default('swap_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export function errorResponse(message:string, status=400, details?:any){
  return Response.json({ success:false, error:message, details }, { status });
}
