import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll send a recovery link to your email"
      footer={<>Remember your password? <Link to="/login" className="text-indigo-500 font-medium hover:underline">Log in</Link></>}
    >
      {sent ? (
        <div className="text-center py-6">
          <CheckCircle className="mx-auto text-emerald-500 mb-3" size={40} />
          <p className="font-medium">Check your inbox</p>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">A password reset link has been sent to {email}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
          </div>
          {error && <p className="text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
