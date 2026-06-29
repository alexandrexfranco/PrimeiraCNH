export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  role: Role;
  name: string;
  cpf: string;
  password?: string;
  email?: string;
  phone?: string;
  registro?: string;
  createdAt?: string;
  status: 'ACTIVE' | 'IN_TRAINING' | 'COMPLETED' | 'DROPPED' | 'BLOCKED';
  
  // Student specific
  category?: 'A' | 'B' | 'AB';
  enrolledAt?: string;
  photoUrl?: string;
  jobRole?: string;
  observation?: string;
  
  // Instructor specific Work Vehicle
  vehicleId?: string;
}

export type ClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'MISSED';

export type SkillGrade = 'CONF' | 'N_CONF' | 'OBS' | null;

export interface Evaluation {
  overall: 'EXCELENTE' | 'BOA' | 'REGULAR' | 'NECESSITA_REFORCO' | null;
  isReadyForExam?: boolean; // Apto ou Não apto (Detran)
  checklistItemScores?: {
    conhecimentoVeiculo: {
      bancoRetrovisorCinto: SkillGrade;
      posicaoCambio: SkillGrade;
      ligaVeiculo: SkillGrade;
      sinalizacao: SkillGrade;
      observaPainel: SkillGrade;
      setaAntesSair: SkillGrade;
      checagemPontoCego: SkillGrade;
      soltaFreioEstacionamento: SkillGrade;
      movimentacaoSeguranca: SkillGrade;
    };
    dominioVeiculo: {
      usoPedais: SkillGrade;
      trocaMarcha: SkillGrade;
      marchaRe: SkillGrade;
      colocarVaga: SkillGrade;
      estacionamentoParada: SkillGrade;
      concentracao: SkillGrade;
      atencaoSeguranca: SkillGrade;
    };
    atencaoSeguranca: {
      maosVolante: SkillGrade;
      velocidadeCompativel: SkillGrade;
      sinalizacaoVertical: SkillGrade;
      sinalizacaoHorizontal: SkillGrade;
      distanciaSegura: SkillGrade;
      utilizaSetas: SkillGrade;
      observaRetrovisores: SkillGrade;
      frenagensSuaves: SkillGrade;
      posicionamentoCorreto: SkillGrade;
      atencaoTransito: SkillGrade;
    };
    cruzamentosIntersecoes: {
      reduzVelocidade: SkillGrade;
      observaLados: SkillGrade;
      respeitaPreferencial: SkillGrade;
      respeitaSemaforos: SkillGrade;
      realizacoesConversoes: SkillGrade;
    };
    encerramentoConducao: {
      estacionaLocalSeguro: SkillGrade;
      acionaFreioEstacionamento: SkillGrade;
      cambioPosicaoAdequada: SkillGrade;
      desligaVeiculo: SkillGrade;
      segurancaAntesSair: SkillGrade;
    };
    avaliacaoComportamental: {
      atencaoTransito: SkillGrade;
      obedienciaNormas: SkillGrade;
      controleEmocional: SkillGrade;
      tomadaDecisao: SkillGrade;
      direcaoDefensiva: SkillGrade;
      comunicacaoInstrutor: SkillGrade;
    };
  };
  skills?: {
    partida: boolean;
    controleEmbreagem: boolean;
    trocaMarchas: boolean;
    baliza: boolean;
    conversao: boolean;
    estacionamento: boolean;
    controleVeiculo: boolean;
    direcaoDefensiva: boolean;
    sinalizacao: boolean;
    circulacaoUrbana: boolean;
  };
  observations?: string;
  instructorRating?: {
    rating: number; // 1 a 5 estrelas
    comment?: string;
    createdAt?: string;
  };
}

export interface ClassSession {
  id: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  scheduledDate: string; // ISO date string
  startTime?: string;
  endTime?: string;
  status: ClassStatus;
  
  // GPS Tracking
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
  
  // Checklists (before start)
  checklist?: {
    documentoConferido: boolean;
    veiculoInspecionado: boolean;
    combustivelSuficiente: boolean;
    alunoPresente: boolean;
    equipamentosConferidos: boolean;
  };

  evaluation?: Evaluation;

  cancelReason?: string;
  cancelObservations?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  category: 'A' | 'B';
  status: 'ACTIVE' | 'MAINTENANCE';
}
