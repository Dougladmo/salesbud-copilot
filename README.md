# SalesBud Copilot

Agente SDR (Sales Development Representative) com IA que automatiza conversas no WhatsApp para equipes de vendas. Composto por um backend em Express 5 + TypeScript e um frontend React 19 + Vite.

## Pré-requisitos

- **Node.js** >= 18
- **Docker** e **Docker Compose**
- **npm**
- **ngrok** (para receber webhooks do WhatsApp em ambiente local)

## Estrutura do Projeto

```
salesbud-copilot/
├── salesbud-copilot-microservice/   # Backend (Express 5 + TypeScript)
├── frontend/                        # Frontend (React 19 + Vite + TailwindCSS)
└── README.md
```

---

## 1. Instalando o ngrok

O ngrok cria um túnel público para o seu servidor local, necessário para que os webhooks do WhatsApp (Evolution API) alcancem sua máquina.

### macOS

```bash
# Via Homebrew
brew install ngrok
```

### Linux

```bash
# Download e instalação manual
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-amd64.tgz | \
  sudo tar xzf - -C /usr/local/bin
```

Ou via snap:

```bash
sudo snap install ngrok
```

### Windows

```powershell
# Via Chocolatey
choco install ngrok

# Ou via Winget
winget install ngrok
```

Ou baixe o instalador diretamente em [https://ngrok.com/download](https://ngrok.com/download).

### Configurar o authtoken

Após criar uma conta gratuita em [https://dashboard.ngrok.com](https://dashboard.ngrok.com), copie seu authtoken e execute:

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### Iniciar o túnel

```bash
ngrok http 3000
```

Copie a URL gerada (ex: `https://abcd1234.ngrok-free.app`) e use-a como `WEBHOOK_BASE_URL` no `.env` do backend.

---

## 2. Subindo a Infraestrutura (Docker)

```bash
cd salesbud-copilot-microservice

docker compose up -d
```

Isso inicia:

| Serviço    | Porta Local | Descrição                          |
|------------|-------------|------------------------------------|
| PostgreSQL | 5433        | Banco de dados principal           |
| Redis      | 6379        | Cache e buffer de mensagens        |
| RabbitMQ   | 5672        | Fila de processamento de mensagens |
| RabbitMQ UI| 15672       | Painel de gerenciamento (guest/guest) |

Verifique se todos os containers estão saudáveis:

```bash
docker compose ps
```

---

## 3. Configurando o Backend

### Variáveis de ambiente

```bash
cd salesbud-copilot-microservice
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Infraestrutura
PORT=3000
DATABASE_URL=postgres://salesbud:salesbud@localhost:5433/salesbud_sdr
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# APIs externas (obrigatórias)
OPENROUTER_API_KEY=sua_chave_aqui
PINECONE_API_KEY=sua_chave_aqui
PINECONE_INDEX=salesbud-sdr
EVOLUTION_API_URL=url_da_evolution_api
EVOLUTION_API_KEY=sua_chave_aqui

# Autenticação (Clerk)
CLERK_PUBLISHABLE_KEY=sua_chave_aqui
CLERK_SECRET_KEY=sua_chave_aqui
CLERK_WEBHOOK_SIGNING_SECRET=sua_chave_aqui

# Webhook (URL do ngrok)
WEBHOOK_BASE_URL=https://abcd1234.ngrok-free.app
```

### Instalar dependências e rodar

```bash
npm install
npm run dev
```

O backend estará disponível em `http://localhost:3000`.

---

## 4. Configurando o Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e faz proxy automático das chamadas `/api/*` para o backend na porta 3000.

---

## 5. Executando Tudo (Resumo)

Abra 3 terminais:

**Terminal 1 — Infraestrutura + Backend:**

```bash
cd salesbud-copilot-microservice
docker compose up -d
npm install
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 — ngrok (para webhooks):**

```bash
ngrok http 3000
```

Acesse a aplicação em: **http://localhost:5173**

---

## 6. Rodando os Testes

```bash
cd salesbud-copilot-microservice

# Executar testes uma vez
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com relatório de cobertura
npm run test:cov
```

---

## 7. Lint e Build

### Backend

```bash
cd salesbud-copilot-microservice
npm run lint      # Verificar estilo de código
npm run build     # Compilar TypeScript para dist/
```

### Frontend

```bash
cd frontend
npm run lint      # Verificar estilo de código
npm run build     # Build de produção (tsc + vite build)
```

---

## Fluxo de Funcionamento

```
WhatsApp → Evolution API → Webhook (/webhook)
    → MessageBufferService (Redis, acumula mensagens)
    → RabbitMQ (job publicado após timeout)
    → AgentService (LangGraph + GPT-4o + RAG/Pinecone)
    → Resposta enviada via WhatsApp
```

O agente de IA usa busca vetorial (Pinecone) para consultar documentos da empresa e do vendedor, construindo respostas personalizadas com base na personalidade configurada para cada vendedor.
