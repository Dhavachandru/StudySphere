import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, BookOpen, Check, X, CalendarCheck, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Subject, AttendanceRecord } from '../lib/types';

export default function Attendance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSubject, setOpenSubject] = useState(false);
  const [openRecord, setOpenRecord] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', color: '#6366f1', instructor: '', credits: '' });
  const [recordForm, setRecordForm] = useState({ subject_id: '', subject_name: '', date: new Date().toISOString().slice(0, 10), status: 'present' });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('attendance').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200),
      ]);
      if (s.error) setError(s.error.message);
      if (r.error) setError(r.error.message);
      setSubjects((s.data as Subject[]) ?? []);
      setRecords((r.data as AttendanceRecord[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const addSubject = async () => {
    if (!user || !subjectForm.name.trim()) { setError('Subject name is required.'); return; }
    const { error } = await supabase.from('subjects').insert({
      user_id: user.id, name: subjectForm.name, code: subjectForm.code || null,
      color: subjectForm.color, instructor: subjectForm.instructor || null,
      credits: subjectForm.credits ? Number(subjectForm.credits) : null,
    });
    if (error) { setError(error.message); return; }
    setOpenSubject(false);
    setSubjectForm({ name: '', code: '', color: '#6366f1', instructor: '', credits: '' });
    load();
  };

  const addRecord = async () => {
    if (!user || !recordForm.subject_id) { setError('Select a subject.'); return; }
    const subj = subjects.find((s) => s.id === recordForm.subject_id);
    const { error } = await supabase.from('attendance').insert({
      user_id: user.id, subject_id: recordForm.subject_id,
      subject_name: subj?.name || null, date: recordForm.date, status: recordForm.status,
    });
    if (error) { setError(error.message); return; }
    setOpenRecord(false);
    setRecordForm({ subject_id: '', subject_name: '', date: new Date().toISOString().slice(0, 10), status: 'present' });
    load();
  };

  const removeSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    setSubjects((p) => p.filter((s) => s.id !== id));
  };

  const removeRecord = async (id: string) => {
    await supabase.from('attendance').delete().eq('id', id);
    setRecords((p) => p.filter((r) => r.id !== id));
  };

  // Per-subject attendance percentage
  const subjectStats = subjects.map((s) => {
    const recs = records.filter((r) => r.subject_id === s.id);
    const present = recs.filter((r) => r.status === 'present').length;
    const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;
    return { subject: s, total: recs.length, present, pct };
  });

  const overallPct = records.length > 0 ? Math.round((records.filter((r) => r.status === 'present').length / records.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><CalendarCheck className="text-emerald-500" /> Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Track subjects and calculate attendance percentage.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpenSubject(true)}><Plus size={15} /> Subject</Button>
          <Button size="sm" onClick={() => setOpenRecord(true)}><Plus size={15} /> Mark attendance</Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Overall */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-white/50">Overall attendance</p>
            <p className={`text-4xl font-bold ${overallPct >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>{overallPct}%</p>
            <p className="text-xs text-slate-400">{records.filter((r) => r.status === 'present').length} present / {records.length} total</p>
          </div>
          <TrendingUp size={40} className="text-indigo-400/40" />
        </div>
      </GlassCard>

      {loading ? <Loading /> : (
        <>
          {/* Subjects */}
          <div>
            <h2 className="font-semibold mb-3">Subjects</h2>
            {subjectStats.length === 0 ? (
              <EmptyState icon={<BookOpen size={24} />} title="No subjects yet" hint="Add a subject to start tracking attendance." action={<Button onClick={() => setOpenSubject(true)} size="sm"><Plus size={14} /> Add subject</Button>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjectStats.map(({ subject, total, present, pct }) => (
                  <motion.div key={subject.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-4 group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: subject.color }} />
                          <div>
                            <p className="font-semibold text-sm">{subject.name}</p>
                            <p className="text-xs text-slate-500 dark:text-white/50">{subject.code} · {subject.instructor}</p>
                          </div>
                        </div>
                        <button onClick={() => removeSubject(subject.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1"><span>{present}/{total}</span><span className={pct >= 75 ? 'text-emerald-500' : 'text-rose-500'}>{pct}%</span></div>
                        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: subject.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent records */}
          <div>
            <h2 className="font-semibold mb-3">Recent attendance</h2>
            {records.length === 0 ? (
              <EmptyState icon={<CalendarCheck size={24} />} title="No attendance records" hint="Mark your attendance to see it here." />
            ) : (
              <div className="space-y-1">
                {records.slice(0, 20).map((r) => (
                  <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-3 group flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.status === 'present' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                        {r.status === 'present' ? <Check size={16} /> : <X size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.subject_name || 'General'}</p>
                        <p className="text-xs text-slate-500 dark:text-white/50">{new Date(r.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${r.status === 'present' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>{r.status}</span>
                      <button onClick={() => removeRecord(r.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={openSubject} onClose={() => setOpenSubject(false)} title="Add subject">
        <div className="space-y-3">
          <Input placeholder="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Code (e.g. CS101)" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
            <Input placeholder="Credits" type="number" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} />
          </div>
          <Input placeholder="Instructor" value={subjectForm.instructor} onChange={(e) => setSubjectForm({ ...subjectForm, instructor: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 dark:text-white/50">Color</label>
            <input type="color" value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
          </div>
          <Button onClick={addSubject} className="w-full">Add subject</Button>
        </div>
      </Modal>

      <Modal open={openRecord} onClose={() => setOpenRecord(false)} title="Mark attendance">
        <div className="space-y-3">
          <select value={recordForm.subject_id} onChange={(e) => setRecordForm({ ...recordForm, subject_id: e.target.value })} className="px-4 py-2.5 rounded-xl glass-strong text-sm w-full">
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Input type="date" value={recordForm.date} onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })} />
          <select value={recordForm.status} onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })} className="px-4 py-2.5 rounded-xl glass-strong text-sm w-full">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
          <Button onClick={addRecord} className="w-full">Save record</Button>
        </div>
      </Modal>
    </div>
  );
}
