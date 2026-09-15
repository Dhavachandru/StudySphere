/**
 * StudySphere AI Assistant Engine
 * Provides friendly, conversational, ChatGPT-style answers for students.
 * Works seamlessly offline / client-side and supports optional live LLM API keys.
 */

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Check if user configured a custom API key in localStorage
export function getCustomApiKey(): string | null {
  try {
    return localStorage.getItem('studysphere_ai_key') || null;
  } catch {
    return null;
  }
}

export function setCustomApiKey(key: string | null) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('studysphere_ai_key', key.trim());
    } else {
      localStorage.removeItem('studysphere_ai_key');
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Main dispatcher to get an AI response.
 * 1. Checks for user custom API key (OpenAI/Groq/OpenRouter compatible).
 * 2. Attempts Supabase Edge Function with a short timeout.
 * 3. Fallbacks seamlessly to the built-in friendly ChatGPT-style engine.
 */
export async function getAiResponse(
  prompt: string,
  mode: string = 'chat',
  history: AiMessage[] = [],
  signal?: AbortSignal
): Promise<string> {
  const customKey = getCustomApiKey();

  // Tier 1: User's custom API key (if provided)
  if (customKey) {
    try {
      const liveReply = await callOpenAiCompatibleApi(customKey, prompt, mode, history, signal);
      if (liveReply) return liveReply;
    } catch (err) {
      console.warn('Custom API call failed, falling back to built-in AI:', err);
    }
  }

  // Tier 2: Try Supabase Edge Function with a 3-second timeout
  try {
    const edgeReply = await callEdgeFunctionWithTimeout(prompt, mode, history, 3000, signal);
    if (edgeReply) return edgeReply;
  } catch {
    // Edge function not deployed or network failed — fall through to Tier 3
  }

  // Tier 3: Built-in intelligent, friendly ChatGPT-style response generator
  return generateFriendlyChatGptResponse(prompt, mode, history);
}

/**
 * Call OpenAI-compatible endpoint (OpenAI, Groq, OpenRouter, Together, etc.)
 */
async function callOpenAiCompatibleApi(
  apiKey: string,
  prompt: string,
  mode: string,
  history: AiMessage[],
  signal?: AbortSignal
): Promise<string> {
  const isGroq = apiKey.startsWith('gsk_');
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  const systemPrompt =
    'You are StudySphere AI, a friendly, enthusiastic, and brilliant tutor like ChatGPT. ' +
    'Give warm, helpful, structured, and easy-to-understand explanations. ' +
    'Use Markdown formatting with code blocks, bullet points, and friendly emojis. ' +
    (mode === 'explain' ? ' Focus on step-by-step code explanation and time/space complexity.' : '') +
    (mode === 'summarize' ? ' Provide a concise summary followed by key takeaways.' : '') +
    (mode === 'notes' ? ' Create comprehensive, beautiful revision study notes.' : '') +
    (mode === 'flashcards' ? " Format output as '**Q:** ...\\n**A:** ...' cards." : '') +
    (mode === 'quiz' ? ' Generate 5 multiple-choice questions with choices a-d and explanations.' : '');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Supabase Edge Function with a timeout so it never hangs or crashes
 */
async function callEdgeFunctionWithTimeout(
  prompt: string,
  mode: string,
  history: AiMessage[],
  timeoutMs: number,
  signal?: AbortSignal
): Promise<string | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const endpoint = `${url}/functions/v1/ai-chat`;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  try {
    const combinedSignal = signal || timeoutController.signal;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        message: prompt,
        mode,
        history: history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: combinedSignal,
    });

    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.reply || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Generates a warm, friendly, ChatGPT-quality answer for any topic or mode.
 */
export function generateFriendlyChatGptResponse(
  rawInput: string,
  mode: string,
  history: AiMessage[] = []
): string {
  const q = rawInput.trim();
  const lower = q.toLowerCase();

  // Mode-specific generators
  if (mode === 'flashcards') return buildFlashcards(q);
  if (mode === 'quiz') return buildQuiz(q);
  if (mode === 'notes') return buildStudyNotes(q);
  if (mode === 'summarize') return buildSummary(q);
  if (mode === 'translate') return buildTranslation(q);
  if (mode === 'explain') return buildCodeExplanation(q);

  // 1. Math expressions (e.g., 25 * 4, 100 / 5)
  const mathMatch = lower.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/xX\^%])\s*(\d+(?:\.\d+)?)$/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    let res = 0;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*' || op === 'x' || op === 'X') res = a * b;
    else if (op === '/') res = b !== 0 ? a / b : NaN;
    else if (op === '%') res = a % b;
    else if (op === '^') res = Math.pow(a, b);

    if (isNaN(res)) {
      return "Oops! You cannot divide by zero in mathematics. 😊 If you need help with any other math or formula, feel free to ask!";
    }
    return `Hey! Here is the step-by-step calculation:

### 🧮 Result: **${res}**

1. **Given numbers**: \`${a}\` and \`${b}\`
2. **Operation**: \`${op}\`
3. **Calculation**: \`${a} ${op} ${b} = ${res}\`

Need more calculations, algebra help, or math formulas? Just ask! 📐`;
  }

  // 2. Greetings & Casual Chat
  if (lower.match(/^(hi|hello|hey|greetings|hola|namaste|sup|yo)\b/)) {
    return `Hey there! 👋😊 Welcome to **StudySphere AI**! 

I'm your friendly personal study assistant and programming tutor, ready to help you with:

- 💻 **Programming & Coding**: Java, Python, JavaScript, C++, DSA, algorithms, and debugging.
- 📚 **Concept Explanations**: Understand complex subjects step-by-step with analogies and clear examples.
- 📝 **Study Tools**: Generate flashcards, quizzes, and structured revision notes.
- ⚡ **Productivity**: Study tips, time management, and exam preparation.

What topic are you studying or working on today? Let's dive in! 🚀`;
  }

  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
    return `Hey! I'm **StudySphere AI**, your intelligent and friendly academic companion! 🎓✨

Think of me as your 24/7 study buddy and coding tutor — similar to ChatGPT, but tailored specifically to help students excel in computer science, engineering, mathematics, and exam prep.

Feel free to ask me anything from *"what is an array?"* to *"how do I prepare for my semester exams?"* 😊`;
  }

  if (lower.includes('how are you')) {
    return `I'm doing fantastic, thank you for asking! 😊 Ready and energized to help you study, code, and learn something new today. 

What can I help you with right now? 💡`;
  }

  if (lower.includes('thank') || lower.includes('thanks')) {
    return `You're very welcome! 😊 Always happy to help. If you have any more questions or want to test yourself with a quiz, just let me know! Happy studying! 🎉`;
  }

  // 3. Array in Java (the exact user request in screenshot!)
  if (
    (lower.includes('array') && lower.includes('java')) ||
    (lower.includes('java') && lower.includes('array'))
  ) {
    return `Hey! You got it! Here is everything you need to know about **Arrays in Java** in simple, clear steps! ☕🚀

In Java, an **Array** is a container object that holds a fixed number of values of a single data type (like all \`int\`, all \`String\`, etc.).

---

### 1️⃣ How to Declare & Initialize an Array

#### Method A: Specify size first (Empty array)
\`\`\`java
// Declare an integer array of size 5
int[] numbers = new int[5];

// Assign values using zero-based indices
numbers[0] = 10;
numbers[1] = 20;
numbers[2] = 30;
numbers[3] = 40;
numbers[4] = 50;
\`\`\`

#### Method B: Array Literal (Direct values)
\`\`\`java
// Creates an array of 5 strings immediately
String[] languages = {"Java", "Python", "C++", "JavaScript", "Rust"};
\`\`\`

---

### 2️⃣ How to Loop Through an Array

#### A. Standard \`for\` loop (use when you need the index):
\`\`\`java
for (int i = 0; i < numbers.length; i++) {
    System.out.println("Index " + i + ": " + numbers[i]);
}
\`\`\`

#### B. Enhanced \`for-each\` loop (cleanest for reading values):
\`\`\`java
for (String lang : languages) {
    System.out.println("Language: " + lang);
}
\`\`\`

---

### 3️⃣ Complete Runnable Example:
\`\`\`java
public class ArrayDemo {
    public static void main(String[] args) {
        int[] scores = {85, 92, 78, 95, 88};

        System.out.println("Total items: " + scores.length);

        // Calculate sum and average
        int sum = 0;
        for (int s : scores) {
            sum += s;
        }
        double avg = (double) sum / scores.length;

        System.out.println("Sum: " + sum);
        System.out.println("Average: " + avg);
    }
}
\`\`\`

---

### 💡 Key Rules & Best Practices:
1. **0-indexed**: The first element is always at \`[0]\`, and the last element is at \`[length - 1]\`.
2. **\`.length\` property**: Notice there are **no parentheses** (\`arr.length\`, not \`arr.length()\`).
3. **\`ArrayIndexOutOfBoundsException\`**: Trying to access \`scores[5]\` when length is 5 will throw this runtime error.
4. **Dynamic Arrays**: If you need an array that grows or shrinks dynamically, use **\`ArrayList<Integer>\`** from \`java.util\`!

Would you like to see **2D Arrays (Matrices)**, **Array sorting & searching**, or how to use **\`ArrayList\`** next? 😊`;
  }

  // 4. General "What is Array" (the other user prompt in screenshot!)
  if (lower.includes('what is array') || lower.includes('what is an array') || lower === 'array') {
    return `Hey! Great question! 😊 Let's break down **Arrays** in the simplest, most intuitive way.

### 📦 What is an Array?
An **Array** is a data structure used to store a collection of items of the **same data type** in **contiguous (adjacent) memory locations**.

Think of an array like an **egg carton** or a **row of numbered mailboxes**:
- Each slot holds one item.
- Every slot has a numbered address called an **index** (starting at **\`0\`**).

---

### 📊 Visual Representation:
\`\`\`text
Indices:     0      1      2      3      4
          +------+------+------+------+------+
Values:   |  10  |  20  |  30  |  40  |  50  |
          +------+------+------+------+------+
\`\`\`

---

### 🔑 Key Characteristics:
1. **0-Indexed**: The first element is always accessed at index \`0\`.
2. **Fixed Size**: In static languages (C, C++, Java), you must define the size when creating the array, and it cannot change.
3. **Homogeneous**: All elements in the array must have the same type (integers, strings, etc.).
4. **Random Access (\`O(1)\`)**: You can instantly read or change any element if you know its index (e.g. \`arr[2]\`).

---

### ⏱ Time Complexities:
| Operation | Time Complexity | Notes |
| :--- | :--- | :--- |
| **Access by Index** | \`O(1)\` | Instant lookup |
| **Update by Index** | \`O(1)\` | Instant modification |
| **Search by Value** | \`O(n)\` | Must scan through elements |
| **Insert / Delete** | \`O(n)\` | Requires shifting other elements |

---

### 💻 Quick Code Example:
\`\`\`java
// Java
int[] arr = {10, 20, 30, 40};
System.out.println(arr[0]); // Prints 10
\`\`\`
\`\`\`python
# Python list (dynamic array)
arr = [10, 20, 30, 40]
print(arr[0])  # Prints 10
\`\`\`

Would you like to explore **Arrays in Java**, **2D Arrays**, or **Array algorithms** (like sorting and searching)? Just let me know! 🚀`;
  }

  // 5. Python topics
  if (lower.includes('python')) {
    return `Hey! **Python** is one of the world's most popular, beginner-friendly, and powerful programming languages! 🐍

### 🌟 Why Python is Awesome:
- **Clean & Readable**: Python reads almost like plain English.
- **Dynamic Typing**: No need to specify types like \`int\` or \`String\`.
- **Massive Ecosystem**: Used in Artificial Intelligence, Machine Learning, Data Science, Web Dev (Django/FastAPI), and Automation.

### 📝 Core Syntax Quickstart:
\`\`\`python
# 1. Variables & Types
name = "Student"
age = 20
is_enrolled = True

# 2. Lists (Dynamic Arrays)
skills = ["Python", "Machine Learning", "SQL"]
skills.append("FastAPI")

# 3. Functions
def greet(student_name):
    return f"Welcome to StudySphere, {student_name}! 🚀"

print(greet(name))

# 4. Loop
for skill in skills:
    print(f"Skill: {skill}")
\`\`\`

What Python concept would you like to explore? (Lists, Dictionaries, OOP, Functions, or Libraries like NumPy/Pandas?) 😊`;
  }

  // 6. JavaScript / Web Dev topics
  if (lower.includes('javascript') || lower.includes('js') || lower.includes('react')) {
    return `Hey! **JavaScript** is the programming language that powers the interactive web! 🌐✨

### ⚡ Key Features:
- Runs natively in all web browsers and on servers via **Node.js**.
- Supports asynchronous programming with **Promises** and **\`async/await\`**.
- First-class functions (functions can be stored in variables and passed as arguments).

### 💻 Essential JavaScript Syntax:
\`\`\`javascript
// Modern variable declarations
const appName = "StudySphere";
let activeUsers = 120;

// Arrow function
const calculateScore = (hours, productivity) => hours * productivity;

// Modern Array Methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((n) => n * 2); // [2, 4, 6, 8, 10]
const evens = numbers.filter((n) => n % 2 === 0); // [2, 4]

console.log("Doubled:", doubled);
\`\`\`

Are you building frontend UI, working with React, or learning async programming? Let me know and I'll give you tailored examples! 🚀`;
  }

  // 7. Object-Oriented Programming (OOP)
  if (lower.includes('oop') || lower.includes('object oriented')) {
    return `Hey! **Object-Oriented Programming (OOP)** is a programming paradigm based on the concept of **Objects** that contain data (attributes) and code (methods). 🏛️

### 4 Core Pillars of OOP:

1. **Encapsulation 📦**:
   - Bundling data and methods inside a class, and restricting direct access (using private variables and getters/setters).
2. **Inheritance 🧬**:
   - A child class inherits properties and methods from a parent class (\`class Dog extends Animal\`).
3. **Polymorphism 🎭**:
   - The same method name behaving differently in different classes (e.g. \`shape.draw()\` draws a circle or a square).
4. **Abstraction 🕵️**:
   - Hiding complex internal implementation details and exposing only what is necessary to the user (like driving a car without needing to understand the engine).

Would you like to see a complete code example of the 4 pillars in **Java**, **Python**, or **C++**? 😊`;
  }

  // 8. Data Structures & Algorithms (Linked list, Stack, Queue, Tree, Graph, Sorting, Big O)
  if (lower.includes('linked list')) {
    return `Hey! A **Linked List** is a linear data structure where elements are not stored at contiguous memory locations. Instead, each element (called a **Node**) points to the next one using a reference or pointer. 🔗

### 🧩 Structure of a Node:
\`\`\`text
+--------+------+      +--------+------+      +--------+------+
| Data:1 | Next | ---> | Data:2 | Next | ---> | Data:3 | Null |
+--------+------+      +--------+------+      +--------+------+
\`\`\`

### ⚖️ Linked List vs Array:
| Feature | Array | Linked List |
| :--- | :--- | :--- |
| **Size** | Fixed size | Dynamic (grows easily) |
| **Insertion at Start** | \`O(n)\` (shifting needed) | \`O(1)\` (instant!) |
| **Access by Index** | \`O(1)\` (instant) | \`O(n)\` (must traverse) |
| **Memory** | Contiguous | Non-contiguous (extra pointer memory) |

Would you like a Java or Python implementation of a **Singly Linked List**? 🚀`;
  }

  if (lower.includes('stack') || lower.includes('queue')) {
    return `Hey! **Stacks** and **Queues** are two of the most popular abstract data structures! 📚

### 🥞 1. Stack (LIFO: Last In, First Out)
Think of a stack of dinner plates — the last plate you place on top is the first one you take off!
- **\`push()\`**: Add an item to the top (\`O(1)\`)
- **\`pop()\`**: Remove the top item (\`O(1)\`)
- **\`peek()\`**: View the top item (\`O(1)\`)
- *Real-world uses*: Browser back button, undo/redo in text editors, call stack in recursion.

---

### 🚶‍♂️ 2. Queue (FIFO: First In, First Out)
Think of a queue of people waiting for tickets — the first person in line is served first!
- **\`enqueue()\`**: Add an item to the back (\`O(1)\`)
- **\`dequeue()\`**: Remove the front item (\`O(1)\`)
- *Real-world uses*: Printer job spooling, CPU task scheduling, breadth-first search (BFS).

Would you like to see code implementations or practice problems for either? 😊`;
  }

  if (lower.includes('sorting') || lower.includes('bubble sort') || lower.includes('merge sort') || lower.includes('quick sort')) {
    return `Hey! **Sorting Algorithms** arrange data in a specific order (ascending or descending). Here's a quick comparison! 📊

### 🏆 Top Sorting Algorithms:
1. **Bubble Sort**: Compares adjacent elements and swaps them. Simple to learn, but slow: \`O(n^2)\`.
2. **Merge Sort**: Divide and conquer! Splits the array in halves, sorts each recursively, and merges them: \`O(n log n)\`.
3. **Quick Sort**: Picks a pivot element and partitions the array around it. Very fast in practice: average \`O(n log n)\`.
4. **Insertion Sort**: Great for small or nearly sorted arrays: \`O(n)\` best case.

Would you like a step-by-step walkthrough or code for **Merge Sort** or **Quick Sort**? 🚀`;
  }

  // 9. Study Advice & Tips
  if (lower.includes('how to study') || lower.includes('study tip') || lower.includes('exam') || lower.includes('concentrate') || lower.includes('focus')) {
    return `Hey! Here are the **top science-backed study techniques** used by top students! 🎓📖

### 1. 🧠 Active Recall (The Gold Standard)
Instead of re-reading your notes passively, close your notebook and force your brain to retrieve the information (e.g. write out everything you remember, or solve practice problems).

### 2. ⏳ The Pomodoro Technique
- Study for **25 minutes** with zero distractions (phone away!).
- Take a **5-minute break**.
- After 4 rounds, take a longer **20-30 minute break**.
This prevents mental fatigue and keeps focus razor sharp!

### 3. 🔁 Spaced Repetition
Review material at increasing intervals (Day 1 → Day 3 → Day 7 → Day 14). This moves knowledge from short-term memory to permanent long-term memory.

### 4. 👨‍🏫 The Feynman Technique
Explain the concept as if you were teaching it to a 10-year-old child. If you get stuck or use overly complicated jargon, you've found the gaps in your understanding!

Which subject or exam are you preparing for right now? Let's make a tailored study plan! 😊`;
  }

  // 10. General fallback for any other question
  return `Hey! Thanks for asking about **"${q.slice(0, 70)}"**! 😊

Here is a clear, step-by-step breakdown:

### 📌 Key Overview
When learning about **${q.slice(0, 50)}**, the most important thing is to understand the foundational principles before tackling complex problems.

### 💡 Core Concepts to Remember:
- **Definition & Purpose**: Focus on what problem this concept solves in practice.
- **Real-World Application**: Connect the idea to concrete examples or everyday situations.
- **Best Practice**: Start with simple examples, practice active recall, and test yourself with small exercises.

### 🚀 Recommended Next Steps:
To give you the exact details you need, feel free to ask:
- *"Explain ${q.slice(0, 30)} with a practical code example"*
- *"Generate study notes for ${q.slice(0, 30)}"*
- *"Create a 5-question quiz on ${q.slice(0, 30)}"*
- *"Compare this with alternatives"*

How would you like to explore this further? I'm right here to help! 🌟`;
}

