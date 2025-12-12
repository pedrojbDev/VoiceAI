"use client";

import { useEffect, useState } from "react";
import { Phone, Clock, DollarSign, Activity, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_calls: 0,
    total_minutes: 0,
    total_cost: "0.00"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Dados recebidos:", data);
          setStats({
            total_calls: data.total_calls || 0,
            total_minutes: data.total_minutes || 0,
            total_cost: data.total_cost || "0.00"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Componente Card "Hardcoded" para não depender de importação externa
  const SimpleCard = ({ title, icon: Icon, value, subtext, colorClass }: any) => (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-black/40 border-gray-800 p-6">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 mb-2">
        <h3 className="tracking-tight text-sm font-medium text-gray-200">{title}</h3>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
      <div className="text-2xl font-bold text-white">{loading ? "..." : value}</div>
      <p className="text-xs text-muted-foreground text-gray-500 mt-1">{subtext}</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h2>
          <p className="text-muted-foreground text-gray-400">
            Métricas de performance da sua operação de voz em tempo real.
          </p>
        </div>
      </div>

      {/* GRID DE CARDS (Versão Sem Dependências) */}
      <div className="grid gap-4 md:grid-cols-3">
        <SimpleCard 
          title="Total Chamadas" 
          icon={Phone} 
          value={stats.total_calls} 
          subtext="Chamadas processadas"
          colorClass="text-blue-500"
        />
        <SimpleCard 
          title="Minutos Falados" 
          icon={Clock} 
          value={`${stats.total_minutes} min`} 
          subtext="Tempo total de conversação"
          colorClass="text-purple-500"
        />
        <SimpleCard 
          title="Custo Total" 
          icon={DollarSign} 
          value={`$${stats.total_cost}`} 
          subtext="Custo acumulado da operação"
          colorClass="text-green-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-dashed border-gray-800 bg-black/20 p-6 flex flex-col items-center justify-center h-[200px] text-gray-500">
          <Activity className="h-8 w-8 mb-2 opacity-50" />
          <p>Gráfico de evolução semanal em breve.</p>
        </div>

        <div className="col-span-3 rounded-xl border border-gray-800 bg-black/40 text-card-foreground shadow-sm">
          <div className="p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight text-white">Acesso Rápido</h3>
          </div>
          <div className="p-6 grid gap-4">
            <Link href="/agents" className="flex items-center gap-4 p-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <Users className="h-5 w-5 text-blue-500" />
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none text-white">Meus Agentes</p>
                <p className="text-xs text-gray-500">Configure seus robôs</p>
              </div>
            </Link>
            
            <Link href="/appointments" className="flex items-center gap-4 p-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none text-white">Agendamentos</p>
                <p className="text-xs text-gray-500">Ver agenda confirmada</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}