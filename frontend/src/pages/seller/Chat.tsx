import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, UserRound, Send, Loader2, MessageSquare } from 'lucide-react';
import { chat, type EvolutionChat, type ChatMessage } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { LeadPanel } from '../../components/chat/LeadPanel';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function extractText(msg: ChatMessage): string {
  const m = msg.message;
  if (!m) {
    // Received messages with no content stored: show placeholder so they render
    if (!msg.key.fromMe) return `[${msg.messageType ?? 'mensagem'}]`;
    return '';
  }
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
    <div className="flex h-screen bg-muted overflow-hidden">
      {/* Sidebar - Contact list */}
      <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground mb-3">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingChats ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
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
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-none',
                    isSelected
                      ? 'bg-pink/10'
                      : 'hover:bg-muted bg-transparent'
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={c.profilePicUrl ?? undefined} alt={name} />
                    <AvatarFallback className={cn(
                      'text-white text-sm font-bold',
                      isSelected ? 'bg-pink' : 'bg-navy-light'
                    )}>
                      {getInitial(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      {dateLabel && (
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lastText || formatJid(c.remoteJid)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedJid || !selectedChat ? (
          <div className="flex-1 flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="size-20 rounded-full bg-border mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="size-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Selecione uma conversa para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 bg-card border-b border-border flex items-center px-5 gap-3 shrink-0">
              <Avatar className="size-9">
                <AvatarImage src={selectedChat.profilePicUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-pink text-white text-sm font-bold">
                  {getInitial(getContactName(selectedChat))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {getContactName(selectedChat)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {formatJid(selectedChat.remoteJid)}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => loadMessages(selectedJid)}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar mensagens</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowLeadPanel(!showLeadPanel)}
                      className={cn(showLeadPanel && 'bg-pink/10 text-pink')}
                    >
                      <UserRound className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showLeadPanel ? 'Ocultar painel do lead' : 'Exibir painel do lead'}
                  </TooltipContent>
                </Tooltip>
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
                  <Loader2 className="size-6 animate-spin text-pink" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground text-sm">Nenhuma mensagem encontrada</p>
                </div>
              ) : (
                <>
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="flex justify-center my-3">
                        <Badge variant="secondary" className="shadow-sm text-[11px] font-normal">
                          {group.date}
                        </Badge>
                      </div>
                      {group.msgs.map((msg) => {
                        const text = extractText(msg);
                        if (!text) return null;
                        const fromMe = msg.key.fromMe;
                        return (
                          <div
                            key={msg.key.id}
                            className={cn('flex mb-1', fromMe ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={cn(
                                'max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm',
                                fromMe
                                  ? 'bg-pink text-white rounded-br-sm'
                                  : 'bg-white text-foreground rounded-bl-sm border border-border'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{text}</p>
                              <p
                                className={cn(
                                  'text-[10px] mt-1 text-right',
                                  fromMe ? 'text-white/60' : 'text-muted-foreground'
                                )}
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
            <div className="bg-card border-t border-border px-4 py-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Digite uma mensagem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="flex-1 rounded-full"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputText.trim() || sending}
                  className="rounded-full bg-pink hover:bg-pink-hover shrink-0"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Lead CRM Panel */}
      {selectedJid && seller && showLeadPanel && (
        <div className="w-80 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead CRM</h3>
          </div>
          <ScrollArea className="flex-1">
            <LeadPanel sellerId={seller.id} remoteJid={selectedJid} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
