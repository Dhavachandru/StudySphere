import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { AuthLayout, GoogleButton, Divider } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) setError(error);
    else navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="One workspace for every student need"
      footer={<>Already have an account? <Link to="/login" className="text-indigo-500 font-medium hover:underline">Log in</Link></>}
    >
      <GoogleButton onClick={() => signInWithGoogle()} />
      <Divider />

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
        </div>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input type={show ? 'text' : 'password'} required placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
      </form>
    </AuthLayout>
  );
}
