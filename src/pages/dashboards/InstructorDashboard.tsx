import React, { useState } from "react";
import { useAppStore } from "../../store/AppContext";
import { format, isToday, isFuture, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Car,
  PlayCircle,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  ChevronDown,
  Star,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Safely parse observation field to extract expiration date and receipt information
function parseObservation(obsStr: string | undefined) {
  if (!obsStr) return { expiration: null, receiptUrl: null, receiptAt: null };
  try {
    const data = JSON.parse(obsStr);
    if (data && typeof data === "object") {
      return {
        expiration: data.expiration !== undefined ? data.expiration : null,
        receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : null,
        receiptAt: data.receiptAt !== undefined ? data.receiptAt : null,
      };
    }
  } catch (e) {
    // Treat as raw date string fallback
  }
  if (obsStr && !isNaN(Date.parse(obsStr))) {
    return { expiration: obsStr, receiptUrl: null, receiptAt: null };
  }
  return { expiration: null, receiptUrl: null, receiptAt: null };
}

export function InstructorDashboard() {
  const { classes, currentUser, users, vehicles, updateUser } = useAppStore();
  const navigate = useNavigate();

  const myCompletedClasses = classes.filter(
    (c) => c.instructorId === currentUser?.id && c.status === "COMPLETED",
  );
  
  const ratedClasses = myCompletedClasses.filter((c) => c.evaluation?.instructorRating?.rating);
  const averageRating = ratedClasses.length > 0 
    ? (ratedClasses.reduce((acc, c) => acc + (c.evaluation?.instructorRating?.rating || 0), 0) / ratedClasses.length).toFixed(1)
    : null;

  const { expiration, receiptUrl } = parseObservation(currentUser?.observation);
  const hasExpiration = !!expiration;

  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (expiration && !isNaN(Date.parse(expiration))) {
      const expDate = new Date(expiration);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return daysLeft === 10 || daysLeft === 5;
    }
    return false;
  });

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [selectedPlanMonths, setSelectedPlanMonths] = useState<number | null>(
    1,
  ); // Pre-select November/Default 1 Month
  const [searchStudent, setSearchStudent] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<"SCHEDULED" | "COMPLETED">(
    "SCHEDULED",
  );

  const toggleStudent = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Retrieve PIX Key from Admin user row (saved in Admin's "registro" field)
  const adminUser = users.find((u) => u.role === "ADMIN");
  const pixKey = adminUser?.registro || "";

  const plans = (() => {
    const defaultPlans = [
      { months: 1, price: 100, label: "1 Mês" },
      { months: 3, price: 250, label: "3 Meses" },
      { months: 6, price: 400, label: "6 Meses" },
      { months: 12, price: 600, label: "1 Ano" },
    ];
    if (adminUser?.observation) {
      try {
        const parsed = JSON.parse(adminUser.observation);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch (e) {
        // Fallback silently
      }
    }
    return defaultPlans;
  })();

  const myClasses = classes
    .filter((c) => c.instructorId === currentUser?.id)
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const upcomingClasses = myClasses
    .filter((c) => {
      const scheduled = new Date(c.scheduledDate);
      // Include all classes that are from today onwards
      return scheduled >= startOfDay(new Date());
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const todayClasses = myClasses.filter((c) =>
    isToday(new Date(c.scheduledDate)),
  );
  const nextClass = todayClasses.find(
    (c) => c.status === "SCHEDULED" || c.status === "IN_PROGRESS",
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Painel do Instrutor
          </h1>
          <p className="text-slate-500 mt-1 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          {averageRating ? (
            <div className="flex items-center gap-1.5 mt-2 bg-orange-50 text-orange-750 px-3 py-1 rounded-full border border-orange-100 w-fit text-xs font-semibold shadow-xs">
              <Star className="w-3.5 h-3.5 fill-orange-500 stroke-orange-500" />
              <span>{averageRating} de 5.0</span>
              <span className="text-orange-300 font-medium">•</span>
              <span className="text-slate-500 font-medium">{ratedClasses.length} {ratedClasses.length === 1 ? "avaliação" : "avaliações"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2 bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-100 w-fit text-xs font-medium">
              <Star className="w-3.5 h-3.5 stroke-slate-300" />
              <span>Sem avaliações de alunos</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:items-end gap-2.5 shrink-0 self-start sm:self-auto w-full sm:w-auto">
          {hasExpiration && (
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer shrink-0"
              >
                <Clock className="w-4 h-4 shrink-0" /> Assinatura
              </button>
              <button
                onClick={() => setIsRenewModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer shrink-0"
              >
                Renovar Agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Expiration Warning / Information Popup Modal */}
      {isModalOpen &&
        (() => {
          const { expiration, receiptUrl } = parseObservation(
            currentUser?.observation,
          );

          let isExpired = false;
          let formattedLastDay = "";
          let daysLeft = 999;
          let hoursLeft = 0;
          let minutesLeft = 0;
          let timeText = "Tempo Indeterminado";

          if (expiration && !isNaN(Date.parse(expiration))) {
            const expDate = new Date(expiration);
            const now = new Date();
            const diffMs = expDate.getTime() - now.getTime();
            isExpired = diffMs <= 0;
            const lastDayDate = new Date(expDate.getTime() - 1000);
            formattedLastDay = format(lastDayDate, "dd/MM/yyyy");

            daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            hoursLeft = Math.floor(
              (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (daysLeft > 0) {
              timeText = `${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}${hoursLeft > 0 ? ` e ${hoursLeft} ${hoursLeft === 1 ? "hora" : "horas"}` : ""}`;
            } else if (hoursLeft > 0) {
              timeText = `${hoursLeft} ${hoursLeft === 1 ? "hora" : "horas"}${minutesLeft > 0 ? ` e ${minutesLeft} ${minutesLeft === 1 ? "minuto" : "minutos"}` : ""}`;
            } else {
              timeText = `${minutesLeft} ${minutesLeft === 1 ? "minuto" : "minutos"}`;
            }
          }

          return (
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
              id="subscription-modal-overlay"
            >
              <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-5 transform scale-100 transition-all">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={cn(
                      "p-3.5 rounded-full border-2 shadow-xs shrink-0",
                      !expiration
                        ? "bg-green-50 text-green-600 border-green-200"
                        : daysLeft <= 5
                          ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                          : "bg-sky-50 text-sky-600 border-sky-200",
                    )}
                  >
                    <Clock className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-800 font-sans">
                      Minha Assinatura / Acesso
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {!expiration
                        ? "Sua conta possui acesso ilimitado liberado em nossa plataforma de formação."
                        : "Sua conta possui um período de acesso temporário homologado ativo."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium font-mono uppercase tracking-wider">
                      Situação da Conta
                    </span>
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-md">
                      Ativa
                    </span>
                  </div>
                  <div className="border-t border-slate-200/60 my-2"></div>
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-500 font-medium font-mono uppercase tracking-wider">
                      Válido Até
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {expiration ? formattedLastDay : "Livre"}
                      </p>
                      {expiration && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Até as 23:59:59h
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 my-2"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium font-mono uppercase tracking-wider">
                      Tempo Restante
                    </span>
                    <span
                      className={cn(
                        "font-bold text-[11px] px-2.5 py-0.5 rounded-md border",
                        !expiration
                          ? "bg-green-50 text-green-700 border-green-200"
                          : daysLeft <= 5
                            ? "bg-amber-50 text-amber-700 border-amber-200 font-extrabold"
                            : "bg-sky-50 text-sky-700 border-sky-200",
                      )}
                    >
                      {expiration ? timeText : "Sem Expiração"}
                    </span>
                  </div>

                  {receiptUrl && (
                    <>
                      <div className="border-t border-slate-200/60 my-2"></div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px]">
                          Comprovante Enviado
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Você já enviou um comprovante de pagamento que está
                          pendente de análise pela administração.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsRenewModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
                  >
                    Renovar Agora / Enviar Novo Comprovante
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* PIX Payment and Receipt Upload Popup Modal */}
      {isRenewModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          id="renew-pix-modal"
        >
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-full border border-green-100 uppercase text-xs font-bold">
                Pix
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Renovação de Assinatura
                </h3>
                <p className="text-xs text-slate-500">
                  Realize o pagamento por PIX e envie o comprovante
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                Dados de Pagamento
              </p>

              {pixKey ? (
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-700 select-all font-bold tracking-tight block truncate flex-1">
                      {pixKey}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixKey);
                        alert("Chave PIX copiada!");
                      }}
                      className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Realize o pagamento do valor da mensalidade estipulado com a
                    administração e anexe o arquivo ou foto do comprovante
                    abaixo para validação imediata.
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 space-y-1">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-xs text-amber-700 font-bold">
                    Nenhuma chave PIX cadastrada
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    A administração ainda não registrou a chave PIX padrão da
                    autoescola. Entre em contato diretamente para obter os
                    dados.
                  </p>
                </div>
              )}
            </div>

            {/* Subscription Plans Selection Card */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Planos Disponíveis
              </label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((p) => {
                  const isSelected = selectedPlanMonths === p.months;
                  return (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => setSelectedPlanMonths(p.months)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col gap-1 w-full",
                        isSelected
                          ? "bg-orange-50/50 border-orange-500 ring-2 ring-orange-500/10"
                          : "bg-white border-slate-200 hover:bg-slate-50/50",
                      )}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                        {p.label}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </span>
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Receipt Upload Control */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Comprovante de Pagamento
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/50 transition">
                {selectedReceipt ? (
                  <div className="text-center space-y-2 w-full">
                    <div className="relative w-24 h-24 mx-auto border rounded-xl overflow-hidden bg-white shadow-xs">
                      <img
                        src={selectedReceipt}
                        alt="Comprovante"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(null)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity font-bold"
                      >
                        Remover
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs mx-auto">
                      Imagem selecionada para envio
                    </p>
                  </div>
                ) : (
                  <label className="cursor-pointer text-center py-2 block w-full">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-orange-600 block hover:underline">
                      Selecionar foto do comprovante
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Formatos de imagem suportados (PNG, JPG)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSelectedReceipt(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Receipt Button */}
            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUploadingReceipt || !selectedReceipt}
                onClick={async () => {
                  if (!selectedReceipt) return;
                  try {
                    setIsUploadingReceipt(true);
                    const { expiration } = parseObservation(
                      currentUser?.observation,
                    );
                    const updatedObs = JSON.stringify({
                      expiration: expiration || null,
                      receiptUrl: selectedReceipt,
                      receiptAt: new Date().toISOString(),
                      selectedPlanMonths: selectedPlanMonths,
                    });

                    await updateUser(currentUser!.id, {
                      observation: updatedObs,
                    });

                    alert("Comprovante enviado com sucesso para análise!");
                    setIsRenewModalOpen(false);
                    setSelectedReceipt(null);
                  } catch (e: any) {
                    alert("Erro ao enviar comprovante: " + (e.message || e));
                  } finally {
                    setIsUploadingReceipt(false);
                  }
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isUploadingReceipt ? "Enviando..." : "Enviar Comprovante"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Class Hero */}
      {nextClass && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              {nextClass.status === "IN_PROGRESS"
                ? "Em Andamento"
                : "Próxima Aula"}
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">Horário</p>
              <p className="text-3xl font-bold">
                {format(new Date(nextClass.scheduledDate), "HH:mm")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Aluno(a)</p>
                <p className="font-medium">
                  {
                    users
                      .find((u) => u.id === nextClass.studentId)
                      ?.name.split(" ")[0]
                  }
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Veículo</p>
                <p className="font-medium">
                  {vehicles.find((v) => v.id === nextClass.vehicleId)?.model}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/class/${nextClass.id}`)}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {nextClass.status === "IN_PROGRESS" ? (
                <>Ver Aula em Andamento</>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Iniciar Aula
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Agenda Diária */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Próximas Aulas (Hoje em diante)
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-shadow shadow-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("SCHEDULED")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "SCHEDULED"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            Aulas Agendadas
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "COMPLETED"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            Aulas Concluídas
          </button>
        </div>

        <div className="space-y-4">
          {(() => {
            const upcomingClassesByStudent = upcomingClasses.reduce(
              (acc, c) => {
                if (!acc[c.studentId]) {
                  acc[c.studentId] = [];
                }
                acc[c.studentId].push(c);
                return acc;
              },
              {} as Record<string, typeof upcomingClasses>,
            );

            const filteredStudents = (
              Object.values(
                upcomingClassesByStudent,
              ) as (typeof upcomingClasses)[]
            ).filter((studentClasses) => {
              const student = users.find(
                (u) => u.id === studentClasses[0].studentId,
              );
              const matchesSearch = student?.name
                .toLowerCase()
                .includes(searchStudent.toLowerCase());

              if (!matchesSearch) return false;

              const hasPending = studentClasses.some(
                (c) => c.status !== "COMPLETED",
              );

              if (activeTab === "SCHEDULED") {
                return hasPending;
              } else {
                return !hasPending;
              }
            });

            if (
              filteredStudents.length === 0 &&
              Object.keys(upcomingClassesByStudent).length > 0
            ) {
              return (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>Nenhum aluno encontrado nesta aba ou com a busca atual.</p>
                </div>
              );
            }

            return filteredStudents.map((studentClasses) => {
              const studentId = studentClasses[0].studentId;
              const student = users.find((u) => u.id === studentId);

              const allStudentClasses = classes.filter(
                (cls) => cls.studentId === student?.id,
              );
              const completedClassesCount = allStudentClasses.filter(
                (cls) => cls.status === "COMPLETED",
              ).length;
              const totalRequired = 5;
              const isExpanded = expandedStudents[studentId];

              return (
                <div
                  key={studentId}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <div
                    onClick={() => toggleStudent(studentId)}
                    className="bg-slate-50 p-4 border-b border-slate-200/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 text-slate-800 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
                        {student?.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          student?.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          {student?.name}
                          {student?.observation && student.observation.replace("[APTO_DETRAN]", "").trim() !== "" && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase hidden sm:inline-block">
                              {student.observation.replace("[APTO_DETRAN]", "").trim()}
                            </span>
                          )}
                          {student?.observation?.includes("[APTO_DETRAN]") && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase hidden sm:inline-block">
                              🎓 Apto Detran
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> Aula Particular
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold bg-slate-200/70 text-slate-700 px-2.5 py-1 rounded-md">
                          {completedClassesCount}/{totalRequired} Aulas
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline-block font-medium">
                          Mínimo 5 (2 obrigatórias)
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-slate-400 transition-transform duration-200",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      {/* Global Detran Evaluation Toggle Card */}
                      {student && completedClassesCount >= totalRequired && (
                        <div className="p-4 bg-amber-50/40 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                              student.observation?.includes("[APTO_DETRAN]")
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 border-red-100/70"
                            )}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">Apto para prova prática Detran?</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {student.observation?.includes("[APTO_DETRAN]")
                                  ? "O aluno foi avaliado pelo instrutor como APTO para o exame oficial."
                                  : "O aluno foi avaliado como NÃO APTO (ou em andamento de aulas). Clique à direita para mudar."}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const cleanObs = (student.observation || "").replace("[APTO_DETRAN]", "").trim();
                                await updateUser(student.id, { observation: cleanObs });
                              }}
                              className={cn(
                                "px-3 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer shadow-sm",
                                !student.observation?.includes("[APTO_DETRAN]")
                                  ? "bg-red-600 text-white border-red-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 active:bg-slate-100"
                              )}
                            >
                              Não Apto
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const cleanObs = (student.observation || "").replace("[APTO_DETRAN]", "").trim();
                                const newObs = `[APTO_DETRAN] ${cleanObs}`.trim();
                                await updateUser(student.id, { observation: newObs });
                              }}
                              className={cn(
                                "px-3 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer shadow-sm",
                                student.observation?.includes("[APTO_DETRAN]")
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 active:bg-slate-100"
                              )}
                            >
                              Apto Detran
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Evolution Timeline for Instructor to Monitor Student Growth */}
                      {(() => {
                        const completedStudentClassesSorted = [...allStudentClasses]
                          .filter((cls) => cls.status === "COMPLETED" && cls.evaluation?.checklistItemScores)
                          .sort(
                            (a, b) =>
                              new Date(a.scheduledDate).getTime() -
                              new Date(b.scheduledDate).getTime(),
                          );

                        const studentEvolutionPoints = completedStudentClassesSorted.map((c, idx) => {
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
                          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingDown className="w-4 h-4 text-orange-600" />
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Linha de Tempo de Desempenho (Evolução de Erros)
                              </span>
                            </div>

                            {studentEvolutionPoints.length > 0 ? (
                              <div>
                                <p className="text-[11px] text-slate-500 mb-4 font-medium">
                                  Abaixo está a curva de evolução do aluno de acordo com falhas ("Não Conforme") pontuadas nas aulas práticas anteriores.
                                </p>
                                <div className="h-[180px] w-full pr-2">
                                  <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={studentEvolutionPoints} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                      <XAxis 
                                        dataKey="classLabel" 
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                        axisLine={{ stroke: '#cbd5e1' }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                      />
                                      <YAxis 
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        axisLine={{ stroke: '#cbd5e1' }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                        allowDecimals={false}
                                      />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 shadow-lg text-[11px] space-y-0.5">
                                                <p className="font-bold text-[#f97316]">{data.classLabel}</p>
                                                <p className="text-[9px] text-slate-400">{data.date}</p>
                                                <p className="font-semibold mt-1">
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
                                        strokeWidth={2.5}
                                        dot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5, fill: "#f97316" }}
                                        activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 1.5, fill: "#f97316" }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-400">
                                  Nenhuma aula finalizada com avaliações para traçar a curva de desempenho ainda.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {studentClasses.map((c) => {
                        const isCompleted = c.status === "COMPLETED";
                        return (
                          <div
                            key={c.id}
                            onClick={() => navigate(`/class/${c.id}`)}
                            className={cn(
                              "p-4 transition-all cursor-pointer hover:bg-slate-50 flex items-center justify-between",
                              isCompleted ? "opacity-75 bg-slate-50/30" : "",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-500" />
                              </div>
                              <span className="text-slate-800 font-bold text-sm sm:text-base">
                                {format(
                                  new Date(c.scheduledDate),
                                  "HH:mm - dd/MM/yy",
                                )}
                              </span>
                            </div>
                            {isCompleted ? (
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const scores = c.evaluation?.checklistItemScores;
                                  let finishedPct = 0;
                                  if (scores) {
                                    let totalPts = 0;
                                    let maxPts = 0;
                                    Object.values(scores).forEach((section) => {
                                      Object.values(section).forEach((grade) => {
                                        maxPts += 1;
                                        if (grade === "CONF") totalPts += 1;
                                        else if (grade === "OBS") totalPts += 0.5;
                                      });
                                    });
                                    if (maxPts > 0) {
                                      finishedPct = (totalPts / maxPts) * 100;
                                    }
                                  }

                                  return (
                                    <>
                                      {c.evaluation?.instructorRating && (
                                        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-200 text-[10px] font-extrabold">
                                          <Star className="w-2.5 h-2.5 fill-orange-500 stroke-orange-500" />
                                          {c.evaluation.instructorRating.rating}
                                        </div>
                                      )}
                                      {c.evaluation && (
                                        <span
                                          className={cn(
                                            "text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border hidden xs:inline-block",
                                            scores
                                              ? finishedPct >= 80
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                              : "bg-slate-50 text-slate-500 border-slate-200",
                                          )}
                                        >
                                          {scores
                                            ? `Desempenho: ${finishedPct.toFixed(0)}%`
                                            : "Sem Avaliação"}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  Concluída
                                </span>
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "text-xs font-bold px-2.5 py-1 rounded-full border",
                                  c.status === "IN_PROGRESS"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200",
                                )}
                              >
                                {c.status === "IN_PROGRESS"
                                  ? "Em andamento"
                                  : "Agendada"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {upcomingClasses.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Car className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p>Nenhuma aula futura agendada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
