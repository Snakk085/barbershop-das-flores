import React, { useState } from 'react';
import {
  X,
  PackageCheck,
  Smartphone,
  Send,
  Cloud,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Server,
  Database,
  Radio,
  FileCode2,
  Calendar,
  Percent,
  Sparkles,
  Download
} from 'lucide-react';

interface HandoverKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl?: string;
}

export const HandoverKitModal: React.FC<HandoverKitModalProps> = ({
  isOpen,
  onClose,
  sharedUrl = window.location.href,
}) => {
  const [activeTab, setActiveTab] = useState<'CLIENT_LINK' | 'WHATSAPP_MSG' | 'DEPLOY' | 'WHATSAPP_BOT' | 'MANUAL'>('CLIENT_LINK');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const whatsappMessageTemplate = `Fala, pessoal da *BarberShop Das Flores*! 💈✂️

Aqui é o responsável pelo desenvolvimento do novo sistema e aplicativo de agendamento online de vocês!

O sistema está pronto, customizado com a identidade da unidade da *Rua Bulgária, 405 (Manoel Sátiro, Fortaleza)* e já conta com:

✨ *Principais Recursos Configurados:*
1. 📱 *Aplicativo PWA para Clientes:* Não precisa baixar na Play Store/App Store. Basta abrir o link e salvar na tela inicial do celular!
2. ✂️ *Painéis Individuais para André e Neto:* Cada barbeiro gerencia sua agenda, define suas folgas/feriados e horários de almoço.
3. 💰 *Regra de Comissão Flexível:* Opção de 40%, 50%, 60%, 70% ou a opção *100% Sem Comissão* (aluguel de cadeira).
4. 🔥 *Aba de Promoções & Combos:* Ex: Barba + Cabelo por R$ 50,00 com destaque visual.
5. ⚡ *Sinal Pix Anti-No-Show:* Evita furos de clientes reservando o horário com garantia de 15 minutos.
6. 💬 *Integração com WhatsApp:* Confirmação imediata e lembretes automáticos toda manhã às 08:00h!

🔗 *Link para Acessar e Testar Agora:*
${sharedUrl}

Fico à disposição para tirar qualquer dúvida e agendar o treinamento da equipe! 🚀`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-500/10 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                  Central de Entrega & Handover do Cliente
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Pronto para Enviar
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                BarberShop Das Flores • André & Neto • Manoel Sátiro, Fortaleza - CE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('CLIENT_LINK')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'CLIENT_LINK'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            1. Link do App & PWA
          </button>

          <button
            onClick={() => setActiveTab('WHATSAPP_MSG')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'WHATSAPP_MSG'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            2. Mensagem p/ o Dono (WhatsApp)
          </button>

          <button
            onClick={() => setActiveTab('DEPLOY')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'DEPLOY'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            3. Deploy Vercel + Render
          </button>

          <button
            onClick={() => setActiveTab('WHATSAPP_BOT')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'WHATSAPP_BOT'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            4. Motor WhatsApp (85 98800-5939)
          </button>

          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'MANUAL'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            5. Manual do Dono & Barbeiros
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* TAB 1: CLIENT LINK & PWA */}
          {activeTab === 'CLIENT_LINK' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-amber-500/10 via-zinc-800/40 to-transparent p-4 rounded-xl border border-amber-500/20">
                <h4 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Como entregar o acesso imediato ao cliente
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O cliente (dono, barbeiros e frequentadores da barbearia) já pode acessar a aplicação diretamente pelo navegador de qualquer celular ou computador. Ele funciona como um <strong className="text-white">PWA (Progressive Web App)</strong> sem precisar passar pela aprovação demorada das lojas de aplicativos.
                </p>
              </div>

              {/* Shareable Link Box */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Link de Acesso Direto para o Cliente:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(sharedUrl, 'share-url')}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors shrink-0"
                  >
                    {copiedKey === 'share-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-zinc-950" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Link
                      </>
                    )}
                  </button>
                  <a
                    href={sharedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* PWA Installation Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">📱</span>
                    Como o cliente instala no iPhone (iOS):
                  </div>
                  <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                    <li>Abra o link acima no navegador <strong className="text-zinc-200">Safari</strong>.</li>
                    <li>Toque no ícone de <strong className="text-zinc-200">Compartilhar</strong> (quadrado com seta para cima).</li>
                    <li>Role para baixo e selecione <strong className="text-amber-400">"Adicionar à Tela de Início"</strong>.</li>
                    <li>Pronto! O ícone da <strong className="text-zinc-200">Barbearia Das Flores</strong> aparece na tela como app nativo.</li>
                  </ol>
                </div>

                <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">🤖</span>
                    Como o cliente instala no Android (Chrome):
                  </div>
                  <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
                    <li>Abra o link no navegador <strong className="text-zinc-200">Google Chrome</strong>.</li>
                    <li>Toque nos <strong className="text-zinc-200">3 pontinhos</strong> no canto superior direito.</li>
                    <li>Clique em <strong className="text-emerald-400">"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</li>
                    <li>O aplicativo é instalado em segundos, ocupando menos de 2MB!</li>
                  </ol>
                </div>
              </div>

              {/* QR Code suggestion for counter */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-zinc-950" />
                </div>
                <div className="text-left space-y-1">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    💡 Dica de Ouro de Tech Lead: Placa de Balcão com QR Code
                  </h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sugira ao dono imprimir um display acrílico para o balcão na <em>Rua Bulgária, 405</em> com o QR Code apontando para este link. O cliente que está na barbearia escaneia e já deixa o próximo corte do mês agendado!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP MESSAGE */}
          {activeTab === 'WHATSAPP_MSG' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Texto Pronto para Enviar no WhatsApp</h4>
                  <p className="text-xs text-zinc-400">
                    Copie e envie direto para o dono ou no grupo dos barbeiros da BarberShop Das Flores.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(whatsappMessageTemplate, 'wpp-template')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {copiedKey === 'wpp-template' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Mensagem
                    </>
                  )}
                </button>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {whatsappMessageTemplate}
              </div>

              <div className="flex justify-end">
                <a
                  href={`https://wa.me/5585988005939?text=${encodeURIComponent(whatsappMessageTemplate)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Abrir no WhatsApp da Barbearia (85 98800-5939)
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOY (VERCEL + RENDER) */}
          {activeTab === 'DEPLOY' && (
            <div className="space-y-5">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Guia de Publicação em Produção (Vercel + Render)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A arquitetura atende rigorosamente a solicitação: <strong className="text-white">Next.js PWA na Vercel</strong> e <strong className="text-white">NestJS com PostgreSQL no Render</strong>.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-extrabold text-[11px]">1</span>
                  Banco de Dados PostgreSQL (Render)
                </div>
                <p className="text-xs text-zinc-400 pl-8">
                  No painel do <strong className="text-zinc-200">Render.com</strong>, clique em <strong className="text-amber-400">New + &gt; PostgreSQL</strong>. Escolha a região <strong className="text-zinc-200">Oregon (US West)</strong> ou São Paulo e copie a <strong className="text-zinc-200">Internal Database URL</strong>.
                </p>
                <div className="pl-8">
                  <div className="bg-zinc-900 px-3 py-2 rounded-lg font-mono text-[11px] text-amber-300 flex items-center justify-between border border-zinc-800">
                    <span>DATABASE_URL="postgresql://barber_user:pass@dpg-xxxx.render.com/barbershop_flores"</span>
                    <button
                      onClick={() => handleCopy('DATABASE_URL="postgresql://barber_user:pass@dpg-xxxx.render.com/barbershop_flores"', 'db-url')}
                      className="text-zinc-400 hover:text-white"
                    >
                      {copiedKey === 'db-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-extrabold text-[11px]">2</span>
                  Back-end NestJS (Render Web Service)
                </div>
                <div className="text-xs text-zinc-400 pl-8 space-y-2">
                  <p>1. Crie um repositório no GitHub para o backend e conecte ao Render.</p>
                  <p>2. Preencha os comandos de Build e Start:</p>
                  <div className="bg-zinc-900 p-2.5 rounded-lg font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800">
                    <div className="text-amber-400">Build Command: <span className="text-zinc-200">npm install && npx prisma generate && npx prisma migrate deploy && npm run build</span></div>
                    <div className="text-amber-400">Start Command: <span className="text-zinc-200">node dist/main.js</span></div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-extrabold text-[11px]">3</span>
                  Front-end Next.js / PWA (Vercel)
                </div>
                <div className="text-xs text-zinc-400 pl-8 space-y-2">
                  <p>1. No painel da <strong className="text-zinc-200">Vercel</strong>, clique em <strong className="text-amber-400">Add New Project</strong> e importe o repositório.</p>
                  <p>2. Em <em>Environment Variables</em>, configure:</p>
                  <div className="bg-zinc-900 p-2.5 rounded-lg font-mono text-[11px] text-zinc-300 border border-zinc-800">
                    NEXT_PUBLIC_API_URL="https://barbershop-das-flores-api.onrender.com"
                  </div>
                  <p>3. Clique em <strong className="text-white">Deploy</strong>. A Vercel entrega certificado SSL automático e suporte global a PWA!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP BOT */}
          {activeTab === 'WHATSAPP_BOT' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Conectando o WhatsApp da Barbearia: (85) 98800-5939
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para os disparos automáticos acontecerem diretamente do número oficial da barbearia, recomendamos utilizar a <strong className="text-white">Evolution API</strong> (open-source) ou o serviço <strong className="text-white">Z-API</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    1. Criar Instância
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Na Evolution API, crie uma instância chamada <code className="text-amber-300">barbershop_flores</code>.
                  </p>
                </div>

                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    2. Escanear QR Code
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Abra o WhatsApp no celular (85) 98800-5939, vá em Aparelhos Conectados e leia o QR Code.
                  </p>
                </div>

                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    3. Automatização Ativa
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    O cron job do NestJS disparará às 08:00 todos os dias confirmando a presença dos clientes.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Variáveis de Ambiente Necessárias no NestJS:
                </div>
                <pre className="bg-zinc-900 p-3 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto border border-zinc-800">
{`EVOLUTION_API_URL="https://api.whatsapp-server.com"
EVOLUTION_API_KEY="seu_token_secreto_aqui"
EVOLUTION_INSTANCE_NAME="barbershop_flores"
WHATSAPP_CRON_SCHEDULE="0 8 * * *"`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: MANUAL DO DONO & BARBEIROS */}
          {activeTab === 'MANUAL' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Manual Prático de Operação para o Dono, André e Neto
                </h4>
                <p className="text-xs text-zinc-400">
                  Destaques rápidos das funcionalidades implementadas exatamente como solicitado:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    %
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Opção "Sem Comissão" e Taxas Dinâmicas</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      No painel de cada barbeiro ou no Admin, basta clicar em <strong>"✨ Sem Comissão (100% Barbeiro / Aluguel de Cadeira)"</strong>. O cálculo do faturamento líquido e bruto é reajustado em tempo real.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-400/20 text-red-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Folgas de Dias Inteiros e Feriados Globais</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      No painel do barbeiro, clique em <strong>"+ Bloquear Dia Inteiro / Feriado"</strong>. É possível marcar tanto uma folga pessoal (ex: folga do André) quanto um feriado nacional/local que fecha a barbearia inteira. O motor bloqueia os horários automaticamente no app dos clientes.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    🔥
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Aba de Promoções (Combos Especiais)</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tanto o dono quanto os barbeiros podem criar ofertas no botão <strong>"+ Criar Combo Promocional"</strong> (ex: Barba + Cabelo por R$ 50,00 com badge de desconto). Ela aparece em destaque dourado na primeira aba do app mobile.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Prevenção de No-Show com Sinal Pix</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Cada agendamento gera um Pix copia-e-cola de R$ 15,00 que reserva o horário por 15 minutos. Caso o cliente não pague, o horário volta a ficar livre para outro cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500 text-center sm:text-left">
            Projeto: <strong>BarberShop Das Flores</strong> • Manoel Sátiro, Fortaleza
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(whatsappMessageTemplate, 'footer-copy')}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors flex items-center gap-1.5"
            >
              {copiedKey === 'footer-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copiar Mensagem de Entrega
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
