'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, User, Phone, CheckCircle, Clock } from 'lucide-react';

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    
    // Auto-refresh a cada 5 segundos para ver chegar em tempo real
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAppointments(data);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 border-b border-neutral-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agenda de Consultas</h1>
          <p className="text-neutral-400 mt-1">Agendamentos realizados pela IA em tempo real</p>
        </div>
        <div className="bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
          <span className="text-2xl font-bold text-blue-500">{appointments.length}</span>
          <span className="text-xs text-neutral-500 ml-2 uppercase font-bold">Total</span>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-neutral-500">Carregando agenda...</div>
      ) : (
        <div className="grid gap-4">
          {appointments.length === 0 && (
            <div className="text-center py-20 text-neutral-600 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-800">
              Nenhum agendamento encontrado ainda.
            </div>
          )}

          {appointments.map((app) => (
            <div key={app.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:border-neutral-700 transition-colors">
              
              <div className="flex gap-4 items-center mb-4 md:mb-0">
                <div className="bg-green-900/20 p-3 rounded-full text-green-500">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <User size={16} className="text-neutral-500" />
                    {app.customer_name}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-white font-medium">{app.appointment_time}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-xs bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-full text-neutral-400 flex items-center gap-2">
                  <Phone size={12} />
                  {app.customer_phone || "Web Call"}
                </span>
                <span className="text-xs text-neutral-600 flex items-center gap-1">
                  <Clock size={10} />
                  Agendado em: {new Date(app.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}