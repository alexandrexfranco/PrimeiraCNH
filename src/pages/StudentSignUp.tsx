import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, GraduationCap, AlertCircle, KeyRound, User as UserIcon, Phone, Eye, EyeOff } from 'lucide-react';

export function StudentSignUp() {
  const { addUser, users } = useAppStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<'A' | 'B' | 'AB'>('B');
  const [jobRole, setJobRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cpf.length < 14 || !password) {
        setError('Preencha todos os campos corretamente.');
        return;
    }

    if (users.some(u => u.cpf === cpf)) {
        setError('Este CPF já está cadastrado.');
        return;
    }

    try {
      await addUser({
          name,
          cpf,
          password,
          phone: whatsapp,
          role: 'STUDENT',
          status: 'IN_TRAINING',
          category,
          jobRole: jobRole || undefined,
          enrolledAt: new Date().toISOString()
      });

      navigate('/login', { state: { message: 'Cadastro realizado com sucesso! Faça seu login.' } });
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
             <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Cadastro de Aluno
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Crie sua conta para acompanhar suas aulas.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Shield className="w-4 h-4" /> CPF
              </label>
              <input
                type="text"
                required
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" /> WhatsApp
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Shield className="w-4 h-4" /> Função (Opcional)
              </label>
              <select
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione uma função</option>
                <option value="Parqueador">Parqueador</option>
                <option value="Conferente">Conferente</option>
                <option value="Operador PDI">Operador PDI</option>
                <option value="Zelador(a)">Zelador(a)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-4 h-4" /> Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Crie uma senha segura"
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
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categoria Desejada
               </label>
   <select 
     required
     value={category}
     onChange={e => setCategory(e.target.value as any)}
     className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-gray-50 text-slate-500"
     disabled
   >
     <option value="B">Categoria B (Carro)</option>
   </select>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors uppercase tracking-wider"
              >
                Concluir Cadastro
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