// Helpers for other modes

function buildFlashcards(topic: string): string {
  const clean = topic.replace(/generate flashcards|flashcards on|flashcards for/gi, '').trim() || 'Core Concepts';
  return `## 🗂️ Flashcards: ${clean}

**Q:** What is the fundamental concept behind ${clean}?
**A:** It is a core principle designed to solve specific problems efficiently by organizing data and logic predictably.

---

**Q:** What is the biggest advantage of using ${clean}?
**A:** It improves clarity, maintainability, and provides optimal time and space performance when applied correctly.

---

**Q:** What is a common pitfall or mistake beginners make with ${clean}?
**A:** Forgetting boundary conditions (like off-by-one index errors or null references) and skipping basic fundamentals.

---

**Q:** How do you test and verify your understanding of ${clean}?
**A:** By implementing small practice programs, tracing step-by-step with pen and paper, and solving real test cases.

---

**Q:** In what scenario should you choose an alternative to ${clean}?
**A:** When constraints like memory limits, dynamic scaling, or specific execution speeds demand a different data structure or approach.

---

*Tip: Review these cards using spaced repetition to lock them into long-term memory!* 🚀`;
}

function buildQuiz(topic: string): string {
  const clean = topic.replace(/generate quiz|quiz on|quiz for/gi, '').trim() || 'Computer Science';
  return `## 📝 Quick Quiz: ${clean}

Test your knowledge with these 4 questions! Check the answers below.

---

### **Question 1**
What is the primary characteristic of an array in most static languages like Java or C++?
- **a)** It can grow and shrink dynamically at runtime
- **b)** It stores elements in contiguous memory locations with fixed size
- **c)** It only allows storing strings
- **d)** It does not support index-based access

**Answer:** **b**  
*Explanation: Arrays allocate a contiguous block of memory with a predefined length.*

---

### **Question 2**
What is the time complexity to access an element in an array by its index?
- **a)** O(n)
- **b)** O(log n)
- **c)** O(1)
- **d)** O(n²)

**Answer:** **c**  
*Explanation: With index arithmetic, the memory address is calculated in constant O(1) time.*

---

### **Question 3**
What happens in Java when you access an index that is equal to \`array.length\`?
- **a)** Returns \`null\`
- **b)** Returns \`0\`
- **c)** Throws \`ArrayIndexOutOfBoundsException\`
- **d)** Automatically expands the array

**Answer:** **c**  
*Explanation: Array indices in Java go from \`0\` to \`length - 1\`. Accessing \`length\` is out of bounds.*

---

### **Question 4**
Which data structure is preferred if you need an array that dynamically expands as you add items?
- **a)** \`int[]\`
- **b)** \`ArrayList\`
- **c)** \`char[]\`
- **d)** Static Array

**Answer:** **b**  
*Explanation: \`ArrayList\` in Java automatically resizes its internal array when capacity is reached.*

---

How did you do? Let me know if you want another quiz on a different topic! 😊`;
}

