import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, User as UserIcon, GraduationCap, Phone, Hash } from 'lucide-react';
import { Role } from '../types';

export function RegisterUser({ type }: { type: 'INSTRUCTOR' | 'STUDENT' }) {
  const { addUser, currentUser } = useAppStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [registro, setRegistro] = useState('');
  const [category, setCategory] = useState<'A' | 'B' | 'AB'>('B');

  // Verify permissions
  if (type === 'INSTRUCTOR' && currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  if (type === 'STUDENT' && currentUser?.role !== 'INSTRUCTOR') {
    return <Navigate to="/" replace />;
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cpf.length < 14) return;

    try {
      if (type === 'INSTRUCTOR') {
        await addUser({
          name,
          cpf,
          phone: whatsapp,
          registro,
          password: '123',
          role: 'INSTRUCTOR',
          status: 'ACTIVE'
        });
      } else {
        await addUser({
          name,
          cpf,
          phone: whatsapp,
          registro,
          password: '123',
          role: 'STUDENT',
          status: 'IN_TRAINING',
          category,
          enrolledAt: new Date().toISOString()
        });
      }

      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {type === 'INSTRUCTOR' ? 'Novo Instrutor' : 'Novo Aluno'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Cadastre um {type === 'INSTRUCTOR' ? 'novo instrutor no sistema' : 'novo aluno para as aulas'}. A senha padrão será <strong className="text-orange-600">123</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                {type === 'INSTRUCTOR' ? <UserIcon className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                Nome Completo
             </label>
             <input 
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                CPF
             </label>
             <input 
                type="text"
                required
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-mono"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                WhatsApp
             </label>
             <input 
                type="tel"
                value={whatsapp}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-mono"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                Registro {type === 'INSTRUCTOR' ? '(Credencial)' : '(RENACH)'}
             </label>
             <input 
                type="text"
                value={registro}
                onChange={e => setRegistro(e.target.value)}
                placeholder={type === 'INSTRUCTOR' ? 'Número da credencial' : 'Número do RENACH'}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-mono"
             />
          </div>

          {type === 'STUDENT' && (
            <div>
               <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  Categoria
               </label>
               <select 
                 required
                 value={category}
                 onChange={e => setCategory(e.target.value as any)}
                 className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-500"
                 disabled
               >
                 <option value="B">Categoria B (Carro)</option>
               </select>
            </div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full py-4 mt-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30 uppercase tracking-wider"
        >
          {type === 'INSTRUCTOR' ? 'Cadastrar Instrutor' : 'Cadastrar Aluno'}
        </button>
      </form>
    </div>
  );
}
