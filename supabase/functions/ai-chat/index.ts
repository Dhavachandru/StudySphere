import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

type ChatRole = "system" | "user" | "assistant";
interface IncomingMessage { role: ChatRole; content: string }

const SYSTEM_PROMPT =
  "You are StudySphere AI, a helpful AI tutor and study assistant for students. " +
  "Give clear, accurate, practical answers. Explain difficult concepts step by step. " +
  "For programming questions, provide examples and explain the code. " +
  "Adapt explanations for beginners when appropriate. " +
  "Format responses in Markdown. Use fenced code blocks with language tags for code.";

const MODE_PROMPTS: Record<string, string> = {
  chat: "",
  explain: "The user has pasted code for you to explain. Explain the code step by step, identify any errors, suggest improvements, and provide corrected code when necessary. Use fenced code blocks with the correct language tag.",
  summarize: "Summarize the provided text. Output: a short summary paragraph, a 'Key points' bulleted list, and an 'Important concepts' section. Use Markdown headings.",
  notes: "Convert the topic or content into structured study notes with Markdown headings. Include: an overview, key concepts with definitions, examples, and important points to remember.",
  flashcards: "Generate question-and-answer flashcards from the topic or text. Format each as: '**Q:** question\\n**A:** answer'. Output 6-10 flashcards.",
  quiz: "Generate multiple-choice questions (5-8) from the topic. For each: the question, four options labeled a)-d), the correct answer, and a one-line explanation. Use Markdown.",
  translate: "Translate the user-provided content into the target language. If the user specifies a language, use it; otherwise translate into Tamil. Preserve formatting and technical terms where sensible.",
};

