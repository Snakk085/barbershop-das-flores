# 💈 BarberShop Das Flores - Sistema Completo de Gestão & Agendamento PWA

Sistema profissional de agendamento online e gestão operacional para a **BarberShop Das Flores**, localizada na **Rua Bulgária, 405 - Manoel Sátiro, Fortaleza - CE**, desenvolvido com foco em alta performance, mobile-first PWA, prevenção de furos (No-Show Pix) e anti-concorrência transacional.

---

## 🚀 Arquitetura Tecnológica

- **Front-end:** Next.js (React), TypeScript, Tailwind CSS, Mobile-First PWA instalável no celular.
- **Back-end:** NestJS, TypeScript, Prisma ORM, BullMQ (filas assíncronas), Helmet e Rate-Limiting.
- **Banco de Dados:** PostgreSQL com Advisory Locks transacionais (`pg_advisory_xact_lock`).
- **Pagamentos & No-Show:** Pix Dinâmico (Mercado Pago / Asaas) com lock de expiração de 15 minutos.
- **Notificações:** Motor WhatsApp (Evolution API / Baileys) com confirmações em tempo real e Cron matinal às 08:00h.

---

## 📁 Estrutura do Repositório

```
barbershop-das-flores/
├── frontend/             # Interface do Cliente (PWA), Painel do Barbeiro & Painel do Dono
├── backend/              # API NestJS, Prisma ORM, Cron de WhatsApp e Webhooks Pix
├── docker-compose.yml    # Ambiente completo local (PostgreSQL, Redis, Evolution API)
└── README.md
```

---

## 🛠️ Como Subir no GitHub em 5 Minutos

```bash
# 1. No terminal da sua máquina, descompacte o arquivo zip
cd barbershop-das-flores

# 2. Inicialize o repositório Git
git init
git add .
git commit -m "feat: initial commit - BarberShop Das Flores full-stack"

# 3. Vincule ao seu repositório no GitHub
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/barbershop-das-flores.git
git push -u origin main
```

---

## 🌐 Como Fazer o Deploy em Produção

### 1. Back-end no Render.com (Web Service + PostgreSQL)
1. Crie um banco PostgreSQL no Render (`barbershop-flores-db`).
2. Crie um Web Service no Render apontando para o diretório `/backend`.
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`: URL do PostgreSQL do Render
   - `JWT_SECRET`: Chave secreta de autenticação
   - `MERCADO_PAGO_ACCESS_TOKEN`: Token do Mercado Pago
   - `MERCADO_PAGO_WEBHOOK_SECRET`: Chave HMAC do webhook
   - `EVOLUTION_API_URL`: URL da sua Evolution API do WhatsApp
   - `EVOLUTION_API_KEY`: Chave da API do WhatsApp

### 2. Front-end na Vercel
1. Importe o repositório na [Vercel](https://vercel.com).
2. Configure o Root Directory como `frontend`.
3. Defina a variável de ambiente:
   - `NEXT_PUBLIC_API_URL`: URL da API no Render (ex: `https://barbershop-das-flores.onrender.com`)
4. Clique em **Deploy**!
