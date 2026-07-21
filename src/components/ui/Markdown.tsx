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

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);

type Props = { content: string };

export function Markdown({ content }: Props) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const text = String(children).replace(/\n$/, '');
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            const highlighted = lang ? hljs.highlight(text, { language: lang }).value : hljs.highlightAuto(text).value;
            return <CodeBlock html={highlighted} raw={text} />;
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

function CodeBlock({ html, raw }: { html: string; raw: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(raw); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* noop */ }
  };
  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 text-white opacity-0 group-hover:opacity-100 transition"
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed bg-[#0d1117] text-[#e6edf3]">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
