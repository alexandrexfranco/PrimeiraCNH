import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/AppContext';
import { GraduationCap, Phone, CheckCircle2, AlertCircle, Edit2, X, Save, Plus, Shield, UserIcon, KeyRound, Trash2, Search, Camera, Eye, EyeOff, IdCard, Car, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '../types';

export function ManageStudents() {
  const { users, classes, updateUser, addUser, deleteUser } = useAppStore();
  const students = users.filter(u => u.role === 'STUDENT');

  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    password: '',
    category: 'B' as const,
    jobRole: '',
    photoUrl: ''
  });
  const [createError, setCreateError] = useState('');

  const handleEditClick = (student: User) => {
    setEditingStudentId(student.id);
    const cleanObs = (student.observation || "").replace("[APTO_DETRAN]", "").trim();
    setEditForm({
      name: student.name,
      cpf: student.cpf,
      phone: student.phone,
      category: student.category,
      jobRole: student.jobRole || '',
      observation: cleanObs,
      status: student.status,
      photoUrl: student.photoUrl || ''
    });
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleSave = () => {
    if (editingStudentId && editForm.name && editForm.cpf) {
      const studentObj = students.find(s => s.id === editingStudentId);
      const originalIsApto = studentObj?.observation?.includes("[APTO_DETRAN]") ?? false;
      const formObs = editForm.observation || '';
      const finalObs = originalIsApto
        ? `[APTO_DETRAN] ${formObs.replace("[APTO_DETRAN]", "").trim()}`.trim()
        : formObs.replace("[APTO_DETRAN]", "").trim();

      updateUser(editingStudentId, {
        ...editForm,
        observation: finalObs
      });
      setEditingStudentId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.name || createForm.cpf.length < 14 || !createForm.password) {
        setCreateError('Preencha todos os campos obrigatórios corretamente.');
        return;
    }

    if (users.some(u => u.cpf === createForm.cpf)) {
        setCreateError('Este CPF já está cadastrado.');
        return;
    }

    try {
      await addUser({
          name: createForm.name,
          cpf: createForm.cpf,
          password: createForm.password,
          phone: createForm.phone,
          role: 'STUDENT',
          status: 'IN_TRAINING',
          category: createForm.category,
          jobRole: createForm.jobRole || undefined,
          photoUrl: createForm.photoUrl || undefined,
          enrolledAt: new Date().toISOString()
      });
      setIsCreating(false);
      setCreateForm({ name: '', cpf: '', phone: '', password: '', category: 'B', jobRole: '', photoUrl: '' });
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar aluno.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      try {
        await deleteUser(id);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir aluno');
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gerenciar Alunos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhe o cadastro e o progresso dos alunos matriculados.
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
          >
            <Plus className="w-5 h-5" /> Cadastrar Aluno
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800">Novo Aluno</h2>
            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foto de Perfil Upload */}
              <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b border-dashed border-slate-100">
                <div 
                  onClick={() => newFileInputRef.current?.click()}
                  className="relative w-20 h-20 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold cursor-pointer group overflow-hidden border-2 border-slate-200 hover:border-sky-300 transition-all"
                  title="Upload Foto de Perfil"
                >
                  {createForm.photoUrl ? (
                    <img src={createForm.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-sky-500 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">Foto do Aluno</p>
                <input 
                  type="file" 
                  ref={newFileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCreateForm(p => ({ ...p, photoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />
                {createForm.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setCreateForm(p => ({ ...p, photoUrl: '' }))}
                    className="text-[11px] text-red-500 hover:underline mt-1 font-medium"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do aluno"
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  value={createForm.cpf}
                  onChange={e => setCreateForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={createForm.phone}
                  onChange={e => setCreateForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  Função (Opcional)
                </label>
                <select
                  value={createForm.jobRole}
                  onChange={e => setCreateForm(p => ({ ...p, jobRole: e.target.value }))}
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
                  Senha Provisória
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={createForm.password}
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Crie uma senha de acesso"
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
            </div>

            {createError && (
              <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{createError}</p>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
              >
                Cadastrar Aluno
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar aluno por nome ou CPF..."
          className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-orange-500 focus:border-orange-500 sm:text-sm shadow-sm"
        />
      </div>

      <div className="grid gap-6 sm:gap-8">
        {filteredStudents.length === 0 ? (
           <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
             <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
             <p className="text-slate-500">Nenhum aluno encontrado.</p>
           </div>
        ) : (
          filteredStudents.map(student => {
             const studentClasses = classes.filter(c => c.studentId === student.id);
             const completedCount = studentClasses.filter(c => c.status === 'COMPLETED').length;
             const totalRequired = 5;
             const progress = Math.round((completedCount / totalRequired) * 100);

             return (
               <div key={student.id} className="bg-white p-6 sm:p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                 {editingStudentId === student.id ? (
                   <div className="w-full space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="font-bold text-slate-800 tracking-tight">Editar Aluno</h3>
                       <div className="flex items-center gap-2">

                         <button onClick={() => setEditingStudentId(null)} className="p-1 hover:bg-slate-100 rounded">
                           <X className="w-5 h-5 text-slate-500" />
                         </button>
                       </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Foto de Perfil Upload (Edit) */}
                       <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b border-dashed border-slate-100">
                         <div 
                           onClick={() => editFileInputRef.current?.click()}
                           className="relative w-20 h-20 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold cursor-pointer group overflow-hidden border-2 border-slate-200 hover:border-sky-300 transition-all"
                           title="Upload Foto de Perfil"
                         >
                           {editForm.photoUrl ? (
                             <img src={editForm.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                           ) : (
                             <Camera className="w-6 h-6 text-sky-500 group-hover:scale-110 transition-transform" />
                           )}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera className="w-5 h-5 text-white" />
                           </div>
                         </div>
                         <p className="text-[11px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">Foto do Aluno</p>
                         <input 
                           type="file" 
                           ref={editFileInputRef} 
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 setEditForm(p => ({ ...p, photoUrl: reader.result as string }));
                               };
                               reader.readAsDataURL(file);
                             }
                           }} 
                           accept="image/*" 
                           className="hidden" 
                         />
                         {editForm.photoUrl && (
                           <button
                             type="button"
                             onClick={() => setEditForm(p => ({ ...p, photoUrl: '' }))}
                             className="text-[11px] text-red-500 hover:underline mt-1 font-medium"
                           >
                             Remover foto
                           </button>
                         )}
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                         <input type="text" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF</label>
                         <input type="text" value={editForm.cpf || ''} onChange={e => setEditForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp</label>
                         <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: formatPhone(e.target.value) }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                         <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value as any }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                           <option value="B">Categoria B (Carro)</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                         <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                           <option value="IN_TRAINING">Em Formação</option>
                           <option value="ACTIVE">Ativo</option>
                           <option value="BLOCKED">Bloqueado</option>
                           <option value="COMPLETED">Concluído</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Função</label>
                         <select value={editForm.jobRole || ''} onChange={e => setEditForm(p => ({ ...p, jobRole: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                           <option value="">Nenhuma / Outra</option>
                           <option value="Parqueador">Parqueador</option>
                           <option value="Conferente">Conferente</option>
                           <option value="Operador PDI">Operador PDI</option>
                           <option value="Zelador(a)">Zelador(a)</option>
                         </select>
                       </div>
                       <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações (aparece no perfil)</label>
                         <input type="text" value={editForm.observation || ''} onChange={e => setEditForm(p => ({ ...p, observation: e.target.value }))} placeholder="Ex: Aulas pendentes, Taxa atrasada..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                       </div>
                     </div>
                     <button onClick={handleSave} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex justify-center items-center gap-2">
                       <Save className="w-4 h-4" /> Salvar Alterações
                     </button>
                   </div>
                 ) : (
                 <>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button 
                      onClick={() => handleEditClick(student)}
                      className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
                      title="Editar Aluno"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                      title="Excluir Aluno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                   <div className="flex flex-col w-full">
                     <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
                       <div className="w-20 h-20 sm:w-28 sm:h-28 bg-[#ffedd5] text-[#ea580c] rounded-full flex items-center justify-center font-extrabold text-3xl sm:text-4xl shrink-0 shadow-sm mt-1 mx-auto sm:mx-0 border border-orange-100">
                         {student.photoUrl ? (
                            <img src={student.photoUrl} alt="Perfil" className="w-full h-full object-cover rounded-full" />
                         ) : (
                            student.name.charAt(0)
                         )}
                       </div>
                       
                       <div className="flex-1 w-full mt-2 sm:mt-0">
                         <div className="mb-4 text-center sm:text-left">
                           <h3 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-2.5">
                             {student.name}
                           </h3>
                           <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                             {student.jobRole && (
                                <span className="text-[12px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 uppercase whitespace-nowrap">
                                  {student.jobRole}
                                </span>
                             )}
                             {student.observation && student.observation.replace("[APTO_DETRAN]", "").trim() && (
                                <span className="text-[12px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 uppercase whitespace-nowrap">
                                  {student.observation.replace("[APTO_DETRAN]", "").trim()}
                                </span>
                              )}
                              {student.observation?.includes("[APTO_DETRAN]") && (
                                <span className="text-[12px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-100 uppercase whitespace-nowrap">
                                  🎓 Apto Detran
                                </span>
                              )}
                           </div>
                         </div>
                         
                         <div className="space-y-0 max-w-lg mx-auto sm:mx-0">
                           <div className="flex items-center py-2.5 border-b border-slate-100/80">
                             <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center mr-3 shrink-0">
                               <IdCard className="w-4 h-4" />
                             </div>
                             <span className="text-sm text-[#64748b] w-28 shrink-0">CPF</span>
                             <span className="text-sm font-medium text-[#0f172a]">{student.cpf}</span>
                           </div>
                           
                           <div className="flex items-center py-2.5 border-b border-slate-100/80">
                             <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center mr-3 shrink-0">
                               <Phone className="w-4 h-4" />
                             </div>
                             <span className="text-sm text-[#64748b] w-28 shrink-0">Telefone</span>
                             <span className="text-sm font-medium text-[#0f172a]">{student.phone || 'Não informado'}</span>
                           </div>

                           <div className="flex items-center py-2.5 border-b border-slate-100/80">
                             <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center mr-3 shrink-0">
                               <Car className="w-4 h-4" />
                             </div>
                             <span className="text-sm text-[#64748b] w-28 shrink-0">Categoria</span>
                             <span className="text-sm font-medium text-[#0f172a]">Cat. {student.category}</span>
                           </div>

                           <div className="flex items-center py-2.5 border-b border-slate-100/80">
                             <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center mr-3 shrink-0">
                               <Calendar className="w-4 h-4" />
                             </div>
                             <span className="text-sm text-[#64748b] w-28 shrink-0">Cadastrado em</span>
                             <span className="text-sm font-medium text-[#0f172a]">{format(new Date(student.createdAt || new Date()), 'dd/MM/yyyy')}</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="mt-8 pt-8 border-t border-slate-100/80">
                       <div className="flex items-center justify-between mb-5">
                         <div className="flex items-center gap-3.5">
                           <div className="w-11 h-11 rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shadow-sm">
                             <GraduationCap className="w-5 h-5" />
                           </div>
                           <h4 className="font-bold text-[#0f172a] text-[19px]">Aulas Práticas</h4>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-[#0f172a] text-[22px] leading-tight">{completedCount} / {totalRequired}</div>
                           <div className="text-[13px] text-[#64748b] font-medium -mt-1">concluídas</div>
                         </div>
                       </div>
                       
                       <div className="h-3.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden mb-3">
                         <div 
                           className="h-full bg-[#ea580c] rounded-full transition-all duration-500 ease-out"
                           style={{ width: `${Math.min(progress, 100)}%` }}
                         />
                       </div>
                       <p className="text-[14px] text-[#64748b]">Mínimo 5 (2 obrigatórias)</p>
                     </div>
                   </div>
                 </>
                 )}
               </div>
             )
          })
        )}
      </div>
    </div>
  );
}