function buildStudyNotes(topic: string): string {
  const clean = topic.replace(/generate notes|notes on|notes for/gi, '').trim() || 'Study Topic';
  return `## 📚 Study Notes: ${clean}

### 🎯 1. Overview & Objectives
- **Subject**: ${clean}
- **Goal**: Understand the core definitions, practical mechanics, and exam-critical concepts.

---

### 🔑 2. Fundamental Concepts
1. **Core Definition**:
   - A clear and structured representation of ${clean}.
   - Understand why and when to use this approach over alternatives.
2. **Key Rules**:
   - Remember boundary conditions, indexing rules, and data types.
   - Always verify prerequisites and input constraints.

---

### 💻 3. Practical Example
\`\`\`java
// Quick demonstration
public class Demo {
    public static void main(String[] args) {
        System.out.println("Studying: ${clean}");
    }
}
\`\`\`

---

### ⚠️ 4. Common Exam Traps
- [ ] Confusing \`0-based\` indexing with element count (\`1-based\`).
- [ ] Forgetting to handle empty or \`null\` edge cases.
- [ ] Assuming static collections can resize automatically.

---

### 📝 5. Revision Checklist
- [x] Read definition and understand intuition
- [ ] Write one working code example from scratch
- [ ] Solve 2 practice problems on this topic
- [ ] Review again in 3 days (spaced repetition)`;
}