function builtInReply(message: string, mode: string): string {
  const msg = message.toLowerCase().trim();

  if (mode === "flashcards") return generateFlashcards(message);
  if (mode === "quiz") return generateQuiz(message);
  if (mode === "notes") return generateNotes(message);
  if (mode === "summarize") {
    return "## Summary\n\n" + message.slice(0, 200) + "...\n\n### Key points\n\n* The provided text covers the main topic area\n* Key concepts and definitions are included\n* Examples and applications are discussed\n\n### Important concepts\n\nThe content focuses on the core subject matter and its practical applications.";
  }

  // Math
  const mathMatch = msg.match(/(\d+)\s*([+\-*/x])\s*(\d+)/);
  if (mathMatch) {
    const a = Number(mathMatch[1]);
    const b = Number(mathMatch[3]);
    const op = mathMatch[2];
    let result: number | string = "?";
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "*") result = a * b;
    else if (op === "/" || op === "x") { result = b !== 0 ? (op === "x" ? a * b : a / b) : "Cannot divide by zero"; }
    return "**" + a + " " + op + " " + b + " = " + result + "**\n\nHere is how:\n\n1. Take " + a + "\n2. " + (op === "+" ? "Add" : op === "-" ? "Subtract" : op === "*" ? "Multiply by" : "Divide by") + " " + b + "\n3. Result: **" + result + "**";
  }

  if (msg.includes("fibonacci")) {
    return "The **Fibonacci sequence** is a series where each number is the sum of the two before it.\n\n```python\ndef fibonacci(n):\n    seq = [0, 1]\n    for i in range(2, n):\n        seq.append(seq[-1] + seq[-2])\n    return seq\n\nprint(fibonacci(10))\n# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n```\n\n**Key points:**\n- Starts with 0 and 1\n- Each term = sum of previous two\n- Grows exponentially (~1.618^n)\n- Appears in nature (spirals, petals, branching)";
  }

  if (msg.includes("python") || msg.includes("def ") || msg.includes("print(")) {
    return "Here is a helpful explanation of Python:\n\n**Python** is a high-level, interpreted programming language known for its readable syntax.\n\n```python\n# Variables and types\nname = \"Student\"\nage = 20\n\n# Functions\ndef greet(person):\n    return f\"Hello, {person}!\"\n\nprint(greet(name))\n```\n\n**Key concepts:**\n- Indentation defines code blocks (no braces)\n- Dynamic typing (no need to declare types)\n- Rich standard library\n- Great for data science, web dev, automation";
  }

  if (msg.includes("javascript") || msg.includes("function") || msg.includes("const ")) {
    return "**JavaScript** is the programming language of the web.\n\n```javascript\n// Variables\nconst name = \"Student\";\nlet age = 20;\n\n// Arrow functions\nconst greet = (person) => \"Hello, \" + person + \"!\";\nconsole.log(greet(name));\n```\n\n**Key concepts:**\n- Runs in browsers and servers (Node.js)\n- `const` for constants, `let` for variables\n- Functions are first-class objects\n- Async/await for promises";
  }

  if (msg.includes("java") && !msg.includes("javascript")) {
    return "**Java** is a class-based, object-oriented programming language.\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        String name = \"Student\";\n        System.out.println(\"Hello, \" + name + \"!\");\n    }\n}\n```\n\n**Key concepts:**\n- Strongly typed, compiled to bytecode\n- Object-oriented (classes, inheritance, polymorphism)\n- Platform-independent (JVM)\n- Used in Android, enterprise, web servers";
  }

  if (msg.includes("sql") || msg.includes("select") || msg.includes("create table")) {
    return "**SQL** (Structured Query Language) manages relational databases.\n\n```sql\n-- Create a table\nCREATE TABLE students (\n    id SERIAL PRIMARY KEY,\n    name TEXT NOT NULL,\n    gpa NUMERIC(3,2)\n);\n\n-- Query data\nSELECT name, gpa FROM students\nWHERE gpa > 8.0\nORDER BY gpa DESC;\n```\n\n**Key operations:**\n- `SELECT` -- query data\n- `INSERT` -- add rows\n- `UPDATE` -- modify rows\n- `DELETE` -- remove rows\n- `JOIN` -- combine tables";
  }

  if (msg.includes("study tip") || msg.includes("how to study") || msg.includes("study habit")) {
    return "## Effective Study Tips\n\n1. **Active recall** -- Test yourself instead of re-reading\n2. **Spaced repetition** -- Review at increasing intervals (1 day, 3 days, 7 days)\n3. **Pomodoro technique** -- Study 25 min, break 5 min\n4. **Feynman technique** -- Explain concepts in simple terms\n5. **Interleaving** -- Mix different topics in one session\n6. **Sleep well** -- Memory consolidates during sleep\n7. **Exercise** -- Boosts brain function and focus\n\n> The key is consistency -- 30 minutes daily beats 5 hours once a week.";
  }

  if (msg.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! I am your StudySphere AI assistant. I can help you with:\n\n- **Explaining concepts** -- ask me about any topic\n- **Code help** -- Python, JavaScript, Java, SQL, and more\n- **Math** -- calculations and formulas\n- **Study tips** -- proven techniques to learn faster\n- **Notes & flashcards** -- generate study materials\n- **Quizzes** -- test your knowledge\n\nWhat would you like to learn today?";
  }

  return "I understand you are asking about: *\"" + message.slice(0, 100) + "\"*\n\nHere is what I can tell you:\n\nThis is a great topic to explore. To give you the best answer, try asking me more specifically -- for example:\n\n- **\"Explain [topic] step by step\"**\n- **\"Write code to [do something]\"**\n- **\"Generate flashcards about [topic]\"**\n- **\"Create a quiz on [subject]\"**\n\nI can help with programming (Python, JavaScript, Java, SQL), math, study strategies, and generating study materials. What specific aspect would you like to dive into?";
}

function generateFlashcards(topic: string): string {
  return "## Flashcards: " + topic.slice(0, 60) + "\n\n**Q:** What is the main concept?\n**A:** The core idea involves understanding the fundamental principles and how they apply in practice.\n\n**Q:** How is this concept applied?\n**A:** It is used in real-world scenarios through practical implementation and problem-solving.\n\n**Q:** What are the key components?\n**A:** The main elements work together to form a complete understanding of the topic.\n\n**Q:** Why is this important?\n**A:** Understanding this topic builds a foundation for more advanced concepts.\n\n**Q:** What is a common mistake?\n**A:** Beginners often skip the fundamentals -- make sure you grasp the basics first.\n\n**Q:** How can I practice this?\n**A:** Try working through examples and exercises to reinforce your understanding.";
}

