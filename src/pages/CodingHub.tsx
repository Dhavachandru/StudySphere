import { useEffect, useRef, useState } from 'react';
import { Code2, Play, RotateCw, Copy, Check } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

type Lang = 'html' | 'css' | 'javascript' | 'java' | 'python' | 'c' | 'sql';

const LANGS: { id: Lang; label: string; ext: string }[] = [
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
];

const SAMPLES: Record<Lang, string> = {
  html: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: sans-serif; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; display: grid; place-items: center; height: 100vh; margin: 0; }
.card { background: rgba(255,255,255,.15); padding: 2rem; border-radius: 1rem; backdrop-filter: blur(10px); text-align: center; }
</style></head>
<body>
  <div class="card">
    <h1>Hello from StudySphere</h1>
    <p>Live preview works!</p>
  </div>
</body>
</html>`,
  css: `body {
  margin: 0;
  font-family: system-ui;
  background: #0f172a;
  color: #e2e8f0;
}
.container { max-width: 600px; margin: 2rem auto; padding: 1rem; }
h1 { color: #818cf8; }`,
  javascript: `// JavaScript demo
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) seq.push(seq[i-1] + seq[i-2]);
  return seq;
}
document.body.innerHTML = '<pre>Fibonacci(10): ' + fibonacci(10).join(', ') + '</pre>';`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
    for (int i = 1; i <= 5; i++) {
      System.out.println("Count: " + i);
    }
  }
}`,
  python: `def greet(name):
    return f"Hello, {name}!"

for i in range(3):
    print(greet(f"Student {i+1}"))

# Fibonacci
a, b = 0, 1
for _ in range(10):
    print(a, end=" ")
    a, b = b, a + b`,
  c: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    for (int i = 1; i <= 5; i++) {
        printf("Count: %d\\n", i);
    }
    return 0;
}`,
  sql: `-- SQL demo
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gpa NUMERIC(3,2)
);

INSERT INTO students (name, gpa) VALUES
  ('Alice', 8.5),
  ('Bob', 7.2),
  ('Carol', 9.1);

SELECT name, gpa FROM students WHERE gpa > 8.0 ORDER BY gpa DESC;`,
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function CodingHub() {
  const [lang, setLang] = useState<Lang>('html');
  const [code, setCode] = useState(SAMPLES.html);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (autoRun) runPreview();
    // eslint-disable-next-line
  }, [code, lang, autoRun]);

  const runPreview = () => {
    if (lang === 'html') {
      setHtml(code);
    } else if (lang === 'css') {
      setCss(code);
      setHtml(`<body><div class="container"><h1>CSS Preview</h1><p>Apply this stylesheet to HTML.</p><button>Sample button</button></div></body>`);
    } else if (lang === 'javascript') {
      setJs(code);
    } else {
      setHtml(`<pre style="font-family: monospace; padding: 1rem; white-space: pre-wrap; color: #0f172a; background: #f8fafc; margin:0;">${escapeHtml(code)}</pre>`);
    }
  };

  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const styleTag = css ? `<style>${css}</style>` : '';
    const scriptTag = js ? `<script>try{${js}}catch(e){document.body.innerHTML+='<pre style=\\'color:red\\'>'+e.message+'</pre>'}<\/script>` : '';
    if (!html.includes('<html')) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head>${styleTag}</head><body>${html}${scriptTag}</body></html>`);
      doc.close();
    } else {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html, css, js]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const switchLang = (l: Lang) => {
    setLang(l);
    setCode(SAMPLES[l]);
    setCss('');
    setJs('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Code2 className="text-indigo-500" /> Coding Hub</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Write code with live preview across 7 languages.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
            <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="accent-indigo-500" /> Auto-run
          </label>
          <Button variant="secondary" size="sm" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</Button>
          <Button size="sm" onClick={runPreview}><Play size={15} /> Run</Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {LANGS.map(({ id, label }) => (
          <button key={id} onClick={() => switchLang(id)} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${lang === id ? 'gradient-brand text-white shadow-lg shadow-indigo-500/25' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 h-[60vh]">
        <GlassCard className="flex flex-col p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-xs font-mono text-slate-500 dark:text-white/50">{lang}.{LANGS.find((l) => l.id === lang)?.ext}</span>
            <RotateCw size={14} className="text-slate-400 cursor-pointer hover:text-indigo-500" onClick={() => setCode(SAMPLES[lang])} />
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="code-area flex-1 p-4 bg-transparent outline-none resize-none text-sm leading-relaxed"
          />
        </GlassCard>

        <GlassCard className="flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-500 dark:text-white/50 ml-2">Preview</span>
          </div>
          <iframe ref={iframeRef} title="preview" className="flex-1 bg-white" sandbox="allow-scripts" />
        </GlassCard>
      </div>
    </div>
  );
}
