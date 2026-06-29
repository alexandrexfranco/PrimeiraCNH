import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Car } from 'lucide-react';

export function ScheduleClass() {
  const { id } = useParams();
  const { users, vehicles, classes, addClass, updateClass, currentUser } = useAppStore();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [error, setError] = useState('');

  const students = users.filter(u => u.role === 'STUDENT' && (u.status !== 'BLOCKED' || u.id === studentId));
  const instructors = users.filter(u => u.role === 'INSTRUCTOR' && (u.status !== 'BLOCKED' || u.id === instructorId));

  useEffect(() => {
    if (id) {
      const existingClass = classes.find(c => c.id === id);
      if (existingClass) {
        setStudentId(existingClass.studentId);
        setInstructorId(existingClass.instructorId);
        setVehicleId(existingClass.vehicleId);
        const scheduledDate = new Date(existingClass.scheduledDate);
        setDate(format(scheduledDate, 'yyyy-MM-dd'));
        setTime(format(scheduledDate, 'HH:mm'));
      }
    }
  }, [id, classes]);

  const selectedStudent = students.find(s => s.id === studentId);
  const filteredVehicles = selectedStudent 
    ? vehicles.filter(v => {
        if (!selectedStudent.category) return true;
        if (selectedStudent.category === 'AB') return true;
        return v.category === selectedStudent.category;
      })
    : vehicles;

  // Se o usuário atual for instrutor, pré-seleciona ele e bloqueia, caso contrário permite seleção
  useEffect(() => {
    if (!id && currentUser?.role === 'INSTRUCTOR') {
      setInstructorId(currentUser.id);
    }
  }, [currentUser, id]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId || !instructorId || !vehicleId || !date || !time) return;

    const scheduledDate = new Date(`${date}T${time}:00`).toISOString();
    
    // Check for conflicts
    const newClassTime = new Date(scheduledDate).getTime();
    
    const hasConflict = classes.some(c => {
      if (c.id === id) return false; // Ignorar a própria aula ao editar
      // Consider only classes that are scheduled or in progress as potential conflicts
      if (c.status !== 'SCHEDULED' && c.status !== 'IN_PROGRESS') return false;
      
      const cTime = new Date(c.scheduledDate).getTime();
      
      // Checking for exact same time (assuming 1-hour slots strictly or same starting time)
      if (cTime === newClassTime) {
        if (c.studentId === studentId) {
          setError('Este aluno já tem uma aula agendada para este horário.');
          return true;
        }
        if (c.instructorId === instructorId) {
          setError('Este instrutor já tem uma aula agendada para este horário.');
          return true;
        }
        if (c.vehicleId === vehicleId) {
          setError('Este veículo já está reservado para este horário.');
          return true;
        }
      }
      return false;
    });

    if (hasConflict) return;

    try {
      if (id) {
        await updateClass(id, {
          studentId,
          instructorId,
          vehicleId,
          scheduledDate
        });
      } else {
        await addClass({
          studentId,
          instructorId,
          vehicleId,
          scheduledDate,
          status: 'SCHEDULED'
        });
      }

      navigate(id ? `/class/${id}` : '/');
    } catch (err: any) {
      setError(err.message || 'Erro ao agendar aula.');
    }
  };

  const isEditing = !!id;

  return (
    <div className="max-w-xl mx-auto space-y-6 flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Editar Agendamento' : 'Nova Aula'}</h1>
        <p className="text-slate-500 text-sm mt-1">{isEditing ? 'Ajuste os detalhes desta aula prática.' : 'Agende uma aula prática para um aluno.'}</p>
      </div>

      <form onSubmit={handleSchedule} className="space-y-4 flex-1">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data
              </label>
              <input 
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Horário
              </label>
              <input 
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Aluno
             </label>
             <select 
               required
               value={studentId}
               onChange={e => setStudentId(e.target.value)}
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
             >
               <option value="">Selecione um aluno...</option>
               {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.category ? `(Cat ${s.category})` : ''}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Instrutor
             </label>
             <select 
               required
               value={instructorId}
               onChange={e => setInstructorId(e.target.value)}
               disabled={currentUser?.role === 'INSTRUCTOR'}
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all disabled:opacity-50"
             >
               <option value="">Selecione um instrutor...</option>
               {instructors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Veículo
             </label>
             <select 
               required
               value={vehicleId}
               onChange={e => setVehicleId(e.target.value)}
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
             >
               <option value="">Selecione um veículo...</option>
               {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.model} {v.category ? `(Cat ${v.category})` : ''} - {v.plate}</option>)}
             </select>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 mt-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30"
        >
          {isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
        </button>
      </form>
    </div>
  );
}
