import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Shield,
  Clock,
  Zap,
  Download,
  ExternalLink,
  Layers,
  Database,
  Smartphone,
  Server
} from 'lucide-react';
import { BACKEND_BLUEPRINT } from '../data/backendBlueprint';

export const BackendBlueprintView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'PRISMA' | 'TREE' | 'SERVICE' | 'CRON' | 'WEBHOOK' | 'SECURITY'
  >('PRISMA');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Blueprint Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Arquitetura de Produção Tech Lead
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Backend NestJS • Prisma ORM • PostgreSQL • BullMQ
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Código fonte estruturado, seguro e escalável projetado para aguentar alta concorrência de agendamentos, prevenir no-show via Pix instantâneo e automatizar lembretes via WhatsApp sem risco de banimento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const fullText = `=== SCHEMA.PRISMA ===\n${BACKEND_BLUEPRINT.prismaSchema}\n\n=== APPOINTMENTS.SERVICE.TS ===\n${BACKEND_BLUEPRINT.appointmentService}\n\n=== WHATSAPP-REMINDER.CRON.TS ===\n${BACKEND_BLUEPRINT.whatsappCron}\n\n=== WEBHOOK & SEGURANÇA ===\n${BACKEND_BLUEPRINT.webhookService}\n\n${BACKEND_BLUEPRINT.securityAndMain}`;
                const blob = new Blob([fullText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'barberflow-backend-blueprint.txt';
                a.click();
              }}
              className="px-4 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivos (.txt)</span>
            </button>
          </div>
        </div>

        {/* Tech Stack Highlights */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Database className="w-4 h-4 text-blue-400" />
            <span>PostgreSQL + Prisma</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Helmet + Rate Limit + RBAC</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Advisory Locks Anti-Race</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>BullMQ + Evolution API</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveTab('PRISMA')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PRISMA'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>1. schema.prisma</span>
        </button>

        <button
          onClick={() => setActiveTab('TREE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'TREE'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>2. Estrutura de Pastas NestJS</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'SERVICE'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>3. appointments.service.ts</span>
        </button>

        <button
          onClick={() => setActiveTab('CRON')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'CRON'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>4. whatsapp-reminder.cron.ts</span>
        </button>

        <button
          onClick={() => setActiveTab('WEBHOOK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'WEBHOOK'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>5. payments.controller.ts</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'SECURITY'
              ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>6. main.ts & Segurança</span>
        </button>
      </div>

      {/* Code Display Container */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Top Code Bar */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            <span className="text-xs font-mono text-zinc-400 ml-2 font-semibold">
              {activeTab === 'PRISMA' && 'prisma/schema.prisma'}
              {activeTab === 'TREE' && 'Estrutura Modular NestJS (Clean Architecture)'}
              {activeTab === 'SERVICE' && 'src/modules/appointments/appointments.service.ts'}
              {activeTab === 'CRON' && 'src/modules/whatsapp/cron/whatsapp-reminder.cron.ts'}
              {activeTab === 'WEBHOOK' && 'src/modules/payments/payments.controller.ts'}
              {activeTab === 'SECURITY' && 'src/main.ts (Helmet, Throttler, Pipes)'}
            </span>
          </div>

          <button
            onClick={() => {
              const content =
                activeTab === 'PRISMA'
                  ? BACKEND_BLUEPRINT.prismaSchema
                  : activeTab === 'TREE'
                  ? BACKEND_BLUEPRINT.folderStructure
                  : activeTab === 'SERVICE'
                  ? BACKEND_BLUEPRINT.appointmentService
                  : activeTab === 'CRON'
                  ? BACKEND_BLUEPRINT.whatsappCron
                  : activeTab === 'WEBHOOK'
                  ? BACKEND_BLUEPRINT.webhookService
                  : BACKEND_BLUEPRINT.securityAndMain;
              copyCode(content, activeTab);
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content View */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[620px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed">
          <pre>
            <code>
              {activeTab === 'PRISMA' && BACKEND_BLUEPRINT.prismaSchema}
              {activeTab === 'TREE' && BACKEND_BLUEPRINT.folderStructure}
              {activeTab === 'SERVICE' && BACKEND_BLUEPRINT.appointmentService}
              {activeTab === 'CRON' && BACKEND_BLUEPRINT.whatsappCron}
              {activeTab === 'WEBHOOK' && BACKEND_BLUEPRINT.webhookService}
              {activeTab === 'SECURITY' && BACKEND_BLUEPRINT.securityAndMain}
            </code>
          </pre>
        </div>
      </div>

      {/* Deployment & Production Guide Section */}
      <div className="p-5 rounded-2xl glass-card border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Guia de Deploy em Produção (Vercel + Render)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              1. Front-end (Next.js PWA na Vercel)
            </h4>
            <ul className="text-zinc-400 space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li>Repositório conectado à Vercel com framework preset <strong>Next.js</strong>.</li>
              <li>Variável de ambiente: <code className="text-amber-300">NEXT_PUBLIC_API_URL=https://barberflow-api.onrender.com</code></li>
              <li>PWA configurado com <code className="text-zinc-300">manifest.json</code> e Service Worker para instalação offline no celular do cliente.</li>
              <li>Deploy automático a cada push na branch <strong>main</strong>.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              2. Back-end (NestJS + PostgreSQL no Render)
            </h4>
            <ul className="text-zinc-400 space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li>Criar <strong>Managed PostgreSQL Database</strong> no Render.</li>
              <li>Criar <strong>Web Service</strong> com Dockerfile ou comando <code className="text-zinc-300">npm run build && npm run start:prod</code>.</li>
              <li>Configurar Redis (Upstash ou Render Redis) para a fila BullMQ do WhatsApp.</li>
              <li>Executar migrações automáticas: <code className="text-amber-300">npx prisma migrate deploy</code> no build command.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
