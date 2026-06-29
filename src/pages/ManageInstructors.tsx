import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { Users, Phone, Shield, Edit2, X, Save, Plus, Trash2, Search, AlertTriangle, CheckCircle2, Ban, Camera, Clock, Car } from 'lucide-react';
import { User } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

// Helper to parse observations containing JSON or plain expiration dates safely
export function parseObservation(obsStr: string | undefined) {
  if (!obsStr) return { expiration: null, receiptUrl: null, receiptAt: null, selectedPlanMonths: null, vehicleId: null };
  try {
    const data = JSON.parse(obsStr);
    if (data && typeof data === 'object') {
      return {
        expiration: data.expiration !== undefined ? data.expiration : null,
        receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : null,
        receiptAt: data.receiptAt !== undefined ? data.receiptAt : null,
        selectedPlanMonths: data.selectedPlanMonths !== undefined ? data.selectedPlanMonths : null,
        vehicleId: data.vehicleId !== undefined ? data.vehicleId : null,
      };
    }
  } catch (e) {
    // Treat as fallback plan below
  }
  if (obsStr && !isNaN(Date.parse(obsStr))) {
    return { expiration: obsStr, receiptUrl: null, receiptAt: null, selectedPlanMonths: null, vehicleId: null };
  }
  return { expiration: null, receiptUrl: null, receiptAt: null, selectedPlanMonths: null, vehicleId: null };
}

