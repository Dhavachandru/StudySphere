import type { Handler } from '@netlify/functions';

/**
 * StudySphere AI chat backend.
 *
 * Calls an OpenAI-compatible chat completions endpoint using a server-side
 * API key (AI_API_KEY). The key is NEVER exposed to the browser — this function
 * runs on Netlify's serverless runtime and only returns the generated text.
 *
 * Required Netlify env var: AI_API_KEY
 * Optional env vars:
 *   AI_API_BASE  — OpenAI-compatible base URL (default: https://api.openai.com/v1)
 *   AI_MODEL     — model name (default: gpt-4o-mini)
 */

type ChatRole = 'system' | 'user' | 'assistant';
interface IncomingMessage { role: ChatRole; content: string }

const SYSTEM_PROMPT =
  'You are StudySphere AI, a helpful AI tutor and study assistant for students. ' +
  'Give clear, accurate, practical answers. Explain difficult concepts step by step. ' +
  'For programming questions, provide examples and explain the code. ' +
  'Adapt explanations for beginners when appropriate. ' +
  'Format responses in Markdown. Use fenced code blocks with language tags for code.';

// Per-mode system instruction appended to the base prompt.
const MODE_PROMPTS: Record<string, string> = {
  chat: '',
  explain:
    'The user has pasted code for you to explain. Explain the code step by step, ' +
    'identify any errors, suggest improvements, and provide corrected code when necessary. ' +
    'Use fenced code blocks with the correct language tag.',
  summarize:
    'Summarize the provided text. Output: a short summary paragraph, a "Key points" bulleted list, ' +
    'and an "Important concepts" section. Use Markdown headings.',
  notes:
    'Convert the topic or content into structured study notes with Markdown headings. ' +
    'Include: an overview, key concepts with definitions, examples, and important points to remember.',
  flashcards:
    'Generate question-and-answer flashcards from the topic or text. Format each as: ' +
    '"**Q:** question\\n**A:** answer". Output 6-10 flashcards.',
  quiz:
    'Generate multiple-choice questions (5-8) from the topic. For each: the question, four options ' +
    'labeled a)-d), the correct answer, and a one-line explanation. Use Markdown.',
  translate:
    'Translate the user-provided content into the target language. If the user specifies a language, ' +
    'use it; otherwise translate into Tamil. Preserve formatting and technical terms where sensible.',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: 'AI_API_KEY is not configured. Add it in Netlify → Site settings → Environment variables.',
    });
  }

  let message: string;
  let mode: string;
  let history: IncomingMessage[];
  try {
    const parsed = JSON.parse(event.body || '{}');
    message = String(parsed.message || '');
    mode = String(parsed.mode || 'chat');
    history = Array.isArray(parsed.history) ? parsed.history : [];
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  if (!message.trim()) return json(400, { error: 'Message is required.' });

  const base = process.env.AI_API_BASE || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const modePrompt = MODE_PROMPTS[mode] ?? '';

  const messages: { role: ChatRole; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT + (modePrompt ? '\n\n' + modePrompt : '') },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const resp = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return json(resp.status, { error: `AI provider error: ${text.slice(0, 300)}` });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return json(502, { error: 'AI provider returned an empty response.' });

    return json(200, { reply, model });
  } catch (err) {
    return json(502, { error: `Failed to reach AI provider: ${err instanceof Error ? err.message : 'unknown error'}` });
  }
};
