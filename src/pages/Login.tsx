import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, User as UserIcon, GraduationCap, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { Role } from '../types';

const ROLE_ICONS: Record<Role, React.ElementType> = {
  ADMIN: Shield,
  INSTRUCTOR: UserIcon,
  STUDENT: GraduationCap,
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export function Login() {
  const { users, login, currentUser, error: appError } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'SEU_SUPABASE_PROJECT_URL';

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.cpf === cpf);
    if (user) {
      if (user.password && user.password !== password) {
         setError('Senha incorreta.');
         return;
      }
      if (user.status === 'BLOCKED') {
         setError('Este usuário está suspenso ou bloqueado. Entre em contato com a administração.');
         return;
      }
      login(user.id);
      navigate('/');
    } else {
      setError('CPF não encontrado. Verifique e tente novamente.');
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setCpf(formatCPF(e.target.value));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white overflow-hidden p-2">
            <img src="/LogoGV3.png?v=1" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Primeira CNH
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Acesse informando suas credenciais.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {appError && (
          <div className="mb-6 mx-4 sm:mx-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm leading-tight shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Erro ao conectar com o banco de dados:</strong>
                Ocorreu o seguinte erro durante o carregamento dos dados:<br/>
                <code className="text-xs bg-red-100 p-1 rounded mt-1 block max-h-32 overflow-auto break-all">
                  {appError}
                </code>
                <p className="mt-2 text-xs">
                  Acesse seu banco de dados no Supabase e verifique se as tabelas corretas foram criadas e as permissões RLS (Row Level Security) estão configuradas para permitir acesso.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="mb-6 mx-4 sm:mx-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm leading-tight shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Banco de Dados não conectado!</strong>
                As credenciais do Supabase não foram encontradas. Para conectar o aplicativo, abra o menu <strong>Settings</strong> do AI Studio (ícone de engrenagem) e adicione em "Secrets":<br/>
                <code className="text-xs bg-red-100 px-1 py-0.5 rounded mt-1 block w-fit">VITE_SUPABASE_URL</code>
                <code className="text-xs bg-red-100 px-1 py-0.5 rounded mt-1 block w-fit">VITE_SUPABASE_ANON_KEY</code>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {message && (
             <div className="mb-6 p-4 bg-green-50/50 border border-green-200 text-green-700 rounded-xl text-sm font-medium text-center">
               {message}
             </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">
                CPF
              </label>
              <div className="mt-1">
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors uppercase tracking-wider"
              >
                Entrar
              </button>
            </div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                Contas para teste (Senha: 123)
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {users.map(u => (
              <button 
                key={u.id}
                type="button"
                onClick={() => { setCpf(u.cpf); setPassword(u.password || '123'); }}
                className="text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-left"
              >
                <div className="font-bold flex items-center gap-1">
                   {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-slate-400" />}
                   {u.role === 'INSTRUCTOR' && <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                   {u.role === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-slate-400" />}
                   {u.role === 'ADMIN' ? 'Administrador' : u.role === 'INSTRUCTOR' ? 'Instrutor' : 'Aluno'}: {u.cpf}
                </div>
                <div className="text-[10px] mt-0.5">{u.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
