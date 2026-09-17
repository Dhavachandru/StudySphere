import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, BookOpen, Building2, Award } from 'lucide-react';
import { AuthLayout, GoogleButton, Divider } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import type { UserRole } from '../../lib/types';

export default function Signup() {
  const { signUp, signInWithGoogle, updateRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [teacherId, setTeacherId] = useState('');
  const [semester, setSemester] = useState(1);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qRole = searchParams.get('role');
    if (qRole === 'teacher' || qRole === 'student') {
      setRole(qRole);
    }
  }, [searchParams]);

  const validate = () => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);

    const { error: signUpError } = await signUp(
      email,
      password,
      name,
      role,
      role === 'teacher'
        ? { department, designation, teacher_id: teacherId }
        : { department, semester }
    );
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      await updateRole(role);
      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <AuthLayout
      title={role === 'teacher' ? 'Create Faculty Account' : 'Create Student Account'}
      subtitle={
        role === 'teacher'
          ? 'Set up your teaching portal to conduct attendance and assign tasks'
          : 'One workspace for every student need — study, plan, and code'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={`/login${role === 'teacher' ? '?role=teacher' : ''}`}
            className="text-indigo-500 font-medium hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {/* Account Type Toggle */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          I am registering as:
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left ${
              role === 'student'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/15 ring-1 ring-indigo-500/30'
                : 'border-white/10 hover:border-white/20 text-slate-600 dark:text-white/60 glass'
            }`}
          >
            <BookOpen size={20} />
            <span className="text-xs font-bold">Student</span>
            <span className="text-[10px] text-center text-slate-400 leading-tight">
              Learn, track coursework & tasks
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-left ${
              role === 'teacher'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500/30'
                : 'border-white/10 hover:border-white/20 text-slate-600 dark:text-white/60 glass'
            }`}
          >
            <GraduationCap size={20} />
            <span className="text-xs font-bold">Teacher / Faculty</span>
            <span className="text-[10px] text-center text-slate-400 leading-tight">
              Mark attendance & assign tasks
            </span>
          </button>
        </div>
      </div>

      <GoogleButton onClick={() => signInWithGoogle()} />
      <Divider />

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            required
            placeholder={role === 'teacher' ? 'Full name (e.g. Dr. Radhakrishnan)' : 'Full name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            required
            placeholder={role === 'teacher' ? 'Faculty email address' : 'Student email address'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type={show ? 'text' : 'password'}
            required
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Role-specific fields */}
        {role === 'teacher' ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-white/60 block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Artificial Intelligence">AI & Data Sci</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-white/60 block mb-1">
                Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Prof</option>
                <option value="Assistant Professor">Assistant Prof</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Department Head">Head of Dept</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-white/60 block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Artificial Intelligence">AI & Data Sci</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-white/60 block mb-1">
                Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

        <Button
          type="submit"
          loading={loading}
          className={`w-full ${
            role === 'teacher'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              : ''
          }`}
          size="lg"
        >
          Create {role === 'teacher' ? 'Faculty' : 'Student'} account
        </Button>
      </form>
    </AuthLayout>
  );
}
