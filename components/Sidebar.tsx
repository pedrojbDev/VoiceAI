'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Phone, CalendarCheck, Settings, LogOut } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Meus Agentes', icon: Users, path: '/agents' },
  { name: 'Agendamentos', icon: CalendarCheck, path: '/appointments' },
  { name: 'Histórico Calls', icon: Phone, path: '/calls' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 h-screen flex flex-col fixed left-0 top-0">
      
      {/* Logo da Empresa */}
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-white tracking-tighter">
          Voice<span className="text-blue-500">AI</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">SaaS White Label Admin</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-4 border-t border-neutral-800">
        <button className="flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-red-400 w-full transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}