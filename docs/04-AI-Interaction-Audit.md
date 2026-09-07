# AI Interaction Audit

## Purpose of AI

AI in StudySphere serves as an **integrated study assistant** — embedded directly into the study workflow so students do not need to leave the app to get help. The AI can explain concepts, generate study materials (notes, flashcards, quizzes), summarize text, explain code, and translate content.

## Where AI Exists in the Codebase

The AI functionality in StudySphere consists of two components that work together:

### 1. Frontend — AI Assistant Page

**File:** `src/pages/AIAssistant.tsx`

The AI Assistant page provides the user-facing chat interface. It includes:

- **7 interaction modes** selectable via tabs at the top of the chat panel:

| Mode ID | Label | Purpose |
|---------|-------|---------|
| `chat` | Chat | General study Q&A |
| `explain` | Explain code | User pastes code; AI explains it step by step |
| `summarize` | Summarize | User provides text; AI summarizes with key points |
| `notes` | Generate notes | User provides a topic; AI generates structured study notes |
| `flashcards` | Flashcards | User provides a topic; AI generates Q&A flashcards |
| `quiz` | Generate quiz | User provides a topic; AI generates multiple-choice questions |
| `translate` | Translate | User provides content; AI translates (default: Tamil) |

- **Conversation management**: Users can create new chats, switch between conversations, and delete conversations. All messages are stored in the `chat_history` Supabase table.
- **Message features**: AI responses are rendered as Markdown (with code syntax highlighting). Users can copy any AI response. A retry button appears if a request fails. A stop button allows aborting in-progress requests.
- **Data flow**: The frontend sends the user's message, selected mode, conversation history, conversation ID, and user ID to the Edge Function. It includes the user's auth token and anon key for authentication.

### 2. Backend — Supabase Edge Function

**File:** `supabase/functions/ai-chat/index.ts`

