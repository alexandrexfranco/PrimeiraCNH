import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link to="/home" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8">
            <FileText className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Termos e Condições de Uso</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o sistema Primeira CNH, você concorda em cumprir e ser regido por estes Termos e Condições de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Descrição do Serviço</h2>
              <p>
                O Primeira CNH é um programa de desenvolvimento profissional criado pela Transilva para seus colaboradores. Junto com o programa, temos uma plataforma de gestão de aprendizado focada na administração de aulas práticas, agendamentos e acompanhamento de progresso para autoescolas, instrutores e alunos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Uso da Conta</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Você é responsável por manter a confidencialidade das credenciais da sua conta.</li>
                <li>Você concorda em notificar imediatamente a administração sobre qualquer uso não autorizado da sua conta.</li>
                <li>A conta é pessoal e intransferível, não devendo ser compartilhada com terceiros.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Política de Agendamento e Cancelamento</h2>
              <p>
                O agendamento de aulas práticas deve respeitar as regras e horários definidos pelo instrutor e pela autoescola. O cancelamento ou reagendamento deve ser feito com a antecedência mínima estabelecida, sob pena de ser considerada falta não justificada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Elegibilidade e Condições do Programa</h2>
              <p>
                A participação no programa pode estar sujeita a critérios de elegibilidade, como tempo de vínculo ativo e perfil de desempenho. O descumprimento de regras, como faltas não justificadas ou reprovações, pode acarretar em perda do benefício ou aplicação de regras de retenção (reembolso), conforme o regulamento específico do programa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Privacidade e Dados Pessoais</h2>
              <p>
                O Primeira CNH coleta e processa seus dados pessoais apenas para fins de prestação do serviço e cumprimento de obrigações legais, conforme as leis de proteção de dados vigentes. Suas informações não serão vendidas a terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma. O uso contínuo do serviço após as alterações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Contato</h2>
              <p>
                Para dúvidas, suporte ou solicitações relacionadas a estes Termos, entre em contato com a administração da sua unidade.
              </p>
            </section>

            <div className="pt-8 mt-8 border-t border-slate-100 text-sm text-slate-500">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
