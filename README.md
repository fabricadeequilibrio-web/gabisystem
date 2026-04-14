# Gabisystem

Sistema de gestão para PMEs brasileiras — **AI First**.

> O primeiro sistema de gestão brasileiro que você não precisa aprender a usar.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilização | Tailwind CSS |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| IA | Anthropic Claude API |
| Autenticação | NextAuth.js |

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta na [Anthropic Console](https://console.anthropic.com) para a API key

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/gabisystem.git
cd gabisystem

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Crie o banco de dados
createdb gabisystem_dev

# 5. Execute as migrations
npx prisma migrate dev --name init

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## Estrutura do Projeto

```
gabisystem/
├── app/                    # App Router do Next.js
│   ├── (auth)/             # Rotas públicas (login, cadastro)
│   ├── (dashboard)/        # Rotas protegidas
│   └── api/                # API Routes
├── components/             # Componentes React
│   ├── ui/                 # Componentes base
│   ├── forms/              # Formulários
│   ├── dashboard/          # Componentes do painel
│   └── ia/                 # Componentes do assistente IA
├── lib/
│   ├── prisma/             # Cliente Prisma
│   ├── ai/                 # Serviço de IA (isolado)
│   ├── auth/               # Configuração de autenticação
│   └── validations/        # Schemas de validação (Zod)
├── prisma/
│   └── schema.prisma       # Modelo de dados completo
├── scripts/                # Scripts utilitários
├── types/                  # Tipos TypeScript globais
└── .env.example            # Variáveis de ambiente necessárias
```

---

## Princípio de Desenvolvimento

> Preferir sempre a decisão que mantém mais opções abertas, mesmo que não seja a "ótima" no momento.

---

## Status

Em desenvolvimento — MVP em construção.