The Edge Function is the server-side AI logic. It runs on Deno (Supabase's edge runtime) and handles:

- **CORS**: Returns proper CORS headers for all responses, including OPTIONS preflight.
- **Authentication**: Expects a Bearer token (user's Supabase session token) and anon key.
- **Two-tier AI strategy**:
  - **Tier 1 — External AI API (if configured)**: If an `OPENAI_API_KEY` or `AI_API_KEY` environment variable is set in Supabase secrets, the function calls an OpenAI-compatible chat completions endpoint. It sends a system prompt, mode-specific prompt, conversation history (last 10 messages), and the user's message.
  - **Tier 2 — Built-in study assistant (fallback)**: If no external API key is configured, the function uses a built-in response system that can:
    - Perform basic arithmetic (e.g., "12 + 8" → "20")
    - Explain the Fibonacci sequence with Python code
    - Explain Python, JavaScript, Java, and SQL with code examples and key concepts
    - Provide study tips (active recall, spaced repetition, Pomodoro, Feynman technique)
    - Generate flashcards, quizzes, and structured notes from a topic
    - Respond to greetings with a capability summary
    - Provide a helpful default response guiding the user to ask more specifically
- **System prompt** (defined in the edge function):
  > "You are StudySphere AI, a helpful AI tutor and study assistant for students. Give clear, accurate, practical answers. Explain difficult concepts step by step. For programming questions, provide examples and explain the code. Adapt explanations for beginners when appropriate. Format responses in Markdown. Use fenced code blocks with language tags for code."
- **Mode-specific prompts**: Each of the 7 modes has a dedicated prompt that instructs the AI on how to format its response (e.g., flashcards mode: "Format each as: '**Q:** question\n**A:** answer'. Output 6-10 flashcards.").
- **Persistence**: After generating a response, the function saves both the user message and AI response to the `chat_history` table using the Supabase service role key.
- **Response format**: Returns a JSON object: `{ reply: string, model: string }` where `model` is either the external model name (e.g., "gpt-4o-mini") or "studysphere-built-in".

### 3. Database — Chat History Table

**Table:** `chat_history`

Stores all AI conversations. Fields include `user_id`, `conversation_id`, `role` (user/assistant), `content`, `kind` (the mode used), and `created_at`. Row Level Security ensures users can only access their own conversations.

## AI Workflow

```
User types a message in AI Assistant page
         │
         ▼
Frontend (AIAssistant.tsx)
  • Saves user message to chat_history table
  • Sends POST request to Edge Function with:
    - message, mode, history, conversation_id, user_id
    - Authorization: Bearer <session token>
    - apikey: <anon key>
         │
         ▼
Supabase Edge Function (ai-chat/index.ts)
  • Validates request body
  • Checks for external AI API key (OPENAI_API_KEY / AI_API_KEY)
         │
         ├──── Key found ──► Calls external AI API (OpenAI-compatible)
         │                     • Sends system prompt + mode prompt + history
         │                     • Receives AI-generated response
         │                     • Falls back to built-in if API call fails
         │
         └──── No key ────► Uses built-in study assistant
                              • Pattern-matches user message
                              • Generates structured Markdown response
         │
         ▼
  • Saves user message + AI response to chat_history table
  • Returns JSON: { reply, model }
         │
         ▼
Frontend receives response
  • Displays AI reply as rendered Markdown
  • Shows copy button for AI responses
  • Shows retry button if request failed
  • Updates conversation list
```

## Example Prompts

> The following are **example prompts** that a user could send to the AI Assistant. They are illustrative, not stored verbatim in the codebase. The system prompt and mode prompts are the actual prompts defined in the edge function.

### Chat mode — example

**User:** "Explain the Fibonacci sequence"

**AI response (built-in):**
> The **Fibonacci sequence** is a series where each number is the sum of the two before it.
>
> ```python
> def fibonacci(n):
>     seq = [0, 1]
>     for i in range(2, n):
>         seq.append(seq[-1] + seq[-2])
>     return seq
>
> print(fibonacci(10))
> # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
> ```
>
> **Key points:**
> - Starts with 0 and 1
> - Each term = sum of previous two
> - Grows exponentially (~1.618^n)
> - Appears in nature (spirals, petals, branching)

### Flashcards mode — example

**User:** "Data structures"

**AI response (built-in):** Generates 6 flashcards with Q/A format covering the main concept, application, key components, importance, common mistakes, and practice advice.

### Quiz mode — example

**User:** "Operating systems basics"

**AI response (built-in):** Generates 5 multiple-choice questions, each with 4 options (a–d), the correct answer, and a one-line explanation.

### Explain code mode — example

**User:** Pastes a Python function

**AI response (if external API configured):** Explains the code step by step, identifies errors, suggests improvements, and provides corrected code. (If using the built-in assistant, provides a general Python explanation.)

## AI Limitations

| Limitation | Description |
|-----------|-------------|
| **Incorrect answers** | The AI may provide factually incorrect information, especially the built-in assistant which uses pattern matching rather than a trained language model. |
| **Hallucinations** | If an external AI API is configured, it may generate plausible-sounding but incorrect content (a known limitation of LLMs). The built-in assistant is less prone to hallucination but also less capable. |
| **Context limitations** | Only the last 10 messages of conversation history are sent to the external API. Long conversations may lose earlier context. The built-in assistant does not use conversation history at all — each response is independent. |
| **Dependence on external APIs** | Full conversational AI requires an external API key (e.g., OpenAI). Without it, the built-in assistant provides limited, pattern-matched responses that cannot handle complex or nuanced questions. |
| **No real-time data** | The AI cannot access the internet, current events, or the user's study data. It only sees the text the user sends. |
| **No code execution (AI)** | The AI Assistant cannot run code. It can explain and write code, but execution happens only in the separate Coding Hub feature. |
| **Rate limits** | If using an external API, rate limits and token limits may apply. The built-in assistant has no rate limits but is less capable. |
| **Latency** | First Python run in Coding Hub downloads Pyodide (~10 seconds). External AI API calls add network latency. |

## Ethical Considerations

| Consideration | How StudySphere Addresses It |
|---------------|------------------------------|
| **Student privacy** | All AI conversations are stored in the user's own `chat_history` table, protected by Row Level Security — users can only access their own data. The Edge Function uses the service role key only for inserting messages, not for exposing data. No conversation data is shared with other users. |
| **Responsible AI usage** | The AI is positioned as a study assistant, not a source of truth. The system prompt instructs it to "adapt explanations for beginners" and "provide clear, accurate, practical answers." |
| **Accuracy** | The built-in assistant provides factual, pre-written responses for common topics (Python, JavaScript, Java, SQL, Fibonacci, study tips). If an external API is used, accuracy depends on the LLM, which can hallucinate. |
| **Transparency** | The AI response includes a `model` field indicating whether the response came from an external model or the built-in assistant. The interface clearly labels all 7 modes so the user knows what kind of response to expect. |
| **Avoiding over-dependence on AI** | The AI is one feature among many (notes, planner, assignments, coding, analytics). It does not auto-generate answers to assignments — the user must actively type a message and select a mode. The study tips mode encourages proven study techniques (active recall, spaced repetition) rather than passive AI use. |
| **No academic dishonesty facilitation** | The AI is designed for learning (explaining concepts, generating flashcards/quizzes for self-testing), not for completing assignments on behalf of students. |

## Human Oversight

Students should **always verify important AI-generated information** against authoritative sources (textbooks, lecture notes, official documentation). Specifically:

1. **Factual claims**: The AI may state facts that are oversimplified or incorrect. Cross-check with course materials.
2. **Code examples**: While the built-in assistant's code examples are pre-written and tested, external AI-generated code may contain bugs or use deprecated APIs. Test code in the Coding Hub before relying on it.
3. **Study advice**: The AI's study tips are general-purpose. What works for one student may not work for another. Experiment and adapt.
4. **Translation accuracy**: The translate mode (defaulting to Tamil) may produce inaccurate or unnatural translations for technical or domain-specific content.
5. **Quiz and flashcard quality**: AI-generated questions may be too easy, too hard, or test surface-level knowledge rather than deep understanding. Use them as a starting point, not a complete study resource.

The AI is a **supplement to learning**, not a replacement for critical thinking, textbook reading, or instructor guidance.
