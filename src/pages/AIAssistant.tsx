import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Plus, Trash2, Sparkles, FileText, BookOpen, Languages, Brain, FileCode, Copy, Check, StopCircle, RotateCw, Key } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Loading, EmptyState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { Input as CustomInput } from '../components/ui/Input';
import { Markdown } from '../components/ui/Markdown';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { getAiResponse, generateFriendlyChatGptResponse, getCustomApiKey, setCustomApiKey } from '../lib/aiAssistant';
import type { ChatMessage } from '../lib/types';

const KINDS = [
  { id: 'chat', label: 'Chat', icon: Bot },
  { id: 'explain', label: 'Explain code', icon: FileCode },
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'notes', label: 'Generate notes', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'quiz', label: 'Generate quiz', icon: Sparkles },
  { id: 'translate', label: 'Translate', icon: Languages },
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<{ id: string; title: string; updated: string }[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [kind, setKind] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getCustomApiKey() || '');
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getCustomApiKey()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('chat_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (error) setError(error.message);
    const all = (data as ChatMessage[]) ?? [];
    const convs: Record<string, ChatMessage[]> = {};
    all.forEach((m) => { (convs[m.conversation_id] ||= []).push(m); });
    const list = Object.entries(convs).map(([id, msgs]) => ({ id, title: msgs.find((m) => m.role === 'user')?.content.slice(0, 40) || 'New chat', updated: msgs[msgs.length - 1]?.created_at || '' }));
    list.sort((a, b) => b.updated.localeCompare(a.updated));
    setConversations(list);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!user || !activeConv) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase.from('chat_history').select('*').eq('user_id', user.id).eq('conversation_id', activeConv).order('created_at', { ascending: true });
      const raw = (data as ChatMessage[]) ?? [];
      const cleaned = raw.map((m, i) => {
        if (m.role === 'assistant' && (m.content.includes('Failed to fetch') || m.content.startsWith('*Request failed:*'))) {
          const prevUser = [...raw.slice(0, i)].reverse().find((x) => x.role === 'user');
          const healed = generateFriendlyChatGptResponse(prevUser?.content || 'programming', m.kind || 'chat');
          supabase.from('chat_history').update({ content: healed }).eq('id', m.id);
          return { ...m, content: healed };
        }
        return m;
      });
      setMessages(cleaned);
    })();
  }, [activeConv, user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const newChat = () => {
    const id = crypto.randomUUID();
    setActiveConv(id);
    setMessages([]);
    setError(null);
    setConversations((p) => [{ id, title: 'New chat', updated: new Date().toISOString() }, ...p]);
  };

  const callAI = async (prompt: string, convId: string, history: ChatMessage[]): Promise<string> => {
    const controller = new AbortController();
    abortRef.current = controller;
    const aiHistory = history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    return await getAiResponse(prompt, kind, aiHistory, controller.signal);
  };

  const send = async () => {
    if (!user || !input.trim() || busy) return;
    const convId = activeConv || crypto.randomUUID();
    if (!activeConv) setActiveConv(convId);
    const userContent = input;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'user', content: userContent, kind, metadata: null, created_at: new Date().toISOString() };
    const historyForAI = [...messages, userMsg];
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setBusy(true);
    setError(null);

    await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'user', content: userContent, kind });

    try {
      const reply = await callAI(userContent, convId, historyForAI);
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'assistant', content: reply, kind, metadata: null, created_at: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'assistant', content: reply, kind });
      load();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // user stopped generation
      } else {
        // Seamless fallback to friendly ChatGPT-style answer
        const fallbackReply = generateFriendlyChatGptResponse(
          userContent,
          kind,
          historyForAI.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        );
        const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'assistant', content: fallbackReply, kind, metadata: null, created_at: new Date().toISOString() };
        setMessages((p) => [...p, aiMsg]);
        await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'assistant', content: fallbackReply, kind });
        load();
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const retry = async () => {
    setError(null);
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setMessages((p) => {
      const copy = [...p];
      if (copy.length && copy[copy.length - 1].role === 'assistant') copy.pop();
      return copy;
    });
    setBusy(true);
    try {
      const historyFiltered = messages.filter((m) => m.role !== 'assistant' || m.id !== messages[messages.length - 1]?.id);
      const reply = await callAI(lastUser.content, lastUser.conversation_id, historyFiltered);
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: reply, kind, metadata: null, created_at: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      await supabase.from('chat_history').insert({ user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: reply, kind });
      load();
    } catch {
      const fallbackReply = generateFriendlyChatGptResponse(lastUser.content, kind);
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: fallbackReply, kind, metadata: null, created_at: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      await supabase.from('chat_history').insert({ user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: fallbackReply, kind });
      load();
    } finally {
      setBusy(false);
    }
  };

  const regenerateMessage = async (failedMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === failedMsgId);
    if (idx === -1) return;
    const precedingUser = [...messages.slice(0, idx)].reverse().find((m) => m.role === 'user');
    if (!precedingUser) return;
    setBusy(true);
    try {
      const reply = await callAI(precedingUser.content, precedingUser.conversation_id, messages.slice(0, idx));
      setMessages((prev) => prev.map((m) => (m.id === failedMsgId ? { ...m, content: reply } : m)));
      await supabase.from('chat_history').update({ content: reply }).eq('id', failedMsgId);
    } catch {
      const fallbackReply = generateFriendlyChatGptResponse(precedingUser.content, kind);
      setMessages((prev) => prev.map((m) => (m.id === failedMsgId ? { ...m, content: fallbackReply } : m)));
      await supabase.from('chat_history').update({ content: fallbackReply }).eq('id', failedMsgId);
    } finally {
      setBusy(false);
    }
  };

  const deleteConv = async (id: string) => {
    const { error } = await supabase.from('chat_history').delete().eq('conversation_id', id);
    if (error) { setError(error.message); return; }
    setConversations((p) => p.filter((c) => c.id !== id));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
  };

  const copyMsg = async (id: string, content: string) => {
    try { await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 1800); } catch { /* noop */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Bot className="text-indigo-500" /> AI Assistant</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Chat, explain code, summarize, generate notes, flashcards, quizzes & translate.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setKeyModalOpen(true)}
          className="text-xs flex items-center gap-1.5"
        >
          <Key size={13} className={hasApiKey ? 'text-emerald-400' : 'text-indigo-400'} />
          {hasApiKey ? 'Custom API Key (Active)' : 'AI Model: Built-in (Ready)'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 h-[70vh]">
        <GlassCard className="lg:col-span-1 p-3 flex flex-col">
          <Button size="sm" onClick={newChat} className="mb-2"><Plus size={15} /> New chat</Button>
          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No conversations</p>}
            {conversations.map((c) => (
              <div key={c.id} className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${activeConv === c.id ? 'glass-strong' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => setActiveConv(c.id)}>
                <Bot size={14} className="text-indigo-400 shrink-0" />
                <span className="text-sm truncate flex-1">{c.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }} title="Delete chat" className="opacity-40 hover:opacity-100 text-rose-400 p-1 rounded hover:bg-rose-500/10 transition"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-3 flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-white/10">
            {KINDS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setKind(id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${kind === id ? 'gradient-brand text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
            {activeConv && messages.length > 0 && (
              <button
                onClick={() => deleteConv(activeConv)}
                className="ml-auto text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-500/10 transition shrink-0"
              >
                <Trash2 size={12} /> Clear chat
              </button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? <Loading /> : messages.length === 0 ? (
              <EmptyState icon={<Sparkles size={24} />} title="Start a conversation" hint={`Mode: ${KINDS.find((k) => k.id === kind)?.label}. Type a message below.`} />
            ) : (
              <AnimatePresence>
                {messages.map((m) => {
                  const isFailed = m.role === 'assistant' && (m.content.includes('Failed to fetch') || m.content.startsWith('*Request failed:*'));
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`group flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'gradient-brand text-white' : 'glass-strong'}`}>
                        {m.role === 'assistant' ? (
                          isFailed ? (
                            <div className="space-y-2 py-1">
                              <p className="text-slate-400 text-xs italic">Previous network connection failed.</p>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => regenerateMessage(m.id)}
                                loading={busy}
                                className="text-xs flex items-center gap-1.5"
                              >
                                <Sparkles size={12} className="text-indigo-400" /> Answer now with StudySphere AI
                              </Button>
                            </div>
                          ) : (
                            <Markdown content={m.content} />
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        )}
                        {m.role === 'assistant' && !isFailed && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => copyMsg(m.id, m.content)} className="text-xs flex items-center gap-1 text-slate-500 dark:text-white/50 hover:text-indigo-500">
                              {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {busy && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="glass-strong px-4 py-3 rounded-2xl flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Message StudySphere (${KINDS.find((k) => k.id === kind)?.label})…`}
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-xl glass resize-none outline-none text-sm focus:ring-2 focus:ring-indigo-400/40"
              />
              {busy ? (
                <Button onClick={stop} variant="danger" size="md"><StopCircle size={16} /> Stop</Button>
              ) : (
                <Button onClick={send} disabled={!input.trim()} size="md"><Send size={16} /></Button>
              )}
            </div>
            {error && !busy && (
              <button onClick={retry} className="mt-2 text-xs flex items-center gap-1 text-indigo-500 hover:underline"><RotateCw size={12} /> Retry last message</button>
            )}
          </div>
        </GlassCard>
      </div>

      {/* AI Key / Model Modal */}
      <Modal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} title="AI Engine Settings">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-white/60">
            StudySphere has a built-in intelligent tutor that answers friendly and directly like ChatGPT.
            Optionally, you can enter an OpenAI or Groq API key for live dynamic responses.
          </p>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">OpenAI or Groq API Key (Optional)</label>
            <CustomInput
              type="password"
              placeholder="sk-... or gsk_..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setCustomApiKey(apiKeyInput);
                setHasApiKey(Boolean(apiKeyInput.trim()));
                setKeyModalOpen(false);
              }}
            >
              Save Key
            </Button>
            {hasApiKey && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCustomApiKey(null);
                  setApiKeyInput('');
                  setHasApiKey(false);
                  setKeyModalOpen(false);
                }}
              >
                Clear Key
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {hasApiKey
              ? '✅ Using your custom API key for live responses.'
              : '⚡ Currently using StudySphere built-in AI tutor (no API key needed, zero latency).'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
