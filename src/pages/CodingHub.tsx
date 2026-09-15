import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Code2,
  Play,
  RotateCw,
  Copy,
  Check,
  Terminal,
  FileCode,
  Clock,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sliders
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

type Lang = 'java' | 'cpp' | 'python';

interface LangConfig {
  id: Lang;
  label: string;
  ext: string;
  filename: string;
  compiler: string;
  judge0Id: number;
}

const LANGS: LangConfig[] = [
  { id: 'java', label: 'Java', ext: 'java', filename: 'Main.java', compiler: 'OpenJDK 13', judge0Id: 62 },
  { id: 'cpp', label: 'C++', ext: 'cpp', filename: 'main.cpp', compiler: 'GCC 14', judge0Id: 105 },
  { id: 'python', label: 'Python', ext: 'py', filename: 'main.py', compiler: 'Python 3.11', judge0Id: 92 },
];

const SAMPLES: Record<Lang, string> = {
  java: `// Java (OpenJDK) — StudySphere Coding Hub
// Note: Class name must be 'Main'
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in StudySphere!");

        // Example: Fibonacci Sequence
        int n = 10;
        long[] fib = new long[n];
        fib[0] = 0;
        fib[1] = 1;
        for (int i = 2; i < n; i++) {
            fib[i] = fib[i - 1] + fib[i - 2];
        }

        System.out.print("First " + n + " Fibonacci numbers: ");
        for (int i = 0; i < n; i++) {
            System.out.print(fib[i] + (i < n - 1 ? ", " : "\\n"));
        }

        long sum = 0;
        for (long val : fib) sum += val;
        System.out.println("Sum: " + sum);
    }
}`,
  cpp: `// C++ (GCC) — StudySphere Coding Hub
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++ in StudySphere!" << std::endl;

    // Example: Vector operations and algorithms
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int total = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Numbers: ";
    for (size_t i = 0; i < numbers.size(); i++) {
        std::cout << numbers[i] << (i + 1 < numbers.size() ? ", " : "\\n");
    }

    std::cout << "Total Sum: " << total << std::endl;
    std::cout << "Average: " << (static_cast<double>(total) / numbers.size()) << std::endl;

    return 0;
}`,
  python: `# Python 3 — StudySphere Coding Hub
import math

def fibonacci(n):
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq

nums = fibonacci(10)
print("Hello from Python in StudySphere!")
print(f"Fibonacci(10): {nums}")
print(f"Sum: {sum(nums)}")
print(f"Pi: {math.pi:.5f}")

# Try editing and pressing Run (Ctrl+Enter)!`,
};

