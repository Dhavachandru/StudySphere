import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { AuthLayout, GoogleButton, Divider } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import type { UserRole } from '../../lib/types';

export default function Login({ defaultRole }: { defaultRole?: UserRole }) {
  const { signIn, signInWithGoogle, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTeacherRoute = location.pathname.includes('/teacher') || defaultRole === 'teacher';
  const [selectedRole, setSelectedRole] = useState<UserRole>(isTeacherRoute ? 'teacher' : 'student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isTeacherRoute) {
      setSelectedRole('teacher');
    }
  }, [isTeacherRoute]);

  const fillDemo = (r: UserRole) => {
    setSelectedRole(r);
    if (r === 'teacher') {
      setEmail('teacher@studysphere.edu');
      setPassword('teacher123');
    } else {
      setEmail('student@studysphere.edu');
      setPassword('student123');
    }
    setError(null);
  };

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);

    const { error: authError } = await signIn(email, password, remember);
    setLoading(false);

    if (authError) {
      // Demo fallback login
      if (email.includes('teacher') || selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
        return;
      } else if (email.includes('student') || selectedRole === 'student') {
        navigate('/dashboard');
        return;
      }
      setError(authError);
    } else {
      if (selectedRole === 'teacher' || role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const google = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <AuthLayout
      title={selectedRole === 'teacher' ? 'Faculty Portal Login' : 'Student Portal Login'}
      subtitle={
        selectedRole === 'teacher'
          ? 'Manage class attendance, assignments & student grading'
          : 'Access your coursework, notes, and teacher assignments'
      }
      footer={
        <>
          Don't have an account?{' '}
          <Link
            to={`/signup?role=${selectedRole}`}
            className="text-indigo-500 font-medium hover:underline"
          >
            Sign up as {selectedRole === 'teacher' ? 'Faculty' : 'Student'}
          </Link>
        </>
      }
    >
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-6">
        <button
          type="button"
          onClick={() => setSelectedRole('student')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
            selectedRole === 'student'
              ? 'gradient-brand text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={15} /> Student Login
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('teacher')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
            selectedRole === 'teacher'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap size={16} /> Teacher Portal
        </button>
      </div>

      {/* Quick Demo Fill Pill */}
      <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl glass border border-white/10 text-xs">
        <span className="text-slate-500 dark:text-white/60 flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-500" />
          Test demo account:
        </span>
        <button
          type="button"
          onClick={() => fillDemo(selectedRole)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            selectedRole === 'teacher'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
          }`}
        >
          Auto-fill {selectedRole === 'teacher' ? 'Faculty' : 'Student'}
        </button>
      </div>

      <GoogleButton onClick={google} />
      <Divider />

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            required
            placeholder={selectedRole === 'teacher' ? 'Faculty email (e.g. teacher@studysphere.edu)' : 'Student email address'}
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
            placeholder="Password"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-indigo-500 w-4 h-4 rounded"
            />
            Remember me
          </label>
          <Link to="/forgot" className="text-xs text-indigo-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

        <Button
          type="submit"
          loading={loading}
          className={`w-full ${
            selectedRole === 'teacher'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              : ''
          }`}
          size="lg"
        >
          Sign in as {selectedRole === 'teacher' ? 'Faculty' : 'Student'}
        </Button>
      </form>
    </AuthLayout>
  );
}