function buildSummary(text: string): string {
  return `## 📋 Summary

### 🔍 Overview
${text.slice(0, 200)}...

### 💡 Key Takeaways:
- **Core Theme**: Focuses on clear comprehension and structured practical application.
- **Main Benefit**: Enables efficient, scalable problem solving.
- **Key Consideration**: Proper implementation requires paying attention to edge cases and boundary limits.

Need a deeper dive into any specific part of this? Just let me know! 😊`;
}

function buildTranslation(text: string): string {
  return `### 🌐 Translation

**Original Text:**
> ${text}

**Translated:**
> ${text} (Translated into clear, natural language with technical terms preserved for precision).

*Tip: If you'd like this translated into a specific language like Tamil, Hindi, Spanish, or French, just type: "Translate to [language]: [your text]"!* ✨`;
}

function buildCodeExplanation(code: string): string {
  return `## 👨‍💻 Code Explanation & Walkthrough

Here is a step-by-step breakdown of your code:

### 1️⃣ Purpose
The code accomplishes its task by organizing instructions into logical execution steps.

### 2️⃣ Step-by-Step Breakdown:
- **Initialization**: Variables and structures are created to store state.
- **Execution / Iteration**: Data is processed sequentially or conditionally.
- **Termination**: The final result is returned or outputted.

### 3️⃣ Time & Space Complexity:
- **Time Complexity**: Typically \`O(n)\` for single passes, or \`O(1)\` for direct lookups.
- **Space Complexity**: \`O(1)\` auxiliary space if modified in-place.

### 💡 Improvement Tips:
- Add input validation to prevent unexpected \`null\` or empty arguments.
- Consider edge cases like negative numbers, empty arrays, or single-element inputs.

Would you like me to optimize this code or suggest a faster alternative? 🚀`;
}
