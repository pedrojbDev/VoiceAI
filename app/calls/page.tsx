'use client';
import { useEffect, useState } from 'react';
import { Phone, Calendar, Clock, DollarSign, PlayCircle } from 'lucide-react';

export default function CallsHistory() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calls/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCalls(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Histórico de Ligações</h1>
        <p className="text-neutral-400 mt-1">Auditoria financeira e gravações.</p>
      </header>

      {loading ? <div className="text-neutral-500">Carregando...</div> : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 text-sm">
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Duração</th>
                <th className="p-4 font-medium">Custo</th>
                <th className="p-4 font-medium">Gravação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${call.call_status === 'ended' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{call.call_status}</span></td>
                  <td className="p-4 text-neutral-300 text-sm"><div className="flex items-center gap-2"><Calendar size={14}/> {new Date(call.start_timestamp).toLocaleString('pt-BR')}</div></td>
                  <td className="p-4 text-neutral-300 text-sm"><div className="flex items-center gap-2"><Clock size={14}/> {call.duration_seconds}s</div></td>
                  <td className="p-4 text-sm font-mono text-green-400">${Number(call.cost).toFixed(3)}</td>
                  <td className="p-4">
                    {call.recording_url ? <a href={call.recording_url} target="_blank" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"><PlayCircle size={16}/> Ouvir</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {calls.length === 0 && <div className="p-10 text-center text-neutral-500">Nenhuma chamada registrada.</div>}
        </div>
      )}
    </div>
  );
}