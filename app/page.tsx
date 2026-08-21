'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Cabinet = any;

export default function CabinetListPage(){
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'swap_desc';
  const page = parseInt(searchParams.get('page')||'1');

  const [data,setData] = useState<Cabinet[]>([]);
  const [meta,setMeta] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [inputQ,setInputQ] = useState(q);

  const fetchData = async () => {
    setLoading(true); setError('');
    try{
      const url = `/api/cabinets?q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&page=${page}&limit=10`;
      const res = await fetch(url);
      const json = await res.json();
      if(!json.success) throw new Error(json.error);
      setData(json.data);
      setMeta(json.meta);
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ fetchData(); }, [q,status,sort,page]);
  useEffect(()=>{ setInputQ(q); },[q]);

  const updateParams = (patch:Record<string,string>)=>{
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k,v])=>{
      if(!v) p.delete(k); else p.set(k,v);
    });
    if(patch.q!==undefined || patch.status!==undefined || patch.sort!==undefined) p.set('page','1');
    router.push(`/?${p.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h1 className="text-3xl font-extrabold">🔋 Battery Swap Monitoring</h1>
      <p className="text-gray-500 mt-1">Internal ops dashboard - {meta?.total || 0} cabinets</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap gap-3 bg-white p-4 rounded-xl border">
        <input
          value={inputQ}
          onChange={e=>setInputQ(e.target.value)}
          onKeyDown={e=> e.key==='Enter' && updateParams({q:inputQ})}
          placeholder="Cari kode / cabang..."
          className="border px-3 py-2 rounded-lg w-64"
        />
        <button onClick={()=>updateParams({q:inputQ})} className="bg-black text-white px-4 py-2 rounded-lg">Search</button>
        
        <select value={status} onChange={e=>updateParams({status:e.target.value})} className="border px-3 py-2 rounded-lg">
          <option value="">All Status</option>
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>

        <select value={sort} onChange={e=>updateParams({sort:e.target.value})} className="border px-3 py-2 rounded-lg">
          <option value="swap_desc">Swap Terbanyak</option>
          <option value="swap_asc">Swap Tersedikit</option>
          <option value="code_asc">Kode A-Z</option>
          <option value="heartbeat_desc">Heartbeat Terbaru</option>
        </select>
      </div>

      {/* States */}
      {loading && <div className="mt-8 bg-white p-8 rounded-xl text-center">Loading cabinets... ⏳</div>}
      {error && <div className="mt-8 bg-red-50 border border-red-200 p-8 rounded-xl text-center text-red-600">Error: {error} ❌</div>}
      {!loading && !error && data.length===0 && <div className="mt-8 bg-white p-8 rounded-xl text-center">No cabinets found. Coba ubah filter 🔍</div>}

      {!loading && !error && data.length>0 && (
        <>
        <div className="mt-6 bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr><th className="p-3">Kode</th><th className="p-3">Cabang</th><th className="p-3">Status</th><th className="p-3">Slot</th><th className="p-3">Swap 24h</th><th className="p-3">Last HB</th></tr>
            </thead>
            <tbody>
              {data.map((c:any)=>(
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold"><Link href={`/cabinet/${c.id}`} className="text-blue-600 hover:underline">{c.code}</Link></td>
                  <td className="p-3">{c.branch}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${c.status==='ONLINE'?'bg-green-100 text-green-700':c.status==='OFFLINE'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                  <td className="p-3">{c.full_count}/{c.total_slots}</td>
                  <td className="p-3 font-semibold">{c.swaps_24h}</td>
                  <td className="p-3 text-gray-500 text-xs">{new Date(c.last_heartbeat).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages} - {meta.total} total</div>
          <div className="flex gap-2">
            <button disabled={!meta.hasPrev} onClick={()=>updateParams({page:String(page-1)})} className="px-4 py-2 border rounded-lg disabled:opacity-30 bg-white">Prev</button>
            <button disabled={!meta.hasNext} onClick={()=>updateParams({page:String(page+1)})} className="px-4 py-2 border rounded-lg disabled:opacity-30 bg-white">Next</button>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
