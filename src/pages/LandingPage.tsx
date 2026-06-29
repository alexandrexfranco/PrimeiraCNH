import { Link, Navigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { Car, ShieldCheck, Clock, ChevronRight, User, TrendingDown, Wallet, Timer, CheckCircle2, ShieldAlert, Smartphone, Users, Calendar, AlertTriangle, Medal, Shield } from 'lucide-react';

export function LandingPage() {
  const { currentUser } = useAppStore();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <img src="/LogoGV3.png?v=1" alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Primeira CNH</span>
          </div>
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm font-semibold transition-all backdrop-blur-md"
          >
            <User className="w-4 h-4" />
            Acessar Sistema
          </Link>
        </header>

        {/* Hero Section */}
        <main className="mt-20 lg:mt-32 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-md">
              Acelere a conquista da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">CNH</span>.
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
              Gestão inteligente de aulas práticas, relatórios detalhados e acompanhamento em tempo real para alunos e instrutores.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(234,88,12,0.6)] hover:shadow-[0_0_60px_-15px_rgba(234,88,12,0.8)] hover:-translate-y-1"
              >
                Entrar no Sistema
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="relative mt-12 lg:mt-0">
            {/* Decorative Glass Cards */}
            <div className="relative z-10 p-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src="/Modelos.webp" 
                alt="Modelos" 
                className="rounded-2xl w-full h-auto sm:h-[400px] sm:object-cover bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1470&auto=format&fit=crop";
                }}
              />
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -left-2 sm:-bottom-8 sm:-left-8 p-4 sm:p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-3 sm:gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Aprovação</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">98%</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Section 1: Termômetro de Investimento */}
        <div className="mt-40 pt-16 border-t border-white/10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">O Termômetro de Investimento CNH</h2>
            <div className="inline-block p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-lg md:text-xl font-semibold text-red-400">
                Redução de mais de 60% no custo para o colaborador e corte pela metade no tempo de formação.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mercado */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingDown className="w-32 h-32 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-8 flex items-center gap-3">
                <span className="w-3 h-8 bg-slate-500 rounded-full"></span>
                Mercado
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                    <Wallet className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium mb-1">Custo médio</p>
                    <p className="text-xl font-bold text-slate-200">R$ 2.214 a R$ 2.714</p>
                    <p className="text-sm text-slate-500 mt-1">(Exames + Taxas + Autoescola R$1.5k-2k)</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                    <Timer className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium mb-1">Tempo médio</p>
                    <p className="text-xl font-bold text-slate-200">6 Meses</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Via Transilva */}
            <div className="p-8 rounded-3xl bg-indigo-900/40 border border-indigo-500/30 backdrop-blur-sm relative overflow-hidden shadow-[0_0_40px_-15px_rgba(79,70,229,0.3)]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-32 h-32 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-indigo-300 mb-8 flex items-center gap-3">
                <span className="w-3 h-8 bg-indigo-500 rounded-full"></span>
                Via Transilva
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Wallet className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-300/80 font-medium mb-1">Custo ao Colaborador</p>
                    <p className="text-2xl font-bold text-white">Apenas R$ 714</p>
                    <p className="text-sm text-indigo-300 mt-1">(Exames e Taxas Detran)</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Car className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-300/80 font-medium mb-1">Investimento Transilva</p>
                    <p className="text-lg font-bold text-white">Veículo e Instrutor assumidos pela empresa</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Timer className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-300/80 font-medium mb-1">Tempo médio</p>
                    <p className="text-xl font-bold text-white">3 Meses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Elegibilidade e Retenção */}
        <div className="mt-32 pt-16 border-t border-white/10">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">Elegibilidade e Retenção de Talentos</h2>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Critérios de Acesso */}
            <div>
              <h3 className="text-2xl font-bold text-slate-200 mb-8 text-center lg:text-left">Critérios de Acesso</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shrink-0 shadow-lg">
                    <Clock className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Vínculo Ativo</p>
                    <p className="text-slate-400">(&gt;3 meses)</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shrink-0 shadow-lg">
                    <User className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Perfil Operacional</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shrink-0 shadow-lg">
                    <Medal className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Alto Desempenho e Assiduidade</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Escudo de Retenção */}
            <div>
              <h3 className="text-2xl font-bold text-slate-200 mb-8 text-center lg:text-left">Escudo de Retenção<br/><span className="text-lg text-slate-400 font-normal">Regras de Reembolso em caso de saída</span></h3>
              <div className="space-y-4 relative">
                {/* Connecting line */}
                <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-800 rounded-full hidden sm:block"></div>
                
                <div className="relative flex items-center gap-6 p-6 rounded-2xl bg-red-900/20 border border-red-500/30">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/50 shrink-0 z-10">
                    <ShieldAlert className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Até 6 Meses após conclusão</p>
                    <p className="text-red-300 font-medium">Reembolso de 100% à empresa</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-6 p-6 rounded-2xl bg-orange-900/20 border border-orange-500/30 ml-0 sm:ml-8">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/50 shrink-0 z-10">
                    <Shield className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">De 6 a 11 Meses</p>
                    <p className="text-orange-300 font-medium">Reembolso de 70%</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-6 p-6 rounded-2xl bg-indigo-900/30 border border-indigo-500/30 ml-0 sm:ml-16">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 shrink-0 z-10">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">A partir de 12 Meses</p>
                    <p className="text-indigo-300 font-medium">Isento (Retenção garantida)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-300">
              <span className="font-bold text-white">Modelos de Concessão:</span> Possibilidade de 100% Patrocinado ou Co-participação.
            </p>
          </div>
        </div>

        {/* Section 3: Gestão de Aprendizado */}
        <div className="mt-32 mb-20 pt-16 border-t border-white/10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Gestão de Aprendizado na Palma da Mão</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Controle rigoroso de horas, aulas e lições aprendidas via aplicativo Primeira CNH.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center relative">
            <div className="space-y-8 md:col-span-1 order-2 md:order-1">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative">
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full border-4 border-slate-900 hidden md:block"></div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">1</div>
                  <h4 className="text-xl font-bold text-white">Painel do Instrutor</h4>
                </div>
                <p className="text-slate-400 pl-14">Gestão de Alunos e Relatórios de tempo total.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative">
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full border-4 border-slate-900 hidden md:block"></div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">2</div>
                  <h4 className="text-xl font-bold text-white">Agendamento de Aulas</h4>
                </div>
                <p className="text-slate-400 pl-14">Controle de veículos e horários.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative">
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full border-4 border-slate-900 hidden md:block"></div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">3</div>
                  <h4 className="text-xl font-bold text-white">Área do Aluno</h4>
                </div>
                <p className="text-slate-400 pl-14">Acompanhamento de progresso e histórico.</p>
              </div>
            </div>

            <div className="md:col-span-2 order-1 md:order-2 flex justify-center">
              <div className="relative max-w-sm w-full mx-auto">
                <div className="aspect-[9/19] rounded-[3rem] border-[8px] border-slate-800 bg-slate-950 p-2 shadow-2xl relative overflow-hidden">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                  
                  {/* Phone screen content (simplified mockup of the app) */}
                  <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col pt-10">
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 hide-scrollbar">
                      <div className="flex flex-col items-center pt-4 pb-6">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg">P</div>
                        <h3 className="font-bold text-slate-900">Primeira CNH</h3>
                        <p className="text-xs text-slate-500">Acesse informando suas credenciais.</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">Painel do Instrutor</h4>
                        <p className="text-xs text-slate-500 mb-3">Sexta-Feira, 5 De Junho</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3"/> 09:00 - 06/06/26</span>
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Agendada</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">J</div>
                              <span className="text-xs text-slate-700 font-medium">João Aluno</span>
                            </div>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-3 h-3 block bg-slate-300 rounded-full"></span> Centro de Treinamento</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-200 bg-green-50/50">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">Progresso Prático</h4>
                            <p className="text-xs text-slate-600">0 de 5 aulas mínimas concluídas</p>
                            <p className="text-[10px] text-orange-600 font-medium mt-1">Atenção: São necessárias 2 aulas obrigatórias e no mínimo 5 aulas no total.</p>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-right mt-1">0% Concluído</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="p-4 md:p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center gap-4 justify-center text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-lg md:text-xl font-bold text-red-400">
                Atenção: Faltas não justificadas ou reprovação = critério eliminatório.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-white/10 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Primeira CNH. Todos os direitos reservados.
          </p>
          <Link to="/termos" className="text-slate-400 hover:text-white text-sm transition-colors">
            Termos e Condições de Uso
          </Link>
        </footer>
      </div>
    </div>
  );
}