export function ManageInstructors() {
  const { users, classes, vehicles, addUser, updateUser, deleteUser, addVehicle, currentUser } = useAppStore();
  
  // Only ADMIN is allowed to manage instructors
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm mt-1">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const instructors = users.filter(u => u.role === 'INSTRUCTOR');
  const adminUser = users.find(u => u.role === 'ADMIN');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // File input refs
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // States for administering PIX Key, Viewing Comprovante & Managing pricing plans
  const [pixKey, setPixKey] = useState('');
  const [isSavingPix, setIsSavingPix] = useState(false);
  const [viewingReceiptInstructor, setViewingReceiptInstructor] = useState<User | null>(null);

  const [plans, setPlans] = useState([
    { months: 1, price: 100, label: '1 Mês' },
    { months: 3, price: 250, label: '3 Meses' },
    { months: 6, price: 400, label: '6 Meses' },
    { months: 12, price: 600, label: '1 Ano' }
  ]);
  const [isSavingPlans, setIsSavingPlans] = useState(false);

  useEffect(() => {
    if (adminUser?.registro) {
      setPixKey(adminUser.registro);
    }
    if (adminUser?.observation) {
      try {
        const parsed = JSON.parse(adminUser.observation);
        if (Array.isArray(parsed) && parsed.length === 4) {
          setPlans(parsed);
        }
      } catch (e) {
        // Fallback silently to default plans
      }
    }
  }, [adminUser]);

  const handleSavePix = async () => {
    if (!adminUser) return;
    try {
      setIsSavingPix(true);
      await updateUser(adminUser.id, { registro: pixKey });
      alert('Chave PIX atualizada com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar a chave PIX: ' + (err.message || err));
    } finally {
      setIsSavingPix(false);
    }
  };

  const handleSavePlans = async () => {
    if (!adminUser) return;
    try {
      setIsSavingPlans(true);
      await updateUser(adminUser.id, { observation: JSON.stringify(plans) });
      alert('Valores dos planos de renovação atualizados com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar os planos de renovação: ' + (err.message || err));
    } finally {
      setIsSavingPlans(false);
    }
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [editExpirationPeriod, setEditExpirationPeriod] = useState('keep');

  // Edit vehicle states
  const [editVehicleMode, setEditVehicleMode] = useState<'keep' | 'none' | 'link' | 'new'>('keep');
  const [editSelectedVehicleId, setEditSelectedVehicleId] = useState('');
  const [editNewVehicleForm, setEditNewVehicleForm] = useState({
    model: '',
    plate: '',
    category: 'B' as 'A' | 'B'
  });

  // Registration state
  const [isAdding, setIsAdding] = useState(false);
  const [activationPeriod, setActivationPeriod] = useState('unlimited');
  const [newForm, setNewForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    registro: '',
    status: 'ACTIVE' as const,
    photoUrl: '',
    observation: '',
    category: 'B' as 'A' | 'B' | 'AB'
  });

  // Registration vehicle states
  const [vehicleMode, setVehicleMode] = useState<'none' | 'link' | 'new'>('none');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newVehicleForm, setNewVehicleForm] = useState({
    model: '',
    plate: '',
    category: 'B' as 'A' | 'B'
  });

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Masks
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

  // Handlers
  const handleEditClick = (instructor: User) => {
    setEditingId(instructor.id);
    setEditExpirationPeriod('keep');
    setEditForm({
      name: instructor.name,
      cpf: instructor.cpf,
      phone: instructor.phone || '',
      registro: instructor.registro || '',
      status: instructor.status,
      photoUrl: instructor.photoUrl || '',
      observation: instructor.observation || '',
      vehicleId: instructor.vehicleId || '',
      category: instructor.category || 'B'
    });
    setEditVehicleMode('keep');
    setEditSelectedVehicleId(instructor.vehicleId || '');
    setEditNewVehicleForm({ model: '', plate: '', category: 'B' });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name || (editForm.cpf && editForm.cpf.length < 14)) {
      alert('Por favor, preencha o Nome e o CPF corretamente.');
      return;
    }
    try {
      const instructorObj = instructors.find(u => u.id === editingId);
      const existingData = parseObservation(instructorObj?.observation);

      let targetExpiration = existingData.expiration;
      if (editExpirationPeriod === 'unlimited') {
        targetExpiration = null;
      } else if (editExpirationPeriod !== 'keep') {
        const months = parseInt(editExpirationPeriod, 10);
        const expiration = new Date();
        expiration.setMonth(expiration.getMonth() + months);
        // Expirar meia-noite do dia subsequente ao último dia de vencimento (vencimento dura até 23:59:59 d)
        expiration.setDate(expiration.getDate() + 1);
        expiration.setHours(0, 0, 0, 0);
        targetExpiration = expiration.toISOString();
      }

      let finalVehicleIdFromEdit = instructorObj?.vehicleId;
      if (editVehicleMode === 'none') {
        finalVehicleIdFromEdit = undefined;
      } else if (editVehicleMode === 'link') {
        if (editSelectedVehicleId) {
          finalVehicleIdFromEdit = editSelectedVehicleId;
        } else {
          finalVehicleIdFromEdit = undefined;
        }
      } else if (editVehicleMode === 'new') {
        if (!editNewVehicleForm.model || !editNewVehicleForm.plate) {
          alert('Por favor, preencha o Modelo e a Placa do novo veículo Gostaria.');
          return;
        }
        const createdVehicle = await addVehicle({
          model: editNewVehicleForm.model,
          plate: editNewVehicleForm.plate,
          category: editNewVehicleForm.category,
          status: 'ACTIVE'
        });
        finalVehicleIdFromEdit = createdVehicle.id;
      }

      let finalObservation = '';
      if (targetExpiration !== null || existingData.receiptUrl || finalVehicleIdFromEdit) {
        finalObservation = JSON.stringify({
          expiration: targetExpiration,
          receiptUrl: existingData.receiptUrl || null,
          receiptAt: existingData.receiptAt || null,
          vehicleId: finalVehicleIdFromEdit || null
        });
      }

      await updateUser(editingId, {
        ...editForm,
        observation: finalObservation,
        vehicleId: finalVehicleIdFromEdit
      });
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar dados do instrutor.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name || newForm.cpf.length < 14) {
      alert('Por favor, preencha o Nome e o CPF corretamente.');
      return;
    }

    try {
      let finalVehicleId: string | undefined = undefined;
      
      if (vehicleMode === 'link') {
        if (selectedVehicleId) {
          finalVehicleId = selectedVehicleId;
        }
      } else if (vehicleMode === 'new') {
        if (!newVehicleForm.model || !newVehicleForm.plate) {
          alert('Por favor, preencha o Modelo e a Placa do novo veículo.');
          return;
        }
        const createdVehicle = await addVehicle({
          model: newVehicleForm.model,
          plate: newVehicleForm.plate,
          category: newVehicleForm.category,
          status: 'ACTIVE'
        });
        finalVehicleId = createdVehicle.id;
      }

      let expirationISO: string | undefined = undefined;
      if (activationPeriod !== 'unlimited') {
        const months = parseInt(activationPeriod, 10);
        const expiration = new Date();
        expiration.setMonth(expiration.getMonth() + months);
        // Expirar meia-noite do dia subsequente ao último dia de vencimento (vencimento dura até 23:59:59 d)
        expiration.setDate(expiration.getDate() + 1);
        expiration.setHours(0, 0, 0, 0);
        expirationISO = expiration.toISOString();
      }

      await addUser({
        name: newForm.name,
        cpf: newForm.cpf,
        phone: newForm.phone,
        registro: newForm.registro,
        password: '123',
        role: 'INSTRUCTOR',
        status: newForm.status,
        photoUrl: newForm.photoUrl || undefined,
        observation: expirationISO,
        vehicleId: finalVehicleId,
        category: newForm.category
      });

      // Reset
      setNewForm({
        name: '',
        cpf: '',
        phone: '',
        registro: '',
        status: 'ACTIVE',
        photoUrl: '',
        observation: '',
        category: 'B'
      });
      setVehicleMode('none');
      setSelectedVehicleId('');
      setNewVehicleForm({ model: '', plate: '', category: 'B' });
      setActivationPeriod('unlimited');
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar instrutor.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      // Check if instructor has scheduled or completed classes
      const instructorClasses = classes.filter(c => c.instructorId === id);
      if (instructorClasses.length > 0) {
        const confirmResult = window.confirm(
          `Atenção: Este instrutor possui ${instructorClasses.length} aula(s) vinculada(s). Excluir o registro pode causar inconsistências. Deseja prosseguir mesmo assim?`
        );
        if (!confirmResult) {
          setDeletingId(null);
          return;
        }
      }

      await deleteUser(id);
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir instrutor.');
    }
  };

  // Filtered list
  const filteredInstructors = instructors.filter(instructor => {
    const term = searchTerm.toLowerCase();
    return (
      instructor.name.toLowerCase().includes(term) ||
      instructor.cpf.includes(term) ||
      (instructor.registro && instructor.registro.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" /> Gerenciar Instrutores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cadastre, edite, suspenda ou exclua instrutores do sistema.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="self-start sm:self-auto px-4 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition flex items-center gap-2 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Cadastrar Instrutor
          </button>
        )}
      </div>

      {/* Admin PIX & Renewal Plans Config Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600 animate-pulse" /> Chave PIX para Renovação
            </h2>
            <p className="text-xs text-slate-500">
              Configure a chave PIX para que os instrutores realizem o pagamento de suas taxas de homologação ou liberação operacional.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto max-w-sm shrink-0">
            <input
              type="text"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="Ex: pix@autoescola.com ou chave CNPJ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
            <button
              onClick={handleSavePix}
              disabled={isSavingPix}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSavingPix ? 'Salvando...' : 'Salvar PIX'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-600" /> Valores dos Planos de Renovação (R$)
            </h2>
            <p className="text-xs text-slate-500">
              Defina os valores cobrados para cada período de renovação de assinatura dos instrutores.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {plans.map((p, index) => (
              <div key={p.months} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">{p.label}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    value={p.price}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlans(prev => prev.map((item, idx) => idx === index ? { ...item, price: val } : item));
                    }}
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSavePlans}
              disabled={isSavingPlans}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isSavingPlans ? 'Salvando Valores...' : 'Salvar Valores dos Planos'}
            </button>
          </div>
        </div>
      </div>

      {/* Add New Instructor Form Card */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Novo Cadastro de Instrutor</h2>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-orange-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foto de Perfil Upload */}
              <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b border-dashed border-slate-100">
                <div 
                  onClick={() => newFileInputRef.current?.click()}
                  className="relative w-16 h-16 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold cursor-pointer group overflow-hidden border-2 border-slate-200 hover:border-sky-300 transition-all"
                  title="Upload Foto de Perfil"
                >
                  {newForm.photoUrl ? (
                    <img src={newForm.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">Foto do Instrutor</p>
                <input 
                  type="file" 
                  ref={newFileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewForm(p => ({ ...p, photoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />
                {newForm.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setNewForm(p => ({ ...p, photoUrl: '' }))}
                    className="text-[10px] text-red-500 hover:underline mt-1 font-medium"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do instrutor"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF</label>
                <input
                  type="text"
                  required
                  value={newForm.cpf}
                  onChange={e => setNewForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={newForm.phone}
                  onChange={e => setNewForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 90000-0000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credencial / Registro</label>
                <input
                  type="text"
                  value={newForm.registro}
                  onChange={e => setNewForm(p => ({ ...p, registro: e.target.value }))}
                  placeholder="Número de registro credenciado"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria de Aula</label>
                <select
                  value={newForm.category}
                  onChange={e => setNewForm(p => ({ ...p, category: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                >
                  <option value="B">Carro (Categoria B)</option>
                  <option value="A">Moto (Categoria A)</option>
                  <option value="AB">Carro e Moto (Categoria AB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Inicial</label>
                <select
                  value={newForm.status}
                  onChange={e => setNewForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="BLOCKED">Suspenso / Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Período de Acesso / Assinatura</label>
                <select
                  value={activationPeriod}
                  onChange={e => setActivationPeriod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                >
                  <option value="unlimited">Tempo indefinido (Sem expiração)</option>
                  <option value="1">1 Mês (30 dias)</option>
                  <option value="3">3 Meses</option>
                  <option value="6">6 Meses</option>
                  <option value="12">1 Ano</option>
                </select>
              </div>
            </div>

            {/* Work Vehicle Linkage */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-orange-600 animate-pulse" /> Veículo para Ministrar Aulas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Como deseja vincular o veículo?</label>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="vehicleMode" 
                        value="none" 
                        checked={vehicleMode === 'none'} 
                        onChange={() => setVehicleMode('none')} 
                        className="mr-2 text-orange-600 focus:ring-orange-500" 
                      />
                      Nenhum veículo agora
                    </label>
                    <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="vehicleMode" 
                        value="link" 
                        checked={vehicleMode === 'link'} 
                        onChange={() => setVehicleMode('link')} 
                        className="mr-2 text-orange-600 focus:ring-orange-500" 
                      />
                      Vincular veículo existente da frota
                    </label>
                    <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="vehicleMode" 
                        value="new" 
                        checked={vehicleMode === 'new'} 
                        onChange={() => setVehicleMode('new')} 
                        className="mr-2 text-orange-600 focus:ring-orange-500" 
                      />
                      Cadastrar novo veículo e vincular
                    </label>
                  </div>
                </div>

                {vehicleMode === 'link' && (
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Veículo</label>
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    >
                      <option value="">-- Selecione o veículo --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.model} - Placa: {v.plate} (Cat {v.category})</option>
                      ))}
                    </select>
                  </div>
                )}

                {vehicleMode === 'new' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo do Veículo</label>
                      <input
                        type="text"
                        placeholder="Ex: VW Gol, Honda CG 160..."
                        value={newVehicleForm.model}
                        onChange={e => setNewVehicleForm(p => ({ ...p, model: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Placa do Veículo</label>
                      <input
                        type="text"
                        placeholder="Ex: BRA2E19, ABC-1234"
                        value={newVehicleForm.plate}
                        onChange={e => setNewVehicleForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria</label>
                      <select
                        value={newVehicleForm.category}
                        onChange={e => setNewVehicleForm(p => ({ ...p, category: e.target.value as any }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      >
                        <option value="B">Carro (Categoria B)</option>
                        <option value="A">Moto (Categoria A)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition shadow-md shadow-orange-500/15"
              >
                Salvar Cadastro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar instrutor por nome, CPF ou registro..."
          className="w-full bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Instructors List */}
      <div className="grid gap-4">
        {filteredInstructors.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Nenhum instrutor encontrado.</p>
            <p className="text-slate-400 text-xs mt-1">Tente ajustar seus termos de busca.</p>
          </div>
        ) : (
          filteredInstructors.map(instructor => {
            const instructorClassesCount = classes.filter(c => c.instructorId === instructor.id).length;
            const completedClassesCount = classes.filter(c => c.instructorId === instructor.id && c.status === 'COMPLETED').length;

            return (
              <div
                key={instructor.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:shadow-sm transition relative group"
              >
                {/* Deleting Overlay Check */}
                {deletingId === instructor.id ? (
                  <div className="w-full p-2 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Excluir Cadastro</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Tem certeza de que deseja deletar permanentemente <strong>{instructor.name}</strong>? Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs pt-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => confirmDelete(instructor.id)}
                        className="px-3 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                      >
                        Sim, Excluir
                      </button>
                    </div>
                  </div>
                ) : editingId === instructor.id ? (
                  // Inline Edit Form State
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Edit2 className="w-4 h-4 text-orange-600" /> Editar Instrutor
                      </h3>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Foto de Perfil no Edit */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b border-dashed border-slate-100">
                        <div 
                          onClick={() => editFileInputRef.current?.click()}
                          className="relative w-16 h-16 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold cursor-pointer group overflow-hidden border-2 border-slate-200 hover:border-sky-300 transition-all"
                          title="Alterar Foto de Perfil"
                        >
                          {editForm.photoUrl ? (
                            <img src={editForm.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">Alterar Foto</p>
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
                            className="text-[10px] text-red-500 hover:underline mt-1 font-medium"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF</label>
                        <input
                          type="text"
                          value={editForm.cpf || ''}
                          onChange={e => setEditForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp</label>
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={e => setEditForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credencial / Registro</label>
                        <input
                          type="text"
                          value={editForm.registro || ''}
                          onChange={e => setEditForm(p => ({ ...p, registro: e.target.value }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria de Aula</label>
                        <select
                          value={editForm.category || 'B'}
                          onChange={e => setEditForm(p => ({ ...p, category: e.target.value as any }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="B">Carro (Categoria B)</option>
                          <option value="A">Moto (Categoria A)</option>
                          <option value="AB">Carro e Moto (Categoria AB)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="ACTIVE">Ativo</option>
                          <option value="BLOCKED">Suspenso / Bloqueado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Período de Acesso / Renovação</label>
                        <select
                          value={editExpirationPeriod}
                          onChange={e => setEditExpirationPeriod(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="keep">Manter atual / Não alterar</option>
                          <option value="unlimited">Tempo indefinido (Remover expiração)</option>
                          <option value="1">Ativar por 1 Mês (30 dias)</option>
                          <option value="3">Ativar por 3 Meses</option>
                          <option value="6">Ativar por 6 Meses</option>
                          <option value="12">Ativar por 1 Ano</option>
                        </select>
                      </div>
                    </div>

                    {/* Edit Work Vehicle */}
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-orange-600" /> Alterar Veículo de Trabalho
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1 md:col-span-3">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Como deseja alterar a vinculação de veículo?</label>
                          <div className="flex flex-wrap gap-4 mt-1 font-semibold text-slate-700">
                            <label className="inline-flex items-center text-xs cursor-pointer">
                              <input 
                                type="radio" 
                                name="editVehicleMode" 
                                value="keep" 
                                checked={editVehicleMode === 'keep'} 
                                onChange={() => setEditVehicleMode('keep')} 
                                className="mr-2 text-orange-600 focus:ring-orange-500" 
                              />
                              Manter veículo atual
                            </label>
                            <label className="inline-flex items-center text-xs cursor-pointer">
                              <input 
                                type="radio" 
                                name="editVehicleMode" 
                                value="none" 
                                checked={editVehicleMode === 'none'} 
                                onChange={() => setEditVehicleMode('none')} 
                                className="mr-2 text-orange-600 focus:ring-orange-500" 
                              />
                              Remover vínculo de veículo
                            </label>
                            <label className="inline-flex items-center text-xs cursor-pointer">
                              <input 
                                type="radio" 
                                name="editVehicleMode" 
                                value="link" 
                                checked={editVehicleMode === 'link'} 
                                onChange={() => setEditVehicleMode('link')} 
                                className="mr-2 text-orange-600 focus:ring-orange-500" 
                              />
                              Vincular outro veículo da frota
                            </label>
                            <label className="inline-flex items-center text-xs cursor-pointer">
                              <input 
                                type="radio" 
                                name="editVehicleMode" 
                                value="new" 
                                checked={editVehicleMode === 'new'} 
                                onChange={() => setEditVehicleMode('new')} 
                                className="mr-2 text-orange-600 focus:ring-orange-500" 
                              />
                              Cadastrar novo veículo e vincular
                            </label>
                          </div>
                        </div>

                        {editVehicleMode === 'link' && (
                          <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Veículo</label>
                            <select
                              value={editSelectedVehicleId}
                              onChange={e => setEditSelectedVehicleId(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 transition"
                            >
                              <option value="">-- Selecione o veículo --</option>
                              {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.model} - Placa: {v.plate} (Cat {v.category})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {editVehicleMode === 'new' && (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo do Veículo</label>
                              <input
                                type="text"
                                placeholder="Ex: VW Gol, Honda CG 160..."
                                value={editNewVehicleForm.model}
                                onChange={e => setEditNewVehicleForm(p => ({ ...p, model: e.target.value }))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Placa do Veículo</label>
                              <input
                                type="text"
                                placeholder="Ex: BRA2E19, ABC-1234"
                                value={editNewVehicleForm.plate}
                                onChange={e => setEditNewVehicleForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 transition font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria de Aula</label>
                              <select
                                value={editNewVehicleForm.category}
                                onChange={e => setEditNewVehicleForm(p => ({ ...p, category: e.target.value as any }))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 transition"
                              >
                                <option value="B">Carro (Categoria B)</option>
                                <option value="A">Moto (Categoria A)</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition flex items-center gap-1.5 shadow-md shadow-orange-500/15"
                      >
                        <Save className="w-4 h-4" /> Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal View State
                  <>
                    {/* Action buttons (Edit & Delete) top right on hover or visible */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all z-10">
                      <button
                        onClick={() => handleEditClick(instructor)}
                        className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition"
                        title="Editar Instrutor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(instructor.id)}
                        className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                        title="Excluir Instrutor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Left: Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold text-lg border border-sky-200 shrink-0">
                        {instructor.photoUrl ? (
                          <img src={instructor.photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          instructor.name.charAt(0)
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-bold text-slate-900 truncate pr-16 flex items-center gap-2">
                          <span>{instructor.name}</span>
                          <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100 uppercase shrink-0">
                            Cat {instructor.category || 'B'}
                          </span>
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono">CPF: {instructor.cpf}</span>
                          {instructor.registro && (
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-slate-400" /> Registro: {instructor.registro}
                            </span>
                          )}
                          {instructor.phone && (
                            <a
                              href={`https://wa.me/${instructor.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="flex items-center gap-1 text-green-600 hover:underline inline-flex font-mono"
                            >
                              <Phone className="w-3.5 h-3.5" /> {instructor.phone}
                            </a>
                          )}
                          <span className="text-slate-300">|</span>
                          {instructor.vehicleId ? (() => {
                            const linkedVehicle = vehicles.find(v => v.id === instructor.vehicleId);
                            if (!linkedVehicle) return (
                              <span className="flex items-center gap-1.5 text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase">
                                ⚠️ Sem veículo vinculado
                              </span>
                            );
                            return (
                              <span className="flex items-center gap-1.5 text-slate-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                <Car className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {linkedVehicle.model} ({linkedVehicle.plate}) • Cat {linkedVehicle.category}
                              </span>
                            );
                          })() : (
                            <span className="flex items-center gap-1.5 text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase">
                              ⚠️ Sem veículo vinculado
                            </span>
                          )}
                        </div>

                        {(() => {
                          const { expiration, receiptUrl, receiptAt } = parseObservation(instructor.observation);
                          if (!expiration && !receiptUrl) return null;

                          return (
                            <div className="flex flex-col gap-1.5 pt-0.5">
                              {expiration && !isNaN(Date.parse(expiration)) && (() => {
                                const expDate = new Date(expiration);
                                const now = new Date();
                                const diffMs = expDate.getTime() - now.getTime();
                                const isExpired = diffMs <= 0;
                                const lastDayDate = new Date(expDate.getTime() - 1000);
                                const formattedLastDay = format(lastDayDate, "dd/MM/yyyy");
                                const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                                return (
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                                      isExpired 
                                        ? "bg-red-50 text-red-600 border-red-200" 
                                        : daysLeft <= 5 
                                          ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" 
                                          : "bg-sky-50 text-sky-700 border-sky-200"
                                    )}>
                                      <Clock className="w-3.5 h-3.5 shrink-0" />
                                      {isExpired 
                                        ? `Acesso Expirado (em ${formattedLastDay})` 
                                        : `Acesso até: ${formattedLastDay} (${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'})`
                                      }
                                    </span>
                                  </div>
                                );
                              })()}

                              {receiptUrl && (
                                <button
                                  type="button"
                                  onClick={() => setViewingReceiptInstructor(instructor)}
                                  className="self-start inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold hover:bg-red-100 transition cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5 shrink-0" /> Ver Comprovante Pendente
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right: Status and Activity Statistics */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shrink-0 mt-2 sm:mt-0 pt-2 border-t sm:border-t-0 sm:pt-0 border-slate-100">
                      {/* Status */}
                      <div>
                        {instructor.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ATIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                            <Ban className="w-3.5 h-3.5" /> BLOQUEADO
                          </span>
                        )}
                      </div>

                      {/* Stat Counters */}
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aulas Ministradas</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">
                          {completedClassesCount} <span className="text-xs font-normal text-slate-400">concluídas ({instructorClassesCount} total)</span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comprovante View Modal */}
      {viewingReceiptInstructor && (() => {
        const { expiration, receiptUrl, receiptAt, selectedPlanMonths } = parseObservation(viewingReceiptInstructor.observation);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto py-8" id="receipt-verify-overlay">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] sm:max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setViewingReceiptInstructor(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Verificar Comprovante</h3>
                  <p className="text-xs text-slate-500">
                    Enviado por <span className="font-semibold text-slate-700">{viewingReceiptInstructor.name}</span>
                  </p>
                </div>
              </div>

              {receiptAt && (
                <p className="text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  Enviado em: {format(new Date(receiptAt), "dd/MM/yyyy 'às' HH:mm:ss")}
                </p>
              )}

              {/* Selected Plan Details box */}
              {(() => {
                const chosenPlan = plans.find(p => p.months === selectedPlanMonths);
                if (!chosenPlan && !selectedPlanMonths) return null;
                return (
                  <div className="bg-orange-50/70 border border-orange-100 p-3 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider font-mono">Plano Solicitado</span>
                      <p className="text-xs font-bold text-slate-800">{chosenPlan ? chosenPlan.label : `${selectedPlanMonths} Meses`}</p>
                    </div>
                    {chosenPlan && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Valor do Plano</span>
                        <p className="text-xs font-extrabold text-orange-600 font-mono">R$ {chosenPlan.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Receipt File Preview Container */}
              <div className="border border-slate-100 bg-slate-50 rounded-2xl p-2 flex items-center justify-center min-h-[240px] max-h-[360px] overflow-auto">
                {receiptUrl ? (
                  <img 
                    src={receiptUrl} 
                    alt="Comprovante de pagamento" 
                    className="max-w-full max-h-[340px] object-contain rounded-lg shadow-xs" 
                  />
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Nenhum arquivo enviado</span>
                )}
              </div>

              {/* Action and Approval Zone */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aprovar Renovação Direta</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {plans.map(p => {
                    const isRequested = selectedPlanMonths === p.months;
                    return (
                      <button
                        key={p.months}
                        onClick={async () => {
                          try {
                            const expiration = new Date();
                            expiration.setMonth(expiration.getMonth() + p.months);
                            expiration.setDate(expiration.getDate() + 1);
                            expiration.setHours(0, 0, 0, 0);
                            
                            // Set active, set new expiration, and clean receiptUrl!
                            const finalObs = JSON.stringify({
                              expiration: expiration.toISOString(),
                              receiptUrl: null,
                              receiptAt: null
                            });

                            await updateUser(viewingReceiptInstructor.id, {
                              observation: finalObs,
                              status: 'ACTIVE'
                            });

                            alert(`Assinatura de ${viewingReceiptInstructor.name} renovada por ${p.label}!`);
                            setViewingReceiptInstructor(null);
                          } catch (err: any) {
                            alert('Erro ao aprovar renovação: ' + (err.message || err));
                          }
                        }}
                        className={cn(
                          "py-2 px-2 text-[11px] font-bold rounded-xl transition text-center cursor-pointer flex flex-col justify-center items-center relative",
                          isRequested 
                            ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-sm" 
                            : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                        )}
                      >
                        {isRequested && (
                          <span className="absolute -top-1.5 right-1 px-1 py-0.2 bg-slate-900 text-white rounded text-[7px] font-extrabold uppercase tracking-wider scale-90">Escolhido</span>
                        )}
                        <span>{p.label}</span>
                        <span className={cn("text-[9px] opacity-75", isRequested ? "text-orange-100" : "text-green-600")}>R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={async () => {
                      try {
                        const finalObs = JSON.stringify({
                          expiration: null,
                          receiptUrl: null,
                          receiptAt: null
                        });

                        await updateUser(viewingReceiptInstructor.id, {
                          observation: finalObs,
                          status: 'ACTIVE'
                        });

                        alert(`Assinatura de ${viewingReceiptInstructor.name} liberada por Tempo Indefinido!`);
                        setViewingReceiptInstructor(null);
                      } catch (err: any) {
                        alert('Erro ao aprovar renovação: ' + (err.message || err));
                      }
                    }}
                    className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl transition text-center cursor-pointer"
                  >
                    Sem Limite
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    const confirmDiscard = window.confirm("Deseja rejeitar e descartar este comprovante?");
                    if (!confirmDiscard) return;
                    try {
                      const finalObs = JSON.stringify({
                        expiration: expiration,
                        receiptUrl: null,
                        receiptAt: null
                      });
                      await updateUser(viewingReceiptInstructor.id, {
                        observation: finalObs
                      });
                      alert('Comprovante recusado com sucesso.');
                      setViewingReceiptInstructor(null);
                    } catch (e: any) {
                      alert('Erro ao recusar comprovante: ' + e.message);
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Rejeitar / Descartar
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceiptInstructor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
