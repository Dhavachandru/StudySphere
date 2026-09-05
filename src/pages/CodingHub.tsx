import { useEffect, useRef, useState, useCallback } from 'react';
import { Code2, Play, RotateCw, Copy, Check, Terminal, FileCode } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

type Lang = 'html' | 'css' | 'javascript' | 'python';

const LANGS: { id: Lang; label: string; ext: string; runnable: boolean }[] = [
  { id: 'html', label: 'HTML', ext: 'html', runnable: true },
  { id: 'css', label: 'CSS', ext: 'css', runnable: true },
  { id: 'javascript', label: 'JavaScript', ext: 'js', runnable: true },
  { id: 'python', label: 'Python', ext: 'py', runnable: true },
];

const SAMPLES: Record<Lang, string> = {
  html: `<!DOCTYPE html>
<html>
<head><style>
body { font-family: sans-serif; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; display: grid; place-items: center; height: 100vh; margin: 0; }
.card { background: rgba(255,255,255,.15); padding: 2rem; border-radius: 1rem; backdrop-filter: blur(10px); text-align: center; }
h1 { margin: 0 0 .5rem; }
button { padding: .5rem 1rem; border: none; border-radius: .5rem; background: white; color: #6366f1; font-weight: 600; cursor: pointer; }
</style></head>
<body>
  <div class="card">
    <h1>Hello from StudySphere</h1>
    <p>Edit the code and see live changes!</p>
    <button onclick="alert('It works!')">Click me</button>
  </div>
</body>
</html>`,
  css: `/* CSS Playground — paired with sample HTML */
body {
  margin: 0;
  font-family: system-ui;
  background: #0f172a;
  color: #e2e8f0;
  display: grid;
  place-items: center;
  height: 100vh;
}
.card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(99,102,241,.3);
}
h1 { color: white; }
button {
  padding: .6rem 1.2rem;
  border: none;
  border-radius: .5rem;
  background: white;
  color: #6366f1;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s;
}
button:hover { transform: scale(1.05); }`,
  javascript: `// JavaScript — runs live in the preview
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) seq.push(seq[i-1] + seq[i-2]);
  return seq;
}

const nums = fibonacci(10);
document.body.innerHTML = \`
  <div style="font-family:system-ui;padding:2rem;background:#0f172a;color:#e2e8f0;min-height:100vh">
    <h1 style="color:#818cf8">Fibonacci Sequence</h1>
    <p style="font-size:1.5rem;font-family:monospace">\${nums.join(', ')}</p>
    <p style="color:#94a3b8">Sum: \${nums.reduce((a,b)=>a+b,0)}</p>
  </div>
\`;`,
  python: `# Python — runs in your browser via Pyodide
import math

def fibonacci(n):
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq

nums = fibonacci(10)
print(f"Fibonacci(10): {nums}")
print(f"Sum: {sum(nums)}")
print(f"Pi: {math.pi:.4f}")

# Try editing and re-running!`,
};

const CSS_HTML = `<div class="card"><h1>CSS Preview</h1><p>Style me with CSS!</p><button>Sample button</button></div>`;

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPyodide(): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      // load the pyodide script
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as { loadPyodide?: unknown }).loadPyodide) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
        document.head.appendChild(script);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
      return py;
    })();
  }
  return pyodidePromise;
}

export default function CodingHub() {
  const [lang, setLang] = useState<Lang>('html');
  const [code, setCode] = useState(SAMPLES.html);
  const [cssCode, setCssCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [output, setOutput] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [pyError, setPyError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runWeb = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    if (lang === 'html') {
      doc.open();
      doc.write(code);
      doc.close();
    } else if (lang === 'css') {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>${code}</style></head><body>${CSS_HTML}</body></html>`);
      doc.close();
    } else if (lang === 'javascript') {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head></head><body><script>try{${code}}catch(e){document.body.innerHTML='<pre style="color:red;font-family:monospace;padding:1rem">'+e.message+'</pre>'}<\/script></body></html>`);
      doc.close();
    }
  }, [code, lang]);

  const runPython = useCallback(async () => {
    setRunning(true);
    setPyError(null);
    setOutput('');
    try {
      const py = await getPyodide();
      // capture stdout
      py.setStdout({ batched: (s: string) => setOutput((prev) => prev + s + '\n') });
      py.setStderr({ batched: (s: string) => setOutput((prev) => prev + s + '\n') });
      await py.runPythonAsync(code);
    } catch (e) {
      setPyError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [code]);

  const run = useCallback(() => {
    if (lang === 'python') runPython();
    else runWeb();
  }, [lang, runWeb, runPython]);

  useEffect(() => {
    if (autoRun && lang !== 'python') runWeb();
  }, [code, lang, autoRun, runWeb]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const switchLang = (l: Lang) => {
    setLang(l);
    setCode(SAMPLES[l]);
    setCssCode('');
    setOutput('');
    setPyError(null);
  };

  const isWeb = lang === 'html' || lang === 'css' || lang === 'javascript';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Code2 className="text-indigo-500" /> Coding Hub</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Write code with live preview. HTML, CSS, JavaScript & Python run right in your browser.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
            <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="accent-indigo-500" /> Auto-run
          </label>
          <Button variant="secondary" size="sm" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</Button>
          <Button size="sm" onClick={run} loading={running}><Play size={15} /> Run</Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {LANGS.map(({ id, label, runnable }) => (
          <button key={id} onClick={() => switchLang(id)} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition flex items-center gap-1.5 ${lang === id ? 'gradient-brand text-white shadow-lg shadow-indigo-500/25' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
            {label}
            {runnable && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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

        {isWeb ? (
          <GlassCard className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-500 dark:text-white/50 ml-2">Live Preview</span>
            </div>
            <iframe ref={iframeRef} title="preview" className="flex-1 bg-white" sandbox="allow-scripts allow-modals" />
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs text-slate-500 dark:text-white/50">Python Output {running && '· running…'}</span>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 font-mono text-sm">
              {output && <pre className="whitespace-pre-wrap">{output}</pre>}
              {pyError && <pre className="whitespace-pre-wrap text-rose-400">{pyError}</pre>}
              {!output && !pyError && !running && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <FileCode size={28} className="text-slate-600" />
                  <p className="text-xs">Press <span className="text-indigo-400 font-semibold">Run</span> to execute your Python code.</p>
                  <p className="text-[11px] text-slate-600">First run downloads Pyodide (~10s), then it's cached.</p>
                </div>
              )}
              {running && !output && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="text-xs">Loading Python runtime…</span>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
