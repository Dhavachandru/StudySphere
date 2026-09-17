import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  ExternalLink,
  Award,
  MessageSquare,
  AlertCircle,
  Calendar,
  X,
  Search,
  Check,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Loading, EmptyState } from '../../components/ui/State';
import { useAuth } from '../../lib/auth';
import { teacherService } from '../../lib/teacherService';
import { TEACHER_SUBJECTS } from '../../lib/attendanceService';
import type { TeacherTask, TaskSubmission, StudentRosterItem } from '../../lib/types';

export default function TeacherAssignments() {
  const { profile, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createOpen, setCreateOpen] = useState(searchParams.get('new') === '1');
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<TeacherTask | null>(null);
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<TaskSubmission | null>(null);

  // Form for New Task
  const [taskForm, setTaskForm] = useState({
    title: '',
    subject: TEACHER_SUBJECTS[0],
    department: 'Computer Science',
    description: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    total_points: 100,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Form for Grading
  const [gradeScore, setGradeScore] = useState<number | string>('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, s, r] = await Promise.all([
        teacherService.getTasks(user?.id),
        teacherService.getAllSubmissions(),
        teacherService.getStudentRoster(),
      ]);
      setTasks(t);
      setSubmissions(s);
      setRoster(r);

      // Check URL query for review modal
      const taskParam = searchParams.get('task');
      if (taskParam) {
        const found = t.find((x) => x.id === taskParam);
        if (found) setSelectedTaskForReview(found);
      }

      const reviewSubParam = searchParams.get('review');
      if (reviewSubParam) {
        const foundSub = s.find((x) => x.id === reviewSubParam);
        if (foundSub) {
          setSelectedSubForGrading(foundSub);
          setGradeScore(foundSub.grade ?? '');
          setGradeFeedback(foundSub.feedback ?? '');
        }
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    await teacherService.createTask({
      teacher_id: user?.id || 'prof-1',
      teacher_name: profile?.full_name || 'Faculty Member',
      teacher_avatar: profile?.avatar_url || null,
      title: taskForm.title.trim(),
      subject: taskForm.subject,
      department: taskForm.department,
      description: taskForm.description.trim(),
      due_date: taskForm.due_date,
      total_points: Number(taskForm.total_points) || 100,
      priority: taskForm.priority,
    });

    setCreateOpen(false);
    setTaskForm({
      title: '',
      subject: TEACHER_SUBJECTS[0],
      department: 'Computer Science',
      description: '',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      total_points: 100,
      priority: 'medium',
    });
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    await teacherService.deleteTask(id);
    loadData();
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForGrading) return;

    setSubmittingGrade(true);
    try {
      await teacherService.gradeSubmission(
        selectedSubForGrading.id,
        gradeScore,
        gradeFeedback.trim()
      );
      setSelectedSubForGrading(null);
      loadData();
    } catch (err) {
      console.error('Failed to grade submission', err);
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) return <Loading label="Loading assignments..." />;

  const taskSubmissions = selectedTaskForReview
    ? submissions.filter((s) => s.task_id === selectedTaskForReview.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2.5">
            <ClipboardList className="text-indigo-500" /> Faculty Coursework & Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Create assignments, review submissions, and assign grades & feedback to students.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 self-start sm:self-auto"
        >
          <Plus size={16} /> Assign New Task
        </Button>
      </div>

      {/* Task Cards Grid */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="No tasks assigned yet"
          hint="Create your first coursework task or homework assignment for enrolled students."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Assign First Task
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const subs = submissions.filter((s) => s.task_id === task.id);
            const graded = subs.filter((s) => s.status === 'graded');
            const totalStudents = roster.length || 1;
            const progress = Math.round((subs.length / totalStudents) * 100);

            const isOverdue = new Date(task.due_date).getTime() < Date.now();

            return (
              <GlassCard key={task.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {task.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-500'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {task.priority} priority
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                      title="Delete assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="font-bold text-base">{task.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2">
                    {task.description}
                  </p>
                </div>

                {/* Details & Submission Stats */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Due: {new Date(task.due_date).toLocaleDateString()}
                      {isOverdue && <span className="text-rose-500 font-semibold">(Expired)</span>}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-white/80">
                      {task.total_points} Total Points
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>
                        Submissions: {subs.length}/{totalStudents} students
                      </span>
                      <span>{graded.length} graded</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => setSelectedTaskForReview(task)}
                      className="w-full text-xs bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20"
                    >
                      Review Submissions ({subs.length})
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Task */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Assign New Coursework Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Assignment Title
            </label>
            <Input
              required
              placeholder="e.g. Implement Balanced BST Deletion"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
                Subject / Course
              </label>
              <select
                value={taskForm.subject}
                onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {TEACHER_SUBJECTS.map((s) => (
                  <option key={s} value={s} className="dark:bg-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                className="w-full text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              >
                <option value="low" className="dark:bg-slate-900">Low Priority</option>
                <option value="medium" className="dark:bg-slate-900">Medium Priority</option>
                <option value="high" className="dark:bg-slate-900">High Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
                Total Marks / Points
              </label>
              <Input
                type="number"
                min="10"
                max="500"
                value={taskForm.total_points}
                onChange={(e) => setTaskForm({ ...taskForm, total_points: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Instructions & Requirements
            </label>
            <Textarea
              rows={4}
              placeholder="Detail the problem statement, submission requirements (e.g. GitHub link, report format), and grading criteria..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Create & Assign to Students
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Submissions for a Task */}
      <Modal
        open={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        title={`Submissions: ${selectedTaskForReview?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Subject: <strong className="text-slate-200">{selectedTaskForReview?.subject}</strong> &bull; Total Points: {selectedTaskForReview?.total_points}
          </p>

          {taskSubmissions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No students have submitted this assignment yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {taskSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl glass border border-white/10 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xs">
                        {sub.student_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{sub.student_name}</p>
                        <p className="text-[11px] text-slate-400">
                          Submitted {new Date(sub.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        sub.status === 'graded'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {sub.status === 'graded' ? `Graded: ${sub.grade} pts` : 'Pending Grade'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/20 text-xs space-y-2">
                    <p className="font-medium text-slate-200">{sub.submission_text}</p>
                    {sub.submission_link && (
                      <a
                        href={sub.submission_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline font-mono"
                      >
                        <ExternalLink size={12} /> {sub.submission_link}
                      </a>
                    )}
                  </div>

                  {sub.feedback && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <span className="font-bold text-emerald-400 block mb-0.5">Teacher Feedback:</span>
                      <p className="text-slate-300">{sub.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSubForGrading(sub);
                        setGradeScore(sub.grade ?? '');
                        setGradeFeedback(sub.feedback ?? '');
                      }}
                      className="text-xs"
                    >
                      <Award size={13} /> {sub.status === 'graded' ? 'Edit Grade' : 'Assign Grade & Feedback'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Grading & Feedback */}
      <Modal
        open={!!selectedSubForGrading}
        onClose={() => setSelectedSubForGrading(null)}
        title={`Grade: ${selectedSubForGrading?.student_name}`}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Score / Marks (out of {selectedTaskForReview?.total_points || 100})
            </label>
            <Input
              type="number"
              required
              min="0"
              max={selectedTaskForReview?.total_points || 100}
              placeholder="e.g. 95"
              value={gradeScore}
              onChange={(e) => setGradeScore(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1">
              Teacher Feedback
            </label>
            <Textarea
              rows={4}
              placeholder="Provide constructive feedback, praise strong points, or explain point deductions..."
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSelectedSubForGrading(null)} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submittingGrade}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check size={14} /> Save Grade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
