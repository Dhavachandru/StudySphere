import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js/lib/core';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';

// Register core languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);

// Register plain text aliases so hljs won't ever throw on them
const plainText = () => ({ name: 'plaintext' });
hljs.registerLanguage('plaintext', plainText);
hljs.registerLanguage('text', plainText);
hljs.registerLanguage('txt', plainText);
hljs.registerLanguage('output', plainText);
hljs.registerLanguage('console', plainText);
hljs.registerLanguage('none', plainText);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type Props = { content: string };

export function Markdown({ content }: Props) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const text = String(children).replace(/\n$/, '');
            const langMatch = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
            const lang = langMatch?.[1];

            // Render inline code if no line breaks and no language class
            if (!lang && !text.includes('\n')) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono text-[13px] border border-indigo-500/20"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Multi-line code block: safely highlight or escape
            let highlighted = '';
            const langLower = (lang || '').toLowerCase();

            try {
              if (langLower && hljs.getLanguage(langLower)) {
                highlighted = hljs.highlight(text, { language: langLower, ignoreIllegals: true }).value;
              } else if (!langLower || ['text', 'plaintext', 'txt', 'output', 'console', 'none'].includes(langLower)) {
                highlighted = escapeHtml(text);
              } else {
                try {
                  highlighted = hljs.highlightAuto(text).value;
                } catch {
                  highlighted = escapeHtml(text);
                }
              }
            } catch {
              highlighted = escapeHtml(text);
            }

            return <CodeBlock html={highlighted || escapeHtml(text)} raw={text} lang={langLower || 'code'} />;
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ children, ...props }) {
            return <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ html, raw, lang }: { html: string; raw: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#0d1117] shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-white/5 text-xs text-slate-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-white/10 text-slate-300 transition text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-[#e6edf3] font-mono">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
