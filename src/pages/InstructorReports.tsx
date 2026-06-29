import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { differenceInMinutes } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { FileBarChart, Clock, CheckCircle, AlertTriangle, Users, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InstructorReports() {
  const { classes, users, currentUser } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  // Filter students that this instructor has taught or simply all students if they want
  // Realistically an instructor sees their own stats, but let's show all students they have classes with.
  const myClasses = classes.filter(c => c.instructorId === currentUser?.id);
  // An instructor can view all students, but we'll show global stats for the instructor's own classes.
  const myStudents = users.filter(u => u.role === 'STUDENT');
  const selectedStudent = myStudents.find(s => s.id === selectedStudentId);

  // Determine metrics
  const totalStudents = myStudents.length;
  const completedStudents = myStudents.filter(s => {
    const studentClasses = myClasses.filter(c => c.studentId === s.id && c.status === 'COMPLETED');
    return studentClasses.length >= 5; // Assumed 5 is completed
  });
  const pendingStudents = totalStudents - completedStudents.length;

  // Let's aggregate evaluation stats for all my classes or specific selected student classes
  const evaluationCounts = {
    'EXCELENTE': 0,
    'BOA': 0,
    'REGULAR': 0,
    'NECESSITA_REFORCO': 0,
  };
  
  let totalMinutesAll = 0;

  // Global minutes stat for current instructor:
  myClasses.filter(c => c.status === 'COMPLETED').forEach(c => {
    if (c.startTime && c.endTime) {
      totalMinutesAll += differenceInMinutes(new Date(c.endTime), new Date(c.startTime));
    }
  });

  // Filter evaluation classes for the Pie Chart based on selected student:
  const evaluationClasses = selectedStudent
    ? myClasses.filter(c => c.status === 'COMPLETED' && c.studentId === selectedStudent.id)
    : myClasses.filter(c => c.status === 'COMPLETED');

  evaluationClasses.forEach(c => {
    if (c.evaluation?.overall) {
      evaluationCounts[c.evaluation.overall as keyof typeof evaluationCounts]++;
    }
  });

  const evalData = [
    { name: 'Excelente', value: evaluationCounts['EXCELENTE'], color: '#22c55e' },
    { name: 'Boa', value: evaluationCounts['BOA'], color: '#3b82f6' },
    { name: 'Regular', value: evaluationCounts['REGULAR'], color: '#f59e0b' },
    { name: 'Em Reforço', value: evaluationCounts['NECESSITA_REFORCO'], color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Filter and sort completed classes chronologically for student history:
  const studentCompletedClasses = selectedStudent
    ? myClasses
        .filter(c => c.status === 'COMPLETED' && c.studentId === selectedStudent.id)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    : [];

  const evaluationHistoryData = studentCompletedClasses.map((c, index) => {
    const scores = c.evaluation?.checklistItemScores;
    let finishedPct = 0;
    if (scores) {
      let totalPts = 0;
      let maxPts = 0;
      Object.values(scores).forEach((section) => {
        Object.values(section).forEach((grade) => {
          if (grade !== null) {
            maxPts += 1;
            if (grade === "CONF") totalPts += 1;
            else if (grade === "OBS") totalPts += 0.5;
          }
        });
      });
      if (maxPts > 0) {
        finishedPct = Math.round((totalPts / maxPts) * 100);
      }
    } else {
      // Fallback
      if (c.evaluation?.overall === "EXCELENTE") finishedPct = 100;
      else if (c.evaluation?.overall === "BOA") finishedPct = 85;
      else if (c.evaluation?.overall === "REGULAR") finishedPct = 65;
      else if (c.evaluation?.overall === "NECESSITA_REFORCO") finishedPct = 40;
    }

    const ratingLabel = {
      'EXCELENTE': 'Excelente',
      'BOA': 'Boa',
      'REGULAR': 'Regular',
      'NECESSITA_REFORCO': 'Em Reforço'
    }[c.evaluation?.overall || ''] || 'Sem Avaliação';

    const color = {
      'EXCELENTE': '#22c55e',
      'BOA': '#3b82f6',
      'REGULAR': '#f59e0b',
      'NECESSITA_REFORCO': '#ef4444'
    }[c.evaluation?.overall || ''] || '#cbd5e1';

    return {
      name: `Aula ${index + 1}`,
      Desempenho: finishedPct,
      rating: ratingLabel,
      color: color,
      date: new Date(c.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  });

  // Student specific data
  const studentClasses = selectedStudent ? myClasses.filter(c => c.studentId === selectedStudent.id) : [];
  
  const completedClasses = studentClasses.filter(c => c.status === 'COMPLETED');
  const missedClasses = studentClasses.filter(c => c.status === 'MISSED' || c.status === 'CANCELED');
  
  let totalStudentMinutes = 0;
  const skillNeedsCheck: Record<string, number> = {};

  completedClasses.forEach(c => {
    if (c.startTime && c.endTime) {
      totalStudentMinutes += differenceInMinutes(new Date(c.endTime), new Date(c.startTime));
    }
    // if evaluation has skills that were explicitly marked false (necessita reforço?)
    // Actually our previous state sets false as default, and true as trained.
    // Let's just tally what was trained.
    if (c.evaluation?.skills) {
      Object.entries(c.evaluation.skills).forEach(([skill, practiced]) => {
        if (practiced) {
          skillNeedsCheck[skill] = (skillNeedsCheck[skill] || 0) + 1;
        }
      });
    }
  });

  const skillData = Object.entries(skillNeedsCheck).map(([name, count]) => ({
    name: name.replace(/([A-Z])/g, ' $1').trim(),
    count
  }));

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-orange-600" /> Relatórios do Instrutor
          </h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe métricas, avaliações e tempo total de suas aulas.</p>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Total de Alunos */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-200" />
            <div className="flex gap-5 sm:gap-6 w-full items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 flex justify-between items-center gap-4">
                <div className="flex flex-col flex-1">
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0f172a] uppercase tracking-wide leading-tight mb-3">Total de Alunos</h3>
                  <div className="w-full border-b-2 border-dashed border-slate-100" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-[#0f172a]">
                  {totalStudents}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Concluídos */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-300" />
            <div className="flex gap-5 sm:gap-6 w-full items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 flex justify-between items-center gap-4">
                <div className="flex flex-col flex-1">
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0f172a] uppercase tracking-wide leading-tight">Concluídos</h3>
                  <p className="text-[13px] sm:text-[14px] font-medium text-[#64748b] uppercase tracking-wide mt-1 mb-3">(5+ Aulas)</p>
                  <div className="w-full border-b-2 border-dashed border-slate-100" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600">
                  {completedStudents.length}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Em Formação */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-300" />
            <div className="flex gap-5 sm:gap-6 w-full items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 flex justify-between items-center gap-4">
                <div className="flex flex-col flex-1">
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0f172a] uppercase tracking-wide leading-tight mb-3">Em Formação</h3>
                  <div className="w-full border-b-2 border-dashed border-slate-100" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-orange-500">
                  {pendingStudents}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Tempo Total */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-400" />
            <div className="flex gap-5 sm:gap-6 w-full items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 flex justify-between items-center gap-4">
                <div className="flex flex-col flex-1">
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0f172a] uppercase tracking-wide leading-tight">Tempo Total</h3>
                  <p className="text-[13px] sm:text-[14px] font-medium text-[#64748b] uppercase tracking-wide mt-1 mb-3">(Horas)</p>
                  <div className="w-full border-b-2 border-dashed border-slate-100" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-blue-600">
                  {Math.round(totalMinutesAll / 60)}h
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm sm:text-base">
              {selectedStudent ? `Desempenho por Aula - ${selectedStudent.name}` : "Visão Geral de Avaliações (Todas as Aulas)"}
            </h3>
            {selectedStudent ? (
              evaluationHistoryData.length > 0 ? (
                <div className="h-64 flex flex-col justify-between">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height={224}>
                      <BarChart data={evaluationHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                          unit="%"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-950 text-white p-2.5 rounded-xl border border-slate-900 shadow-xl text-xs space-y-1">
                                  <p className="font-extrabold text-orange-400">{data.name}</p>
                                  <p className="text-[10px] text-slate-400">Data: {data.date}</p>
                                  <div className="border-t border-slate-800 my-1 pt-1" />
                                  <p className="font-semibold text-[11px]">
                                    Aproveitamento: <span className="font-black text-orange-300">{data.Desempenho}%</span>
                                  </p>
                                  <p className="font-semibold text-[11px]">
                                    Avaliação: <span style={{ color: data.color }} className="font-black">{data.rating}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="Desempenho" radius={[4, 4, 0, 0]} barSize={24}>
                          {evaluationHistoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] font-bold text-slate-500 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#22c55e]" /> Excelente</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#3b82f6]" /> Boa</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#f59e0b]" /> Regular</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#ef4444]" /> Em Reforço</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex justify-center items-center text-slate-400 text-xs">Este aluno ainda não possui aulas concluídas com avaliação.</div>
              )
            ) : (
              evalData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie data={evalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {evalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex justify-center items-center text-slate-400 text-xs">Sem dados de avaliação disponíveis.</div>
              )
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800">Relatório Individual</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Aluno</label>
              <select 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Selecione um aluno para detalhes...</option>
                {myStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedStudent && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <span className="text-sm font-medium text-orange-900">Relatório Completo</span>
                  <Link 
                    to={`/print-report/${selectedStudent.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-700 transition"
                  >
                    <Printer className="w-4 h-4" /> Imprimir
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Concluídas</p>
                    <p className="text-xl font-bold text-slate-800">{completedClasses.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Faltas/Cancel.</p>
                    <p className="text-xl font-bold text-red-600">{missedClasses.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tempo (Min)</p>
                    <p className="text-xl font-bold text-blue-600">{totalStudentMinutes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
