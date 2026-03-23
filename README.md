# SalesBud Copilot

Um copiloto inteligente para vendedores que automatiza o atendimento via WhatsApp. Facilita o processo de venda ao lidar com grande volume de clientes simultaneamente, qualificar leads, conduzir a conversa de forma natural e agendar calls — liberando o vendedor para focar no fechamento.

**O que o Copilot faz:**
- Conversa naturalmente com leads/clientes
- Identifica temperatura do lead (frio, morno, quente)
- Detecta se é tomador de decisão
- Mapeia dores, expectativas e objeções
- Avalia interesse e qualificação
- Classifica etapa do funil de vendas
- Agenda calls no Google Meet (via Google Calendar)
- Atende alto volume de leads simultaneamente
- Personalidade configurável por vendedor
- Base de conhecimento própria (RAG/Pinecone)
- Transcreve áudios do WhatsApp automaticamente (Whisper via OpenRouter)
- Descreve imagens recebidas (GPT-4o via OpenRouter)

> Backend em Express 5 + TypeScript. Frontend em React 19 + Vite. IA com DeepSeek v3.2 via OpenRouter e LangChain. Autenticação com Clerk.

## Pré-requisitos

- **Node.js** >= 18
- **Docker** e **Docker Compose**
- **npm**
- **ngrok** (para receber webhooks do WhatsApp em ambiente local)
- **Conta no Clerk** (autenticação e OAuth Google Calendar)

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

# Evolution API — nome da instância PoC
EVOLUTION_INSTANCE_NAME=salesbud_poc

# Seed (opcional — cria dados iniciais para PoC)
DEFAULT_COMPANY_ID=uuid_da_empresa_aqui
SEED_SELLER_CLERK_USER_ID=clerk_user_id_do_vendedor
SEED_ADMIN_CLERK_USER_ID=clerk_user_id_do_admin
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

O frontend estará disponível em `http://localhost:5173` e faz proxy automático das chamadas `/api/*` para o backend na porta 3000 (rewrite remove o prefixo `/api`).

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

## Seed Automático (PoC)

Ao rodar o backend pela primeira vez, o sistema cria automaticamente no banco de dados:

- 1 empresa padrão
- 1 usuário vendedor
- 1 usuário admin

Isso é apenas para fins de demonstração (PoC), permitindo testar o sistema sem precisar cadastrar nada manualmente.

### Testando o agente no WhatsApp

Com tudo configurado e rodando (infra Docker + backend + Evolution API conectada), o agente já está pronto para responder. Basta enviar uma mensagem para o número de demonstração:

**[Enviar mensagem no WhatsApp → +55 (91) 98194-1219](https://wa.me/5591981941219)**

O agente responderá automaticamente simulando o vendedor padrão do seed.

---

## 6. Testes

```bash
cd salesbud-copilot-microservice

npm test             # Rodar todos os testes uma vez
npm run test:watch   # Rodar em modo watch (re-executa ao salvar)
npm run test:cov     # Rodar com relatório de cobertura
```

Os testes cobrem:

| Módulo | O que testa |
|--------|-------------|
| `CalendarService` | Buffer de 30min entre reuniões, detecção de overlap, custom buffer |
| `check_availability` tool | Validação de horário comercial, antecedência mínima, conflitos, erros |
| `schedule_meeting` tool | Agendamento com Meet, atualização de status do lead, conflitos, fallback |

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

## Como o Sistema Funciona

### Pipeline de Mensagens

```
1. WhatsApp
   └─► Evolution API (1 instância por vendedor)
        └─► POST /webhook/:sellerId

2. Webhook Controller
   ├─► Detecta fromMe=true → pausa agente por 2h (seller takeover)
   ├─► audioMessage → transcreve via Whisper-1 (OpenRouter)
   ├─► imageMessage → descreve via GPT-4o (OpenRouter) + caption
   └─► Faz upsert do Lead (cria/atualiza por remoteJid)

3. MessageBufferService
   └─► Acumula mensagens no Redis por chave (sellerId + remoteJid)
   └─► Reinicia timer a cada nova mensagem (padrão: 5s)
        └─► Ao disparar → publica job na fila RabbitMQ

4. process-buffer subscriber (RabbitMQ consumer)
   └─► Verifica se agente está pausado (seller takeover ativo)
   └─► Faz flush do buffer (todas as mensagens concatenadas)
   └─► Chama AgentService

5. AgentService (LangChain createAgent + DeepSeek v3.2 via OpenRouter)
   ├─► Carrega histórico de conversa do Redis (configurável por vendedor, padrão runtime 80 msgs)
   ├─► Sanitiza input contra prompt injection
   ├─► Monta system prompt dinâmico com personalidade do vendedor
   └─► Ferramentas disponíveis:
       ├─► rag-search       → busca vetorial no Pinecone (namespace empresa + vendedor)
       ├─► think            → reflexão interna (framework SPIN Selling)
       ├─► classify-lead    → classifica temperatura e etapa do funil
       ├─► check-availability → consulta agenda do vendedor (Google Calendar via Clerk OAuth)
       └─► schedule-meeting  → agenda reunião no Google Meet (com lock distribuído e retry)

6. Resposta ao WhatsApp (via Evolution API)
   ├─► URL de mídia detectada (jpg/jpeg/png/gif/mp4/pdf/doc/docx) → sendMedia
   └─► Texto → dividido por \n---\n, enviado parte a parte
                com delay proporcional ao tamanho (50ms/char, máx 10s)
```

### Seller Takeover

Quando o próprio vendedor envia uma mensagem pelo WhatsApp, o agente é automaticamente pausado por 2 horas, evitando que responda enquanto o vendedor está assumindo a conversa manualmente.

### Personalidade do Vendedor

Cada vendedor tem traços configuráveis (formalidade, humor, empatia, estilo de comunicação, abordagem de vendas) que moldam dinamicamente o system prompt — fazendo cada instância se comportar de forma diferente.

### Modelo de Dados

```
Company
 └─► Sellers (1 instância Evolution API por vendedor)
      └─► Leads
```

- **Company**: namespace Pinecone para conhecimento geral da empresa
- **Seller**: namespace Pinecone próprio, configurações de personalidade e instância Evolution
- **Pinecone**: índice `salesbud-sdr`, namespaces separados por company e seller
