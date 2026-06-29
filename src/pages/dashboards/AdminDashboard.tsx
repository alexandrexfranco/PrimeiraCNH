import { useAppStore } from '../../store/AppContext';
import { Users, Car, CalendarCheck, AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
  const { classes, users, vehicles } = useAppStore();

  const students = users.filter(u => u.role === 'STUDENT');
  const instructors = users.filter(u => u.role === 'INSTRUCTOR');
  
  const completedClasses = classes.filter(c => c.status === 'COMPLETED').length;
  const canceledClasses = classes.filter(c => c.status === 'CANCELED').length;
  const totalClasses = classes.length;

  const cancelRate = totalClasses === 0 ? 0 : Math.round((canceledClasses / totalClasses) * 100);

  const kpis = [
    { label: 'Alunos Ativos', value: students.length, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Instrutores', value: instructors.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Aulas Concluídas', value: completedClasses, icon: CalendarCheck, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Taxa de Cancel.', value: `${cancelRate}%`, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visão Gerencial</h1>
        <p className="text-slate-400 text-sm mt-1">Indicadores e resultados operacionais.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
           const Icon = kpi.icon;
           return (
             <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${kpi.color}`}>
                 <Icon className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</p>
               </div>
             </div>
           )
        })}
      </div>

      <div>
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-bold text-slate-800">Frota (Veículos)</h2>
         </div>
         <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
           {vehicles.map(v => (
             <div key={v.id} className="p-4 flex flex-sm items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                   <Car className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="font-bold text-slate-800 text-sm">{v.model}</p>
                   <p className="text-xs text-slate-500">Placa: {v.plate} • Cat {v.category}</p>
                 </div>
               </div>
               <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-700 rounded text-uppercase">
                 {v.status === 'ACTIVE' ? 'Operacional' : 'Manutenção'}
               </span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
