import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  ClipboardList,
  Check,
  Clock,
  GraduationCap,
  ExternalLink,
  Send,
  Award,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { teacherService } from '../lib/teacherService';
import type { Assignment, TeacherTask, TaskSubmission } from '../lib/types';

const STATUSES = ['pending', 'in-progress', 'completed', 'overdue'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function Assignments() {
  const { user, profile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'teacher' | 'personal'>('teacher');

  // Personal Assignments State
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', subject: '', due_date: '', priority: 'medium', status: 'pending', description: '' });

  // Teacher Coursework State
  const [teacherTasks, setTeacherTasks] = useState<TeacherTask[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<TaskSubmission[]>([]);
  const [submitModalTask, setSubmitModalTask] = useState<TeacherTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personalRes, allTasks, mySubs] = await Promise.all([
        user
          ? supabase.from('assignments').select('*').eq('user_id', user.id).order('due_date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        teacherService.getAllTasks(),
        user ? teacherService.getStudentSubmissions(user.id) : Promise.resolve([]),
      ]);

      if (personalRes.error) setError(personalRes.error.message);
      setItems((personalRes.data as Assignment[]) ?? []);
      setTeacherTasks(allTasks);
      setStudentSubmissions(mySubs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const add = async () => {
    if (!user || !form.title) { setError('Title is required.'); return; }
    const { error } = await supabase.from('assignments').insert({
      user_id: user.id,
      title: form.title,
      subject: form.subject,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      description: form.description,
    });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', subject: '', due_date: '', priority: 'medium', status: 'pending', description: '' });
    load();
  };

  const update = async (a: Assignment, patch: Partial<Assignment>) => {
    const { error } = await supabase.from('assignments').update(patch).eq('id', a.id);
    if (error) { setError(error.message); return; }
    setItems((p) => p.map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
  };

  const remove = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalTask) return;

    setSubmitting(true);
    try {
      await teacherService.submitTask({
        task_id: submitModalTask.id,
        student_id: user?.id || 'std-1',
        student_name: profile?.full_name || 'Current Student',
        student_email: user?.email,
        student_avatar: profile?.avatar_url,
        submission_text: submissionText.trim(),
        submission_link: submissionLink.trim() || undefined,
      });

      setSubmitModalTask(null);
      setSubmissionText('');
      setSubmissionLink('');
      load();
    } catch (err) {
      console.error('Failed to submit coursework', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (task: TeacherTask) => {
    const existing = studentSubmissions.find((s) => s.task_id === task.id);
    setSubmitModalTask(task);
    setSubmissionText(existing?.submission_text || '');
    setSubmissionLink(existing?.submission_link || '');
  };

  const filtered = filter === 'all' ? items : items.filter((a) => a.status === filter);

  const stats = {
    total: items.length,
    pending: items.filter((a) => a.status === 'pending').length,
    inProgress: items.filter((a) => a.status === 'in-progress').length,
    completed: items.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2.5">
            <ClipboardList className="text-indigo-500" /> Academic Tasks & Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50">
            Submit faculty coursework and track personal deadlines and study priorities.
          </p>
        </div>

        {/* View Switcher: Teacher Tasks vs Personal Tasks */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'teacher'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={15} /> Faculty Tasks ({teacherTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'personal'
                ? 'gradient-brand text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList size={14} /> Personal Tracker ({items.length})
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* 1. TEACHER COURSEWORK TAB */}
      {activeTab === 'teacher' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Tasks and homework assigned directly by your teachers & professors.
            </p>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {studentSubmissions.length} Submissions Made
            </span>
          </div>

          {loading ? (
            <Loading label="Loading teacher coursework..." />
          ) : teacherTasks.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={28} />}
              title="No faculty tasks assigned yet"
              hint="When your teachers assign tasks or coursework, they will appear here with instructions and points."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {teacherTasks.map((task) => {
                const sub = studentSubmissions.find((s) => s.task_id === task.id);
                const isGraded = sub?.status === 'graded';
                const isSubmitted = sub?.status === 'submitted' || isGraded;
                const days = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null;

                return (
                  <GlassCard key={task.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            {task.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Assigned by {task.teacher_name}
                          </span>
                        </div>

                        {/* Submission Badge */}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isGraded
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : isSubmitted
                              ? 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {isGraded ? `Graded: ${sub?.grade}/${task.total_points} pts` : isSubmitted ? 'Submitted' : 'Pending Submission'}
                        </span>
                      </div>

                      <h3 className="font-bold text-base">{task.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-3">
                        {task.description}
                      </p>
                    </div>

                    {/* Teacher Feedback Card if Graded */}
                    {isGraded && sub?.feedback && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Award size={14} /> Teacher Feedback:
                        </div>
                        <p className="text-slate-300">{sub.feedback}</p>
                      </div>
                    )}

                    {/* Footer Details & Action Button */}
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} /> Due: {new Date(task.due_date).toLocaleDateString()}
                          {days !== null && days >= 0 ? ` (${days} days left)` : ' (Passed)'}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {task.total_points} Points Max
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => openSubmitModal(task)}
                        className={`w-full text-xs ${
                          isGraded
                            ? 'bg-white/10 text-slate-300 hover:bg-white/15'
                            : isSubmitted
                            ? 'bg-sky-600 hover:bg-sky-500 text-white'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        <Send size={13} /> {isGraded ? 'View Submitted Solution' : isSubmitted ? 'Update Submission' : 'Submit Assignment'}
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2. PERSONAL ASSIGNMENTS TRACKER */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {['all', ...STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize whitespace-nowrap transition ${
                    filter === s ? 'gradient-brand text-white' : 'glass hover:bg-white/70 dark:hover:bg-white/10'
                  }`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>

            <Button onClick={() => setOpen(true)} size="sm">
              <Plus size={14} /> Add Personal Task
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'from-blue-500 to-indigo-500' },
              { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-orange-500' },
              { label: 'In progress', value: stats.inProgress, color: 'from-sky-500 to-cyan-500' },
              { label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-teal-500' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}
                >
                  <ClipboardList size={15} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="No personal tasks"
              hint="Add your personal self-study assignments to stay ahead."
              action={
                <Button onClick={() => setOpen(true)} size="sm">
                  <Plus size={14} /> Add Task
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const days = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000) : null;
                const done = a.status === 'completed';
                return (
                  <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-4 group">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => update(a, { status: done ? 'pending' : 'completed' })}
                          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            done ? 'gradient-brand border-transparent' : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {done && <Check size={14} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium ${done ? 'line-through text-slate-400' : ''}`}>{a.title}</p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                a.priority === 'high'
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : a.priority === 'medium'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-slate-500/15 text-slate-500'
                              }`}
                            >
                              {a.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-white/50">
                            {a.subject && <span>{a.subject}</span>}
                            {a.due_date && (
                              <span
                                className={`flex items-center gap-1 ${
                                  days !== null && days <= 2 && !done ? 'text-rose-500' : ''
                                }`}
                              >
                                <Clock size={12} /> {new Date(a.due_date).toLocaleDateString()}{' '}
                                {days !== null && days >= 0 ? `(${days}d)` : ''}
                              </span>
                            )}
                          </div>
                          {a.description && <p className="text-xs text-slate-500 dark:text-white/50 mt-1">{a.description}</p>}
                        </div>
                        <select
                          value={a.status}
                          onChange={(e) => update(a, { status: e.target.value })}
                          className="px-2 py-1 rounded-lg glass text-xs capitalize"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => remove(a.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Student Submission */}
      <Modal
        open={!!submitModalTask}
        onClose={() => setSubmitModalTask(null)}
        title={`Submit Work: ${submitModalTask?.title}`}
      >
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-black/20 text-xs space-y-1">
            <p className="font-semibold text-slate-300">Subject: {submitModalTask?.subject}</p>
            <p className="text-slate-400">{submitModalTask?.description}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Solution Description & Notes
            </label>
            <Textarea
              required
              rows={4}
              placeholder="Explain your solution, algorithms used, and test results..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Project Link (GitHub repository, Google Drive, or hosted demo)
            </label>
            <Input
              placeholder="https://github.com/username/project"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSubmitModalTask(null)} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Send size={13} /> Confirm & Turn In
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Personal Assignment */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Personal Assignment">
        <div className="space-y-3">
          <Input placeholder="Assignment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="px-3 py-2.5 rounded-xl glass-strong text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
          </div>
          <Textarea
            placeholder="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button onClick={add} className="w-full">
            Add assignment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