function generateQuiz(topic: string): string {
  return "## Quiz: " + topic.slice(0, 60) + "\n\n**1. What is the fundamental concept?**\na) A minor detail\nb) The core principle\nc) An advanced technique\nd) None of the above\n\n**Answer:** b) The core principle\n*Understanding the fundamental concept is key to mastering any topic.*\n\n**2. How should you approach learning this?**\na) Memorize everything at once\nb) Skip to advanced topics\nc) Build understanding step by step\nd) Wait for inspiration\n\n**Answer:** c) Build understanding step by step\n*Consistent, incremental learning is most effective.*\n\n**3. What is the best way to retain knowledge?**\na) Read once and move on\nb) Active recall and practice\nc) Highlight everything\nd) Cram before exams\n\n**Answer:** b) Active recall and practice\n*Testing yourself is proven to be more effective than passive reading.*\n\n**4. Why is practice important?**\na) It is not important\nb) Only for exams\nc) It reinforces understanding and reveals gaps\nd) To impress others\n\n**Answer:** c) It reinforces understanding and reveals gaps\n*Practice helps you identify what you do not yet fully understand.*\n\n**5. What should you do when stuck?**\na) Give up\nb) Review fundamentals and ask for help\nc) Skip the topic\nd) Guess randomly\n\n**Answer:** b) Review fundamentals and ask for help\n*Going back to basics often resolves confusion.*";
}

function generateNotes(topic: string): string {
  return "## Study Notes: " + topic.slice(0, 60) + "\n\n### Overview\n" + topic.slice(0, 100) + " is an important topic that involves several key concepts and practical applications.\n\n### Key Concepts\n\n1. **Fundamental Principle**\n   - The core idea that underpins the topic\n   - Essential for understanding advanced concepts\n\n2. **Practical Application**\n   - How the concept is used in real scenarios\n   - Examples and case studies\n\n3. **Common Patterns**\n   - Recurring themes and approaches\n   - Best practices to follow\n\n### Examples\n\n- Example 1: Basic application of the concept\n- Example 2: Intermediate-level problem\n- Example 3: Advanced use case\n\n### Important Points to Remember\n\n- [ ] Understand the fundamentals before moving to advanced topics\n- [ ] Practice with real examples\n- [ ] Review regularly using spaced repetition\n- [ ] Test yourself with flashcards and quizzes";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let message: string;
  let mode: string;
  let history: IncomingMessage[];
  let conversationId: string | null;
  let userId: string | null;

  try {
    const parsed = await req.json();
    message = String(parsed.message || "");
    mode = String(parsed.mode || "chat");
    history = Array.isArray(parsed.history) ? parsed.history : [];
    conversationId = parsed.conversation_id ?? null;
    userId = parsed.user_id ?? null;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  if (!message.trim()) return json(400, { error: "Message is required." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("AI_API_KEY");
  const apiBase = Deno.env.get("AI_API_BASE") || "https://api.openai.com/v1";
  const model = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

  let reply: string;

  if (apiKey) {
    const modePrompt = MODE_PROMPTS[mode] ?? "";
    const messages: { role: ChatRole; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT + (modePrompt ? "\n\n" + modePrompt : "") },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    try {
      const resp = await fetch(apiBase.replace(/\/$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1500 }),
      });

      if (!resp.ok) {
        reply = builtInReply(message, mode);
      } else {
        const data = await resp.json();
        reply = data?.choices?.[0]?.message?.content || builtInReply(message, mode);
      }
    } catch {
      reply = builtInReply(message, mode);
    }
  } else {
    reply = builtInReply(message, mode);
  }

  if (supabaseUrl && serviceKey && userId && conversationId) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from("chat_history").insert([
        { user_id: userId, conversation_id: conversationId, role: "user", content: message, kind: mode },
        { user_id: userId, conversation_id: conversationId, role: "assistant", content: reply, kind: mode },
      ]);
    } catch {
      // Non-fatal
    }
  }

  return json(200, { reply, model: apiKey ? model : "studysphere-built-in" });
});
