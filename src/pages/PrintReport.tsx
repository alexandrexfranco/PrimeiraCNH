import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '../lib/utils';
import { ptBR } from 'date-fns/locale';
import { Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export function PrintReport() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { users, classes, vehicles, currentUser } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const student = users.find(u => u.id === studentId && u.role === 'STUDENT');
  
  const isIframe = window.self !== window.top;

  const handleDownloadPDF = () => {
    if (!reportRef.current || !student) return;
    
    const element = reportRef.current;
    const opt = {
      margin:       10,
      filename:     `Relatorio_${student.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (student && !isIframe) {
      setTimeout(() => {
        handleDownloadPDF();
      }, 500);
    }
  }, [student, isIframe]);

  if (!student) {
    return (
      <div className="p-8 text-center text-red-600">
        Aluno não encontrado.
      </div>
    );
  }

  const studentClasses = classes
    .filter(c => c.studentId === student.id)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const completedClasses = studentClasses.filter(c => c.status === 'COMPLETED');
  const missedClasses = studentClasses.filter(c => c.status === 'MISSED' || c.status === 'CANCELED');
  
  let totalMinutes = 0;
  const skillsCount: Record<string, number> = {};
  
  completedClasses.forEach(c => {
    if (c.startTime && c.endTime) {
      totalMinutes += differenceInMinutes(new Date(c.endTime), new Date(c.startTime));
    }
    if (c.evaluation?.skills) {
      Object.entries(c.evaluation.skills).forEach(([skill, practiced]) => {
        if (practiced) {
          skillsCount[skill] = (skillsCount[skill] || 0) + 1;
        }
      });
    }
  });

  // Find the instructor for the signature (prefer the instructor from the most recent class, or just use currentUser)
  const lastClass = studentClasses[studentClasses.length - 1];
  const responsibleInstructorId = lastClass ? lastClass.instructorId : currentUser?.id;
  const responsibleInstructor = users.find(u => u.id === responsibleInstructorId) || currentUser;

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8 max-w-4xl mx-auto">
      
      {/* Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-col gap-4 mb-8 border-b pb-4">
        <div className="flex justify-between items-center">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 text-slate-500 hover:text-slate-800"
           >
             <ArrowLeft className="w-5 h-5" /> Voltar
           </button>
           <button 
             onClick={handleDownloadPDF}
             className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
           >
             <Download className="w-5 h-5" /> Baixar PDF
           </button>
         </div>
       </div>

      <div ref={reportRef} className="bg-white p-4">
        {/* Report Header */}
        <div className="relative mb-6 print:mb-2 border-b-2 border-slate-800 pb-4 print:pb-2 flex justify-center items-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 print:w-12 print:h-12 flex items-center justify-center">
            <img src="/LogoGV3.png?v=1" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight print:text-xl">Relatório de Aulas Práticas</h1>
          <p className="text-sm text-slate-500 mt-1 print:text-[10px]">CNH Corporativa - Grupo Veno</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-6 print:mb-3 p-4 print:p-2 bg-slate-50 rounded border border-slate-200">
        <h2 className="text-sm border-b pb-2 print:pb-1 font-bold text-slate-800 uppercase mb-3 print:mb-1 text-center print:text-xs">Dados do Aluno</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2 text-sm print:text-xs">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Nome</p>
            <p className="font-semibold">{student.name}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">CPF</p>
            <p className="font-semibold">{student.cpf}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Categoria</p>
            <p className="font-semibold">{student.category || 'B'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Data do Relatório</p>
            <p className="font-semibold">{format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 print:mb-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase mb-3 print:mb-1 border-b pb-2 print:pb-1 print:text-xs">Resumo de Carga Horária</h2>
        <div className="grid grid-cols-3 gap-4 print:gap-2 text-center">
          <div className="p-4 print:p-2 border rounded">
            <p className="text-2xl print:text-lg font-black">{completedClasses.length}</p>
            <p className="text-xs print:text-[10px] uppercase font-bold text-slate-500">Aulas Concluídas</p>
          </div>
          <div className="p-4 print:p-2 border rounded">
            <p className="text-2xl print:text-lg font-black">{missedClasses.length}</p>
            <p className="text-xs print:text-[10px] uppercase font-bold text-slate-500">Faltas / Canceladas</p>
          </div>
          <div className="p-4 print:p-2 border rounded">
            <p className="text-2xl print:text-lg font-black">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            <p className="text-xs print:text-[10px] uppercase font-bold text-slate-500">Tempo Prático Total</p>
          </div>
        </div>
      </div>

      {/* Detailed Class Log */}
      <div className="mb-6 print:mb-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase mb-3 print:mb-1 border-b pb-2 print:pb-1 print:text-xs">Registro de Aulas</h2>
        {studentClasses.length > 0 ? (
          <table className="w-full text-left text-sm print:text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 print:border-b">
                <th className="py-2 print:py-1 font-bold">Data</th>
                <th className="py-2 print:py-1 font-bold">Horário</th>
                <th className="py-2 print:py-1 font-bold">Veículo</th>
                <th className="py-2 print:py-1 font-bold">Status</th>
                <th className="py-2 print:py-1 font-bold">Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {studentClasses.map(c => {
                const vehicle = vehicles.find(v => v.id === c.vehicleId);
                return (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="py-2 print:py-1">{format(new Date(c.scheduledDate), 'dd/MM/yyyy')}</td>
                    <td className="py-2 print:py-1">{format(new Date(c.scheduledDate), 'HH:mm')}</td>
                    <td className="py-2 print:py-1">{vehicle?.model || '-'}</td>
                    <td className="py-2 print:py-1 font-medium">
                      {c.status === 'COMPLETED' ? 'Concluída' : 
                       c.status === 'SCHEDULED' ? 'Agendada' : 
                       c.status === 'CANCELED' ? 'Cancelada' : c.status}
                    </td>
                    <td className="py-2 print:py-1">
                      {c.evaluation?.overall ? c.evaluation.overall.replace('_', ' ') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma aula registrada.</p>
        )}
      </div>

      {/* Detran Verdict */}
      <div className="mb-6 print:mb-3 border-t border-b border-slate-200 py-4 print:py-2 flex items-center justify-between px-4 print:px-2">
        {(() => {
          const isAptoForDetran = student?.observation?.includes("[APTO_DETRAN]") ?? false;
          return (
            <>
              <div>
                <h3 className="font-bold text-slate-800 uppercase text-sm print:text-[11px]">Parecer do Instrutor para Exame Prático Detran</h3>
                <p className="text-xs print:text-[9px] text-slate-500 mt-1 print:mt-0">Baseado na avaliação contínua e geral de todas as aulas praticadas.</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <span className={cn(
                  "font-black text-xl print:text-sm uppercase tracking-widest px-4 print:px-2 py-1.5 print:py-0.5 rounded border-2 print:border",
                  isAptoForDetran ? "text-green-700 border-green-700" : "text-red-700 border-red-700"
                )}>
                  {isAptoForDetran ? "APTO" : "NÃO APTO"}
                </span>
              </div>
            </>
          )
        })()}
      </div>

      {/* Specific Skills */}
      <div className="mb-6 print:mb-2">
        <h2 className="text-sm border-b pb-1 font-bold text-slate-800 uppercase mb-1 print:text-xs">Estatísticas de Treinamento (Habilidades)</h2>
        <p className="text-[11px] print:text-[9px] text-slate-500 mb-4 print:mb-2">Quantidade de aulas práticas em que cada habilidade foi treinada e avaliada pelo instrutor.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 print:gap-y-1 gap-x-8 print:gap-x-4 text-sm print:text-[10px]">
          {Object.entries(skillsCount).sort((a, b) => b[1] - a[1]).map(([skill, count]) => (
            <div key={skill} className="flex justify-between items-center border-b border-slate-100 pb-1.5 print:pb-0.5">
              <span className="capitalize text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="text-xs print:text-[9px] font-bold text-slate-700 bg-slate-100/80 px-2 print:px-1 py-0.5 print:py-0 rounded border border-slate-200">
                {count} {count === 1 ? 'aula' : 'aulas'}
              </span>
            </div>
          ))}
          {Object.keys(skillsCount).length === 0 && (
            <p className="text-slate-500 col-span-4 text-xs">Nenhum dado de habilidade registrado.</p>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-20 print:mt-10 flex justify-between px-10 print:px-4 text-center">
        <div className="w-48 print:w-32">
          <div className="border-t border-slate-800 pt-2 print:pt-1 text-sm print:text-[10px] font-bold truncate">
            {responsibleInstructor?.name}
          </div>
          <div className="text-xs print:text-[9px] text-slate-500 uppercase">Instrutor Responsável</div>
        </div>
        <div className="w-48 print:w-32">
          <div className="border-t border-slate-800 pt-2 print:pt-1 text-sm print:text-[10px] font-bold truncate">
            {student.name}
          </div>
          <div className="text-xs print:text-[9px] text-slate-500 uppercase">Aluno</div>
        </div>
      </div>
      </div>
    </div>
  );
}
