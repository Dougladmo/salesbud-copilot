# Salesbud — Contexto Completo do Produto

## Visão Geral

- **Empresa:** Salesbud
- **Site:** https://salesbud.com.br/
- **App:** https://app.salesbud.com.br/login
- **Tagline:** "IA para preenchimento de CRM"
- **Proposta de valor:** "A plataforma que grava, transcreve e entende videoconferências, ligações e WhatsApp — atualiza o CRM automaticamente e gera insights para vender mais."
- **Localização:** Florianópolis/SC | São Paulo/SP
- **Base de clientes:** +300 empresas
- **Público-alvo:** Times de SDR, Vendas, Customer Success, gestores de revenue
- **Modelo de venda:** Demo-request (sem self-serve, sem pricing público)
- **Social:** LinkedIn, YouTube

---

## Funcionalidades Mapeadas (Site)

### Pipeline Core (4 etapas)
1. **Grava e transcreve** — Reuniões, ligações e mensagens de WhatsApp
2. **Resume a informação** — IA estrutura os dados
3. **Preenche seu CRM** — Campos preenchidos automaticamente
4. **Gera insights** — Identifica gaps e gera inteligência comercial

### Módulo: Videoconferência (/videoconferencia)
- Conecta agenda Google ou Teams; bot entra como convidado
- Transcrição completa com speakers identificados
- Extração de insights → preenchimento de campos personalizáveis no CRM
- Avaliação por IA baseada no playbook do cliente (nota X/10)
- Identificação de menções a concorrentes com sentimento (Positiva/Neutra/Negativa)
- Mapeamento de dúvidas e objeções recorrentes
- Chat com Bud (Q&A sobre a reunião)
- Templates (prompts customizáveis para extração de dados)

### Módulo: WhatsApp (/whatsapp) — BETA
- Conexão via QRCode (WhatsApp Business)
- Espelhamento de conversas para gestores
- Timeline com resumo diário por conversa
- Métricas de tempo de resposta (lead e usuário)
- Templates para extração de informações e preenchimento de CRM
- Chat para perguntas sobre uma ou várias conversas
- Controle de acesso: gestor vê todos, usuário vê só o seu

### Módulo: Ligações (/ligacoes)
- Integração com 30+ VoIPs/PABX
- Transcrição completa de ligações
- Preenchimento automático de CRM + cards de qualificação
- Score de qualificação do lead e probabilidade de venda
- Avaliação de habilidades por IA (nota por ligação)
- Insights sobre objeções e concorrentes

### Módulo: Enablement (/enablement)
- **Dashboard Reuniões:** Tempo de fala, duração média, quantidade por usuário
- **Dashboard Concorrentes:** Análise de sentimento sobre concorrentes mencionados
- **Dashboard Avaliações:** Média geral por time e por integrante
- **Dashboard Dúvidas:** Objeções e dúvidas mais recorrentes
- Profiling por colaborador com evolução temporal
- Feedbacks automáticos gerados pela IA
- Comparação de desempenho do time

### Casos de Uso por Área

**Pré-vendas:** Avaliação de atendimento, tempo de resposta, resumo de tratativas, score de atendimento, análise de ligações

**Vendas:** CRM automático, dados de contexto por lead, calibração do processo comercial, gaps, probabilidade de deals, forecast automático, monitoramento de follow-ups no WhatsApp, objeções em tempo real

**Customer Success:** Passagem de bastão, contexto de contas, scoring de risco, satisfação em realtime, dúvidas recorrentes, próximos passos automáticos

---

## Menu do App (Tour Interativo)

### Sidebar
1. **Reuniões** — Lista principal com scores
2. **Conversas** (BETA) — Módulo WhatsApp
3. **Templates** — Prompts para extração
4. **Enablement** (submenu):
   - Estatísticas de Reunião
   - Análise de Concorrentes
   - Avaliações de Vendas
   - Dúvidas dos Clientes
5. **Relatórios**
6. **Ferramentas** (submenu):
   - Fast Assessment
7. **Configurações** (submenu):
   - Gerais
   - Bot
   - IA e Análises
   - Calendário
   - Integrações

