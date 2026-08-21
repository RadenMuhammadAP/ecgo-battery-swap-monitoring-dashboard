'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const stateColor: any = {
  FULL: 'bg-green-100 text-green-700 border-green-300',
  CHARGING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  EMPTY: 'bg-gray-100 text-gray-500 border-gray-200',
  LOCKED: 'bg-red-100 text-red-700 border-red-300',
  FAULT: 'bg-red-200 text-red-800 border-red-400'
};

export default function DetailPage({ params }: { params: Promise<{id:string}> }){
  const { id } = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    fetch(`/api/cabinets/${id}`)
    .then(r=>r.json())
    .then(json=>{
        if(!json.success) throw new Error(json.error);
        setData(json.data);
      }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[id]);

  if(loading) return <div className="p-8">Loading detail...</div>;
  if(error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const { cabinet, slots, chart, recent } = data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <Link href="/" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{cabinet.code} - {cabinet.branch}</h1>
        <span className={`px-3 py-1 rounded-full text-sm border font-semibold ${cabinet.status==='ONLINE'?'bg-green-500 text-white':'bg-gray-300'}`}>{cabinet.status}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {slots.map((s:any)=>(
          <div key={s.id} className={`border-2 rounded-xl p-4 shadow-sm ${stateColor[s.state] || 'bg-white'}`}>
            <div className="font-bold text-sm">Slot #{s.position}</div>
            <div className="font-black text-xs mt-1">{s.state}</div>
            <div className="text-2xl font-bold mt-1">{s.soc?? 0}%</div>
            <div className="text- opacity-70 truncate">{s.battery_id || 'EMPTY'}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold mb-4">Swap per jam (24h)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="hour" tickFormatter={(v)=> new Date(v).getHours()+':00'} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip labelFormatter={(v)=> new Date(v).toLocaleString()} />
                <Bar dataKey="count" fill="#000" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-bold mb-4">20 Transaksi Terakhir</h2>
          <div className="overflow-auto max-h-">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white"><tr className="text-left border-b"><th>Waktu</th><th>Out</th><th>In</th><th>SoC</th></tr></thead>
              <tbody>
                {recent.map((t:any)=>(
                  <tr key={t.id} className="border-b hover:bg-gray-50"><td className="py-1.5">{new Date(t.created_at).toLocaleString()}</td><td>{t.battery_out || '-'}</td><td>{t.battery_in || '-'}</td><td className="font-mono">{t.soc_out?? '-'}→{t.soc_in?? '-'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}