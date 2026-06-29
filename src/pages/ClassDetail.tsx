import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/AppContext";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Square,
  XCircle,
  CheckCircle2,
  GraduationCap,
  Star,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { Evaluation, ClassStatus } from "../types";

export function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classes, currentUser, updateClass, users, vehicles, updateUser } = useAppStore();

  const classData = classes.find((c) => c.id === id);
  const student = users.find((u) => u.id === classData?.studentId);
  const vehicle = vehicles.find((v) => v.id === classData?.vehicleId);
  const instructor = users.find((u) => u.id === classData?.instructorId);

  // Calcular sequência da aula para o aluno
  const studentClasses = classes
    .filter((c) => c.studentId === classData?.studentId && c.status !== "CANCELED")
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  let currentClassIndex = studentClasses.findIndex((c) => c.id === classData?.id);
  let classSequenceNumber = currentClassIndex !== -1 ? currentClassIndex + 1 : 0;
  const totalClassesCount = studentClasses.length;

  if (classData?.status === "CANCELED") {
    const allStudentClassesWithCanceled = classes
      .filter((c) => c.studentId === classData?.studentId)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    const canceledIndex = allStudentClassesWithCanceled.findIndex((c) => c.id === classData?.id);
    if (canceledIndex !== -1) {
      classSequenceNumber = canceledIndex + 1;
    }
  }

  // States for actions
  const [checklist, setChecklist] = useState(
    classData?.checklist || {
      documentoConferido: false,
      veiculoInspecionado: false,
      combustivelSuficiente: false,
      alunoPresente: false,
      equipamentosConferidos: false,
    },
  );

  const [evaluation, setEvaluation] = useState<Evaluation>(() => {
    const existing = classData?.evaluation;
    if (existing && existing.checklistItemScores) {
      return existing;
    }
    return {
      ...(existing || {
        overall: null,
        skills: {
          partida: false,
          controleEmbreagem: false,
          trocaMarchas: false,
          baliza: false,
          conversao: false,
          estacionamento: false,
          controleVeiculo: false,
          direcaoDefensiva: false,
          sinalizacao: false,
          circulacaoUrbana: false,
        },
      }),
      isReadyForExam: false,
      checklistItemScores: {
        conhecimentoVeiculo: {
          bancoRetrovisorCinto: null,
          posicaoCambio: null,
          ligaVeiculo: null,
          sinalizacao: null,
          observaPainel: null,
          setaAntesSair: null,
          checagemPontoCego: null,
          soltaFreioEstacionamento: null,
          movimentacaoSeguranca: null,
        },
        dominioVeiculo: {
          usoPedais: null,
          trocaMarcha: null,
          marchaRe: null,
          colocarVaga: null,
          estacionamentoParada: null,
          concentracao: null,
          atencaoSeguranca: null,
        },
        atencaoSeguranca: {
          maosVolante: null,
          velocidadeCompativel: null,
          sinalizacaoVertical: null,
          sinalizacaoHorizontal: null,
          distanciaSegura: null,
          utilizaSetas: null,
          observaRetrovisores: null,
          frenagensSuaves: null,
          posicionamentoCorreto: null,
          atencaoTransito: null,
        },
        cruzamentosIntersecoes: {
          reduzVelocidade: null,
          observaLados: null,
          respeitaPreferencial: null,
          respeitaSemaforos: null,
          realizacoesConversoes: null,
        },
        encerramentoConducao: {
          estacionaLocalSeguro: null,
          acionaFreioEstacionamento: null,
          cambioPosicaoAdequada: null,
          desligaVeiculo: null,
          segurancaAntesSair: null,
        },
        avaliacaoComportamental: {
          atencaoTransito: null,
          obedienciaNormas: null,
          controleEmocional: null,
          tomadaDecisao: null,
          direcaoDefensiva: null,
          comunicacaoInstrutor: null,
        },
      },
    };
  });

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [addedTimeMinutes, setAddedTimeMinutes] = useState(0);
  const [showDetailedEvaluation, setShowDetailedEvaluation] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertedSecondsRef = useRef<number>(0);

  const maxSeconds = (50 + addedTimeMinutes) * 60;

  // States for student-to-instructor rating
  const [ratingVal, setRatingVal] = useState<number>(0);
  const [hoverRatingVal, setHoverRatingVal] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) {
      console.log("Audio init failed", e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (classData?.status === "IN_PROGRESS" && classData.startTime) {
      interval = setInterval(() => {
        const diff = differenceInSeconds(
          new Date(),
          new Date(classData.startTime!),
        );

        if (diff >= maxSeconds) {
          if (lastAlertedSecondsRef.current !== maxSeconds) {
            playAlertSound();
            lastAlertedSecondsRef.current = maxSeconds;
          }
          setElapsedSeconds(maxSeconds);
        } else {
          setElapsedSeconds(diff);
        }
      }, 1000);
    } else if (classData?.status === "IN_PROGRESS" && !classData.startTime) {
      // fallback in case of no start time
    }
    return () => clearInterval(interval);
  }, [classData?.status, classData?.startTime, maxSeconds]);

  if (!classData || !currentUser) {
    return <div>Aula não encontrada ou acesso negado.</div>;
  }

  const isInstructor = currentUser.role === "INSTRUCTOR";
  const isStudent = currentUser.role === "STUDENT";

  if (
    isInstructor &&
    classData.instructorId !== currentUser.id &&
    currentUser.role !== "ADMIN"
  ) {
    // maybe administrators can view too? But wait, let's keep it simple.
  }

  // Permissões
  if (
    currentUser.role !== "ADMIN" &&
    currentUser.role !== "INSTRUCTOR" &&
    currentUser.id !== classData.studentId
  ) {
    return <div>Aula não encontrada ou acesso negado.</div>;
  }

  const isScheduled = classData.status === "SCHEDULED";
  const isInProgress = classData.status === "IN_PROGRESS";
  const isFinished =
    classData.status === "COMPLETED" || classData.status === "CANCELED";

  const allChecked = Object.values(checklist).every((v) => v === true);

  const calculateScore = () => {
    if (!evaluation.checklistItemScores) return 0;
    const scores = evaluation.checklistItemScores;
    let totalPoints = 0;
    let maxPoints = 0;

    const sections = Object.values(scores);
    sections.forEach((section) => {
      Object.values(section).forEach((grade) => {
        if (grade !== null) {
          maxPoints += 1;
          if (grade === "CONF") totalPoints += 1;
          else if (grade === "OBS") totalPoints += 0.5;
        }
      });
    });

    if (maxPoints === 0) return 0;
    return (totalPoints / maxPoints) * 100;
  };

  const currentScore = calculateScore();
  const hasVeto =
    evaluation.overall === "REGULAR" ||
    evaluation.overall === "NECESSITA_REFORCO";
  const isAptoEligible =
    currentScore >= 80 &&
    (evaluation.overall === "BOA" || evaluation.overall === "EXCELENTE");

  const isStudentApto = student?.observation?.includes("[APTO_DETRAN]") ?? false;



  const handleSubmitRating = async () => {
    if (ratingVal === 0) return;
    setIsSubmittingRating(true);
    try {
      const updatedEvaluation: Evaluation = {
        ...evaluation,
        instructorRating: {
          rating: ratingVal,
          comment: ratingComment.trim() || undefined,
          createdAt: new Date().toISOString(),
        }
      };
      
      await updateClass(classData.id, {
        evaluation: updatedEvaluation,
      });
      setEvaluation(updatedEvaluation);
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleStartClass = () => {
    updateClass(classData.id, {
      status: "IN_PROGRESS",
      startTime: new Date().toISOString(),
      checklist,
      startLocation: { lat: -23.5505, lng: -46.6333 }, // Mock GPS
    });
  };

  const handleAddExtraTime = () => {
    // Re-anchor the startTime so that exactly maxSeconds have passed.
    // This allows the timer to resume counting smoothly from maxSeconds.
    const now = new Date();
    const newStartTime = new Date(
      now.getTime() - maxSeconds * 1000,
    ).toISOString();
    updateClass(classData.id, {
      startTime: newStartTime,
    });
    setAddedTimeMinutes((prev) => prev + 10);
  };

  const handleEndClass = () => {
    updateClass(classData.id, {
      status: "COMPLETED",
      endTime: new Date().toISOString(),
      evaluation,
      endLocation: { lat: -23.5505, lng: -46.6333 }, // Mock GPS
    });
    navigate("/");
  };

  const handleCancelClass = () => {
    updateClass(classData.id, {
      status: "CANCELED",
      cancelReason,
      endTime: new Date().toISOString(),
    });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      {/* Navbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Detalhes da Aula
          </h1>
        </div>
        {(isScheduled || classData.status === "COMPLETED" || classData.status === "CANCELED") && (currentUser?.role === "ADMIN" || currentUser?.role === "INSTRUCTOR") && (
          <button
            onClick={() => navigate(`/schedule/${classData.id}`)}
            className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {format(new Date(classData.scheduledDate), "HH:mm")}
              </p>
              {classSequenceNumber > 0 && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-850 border border-orange-200">
                  {classSequenceNumber}ª Aula
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 capitalize">
              {format(new Date(classData.scheduledDate), "EEEE, d 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                isScheduled && "bg-slate-100 text-slate-700",
                isInProgress && "bg-orange-100 text-orange-700 animate-pulse",
                classData.status === "COMPLETED" &&
                  "bg-green-100 text-green-700",
                classData.status === "CANCELED" && "bg-red-100 text-red-700",
              )}
            >
              {classData.status === "IN_PROGRESS"
                ? "Em Andamento"
                : classData.status === "COMPLETED"
                  ? "Concluída"
                  : classData.status === "CANCELED"
                    ? "Cancelada"
                    : "Agendada"}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              {student?.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {student?.name}
              </p>
              <p className="text-xs text-slate-500">CPF: {student?.cpf}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {vehicle?.model} • Cat. {vehicle?.category}
              </p>
              <p className="text-xs text-slate-500">Placa: {vehicle?.plate}</p>
            </div>
          </div>
          {classSequenceNumber > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <GraduationCap className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {classSequenceNumber}ª de {totalClassesCount} aulas registradas
                </p>
                <p className="text-xs text-slate-500">
                  {classData.status === "COMPLETED"
                    ? "Aula concluída para este aluno"
                    : classData.status === "CANCELED"
                      ? "Nesta data, o agendamento foi cancelado"
                      : "Sequência cronológica de aulas do aluno"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Class Checklist */}
      {isScheduled && !showCancel && isInstructor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Checklist Inicial Obrigatório
            </h2>
            {isInstructor && (
              <button
                onClick={() => {
                  const newVal = !allChecked;
                  setChecklist({
                    documentoConferido: newVal,
                    veiculoInspecionado: newVal,
                    combustivelSuficiente: newVal,
                    alunoPresente: newVal,
                    equipamentosConferidos: newVal,
                  });
                }}
                className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg"
              >
                {allChecked ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allChecked ? "Desmarcar Todos" : "Marcar Todos"}
              </button>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-2">
            {[
              { key: "alunoPresente", label: "Estou com o aluno" },
              {
                key: "documentoConferido",
                label: "Documento original conferido",
              },
              {
                key: "veiculoInspecionado",
                label: "Veículo em condições de uso",
              },
              { key: "combustivelSuficiente", label: "Combustível conferido" },
              {
                key: "equipamentosConferidos",
                label: "EPI / Cinto de segurança",
              },
            ].map(({ key, label }) => {
              const isChecked = checklist[key as keyof typeof checklist];
              return (
                <button
                  key={key}
                  disabled={!isInstructor}
                  onClick={() =>
                    setChecklist((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof checklist],
                    }))
                  }
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
                    isInstructor ? "hover:bg-slate-50" : "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isChecked ? "text-slate-900" : "text-slate-600",
                    )}
                  >
                    {label}
                  </span>
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </button>
              );
            })}
          </div>

          {isInstructor && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => setShowCancel(true)}
                className="py-4 px-4 bg-white border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-colors"
              >
                Cancelar/Falta
              </button>
              <button
                onClick={handleStartClass}
                disabled={!allChecked}
                className="py-4 px-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Iniciar Aula
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Workflow */}
      {showCancel && (
        <div className="bg-red-50 p-5 rounded-2xl border border-red-200 space-y-4">
          <h3 className="font-bold text-red-800">Registrar Ocorrência</h3>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-3 rounded-xl border border-red-200 bg-white"
          >
            <option value="">Selecione um motivo...</option>
            <option value="FALTA_ALUNO">Falta do Aluno</option>
            <option value="ATRASO_ALUNO">Atraso excessivo do aluno</option>
            <option value="PROBLEMA_MECANICO">Problema Mecânico</option>
            <option value="CHUVA">Chuva Intensa</option>
            <option value="OUTRO">Outro Motivo</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              className="flex-1 py-3 bg-white border border-slate-300 rounded-xl font-medium"
            >
              Voltar
            </button>
            <button
              onClick={handleCancelClass}
              disabled={!cancelReason}
              className="flex-1 py-3 bg-red-600 border border-red-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* In Progress Evaluation */}
      {isInProgress && (
        <div className="space-y-6">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-800 font-bold">
              <Clock className="w-5 h-5 animate-pulse" />
              Aula em andamento
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {elapsedSeconds >= maxSeconds && isInstructor && (
                  <button
                    onClick={handleAddExtraTime}
                    className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 flex items-center justify-center rounded-lg border border-orange-200 hover:bg-orange-200 transition-colors"
                  >
                    +10 Min
                  </button>
                )}
                <div className="text-xl font-mono font-bold text-orange-700 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-sm">
                  {String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0")}:
                  {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(
                    2,
                    "0",
                  )}
                  :{String(elapsedSeconds % 60).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>

          {isInstructor && (
            <div className="pt-6 border-t border-slate-100 mt-6">
              <div className="space-y-4">
                {evaluation.checklistItemScores && (
                  <div className="space-y-6">
                    {Object.entries({
                      conhecimentoVeiculo: {
                        label: "Conhecimento do Veículo",
                        items: {
                          bancoRetrovisorCinto: "Banco, Retrovisor e Cinto",
                          posicaoCambio: "Posição de câmbio",
                          ligaVeiculo: "Liga o veículo corretamente",
                          sinalizacao: "Sinalização correta",
                          observaPainel: "Observa painel de instrumentos",
                          setaAntesSair: "Aciona seta antes de sair",
                          checagemPontoCego: "Realiza checagem de ponto cego",
                          soltaFreioEstacionamento:
                            "Solta freio de estacionamento",
                          movimentacaoSeguranca:
                            "Inicia movimentação com segurança",
                        },
                      },
                      dominioVeiculo: {
                        label: "Domínio do Veículo",
                        items: {
                          usoPedais: "Uso correto dos pedais",
                          trocaMarcha: "Troca de marcha",
                          marchaRe: "Marcha ré",
                          colocarVaga: "Colocar o veículo na vaga",
                          estacionamentoParada: "Estacionamento e parada",
                          concentracao: "Concentração durante trajeto",
                          atencaoSeguranca: "Atenção a segurança",
                        },
                      },
                      atencaoSeguranca: {
                        label: "Atenção e Segurança",
                        items: {
                          maosVolante: "Mantém ambas as mãos no volante",
                          velocidadeCompativel: "Mantém velocidade compatível",
                          sinalizacaoVertical: "Respeita sinalização vertical",
                          sinalizacaoHorizontal:
                            "Respeita sinalização horizontal",
                          distanciaSegura: "Mantém distância segura",
                          utilizaSetas: "Utiliza setas corretamente",
                          observaRetrovisores:
                            "Observa retrovisores periodicamente",
                          frenagensSuaves: "Realiza frenagens suaves",
                          posicionamentoCorreto:
                            "Mantém posicionamento correto na faixa",
                          atencaoTransito:
                            "Demonstra atenção constante ao trânsito",
                        },
                      },
                      cruzamentosIntersecoes: {
                        label: "Cruzamentos e Interseções",
                        items: {
                          reduzVelocidade: "Reduz velocidade ao aproximar-se",
                          observaLados: "Observa ambos os lados da via",
                          respeitaPreferencial: "Respeita preferencial",
                          respeitaSemaforos: "Respeita semáforos",
                          realizacoesConversoes:
                            "Realiza conversões corretamente",
                        },
                      },
                      encerramentoConducao: {
                        label: "Encerramento da Condução",
                        items: {
                          estacionaLocalSeguro: "Estaciona em local seguro",
                          acionaFreioEstacionamento:
                            "Aciona freio de estacionamento",
                          cambioPosicaoAdequada:
                            "Coloca câmbio em posição adequada",
                          desligaVeiculo: "Desliga o veículo corretamente",
                          segurancaAntesSair:
                            "Verifica segurança antes de sair do veículo",
                        },
                      },
                      avaliacaoComportamental: {
                        label: "Avaliação Comportamental",
                        items: {
                          atencaoTransito: "Atenção ao trânsito",
                          obedienciaNormas: "Obediência às normas",
                          controleEmocional: "Controle emocional",
                          tomadaDecisao: "Tomada de decisão",
                          direcaoDefensiva: "Direção defensiva",
                          comunicacaoInstrutor: "Comunicação com instrutor",
                        },
                      },
                    }).map(([sectionKey, sectionObj]) => (
                      <div
                        key={sectionKey}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                      >
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">
                          {sectionObj.label}
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(sectionObj.items).map(
                            ([itemKey, itemLabel]) => {
                              const currentGrade = evaluation
                                .checklistItemScores![
                                sectionKey as keyof typeof evaluation.checklistItemScores
                              ][itemKey as any] as string | null;
                              return (
                                <div key={itemKey} className="space-y-2">
                                  <p className="font-medium text-slate-700 text-sm leading-tight">
                                    {itemLabel}
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { value: "CONF", label: "Conf." },
                                      { value: "N_CONF", label: "N. Conf." },
                                      { value: "OBS", label: "Obs." },
                                    ].map((grade) => (
                                      <button
                                        key={grade.value}
                                        onClick={() => {
                                          setEvaluation((prev) => ({
                                            ...prev,
                                            checklistItemScores: {
                                              ...prev.checklistItemScores!,
                                              [sectionKey]: {
                                                ...prev.checklistItemScores![
                                                  sectionKey as keyof typeof prev.checklistItemScores
                                                ],
                                                [itemKey]:
                                                  currentGrade === grade.value
                                                    ? null
                                                    : grade.value,
                                              },
                                            },
                                          }));
                                        }}
                                        className={cn(
                                          "py-2 px-1 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5",
                                          currentGrade === grade.value
                                            ? grade.value === "CONF"
                                              ? "bg-green-600 border-green-600 text-white"
                                              : grade.value === "OBS"
                                                ? "bg-orange-500 border-orange-500 text-white"
                                                : "bg-red-600 border-red-600 text-white"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                                        )}
                                      >
                                        {currentGrade === grade.value && (
                                          <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        {grade.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-slate-200 mt-2">
                      <h2 className="font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                        Avaliação e Evolução (Obrigatório)
                      </h2>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Avaliação Geral
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          "EXCELENTE",
                          "BOA",
                          "REGULAR",
                          "NECESSITA_REFORCO",
                        ].map((g) => (
                          <button
                            key={g}
                            onClick={() =>
                              setEvaluation((p) => ({
                                ...p,
                                overall: g as any,
                              }))
                            }
                            className={cn(
                              "py-2 px-3 rounded-xl border text-xs font-bold transition-colors",
                              evaluation.overall === g
                                ? "bg-orange-600 text-white border-orange-600"
                                : "bg-white text-slate-600 border-slate-200",
                            )}
                          >
                            {g.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary and Detran Eligibility */}
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Aproveitamento Total
                        </span>
                        <span
                          className={cn(
                            "font-bold text-lg",
                            currentScore >= 80
                              ? "text-green-600"
                              : "text-orange-600",
                          )}
                        >
                          {currentScore.toFixed(0)}%
                        </span>
                      </div>
                      {classSequenceNumber >= 5 ? (
                        <>
                          <div className="pt-3 border-t border-orange-100 flex items-center justify-between">
                            <span className="font-medium text-slate-700 text-sm">
                              Apto para prova prática Detran?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  if (student) {
                                    const cleanObs = (student.observation || "").replace("[APTO_DETRAN]", "").trim();
                                    await updateUser(student.id, { observation: cleanObs });
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer",
                                  !isStudentApto
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-white text-slate-600 border-slate-200",
                                )}
                              >
                                Não Apto
                              </button>
                              <button
                                onClick={async () => {
                                  if (student) {
                                    const cleanObs = (student.observation || "").replace("[APTO_DETRAN]", "").trim();
                                    const newObs = `[APTO_DETRAN] ${cleanObs}`.trim();
                                    await updateUser(student.id, { observation: newObs });
                                  }
                                }}
                                disabled={!isAptoEligible}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer",
                                  isStudentApto
                                    ? "bg-green-600 text-white border-green-600"
                                    : "bg-white text-slate-600 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed",
                                )}
                                title={
                                  !isAptoEligible
                                    ? "Critérios não atingidos (80% ou Avaliação Geral)"
                                    : ""
                                }
                              >
                                Apto
                              </button>
                            </div>
                          </div>
                          {!isAptoEligible && !hasVeto && (
                            <p className="text-[10px] text-orange-700/80 leading-tight">
                              * Aluno precisa ter aproveitamento de no mínimo 80% e
                              a Avaliação Geral deve ser "Boa" ou "Excelente" para
                              estar apto à prova.
                            </p>
                          )}
                          {!isAptoEligible && hasVeto && (
                            <p className="text-[10px] text-red-600 font-medium leading-tight px-1 uppercase tracking-tight">
                              * Bloqueado: A Avaliação Geral indica que o aluno "
                              {evaluation.overall === "REGULAR"
                                ? "É Regular"
                                : "Necessita de Reforço"}
                              ".
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="pt-3 border-t border-orange-100 text-xs text-slate-500 italic">
                          * A Avaliação de Aptidão (Detran) só pode ser realizada manualmente após a 5ª e última aula regular de simulação do aluno.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Observações Internas (Opcional)
                  </p>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    rows={3}
                    placeholder="Descreva pontos de atenção ou melhorias..."
                    value={evaluation.observations}
                    onChange={(e) =>
                      setEvaluation((p) => ({
                        ...p,
                        observations: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {isInstructor && (
            <button
              onClick={handleEndClass}
              disabled={evaluation.overall === null}
              className="w-full py-4 mt-6 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Finalizar Aula e Assinar
            </button>
          )}
        </div>
      )}

      {/* Finished Summary */}
      {isFinished && (
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-5">
          <h3 className="font-bold text-slate-900 border-b pb-2 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            Resumo da Aula e Avaliação Particular
          </h3>
          {classData.status === "CANCELED" ? (
            <div className="text-red-700 text-sm space-y-1">
              <p>
                <strong>Motivo do cancelamento:</strong>{" "}
                {classData.cancelReason}
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {(() => {
                const scoreSummaryObj = classData.evaluation?.checklistItemScores;
                let finishedScore = 0;
                if (scoreSummaryObj) {
                  let totalPoints = 0;
                  let maxPoints = 0;
                  Object.values(scoreSummaryObj).forEach((section) => {
                    Object.values(section).forEach((grade) => {
                      if (grade !== null) {
                        maxPoints += 1;
                        if (grade === "CONF") totalPoints += 1;
                        else if (grade === "OBS") totalPoints += 0.5;
                      }
                    });
                  });
                  if (maxPoints > 0) {
                    finishedScore = (totalPoints / maxPoints) * 100;
                  }
                } else {
                  finishedScore = currentScore;
                }

                return (
                  <>
                    {/* Infocard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Horário & Duração
                        </p>
                        <p className="font-bold text-slate-800 text-sm">
                          {format(new Date(classData.startTime!), "HH:mm")} -{" "}
                          {format(new Date(classData.endTime!), "HH:mm")}
                        </p>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {Math.max(
                            0,
                            Math.round(
                              (new Date(classData.endTime!).getTime() -
                                new Date(classData.startTime!).getTime()) /
                                60000,
                            ),
                          )}{" "}
                          minutos
                        </span>
                      </div>

                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Aproveitamento Clínico
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-lg font-extrabold",
                              finishedScore >= 80
                                ? "text-green-600"
                                : "text-orange-600",
                            )}
                          >
                            {finishedScore.toFixed(0)}%
                          </span>
                          <div className="h-2 bg-slate-100 rounded-full flex-1 max-w-[80px]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                finishedScore >= 80
                                  ? "bg-green-500"
                                  : "bg-orange-500",
                              )}
                              style={{ width: `${finishedScore}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-450 font-medium">
                          Mínimo necessário: 80%
                        </span>
                      </div>

                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Avaliação Geral
                        </p>
                        {classData.evaluation?.overall ? (
                          <div>
                            <span
                              className={cn(
                                "inline-block text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg",
                                classData.evaluation.overall === "EXCELENTE" &&
                                  "bg-green-100 text-green-800 border border-green-200",
                                classData.evaluation.overall === "BOA" &&
                                  "bg-emerald-100 text-emerald-800 border border-emerald-200",
                                classData.evaluation.overall === "REGULAR" &&
                                  "bg-yellow-100 text-yellow-850 border border-yellow-250",
                                classData.evaluation.overall ===
                                  "NECESSITA_REFORCO" &&
                                  "bg-red-100 text-red-800 border border-red-200",
                              )}
                            >
                              {classData.evaluation.overall.replace("_", " ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Não informada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Detran Card */}
                    {student && (
                      <div
                        className={cn(
                          "p-4 rounded-xl border flex flex-col gap-1",
                          isStudentApto
                            ? "bg-green-50/50 border-green-200 text-green-900"
                            : "bg-red-50/50 border-red-200 text-red-900",
                        )}
                      >
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                          Parecer Geral sobre a Aptidão do Aluno (Detran)
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              isStudentApto
                                ? "bg-green-500"
                                : "bg-red-500",
                            )}
                          />
                          <p className="text-sm font-bold">
                            {isStudentApto
                              ? "Apto para a prova prática do Detran!"
                              : "Ainda não apto para a prova prática."}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {isStudentApto
                            ? "Com base em todas as aulas praticadas, o instrutor certifica que o aluno cumpre todos os requisitos para o exame oficial."
                            : "O aluno requer prática adicional e acompanhamento nos quesitos sinalizados para atingir plena prontidão para o exame prático."}
                        </p>
                      </div>
                    )}

                    {/* Observations Card */}
                    {classData.evaluation?.observations && (
                      <div className="bg-orange-50/30 border border-orange-100 p-4 rounded-xl">
                        <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1.5 font-mono">
                          Parecer Técnico do Instrutor Particular
                        </p>
                        <p className="text-slate-705 italic text-sm leading-relaxed">
                          "{classData.evaluation.observations}"
                        </p>
                      </div>
                    )}

                    {/* Score breakdown by category */}
                    {scoreSummaryObj && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Desempenho por Módulo de Habilidade
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                          {(() => {
                            const categoriesMap = {
                              conhecimentoVeiculo: "Conhecimento do Veículo",
                              dominioVeiculo: "Domínio do Veículo",
                              atencaoSeguranca: "Atenção e Segurança",
                              cruzamentosIntersecoes: "Cruzamentos e Interseções",
                              encerramentoConducao:
                                "Encerramento da Condução",
                              avaliacaoComportamental:
                                "Avaliação Comportamental",
                            };

                            return Object.entries(categoriesMap).map(
                              ([key, label]) => {
                                const categoryItems =
                                  scoreSummaryObj[
                                    key as keyof typeof scoreSummaryObj
                                  ] || {};
                                const confCount = Object.values(
                                  categoryItems,
                                ).filter((v) => v === "CONF").length;
                                const obsCount = Object.values(
                                  categoryItems,
                                ).filter((v) => v === "OBS").length;
                                const nconfCount = Object.values(
                                  categoryItems,
                                ).filter((v) => v === "N_CONF").length;
                                const totalEvaluated = confCount + obsCount + nconfCount;
                                const pct =
                                  totalEvaluated > 0
                                    ? ((confCount + obsCount * 0.5) /
                                        totalEvaluated) *
                                      100
                                    : 0;
                                const hasEvaluation = totalEvaluated > 0;

                                return (
                                  <div
                                    key={key}
                                    className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-slate-700 text-sm">
                                        {label}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        {confCount > 0 && (
                                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                            {confCount} Conf.
                                          </span>
                                        )}
                                        {obsCount > 0 && (
                                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                            {obsCount} Obs.
                                          </span>
                                        )}
                                        {nconfCount > 0 && (
                                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                            {nconfCount} N. Conf.
                                          </span>
                                        )}
                                        {!hasEvaluation && (
                                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase border border-slate-200 border-dashed">
                                            Sem registros nesta aula
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      {hasEvaluation ? (
                                        <>
                                          <span
                                            className={cn(
                                              "text-xs font-black",
                                              pct >= 80
                                                ? "text-green-600"
                                                : "text-amber-600",
                                            )}
                                          >
                                            {pct.toFixed(0)}%
                                          </span>
                                          <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                                            <div
                                              className={cn(
                                                "h-full rounded-full",
                                                pct >= 80
                                                  ? "bg-green-500"
                                                  : "bg-amber-500",
                                              )}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                                          Não Avaliado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              },
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Drilldown view */}
                    {scoreSummaryObj && (
                      <div className="pt-2">
                        <button
                          onClick={() =>
                            setShowDetailedEvaluation(!showDetailedEvaluation)
                          }
                          className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-300/30"
                        >
                          {showDetailedEvaluation
                            ? "Ocultar Detalhes do Checklist"
                            : "Ver Detalhes por Item do Checklist"}
                        </button>

                        {showDetailedEvaluation && (
                          <div className="mt-3 space-y-4 max-h-[350px] overflow-y-auto pr-1 border border-slate-200 p-4 rounded-2xl bg-white shadow-inner">
                            {(() => {
                              const categoriesDef = {
                                conhecimentoVeiculo: {
                                  label: "Conhecimento do Veículo",
                                  items: {
                                    bancoRetrovisorCinto:
                                      "Banco, Retrovisor e Cinto",
                                    posicaoCambio: "Posição de câmbio",
                                    ligaVeiculo: "Liga o veículo corretamente",
                                    sinalizacao: "Sinalização correta",
                                    observaPainel:
                                      "Observa painel de instrumentos",
                                    setaAntesSair: "Aciona seta antes de sair",
                                    checagemPontoCego:
                                      "Realiza checagem de ponto cego",
                                    soltaFreioEstacionamento:
                                      "Solta freio de estacionamento",
                                    movimentacaoSeguranca:
                                      "Inicia movimentação com segurança",
                                  },
                                },
                                dominioVeiculo: {
                                  label: "Domínio do Veículo",
                                  items: {
                                    usoPedais: "Uso correto dos pedais",
                                    trocaMarcha: "Troca de marcha",
                                    marchaRe: "Marcha ré",
                                    colocarVaga: "Colocar o veículo na vaga",
                                    estacionamentoParada:
                                      "Estacionamento e parada",
                                    concentracao:
                                      "Concentração durante trajeto",
                                    atencaoSeguranca: "Atenção a segurança",
                                  },
                                },
                                atencaoSeguranca: {
                                  label: "Atenção e Segurança",
                                  items: {
                                    maosVolante:
                                      "Mantém ambas as mãos no volante",
                                    velocidadeCompativel:
                                      "Mantém velocidade compatível",
                                    sinalizacaoVertical:
                                      "Respeita sinalização vertical",
                                    sinalizacaoHorizontal:
                                      "Respeita sinalização horizontal",
                                    distanciaSegura: "Mantém distância segura",
                                    utilizaSetas: "Utiliza setas corretamente",
                                    observaRetrovisores:
                                      "Observa retrovisores periodicamente",
                                    frenagensSuaves: "Realiza frenagens suaves",
                                    posicionamentoCorreto:
                                      "Mantém posicionamento correto na faixa",
                                    atencaoTransito:
                                      "Demonstra atenção constante ao trânsito",
                                  },
                                },
                                cruzamentosIntersecoes: {
                                  label: "Cruzamentos e Interseções",
                                  items: {
                                    reduzVelocidade:
                                      "Reduz velocidade ao aproximar-se",
                                    observaLados: "Observa ambos os lados da via",
                                    respeitaPreferencial: "Respeita preferencial",
                                    respeitaSemaforos: "Respeita semáforos",
                                    realizacoesConversoes:
                                      "Realiza conversões corretamente",
                                  },
                                },
                                encerramentoConducao: {
                                  label: "Encerramento da Condução",
                                  items: {
                                    estacionaLocalSeguro:
                                      "Estaciona em local seguro",
                                    acionaFreioEstacionamento:
                                      "Aciona freio de estacionamento",
                                    cambioPosicaoAdequada:
                                      "Coloca câmbio em posição adequada",
                                    desligaVeiculo: "Desliga o veículo corretamente",
                                    segurancaAntesSair:
                                      "Verifica segurança antes de sair do veículo",
                                  },
                                },
                                avaliacaoComportamental: {
                                  label: "Avaliação Comportamental",
                                  items: {
                                    atencaoTransito: "Atenção ao trânsito",
                                    obedienciaNormas: "Obediência às normas",
                                    controleEmocional: "Controle emocional",
                                    tomadaDecisao: "Tomada de decisão",
                                    direcaoDefensiva: "Direção defensiva",
                                    comunicacaoInstrutor:
                                      "Comunicação com instrutor",
                                  },
                                },
                              };

                              return Object.entries(categoriesDef).map(
                                ([catKey, catObj]) => {
                                  const catScores =
                                    scoreSummaryObj[
                                      catKey as keyof typeof scoreSummaryObj
                                    ] || {};
                                  return (
                                    <div key={catKey} className="space-y-1.5">
                                      <h4 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 mt-2">
                                        {catObj.label}
                                      </h4>
                                      <div className="space-y-1 divide-y divide-slate-50">
                                        {Object.entries(catObj.items).map(
                                          ([itmKey, itmLabel]) => {
                                            const grade = catScores[itmKey as any];
                                            return (
                                              <div
                                                key={itmKey}
                                                className="flex justify-between items-center py-1.5 text-xs text-slate-600"
                                              >
                                                <span>{itmLabel}</span>
                                                <span
                                                  className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                    grade === "CONF" &&
                                                      "bg-green-50 text-green-700 font-bold",
                                                    grade === "OBS" &&
                                                      "bg-orange-50 text-orange-700 font-bold",
                                                    grade === "N_CONF" &&
                                                      "bg-red-50 text-red-700 font-bold",
                                                    !grade &&
                                                      "bg-slate-100 text-slate-400",
                                                  )}
                                                >
                                                  {grade === "CONF"
                                                    ? "Conf."
                                                    : grade === "OBS"
                                                      ? "Obs."
                                                      : grade === "N_CONF"
                                                        ? "N. Conf."
                                                        : "-"}
                                                </span>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  );
                                },
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Instructor Rating Section */}
      {classData.status === "COMPLETED" && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
              <Star className="w-4 h-4 fill-orange-500 stroke-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Avaliação do Instrutor</h3>
              <p className="text-[11px] text-slate-500">
                {isStudent 
                  ? "Sua percepção e nota para o atendimento deste instrutor nesta aula" 
                  : "Feedback e nota enviada pelo aluno sobre esta aula"}
              </p>
            </div>
          </div>

          {classData.evaluation?.instructorRating ? (
            /* Rated view */
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nota atribuída:</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= (classData.evaluation?.instructorRating?.rating || 0)
                            ? "fill-orange-500 stroke-orange-500"
                            : "stroke-slate-300 fill-none"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {classData.evaluation?.instructorRating?.createdAt && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {format(new Date(classData.evaluation.instructorRating.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                )}
              </div>
              <div className="text-slate-700 bg-white border border-slate-200/40 p-3 rounded-lg text-xs leading-relaxed">
                <span className="text-slate-600 italic">
                  {classData.evaluation?.instructorRating?.comment 
                    ? `"${classData.evaluation?.instructorRating?.comment}"`
                    : "Sem observações por escrito."}
                </span>
              </div>
            </div>
          ) : isStudent ? (
            /* Unrated view for Student (Input view) */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Como foi sua aula com o instrutor {instructor?.name || "técnico"}?
                </label>
                <div className="flex items-center gap-2 py-1 flex-wrap">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRatingVal(star)}
                      onMouseLeave={() => setHoverRatingVal(0)}
                      onClick={() => setRatingVal(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 transition-colors",
                          star <= (hoverRatingVal || ratingVal)
                            ? "fill-orange-500 stroke-orange-500"
                            : "stroke-slate-300 fill-none hover:stroke-orange-400"
                        )}
                      />
                    </button>
                  ))}
                  {ratingVal > 0 && (
                    <span className="text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-850 border border-orange-200 animate-in fade-in zoom-in duration-150">
                      {ratingVal === 5 && "Excelente (5)"}
                      {ratingVal === 4 && "Muito Bom (4)"}
                      {ratingVal === 3 && "Regular (3)"}
                      {ratingVal === 2 && "Muito Fraco (2)"}
                      {ratingVal === 1 && "Péssimo (1)"}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Comentário adicional (opcional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Escreva um comentário sobre a didática, paciência, clareza nas explicações..."
                  rows={2}
                  maxLength={250}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50/50"
                />
              </div>

              <button
                type="button"
                disabled={ratingVal === 0 || isSubmittingRating}
                onClick={handleSubmitRating}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingRating ? "Enviando..." : "Enviar Avaliação"}
              </button>
            </div>
          ) : (
            /* Unrated view for Instructor / Owner */
            <div className="py-4 text-center border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">O aluno ainda não registrou avaliações para esta aula.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
