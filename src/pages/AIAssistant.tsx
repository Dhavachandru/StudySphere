import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Plus, Trash2, Sparkles, FileText, BookOpen, Languages, Brain, FileCode } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
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
  { id: 'translate', label: 'Translate EN↔TA', icon: Languages },
];

// Local heuristic AI response (no external API key in this environment)
function generateResponse(kind: string, prompt: string): string {
  const p = prompt.trim();
  switch (kind) {
    case 'explain':
      return `Here's an explanation of:\n\n${p}\n\n• Purpose: This code performs its core task by orchestrating a sequence of operations.\n• Key parts: inputs are validated, the main logic runs, and results are returned.\n• Step-by-step: 1) Accept input  2) Process  3) Return output.\n• Tip: consider edge cases (empty input, invalid types) for robustness.`;
    case 'summarize':
      return `Summary:\n${p.slice(0, 500)}\n\nKey points:\n• Main idea captured above\n• Supporting details condensed\n• Actionable takeaway highlighted`;
    case 'notes':
      return `Generated notes:\n\n# ${p.slice(0, 60) || 'Topic'}\n\n## Introduction\n- Overview of the topic\n- Why it matters\n\n## Key Concepts\n- Definition\n- Examples\n- Applications\n\n## Summary\n- Recap of main points\n- Next steps for study`;
    case 'flashcards':
      return `Flashcards for: ${p || 'the topic'}\n\nQ1: What is the main concept?\nA1: [Definition here]\n\nQ2: Give an example.\nA2: [Example]\n\nQ3: Why is it important?\nA3: [Reasoning]`;
    case 'quiz':
      return `Quiz on: ${p || 'the topic'}\n\n1. What does X mean?\n   a) ...  b) ...  c) ...\n2. Which is true?\n   a) ...  b) ...  c) ...\n3. Give an example of Y.\n\n(Answers: 1-b, 2-c, 3 — open answer)`;
    case 'translate':
      return `English: ${p}\nTamil (தமிழ்): ${p}\n\nNote: This is a placeholder translation. Connect a translation API for accurate EN↔TA results.`;
    default:
      return `You said: "${p}"\n\nI'm StudySphere's offline assistant. I can help explain code, summarize text, generate notes, flashcards, quizzes, and translate. Try one of the modes above!`;
  }
}

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
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

  // load messages for active conversation
  useEffect(() => {
    if (!user || !activeConv) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase.from('chat_history').select('*').eq('user_id', user.id).eq('conversation_id', activeConv).order('created_at', { ascending: true });
      setMessages((data as ChatMessage[]) ?? []);
    })();
  }, [activeConv, user]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const newChat = () => {
    const id = crypto.randomUUID();
    setActiveConv(id);
    setMessages([]);
    setConversations((p) => [{ id, title: 'New chat', updated: new Date().toISOString() }, ...p]);
  };

  const send = async () => {
    if (!user || !input.trim()) return;
    const convId = activeConv || crypto.randomUUID();
    if (!activeConv) setActiveConv(convId);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'user', content: input, kind, metadata: null, created_at: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    const { error: e1 } = await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'user', content: input, kind });
    if (e1) setError(e1.message);
    setInput('');
    setBusy(true);
    const reply = generateResponse(kind, userMsg.content);
    setTimeout(async () => {
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), user_id: user.id, conversation_id: convId, role: 'assistant', content: reply, kind, metadata: null, created_at: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      const { error: e2 } = await supabase.from('chat_history').insert({ user_id: user.id, conversation_id: convId, role: 'assistant', content: reply, kind });
      if (e2) setError(e2.message);
      setBusy(false);
      load();
    }, 600);
  };

  const deleteConv = async (id: string) => {
    const { error } = await supabase.from('chat_history').delete().eq('conversation_id', id);
    if (error) { setError(error.message); return; }
    setConversations((p) => p.filter((c) => c.id !== id));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Bot className="text-indigo-500" /> AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">Chat, explain code, summarize, generate notes, flashcards, quizzes & translate.</p>
      </div>

      {error && <ErrorState message={error} />}

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
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'gradient-brand text-white' : 'glass-strong'}`}>
                      {m.content}
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
              <Button onClick={send} disabled={!input.trim() || busy} size="md"><Send size={16} /></Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
