import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Lock, Globe, User, Save } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, ErrorState } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({ notifications: true, privacy_public: false, language: 'en' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle();
    if (error) setError(error.message);
    if (data) setSettings({ notifications: data.notifications, privacy_public: data.privacy_public, language: data.language });
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from('settings').upsert(
      { user_id: user.id, ...settings, theme, account_email: user.email, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) { setError(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><SettingsIcon className="text-indigo-500" /> Settings</h1>
      {error && <ErrorState message={error} onRetry={load} />}

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Sun size={18} className="text-amber-500" /> Appearance</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)} className={`flex items-center gap-3 p-3 rounded-xl border transition ${theme === t ? 'border-indigo-400 ring-2 ring-indigo-400/30 glass-strong' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
              {t === 'light' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-400" />}
              <span className="capitalize font-medium">{t} mode</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Bell size={18} className="text-sky-500" /> Notifications</h2>
        <Toggle label="Enable notifications" desc="Assignment deadlines & activity reminders" checked={settings.notifications} onChange={(v) => setSettings({ ...settings, notifications: v })} />
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Lock size={18} className="text-emerald-500" /> Privacy</h2>
        <Toggle label="Public profile" desc="Allow others to see your study stats" checked={settings.privacy_public} onChange={(v) => setSettings({ ...settings, privacy_public: v })} />
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Globe size={18} className="text-violet-500" /> Language</h2>
        <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="px-4 py-2.5 rounded-xl glass-strong text-sm w-full">
          <option value="en">English</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><User size={18} className="text-indigo-500" /> Account</h2>
        <Input value={user?.email || ''} disabled className="mb-3" />
        <Button variant="danger" onClick={signOut}>Sign out</Button>
      </GlassCard>

      <div className="flex items-center gap-3">
        <Button onClick={save}><Save size={15} /> Save settings</Button>
        {saved && <span className="text-sm text-emerald-500">Saved!</span>}
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-slate-500 dark:text-white/50">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`relative w-12 h-6 rounded-full transition ${checked ? 'gradient-brand' : 'bg-slate-300 dark:bg-white/15'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}
