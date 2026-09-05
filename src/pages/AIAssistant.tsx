import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Plus, Trash2, Sparkles, FileText, BookOpen, Languages, Brain, FileCode, Copy, Check, StopCircle, RotateCw } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Markdown } from '../components/ui/Markdown';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
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

const AI_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

type ChatApiMessage = { role: 'user' | 'assistant'; content: string };

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
      setMessages((data as ChatMessage[]) ?? []);
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
    const apiHistory: ChatApiMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const resp = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message: prompt, mode: kind, history: apiHistory, conversation_id: convId, user_id: user?.id }),
      signal: controller.signal,
    });

    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || `Request failed (${resp.status})`);
    return String(data.reply || '');
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

    const { error: e1 } = await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'user', content: userContent, kind });
    if (e1) setError(e1.message);

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
        const msg = e instanceof Error ? e.message : 'AI request failed.';
        setError(msg);
        const errMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'assistant', content: `*Request failed:* ${msg}`, kind, metadata: null, created_at: new Date().toISOString() };
        setMessages((p) => [...p, errMsg]);
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
    // Drop the last assistant message (error) and resend.
    setMessages((p) => {
      const copy = [...p];
      if (copy.length && copy[copy.length - 1].role === 'assistant') copy.pop();
      return copy;
    });
    setBusy(true);
    try {
      const reply = await callAI(lastUser.content, lastUser.conversation_id, messages.filter((m) => m.role !== 'assistant' || m.id !== messages[messages.length - 1]?.id));
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: reply, kind, metadata: null, created_at: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      await supabase.from('chat_history').insert({ user_id: user!.id, conversation_id: lastUser.conversation_id, role: 'assistant', content: reply, kind });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed.');
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Bot className="text-indigo-500" /> AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">Chat, explain code, summarize, generate notes, flashcards, quizzes & translate.</p>
      </div>

      {error && <ErrorState message={error} onRetry={retry} />}

      <div className="grid lg:grid-cols-4 gap-4 h-[70vh]">
        <GlassCard className="lg:col-span-1 p-3 flex flex-col">
          <Button size="sm" onClick={newChat} className="mb-2"><Plus size={15} /> New chat</Button>
          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No conversations</p>}
            {conversations.map((c) => (
              <div key={c.id} className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${activeConv === c.id ? 'glass-strong' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => setActiveConv(c.id)}>
                <Bot size={14} className="text-indigo-400 shrink-0" />
                <span className="text-sm truncate flex-1">{c.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-3 flex flex-col p-0 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto p-2 border-b border-white/10">
            {KINDS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setKind(id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${kind === id ? 'gradient-brand text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? <Loading /> : messages.length === 0 ? (
              <EmptyState icon={<Sparkles size={24} />} title="Start a conversation" hint={`Mode: ${KINDS.find((k) => k.id === kind)?.label}. Type a message below.`} />
            ) : (
              <AnimatePresence>
                {messages.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`group flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'gradient-brand text-white' : 'glass-strong'}`}>
                      {m.role === 'assistant' ? <Markdown content={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => copyMsg(m.id, m.content)} className="text-xs flex items-center gap-1 text-slate-500 dark:text-white/50 hover:text-indigo-500">
                            {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
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
    </div>
  );
}
