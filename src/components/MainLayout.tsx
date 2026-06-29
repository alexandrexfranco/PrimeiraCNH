import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { LogOut, Home, Calendar, Users, Settings, PieChart, Cloud, Lock, Download } from 'lucide-react';
import { cn } from '../lib/utils';

// Safely parse observation field to extract expiration date
function parseObservation(obsStr: string | undefined) {
  if (!obsStr) return { expiration: null };
  try {
    const data = JSON.parse(obsStr);
    if (data && typeof data === 'object') {
      return { expiration: data.expiration !== undefined ? data.expiration : null };
    }
  } catch (e) {
    // Falls back to direct date parsing below
  }
  if (obsStr && !isNaN(Date.parse(obsStr))) {
    return { expiration: obsStr };
  }
  return { expiration: null };
}

export function MainLayout() {
  const { currentUser, logout, updateUser } = useAppStore();
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const { expiration } = parseObservation(currentUser?.observation);

  const isExpiredInstructor = currentUser?.role === 'INSTRUCTOR' && 
    expiration && 
    !isNaN(Date.parse(expiration)) && 
    new Date() > new Date(expiration);

  useEffect(() => {
    if (isExpiredInstructor && currentUser && currentUser.status !== 'BLOCKED') {
      updateUser(currentUser.id, { status: 'BLOCKED' }).catch(err => {
        console.error("Error updating expired user status in Database:", err);
      });
    }
  }, [isExpiredInstructor, currentUser, updateUser]);

  if (!currentUser) {
    return <Navigate to="/home" replace />;
  }

  if (currentUser.status === 'BLOCKED' || isExpiredInstructor) {
    const isSubscriptionExpired = isExpiredInstructor || (
      currentUser.role === 'INSTRUCTOR' && 
      expiration && 
      !isNaN(Date.parse(expiration)) && 
      new Date() > new Date(expiration)
    );

    let blockedTitle = "Acesso Bloqueado";
    let blockedDesc = "Sua conta está suspensa ou bloqueada temporariamente pela administração do sistema.";

    if (isSubscriptionExpired) {
      const expDate = expiration ? new Date(expiration) : new Date();
      const lastDayDate = new Date(expDate.getTime() - 1000);
      const formattedLastDay = `${lastDayDate.getDate().toString().padStart(2, '0')}/${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}/${lastDayDate.getFullYear()}`;
      blockedTitle = "Período de Acesso Expirado";
      blockedDesc = `Sua assinatura corporativa expirou no dia ${formattedLastDay} às 23:59:59h.`;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-100">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-800">{blockedTitle}</h1>
            <p className="text-sm text-slate-500">
              {blockedDesc}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">O que isso significa?</p>
            <ul className="list-disc list-inside space-y-1">
              {currentUser.role === 'INSTRUCTOR' ? (
                isSubscriptionExpired ? (
                  <>
                    <li className="text-red-600 font-semibold">Seu contrato de acesso expirou.</li>
                    <li>Sua agenda operacional foi bloqueada para agendamentos.</li>
                    <li>Estatísticas e registros de aulas passadas estão preservados.</li>
                    <li>Solicite a renovação ao administrador do sistema.</li>
                  </>
                ) : (
                  <>
                    <li>Você não pode ministrar novas aulas práticas.</li>
                    <li>Invalidação temporária da agenda operacional.</li>
                    <li>Suas estatísticas estão preservadas no banco de dados.</li>
                  </>
                )
              ) : (
                <>
                  <li>Suas aulas práticas agendadas foram congeladas.</li>
                  <li>Agendamentos de novas aulas estão indisponíveis.</li>
                  <li>Sua evolução e relatórios estão salvos com segurança.</li>
                </>
              )}
            </ul>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Início', path: '/', icon: Home, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
    { label: 'Agendar', path: '/schedule', icon: Calendar, roles: ['INSTRUCTOR'] },
    { label: 'Relatórios', path: '/reports', icon: PieChart, roles: ['INSTRUCTOR'] },
    { label: 'Instrutores', path: '/manage-instructors', icon: Users, roles: ['ADMIN'] },
    { label: 'Alunos', path: '/manage-students', icon: Users, roles: ['INSTRUCTOR'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-slate-100">
                <img src="/LogoGV3.png?v=1" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-slate-900 tracking-tight">Primeira CNH</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-6">
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors border-b-2 py-5",
                      isActive ? "text-orange-600 border-orange-500" : "text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-sm"
                title="Instalar App no Celular"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {currentUser.role === 'ADMIN' ? 'Administrador' : currentUser.role === 'INSTRUCTOR' ? 'Instrutor' : 'Aluno'}
              </p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-orange-500" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-orange-600 hover:text-orange-700 font-bold"
            >
              <Download className="w-5 h-5 stroke-[2.5px]" />
              <span className="text-[10px] font-medium">Instalar</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