### Tela de Detalhe da Reunião
- **Abas:** Template | Transcrição | Chat | Contas | Leads
- Player de vídeo/áudio (Play, Mute, Playback Rate, Fullscreen, Download)
- Nota da IA (ex: 8/10)
- Botões: Compartilhar, Excluir, Editar, "Melhorar com IA"
- Timeline lateral
- Menções de Concorrentes com sentimento
- Informações da Reunião
- Histórico do Bot

---

## Tour Completo do App (26 passos)

### Setup (1-5)
| Step | Título | Descrição |
|------|--------|-----------|
| 1 | Iniciar Configuração | Configurar em 3 passos simples |
| 2 | 1º Integração CRM | Salesbud integra o CRM/VoIP (+75 CRMs) |
| 3 | 2º WhatsApp | Cada usuário conecta via QRCode |
| 4 | 3º Agenda | Conectar agenda Google/Teams |
| 5 | Configuração Finalizada | Bot grava ligações, reuniões e WhatsApp |

### Reuniões (6-14)
| Step | Título | Descrição |
|------|--------|-----------|
| 6 | Lista de Reuniões | Reuniões/ligações aparecem com scores |
| 7 | Gravação | Gravação disponível após finalizar |
| 8 | Transcrição | Transcrição completa da reunião |
| 9 | Chat com Bud | Perguntar coisas sobre a reunião |
| 10 | Template | Prompts para extrair info e preencher CRM |
| 11 | Avaliação por IA | Todas reuniões/ligações recebem avaliação |
| 12 | Personalizar Avaliação | Prompts de avaliação por equipes |
| 13 | Menções a Concorrentes | IA identifica menções com sentimento |
| 14 | Dúvidas Recorrentes | Dúvidas/objeções mapeadas e categorizadas |

### WhatsApp (15-20)
| Step | Título | Descrição |
|------|--------|-----------|
| 15 | Transição WhatsApp | Entrada no módulo |
| 16 | WhatsApp Bud | Conversas espelhadas |
| 17 | Nível de Acesso | Gestor vê todos, usuário vê só o seu |
| 18 | Mensagens | Acesso integral às conversas |
| 19 | Template WhatsApp | Prompts para extrair info de conversas |
| 20 | Timeline | Informação resumida em timeline |

### Enablement (21-26)
| Step | Título | Descrição |
|------|--------|-----------|
| 21 | Intro Enablement | 4 dashboards para gestores |
| 22 | Dashboard Reuniões | Dados quantitativos (tempo fala, duração, qtd) |
| 23 | Dashboard Concorrentes | Análise de sentimento sobre concorrentes |
| 24 | Dashboard Avaliações | Média geral por time e integrante |
| 25 | Dashboard Dúvidas | Dúvidas/objeções mais recorrentes |
| 26 | CTA Final | Call to action para demonstração |

---

## Integrações Disponíveis

| Tipo | Detalhes |
|------|----------|
| **CRM** | +75 CRMs integrados (citados: HubSpot, RD Station, Pipedrive) |
| **VoIP** | +30 provedores VoIP/PABX |
| **Calendário** | Google Agenda, Microsoft Outlook/Teams, customizadas |
| **Mensagens** | WhatsApp (via QRCode), WhatsApp Business |
| **Webhook** | Disponível |

---

## Métricas e Dados Relevantes

- **Economia:** Até 2h/dia por usuário em preenchimento de CRM
- **Base:** +300 empresas
- **Integrações:** +75 CRMs, +30 VoIPs
- **Canais:** Videoconferência, Ligações VoIP, WhatsApp, Reunião Presencial (mencionada em casos de uso)

---

## Capacidades de IA

- Transcrição (reuniões, ligações)
- Captura e processamento de mensagens (WhatsApp)
- Preenchimento automático de CRM com templates/prompts customizáveis
- Avaliação de reuniões/ligações (customizável por time, nota X/10)
- Detecção de menções a concorrentes com sentimento
- Mapeamento e categorização de objeções/dúvidas
- Avaliação de habilidades e profiling por usuário
- Tracking de evolução temporal por pessoa
- Geração automática de feedback
- Chat (Q&A sobre reuniões/conversas)
- Geração de texto de follow-up (via chat)
- Score de temperatura do negócio e risco de churn
- Score de qualificação de lead

---
