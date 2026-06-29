import React, { useRef } from "react";
import { useAppStore } from "../../store/AppContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Car,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  Camera,
  Star,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import {
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function StudentDashboard() {
  const { classes, currentUser, users, updateUser } = useAppStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUser(currentUser.id, { photoUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const myClasses = classes.filter((c) => c.studentId === currentUser?.id);

  const completedClasses = myClasses.filter((c) => c.status === "COMPLETED");
  const canceledClasses = myClasses.filter((c) => c.status === "CANCELED" || c.status === "MISSED");
  const upcomingClasses = myClasses
    .filter((c) => c.status === "SCHEDULED" || c.status === "IN_PROGRESS")
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const totalRequired = 5;
  const progressPercent = Math.min(
    100,
    Math.round((completedClasses.length / totalRequired) * 100),
  );

  // Process data for the Performance Evolution Timeline (N_CONF reduction curve)
  const evaluatedClassesSorted = [...completedClasses]
    .filter((c) => c.status === "COMPLETED" && c.evaluation?.checklistItemScores)
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const evolutionPoints = evaluatedClassesSorted.map((c, idx) => {
    let nConfCount = 0;
    const scores = c.evaluation?.checklistItemScores;
    if (scores) {
      Object.values(scores).forEach((section) => {
        Object.values(section).forEach((grade) => {
          if (grade === "N_CONF") {
            nConfCount++;
          }
        });
      });
    }
    return {
      index: idx + 1,
      classLabel: `Aula ${idx + 1}`,
      nConf: nConfCount,
      date: format(new Date(c.scheduledDate), "dd/MM 'às' HH:mm"),
    };
  });

  return (
    <div className="space-y-6">
      {/* Informações do Perfil */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div
          className="relative w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-3xl shrink-0 cursor-pointer group overflow-hidden border-2 border-transparent hover:border-orange-200 transition-all"
          onClick={handlePhotoClick}
        >
          {currentUser?.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt="Perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            currentUser?.name?.charAt(0)
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex flex-col sm:flex-row sm:items-center gap-1.5 break-words">
            <span className="truncate">{currentUser?.name}</span>
            {currentUser?.jobRole && (
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md self-center sm:self-auto border border-sky-100 uppercase flex-shrink-0">
                {currentUser.jobRole}
              </span>
            )}
            {currentUser?.observation && currentUser.observation.replace("[APTO_DETRAN]", "").trim() !== "" && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md self-center sm:self-auto border border-orange-100 flex-shrink-0">
                {currentUser.observation.replace("[APTO_DETRAN]", "").trim()}
              </span>
            )}
            {currentUser?.observation?.includes("[APTO_DETRAN]") && (
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2   py-0.5 rounded-md self-center sm:self-auto border border-green-200 flex-shrink-0">
                🎓 Apto Detran
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">
            CPF: {currentUser?.cpf} • Categoria {currentUser?.category || "B"}
          </p>

        </div>
        <div className="hidden md:block text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg text-sm border border-green-200">
            <GraduationCap className="w-4 h-4" />
            EM FORMAÇÃO
          </span>
        </div>
      </div>

      {/* Detran Eligibility Banner */}
      {(() => {
        const isApto = currentUser?.observation?.includes("[APTO_DETRAN]") ?? false;
        return (
          <div
            className={cn(
              "p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm",
              isApto
                ? "bg-green-50 border-green-200 text-green-950"
                : "bg-amber-50 border-amber-200 text-amber-950",
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0",
                  isApto
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-amber-100 text-amber-700 border-amber-200",
                )}
              >
                <GraduationCap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {isApto
                    ? "Apto para a Prova Prática do Detran! 🎓"
                    : "Em Preparação para a Prova Prática"}
                </h3>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">
                  {isApto
                    ? "Parabéns! O instrutor avaliou seu desempenho geral e considerou você plenamente apto e preparado para realizar o exame prático oficial do Detran."
                    : "Continue focado! Seu instrutor faz uma avaliação contínua do seu desenvolvimento, considerando seu progresso ao longo de todas as aulas práticas."}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border",
                isApto
                  ? "bg-green-600 text-white border-green-700 shadow-sm"
                  : "bg-amber-100 text-amber-800 border-amber-300",
              )}
            >
              {isApto ? "Apto no Sistema" : "Em Andamento"}
            </span>
          </div>
        );
      })()}

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-slate-800 font-bold">Progresso Prático</h2>
            <p className="text-sm text-slate-500">
              {completedClasses.length} de {totalRequired} aulas mínimas
              concluídas
            </p>
            <p className="text-xs text-orange-600 mt-1 block font-medium">
              Atenção: São necessárias 2 aulas obrigatórias e no mínimo{" "}
              {totalRequired} aulas no total.
            </p>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-right text-xs text-slate-500 font-medium">
          {progressPercent}% Concluído
        </p>
      </div>

      {/* Evolution Timeline Graphic Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Evolução do Desempenho Prático</h3>
              <p className="text-xs text-slate-500">Curva de redução de falhas e infrações (marcações de "Não Conforme")</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider rounded-lg border border-slate-200 self-start sm:self-auto">
            {evolutionPoints.length === 0 ? "Sem dados suficientes" : `${evolutionPoints.length} avaliações`}
          </div>
        </div>

        {evolutionPoints.length > 0 ? (
          <div>
            <div className="h-[240px] w-full mt-2 pr-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={evolutionPoints} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="classLabel" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                    label={{ value: 'Erros (N. Conf.)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11, fill: '#94a3b8', fontWeight: 600, dx: -2 } }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1">
                            <p className="font-extrabold text-[#f97316]">{data.classLabel}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{data.date}</p>
                            <div className="w-full h-px bg-slate-800 my-1" />
                            <p className="font-semibold flex items-center gap-1">
                              Não Conformidades: <span className="font-black text-orange-400">{data.nConf}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nConf"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#f97316" }}
                    activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2, fill: "#f97316" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 flex items-start gap-2.5">
              <span className="text-orange-500 font-bold text-sm">💡</span>
              <p className="text-xs text-orange-850 leading-relaxed font-medium">
                O gráfico acima exibe as marcações de <strong>Não Conforme</strong> feitas pelo instrutor e somadas por aula. O objetivo prático é reduzir essa curva próximo de zero até a 5ª aula para atingir aptidão plena para a prova do Detran.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
            <TrendingDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Ainda sem avaliações registradas</h4>
            <p className="text-xs text-slate-400 max-w-[320px] mx-auto mt-1 leading-normal">
              Seu histórico detalhado de progresso e curva de erros será desenhado automaticamente aqui após sua primeira aula de simulação ser finalizada e avaliada pelo instrutor.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2">
          {upcomingClasses.length > 0
            ? "Próximas Aulas"
            : "Nenhuma aula agendada"}
        </h2>
        {upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.map((c) => {
              const instructor = users.find((u) => u.id === c.instructorId);
              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/class/${c.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      {format(new Date(c.scheduledDate), "EEEE, d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                        c.status === "IN_PROGRESS"
                          ? "bg-orange-100 text-orange-800 animate-pulse"
                          : "bg-slate-100 text-slate-800",
                      )}
                    >
                      {c.status === "IN_PROGRESS"
                        ? "Em Andamento"
                        : format(new Date(c.scheduledDate), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Car className="w-4 h-4" /> Instrutor: {instructor?.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-500">
              Você ainda não tem próximas aulas marcadas.
            </p>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">
          Histórico
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {completedClasses.length + canceledClasses.length > 0 ? (
            [...completedClasses, ...canceledClasses]
              .sort(
                (a, b) =>
                  new Date(b.scheduledDate).getTime() -
                  new Date(a.scheduledDate).getTime(),
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/class/${c.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        c.status === "COMPLETED"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {c.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {format(
                          new Date(c.scheduledDate),
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
                      </p>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span>
                          {c.status === "COMPLETED"
                            ? "Aula Concluída"
                            : c.status === "MISSED"
                              ? "Falta"
                              : "Cancelada"}
                        </span>
                        {c.status === "COMPLETED" &&
                          (() => {
                            const scores = c.evaluation?.checklistItemScores;
                            let finishedPct = 0;
                            let hasAnyScored = false;
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
                                finishedPct = (totalPts / maxPts) * 100;
                                hasAnyScored = true;
                              }
                            }
                            return (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span
                                  className={cn(
                                    "text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase border",
                                    hasAnyScored
                                      ? finishedPct >= 80
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-50 text-slate-500 border-slate-200",
                                  )}
                                >
                                  {hasAnyScored
                                    ? `Desempenho: ${finishedPct.toFixed(0)}%`
                                    : "Sem Avaliação"}
                                </span>
                                {c.evaluation?.instructorRating && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-1 py-0.2 rounded uppercase">
                                      <Star className="w-2.5 h-2.5 fill-orange-500 stroke-orange-500" />
                                      Avaliado: {c.evaluation.instructorRating.rating}
                                    </span>
                                  </>
                                )}
                              </>
                            );
                          })()}
                      </div>
                    </div>
                  </div>
                  {c.status === "CANCELED" && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Motivo
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded max-w-[100px] truncate block">
                        {c.cancelReason || "Falta"}
                      </span>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              Nenhuma aula no histórico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
