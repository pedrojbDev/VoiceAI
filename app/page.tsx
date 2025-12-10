'use client';
import { useState, useEffect } from 'react';
import { Activity, DollarSign, Clock, Phone } from 'lucide-react';

interface Stats {
  totalCalls: number;
  totalCost: string;
  totalMinutes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalCalls: 0, totalCost: '0.00', totalMinutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.totalCalls !== undefined) setStats(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 pb-6 border-b border-neutral-800">
        <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
        <p className="text-neutral-400 mt-1">Métricas de performance da sua operação de voz</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Chamadas */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm hover:border-blue-900/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-900/20 rounded-lg text-blue-500"><Phone size={24} /></div>
            <p className="text-neutral-400 font-medium">Total Chamadas</p>
          </div>
          <h2 className="text-4xl font-bold text-white">{loading ? '...' : stats.totalCalls}</h2>
        </div>

        {/* Card Minutos */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm hover:border-purple-900/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-900/20 rounded-lg text-purple-500"><Clock size={24} /></div>
            <p className="text-neutral-400 font-medium">Minutos Falados</p>
          </div>
          <h2 className="text-4xl font-bold text-white">{loading ? '...' : stats.totalMinutes}<span className="text-lg text-neutral-500 ml-1">min</span></h2>
        </div>

        {/* Card Custo */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm hover:border-green-900/50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-900/20 rounded-lg text-green-500"><DollarSign size={24} /></div>
            <p className="text-neutral-400 font-medium">Custo Total</p>
          </div>
          <h2 className="text-4xl font-bold text-green-400">{loading ? '...' : `$${stats.totalCost}`}</h2>
        </div>
      </div>

      {/* Espaço para gráficos futuros */}
      <div className="mt-8 p-10 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30 text-center text-neutral-500">
        <Activity className="mx-auto mb-2 opacity-50" />
        <p>Gráficos detalhados de evolução serão exibidos aqui em breve.</p>
      </div>
    </div>
  );
}