// Fallback in-browser Pyodide runtime if offline
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPyodide(): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
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
  const [lang, setLang] = useState<Lang>('java');
  const [codes, setCodes] = useState<Record<Lang, string>>(SAMPLES);
  const [stdin, setStdin] = useState<string>('');
  const [consoleTab, setConsoleTab] = useState<'output' | 'stdin'>('output');

  const [copied, setCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);
  const [running, setRunning] = useState(false);

  // Execution results
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string | null>(null);
  const [compileOutput, setCompileOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<{ id?: number; description?: string } | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [memory, setMemory] = useState<number | null>(null);

  const code = codes[lang];
  const currentLangConfig = LANGS.find((l) => l.id === lang) || LANGS[0];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateCode = (newCode: string) => {
    setCodes((prev) => ({ ...prev, [lang]: newCode }));
  };

  const resetCode = () => {
    setCodes((prev) => ({ ...prev, [lang]: SAMPLES[lang] }));
  };

  const clearOutput = () => {
    setStdout('');
    setStderr(null);
    setCompileOutput(null);
    setStatus(null);
    setTime(null);
    setMemory(null);
  };

  // Run via Judge0 CE API with Pyodide fallback for Python
  const runCode = useCallback(async () => {
    setRunning(true);
    setConsoleTab('output');
    setStdout('');
    setStderr(null);
    setCompileOutput(null);
    setStatus(null);
    setTime(null);
    setMemory(null);

    const activeConfig = LANGS.find((l) => l.id === lang) || LANGS[0];

    try {
      const response = await fetch('https://ce.judge0.com/submissions?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_id: activeConfig.judge0Id,
          source_code: code,
          stdin: stdin || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Compiler API returned status ${response.status}`);
      }

      const result = await response.json();
      setStdout(result.stdout || '');
      setStderr(result.stderr || null);
      setCompileOutput(result.compile_output || null);
      setStatus(result.status || null);
      setTime(result.time || null);
      setMemory(result.memory || null);
    } catch (apiError) {
      // If Python and external API fails, run offline via Pyodide
      if (lang === 'python') {
        try {
          const py = await getPyodide();
          let pyOutput = '';
          py.setStdout({ batched: (s: string) => { pyOutput += s + '\n'; } });
          py.setStderr({ batched: (s: string) => { pyOutput += s + '\n'; } });
          await py.runPythonAsync(code);
          setStdout(pyOutput);
          setStatus({ id: 3, description: 'Accepted (Pyodide in-browser)' });
        } catch (pyErr) {
          setStderr(pyErr instanceof Error ? pyErr.message : String(pyErr));
          setStatus({ id: 11, description: 'Runtime Error' });
        }
      } else {
        setStderr(
          apiError instanceof Error
            ? `Execution Error: ${apiError.message}. Please check your connection.`
            : 'Execution failed.'
        );
        setStatus({ id: 13, description: 'Network / Service Error' });
      }
    } finally {
      setRunning(false);
    }
  }, [code, lang, stdin]);

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runCode]);

  // Tab key indents by 4 spaces
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const spaces = '    ';
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      updateCode(newCode);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyOutput = () => {
    const fullText = [compileOutput, stderr, stdout].filter(Boolean).join('\n');
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 1500);
  };

  const hasContent = Boolean(stdout || stderr || compileOutput || status);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Code2 className="text-indigo-500" /> Coding Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50">
            Write, compile, and run Java, C++, and Python code with real-time console output.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyCode} title="Copy code to clipboard">
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" onClick={runCode} loading={running} title="Run Code (Ctrl + Enter)">
            <Play size={15} /> Run
          </Button>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex gap-1.5">
          {LANGS.map(({ id, label, compiler }) => (
            <button
              key={id}
              onClick={() => setLang(id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                lang === id
                  ? 'gradient-brand text-white shadow-lg shadow-indigo-500/25'
                  : 'glass hover:bg-white/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  lang === id ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/50'
                }`}
              >
                {compiler}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-black/5 dark:border-white/10">
            Ctrl + Enter
          </span>
          <span>to run</span>
        </div>
      </div>

      {/* Split-screen layout: Editor & Terminal */}
      <div className="grid lg:grid-cols-2 gap-4 h-[65vh] min-h-[500px]">
        {/* Code Editor Pane */}
        <GlassCard className="flex flex-col p-0 overflow-hidden shadow-lg border border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <FileCode size={15} className="text-indigo-500" />
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">
                {currentLangConfig.filename}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetCode}
                title="Reset to template sample"
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/50 hover:text-indigo-500 transition px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              >
                <RotateCw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => updateCode(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            spellCheck={false}
            className="code-area flex-1 p-4 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30"
            placeholder={`Write your ${currentLangConfig.label} code here...`}
          />
        </GlassCard>

        {/* Terminal / Output Console Pane */}
        <GlassCard className="flex flex-col p-0 overflow-hidden shadow-lg border border-slate-200/60 dark:border-white/10 bg-slate-950 text-slate-100">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/90 text-xs">
            {/* Left: Tabs (Output vs Stdin) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConsoleTab('output')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition font-medium ${
                  consoleTab === 'output'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Terminal size={13} />
                <span>Output</span>
              </button>
              <button
                onClick={() => setConsoleTab('stdin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition font-medium relative ${
                  consoleTab === 'stdin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Sliders size={13} />
                <span>Stdin</span>
                {stdin.trim() && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Stdin provided" />
                )}
              </button>
            </div>

            {/* Right: Metrics & Actions */}
            <div className="flex items-center gap-2">
              {status && (
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                    status.id === 3
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {status.id === 3 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  <span>{status.description}</span>
                </div>
              )}
              {time && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock size={11} /> {parseFloat(time) < 1 ? `${Math.round(parseFloat(time) * 1000)}ms` : `${parseFloat(time).toFixed(2)}s`}
                </span>
              )}
              {memory != null && memory > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Cpu size={11} /> {Math.round(memory)} KB
                </span>
              )}
              {hasContent && (
                <>
                  <button
                    onClick={copyOutput}
                    className="text-slate-400 hover:text-slate-200 transition p-1 hover:bg-white/10 rounded"
                    title="Copy console output"
                  >
                    {outputCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={clearOutput}
                    className="text-slate-400 hover:text-rose-400 transition p-1 hover:bg-white/10 rounded"
                    title="Clear console"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Console Content Area */}
          <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-slate-950">
            {consoleTab === 'stdin' ? (
              <div className="h-full flex flex-col space-y-2">
                <label className="text-xs text-slate-400">
                  Standard Input (stdin) — passed to your program when reading from keyboard (e.g. cin, Scanner, input()):
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter inputs here (one per line or space-separated)..."
                  className="flex-1 p-3 bg-slate-900 border border-white/10 rounded-lg outline-none resize-none font-mono text-xs text-slate-200 focus:border-indigo-500 transition placeholder:text-slate-600"
                />
              </div>
            ) : (
              <>
                {/* Running State */}
                {running && (
                  <div className="flex items-center gap-2.5 text-indigo-400 py-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-xs">Compiling & executing {currentLangConfig.label} code...</span>
                  </div>
                )}

                {/* Compilation Errors */}
                {compileOutput && (
                  <div className="mb-3 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs whitespace-pre-wrap leading-relaxed">
                    <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle size={13} /> Compilation Output:
                    </div>
                    {compileOutput}
                  </div>
                )}

                {/* Runtime Errors */}
                {stderr && (
                  <div className="mb-3 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs whitespace-pre-wrap leading-relaxed">
                    <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle size={13} /> Runtime Error:
                    </div>
                    {stderr}
                  </div>
                )}

                {/* Standard Output */}
                {stdout && (
                  <pre className="whitespace-pre-wrap text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed">
                    {stdout}
                  </pre>
                )}

                {/* Empty State */}
                {!hasContent && !running && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-10">
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-400">
                      <Terminal size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-slate-300 font-medium">Ready to compile & run</p>
                      <p className="text-xs text-slate-500">
                        Click <span className="text-indigo-400 font-semibold">Run</span> or press{' '}
                        <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-[11px] text-slate-300">
                          Ctrl + Enter
                        </kbd>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 border-t border-white/5 pt-3 mt-1">
                      <span>• Fast Cloud Compiler</span>
                      <span>• Standard I/O (stdin)</span>
                      <span>• Diagnostics</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
