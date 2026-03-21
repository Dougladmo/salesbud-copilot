import { useState, useEffect, useRef, useCallback } from 'react';
import { chat, type EvolutionChat, type ChatMessage } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { LeadPanel } from '../../components/chat/LeadPanel';

function extractText(msg: ChatMessage): string {
  const m = msg.message;
  if (!m) return '';
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `[Imagem] ${m.imageMessage.caption}`;
  if (m.imageMessage) return '[Imagem]';
  if (m.audioMessage) return '[Audio]';
  if (m.videoMessage) return '[Video]';
  if (m.documentMessage) return `[Documento] ${m.documentMessage.fileName ?? ''}`;
  if (m.interactiveMessage?.body?.text) return m.interactiveMessage.body.text;
  return `[${msg.messageType ?? 'mensagem'}]`;
}

function extractLastText(c: EvolutionChat): string {
  const lm = c.lastMessage;
  if (!lm?.message) return '';
  const m = lm.message;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage) return '[Imagem]';
  if (m.audioMessage) return '[Audio]';
  if (m.videoMessage) return '[Video]';
  if (m.documentMessage) return '[Documento]';
  if (m.interactiveMessage?.body?.text) return m.interactiveMessage.body.text;
  return `[${lm.messageType ?? 'mensagem'}]`;
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateFromIso(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatJid(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '').replace(/@lid$/, '');
}

function getContactName(c: EvolutionChat): string {
  if (c.pushName) return c.pushName;
  return formatJid(c.remoteJid);
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function ChatPage() {
  const { seller } = useSeller();
  const [chats, setChats] = useState<EvolutionChat[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      setLoadingChats(true);
      const chatList = await chat.findChats();
      const filtered = (Array.isArray(chatList) ? chatList : [])
        .filter((c) => c.remoteJid?.endsWith('@s.whatsapp.net'))
        .sort((a, b) => {
          const tA = a.lastMessage?.messageTimestamp ?? 0;
          const tB = b.lastMessage?.messageTimestamp ?? 0;
          if (tA || tB) return tB - tA;
          const dA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dB - dA;
        });
      setChats(filtered);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }

  const loadMessages = useCallback(async (jid: string, showLoading = true) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const result = await chat.findMessages(jid, 1, 80);
      const records = result.records ?? [];
      const sorted = [...records].sort((a, b) => a.messageTimestamp - b.messageTimestamp);
      setMessages(sorted);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedJid) return;
    loadMessages(selectedJid);

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(selectedJid, false), 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedJid, loadMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNewMessages = messages.length !== prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    if (!isNewMessages) return;
    // Auto-scroll if near bottom (within 150px) or on first load
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function handleSend() {
    if (!inputText.trim() || !selectedJid || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const tempMsg: ChatMessage = {
      key: { remoteJid: selectedJid, fromMe: true, id: `temp-${Date.now()}` },
      message: { conversation: text },
      messageTimestamp: Math.floor(Date.now() / 1000),
      messageType: 'conversation',
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await chat.sendMessage(selectedJid, text);
      setTimeout(() => loadMessages(selectedJid, false), 2000);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const selectedChat = chats.find((c) => c.remoteJid === selectedJid);

  const filteredChats = chats.filter((c) => {
    if (!search) return true;
    const name = getContactName(c).toLowerCase();
    const jid = formatJid(c.remoteJid).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || jid.includes(q);
  });

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const d = formatDate(msg.messageTimestamp);
    if (d !== currentDate) {
      currentDate = d;
      groupedMessages.push({ date: d, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar - Contact list */}
      <div className="w-80 bg-white border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-text mb-3">Conversas</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface rounded-lg text-sm border border-border focus:outline-none focus:border-accent transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
            </div>
          ) : (
            filteredChats.map((c) => {
              const name = getContactName(c);
              const isSelected = selectedJid === c.remoteJid;
              const lastText = extractLastText(c);
              const lastTs = c.lastMessage?.messageTimestamp;
              const dateLabel = lastTs
                ? formatDate(lastTs)
                : c.updatedAt
                  ? formatDateFromIso(c.updatedAt)
                  : '';
              return (
                <button
                  key={c.remoteJid}
                  onClick={() => setSelectedJid(c.remoteJid)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-none ${
                    isSelected
                      ? 'bg-accent/10'
                      : 'hover:bg-surface-hover bg-transparent'
                  }`}
                >
                  {c.profilePicUrl ? (
                    <img
                      src={c.profilePicUrl}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      isSelected ? 'bg-accent' : 'bg-navy-light'
                    }`}>
                      {getInitial(name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text truncate">{name}</p>
                      {dateLabel && (
                        <span className="text-[11px] text-text-muted shrink-0 ml-2">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {lastText || formatJid(c.remoteJid)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedJid || !selectedChat ? (
          <div className="flex-1 flex items-center justify-center bg-surface">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-border mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-text-muted text-sm">Selecione uma conversa para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 bg-white border-b border-border flex items-center px-5 gap-3 shrink-0">
              {selectedChat.profilePicUrl ? (
                <img
                  src={selectedChat.profilePicUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                  {getInitial(getContactName(selectedChat))}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">
                  {getContactName(selectedChat)}
                </p>
                <p className="text-[11px] text-text-muted truncate">{formatJid(selectedChat.remoteJid)}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => loadMessages(selectedJid)}
                  className="p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer bg-transparent border-none"
                  title="Atualizar mensagens"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowLeadPanel(!showLeadPanel)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer border-none ${
                    showLeadPanel ? 'bg-accent/10 text-accent' : 'hover:bg-surface text-text-muted bg-transparent'
                  }`}
                  title={showLeadPanel ? 'Ocultar painel do lead' : 'Exibir painel do lead'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e2e6ed\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-text-muted text-sm">Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                <>
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="flex justify-center my-3">
                        <span className="bg-white/90 text-text-muted text-[11px] px-3 py-1 rounded-full shadow-sm">
                          {group.date}
                        </span>
                      </div>
                      {group.msgs.map((msg) => {
                        const text = extractText(msg);
                        if (!text) return null;
                        const fromMe = msg.key.fromMe;
                        return (
                          <div
                            key={msg.key.id}
                            className={`flex mb-1 ${fromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm ${
                                fromMe
                                  ? 'bg-accent text-white rounded-br-sm'
                                  : 'bg-white text-text rounded-bl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{text}</p>
                              <p
                                className={`text-[10px] mt-1 text-right ${
                                  fromMe ? 'text-white/60' : 'text-text-muted'
                                }`}
                              >
                                {formatTime(msg.messageTimestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-border px-4 py-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Digite uma mensagem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-surface rounded-full text-sm border border-border focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:bg-accent-hover transition-colors disabled:opacity-40 cursor-pointer border-none"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Lead CRM Panel */}
      {selectedJid && seller && showLeadPanel && (
        <div className="w-80 bg-white border-l border-border flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Lead CRM</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LeadPanel sellerId={seller.id} remoteJid={selectedJid} />
          </div>
        </div>
      )}
    </div>
  );
}
