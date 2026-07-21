import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthLayout, GoogleButton, Divider } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const { error } = await signIn(email, password, remember);
    setLoading(false);
    if (error) setError(error);
    else navigate('/dashboard');
  };

  const google = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to StudySphere"
      footer={<>Don't have an account? <Link to="/signup" className="text-indigo-500 font-medium hover:underline">Sign up</Link></>}
    >
      <GoogleButton onClick={google} />
      <Divider />

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type={show ? 'text' : 'password'} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/60 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-indigo-500 w-4 h-4 rounded" />
            Remember me
          </label>
          <Link to="/forgot" className="text-xs text-indigo-500 hover:underline">Forgot password?</Link>
        </div>

        {error && <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
      </form>
    </AuthLayout>
  );
}
