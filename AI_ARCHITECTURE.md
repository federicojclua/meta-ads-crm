# Anima MKT CRM — AI Architecture

> ⚠️ This document is for **Stage 8**. Do not implement AI features until Stages 1-5 are complete and tested.

## 1. Design Principles

1. **Provider-agnostic:** The system abstracts the AI provider behind a unified interface
2. **Server-side only:** All AI calls happen in Netlify Functions — no API keys in the browser
3. **Feature-flagged:** AI features can be disabled without breaking the app
4. **Cost-controlled:** Token usage is monitored and rate-limited per client
5. **Audited:** All AI interactions are logged

## 2. Abstraction Layer

```
┌──────────────────────────────────────┐
│           AI Service Layer           │
│                                      │
│  createCompletion(prompt, options)    │
│  createChat(messages, options)       │
│  createEmbedding(text)               │
│                                      │
│  ┌────────────┐  ┌────────────────┐  │
│  │  Gemini    │  │  Groq          │  │
│  │  Adapter   │  │  Adapter       │  │
│  └────────────┘  └────────────────┘  │
└──────────────────────────────────────┘
```

### Configuration

```
AI_PROVIDER=gemini          # or "groq"
AI_MODEL=gemini-2.0-flash   # or "llama-3.1-70b-versatile"
GEMINI_API_KEY=<set-in-netlify>
GROQ_API_KEY=<set-in-netlify>
ENABLE_AI=false
```

### Interface

```javascript
// _shared/ai.js
async function createCompletion({ prompt, systemPrompt, maxTokens, temperature }) {
  const provider = process.env.AI_PROVIDER;
  const model = process.env.AI_MODEL;

  switch (provider) {
    case 'gemini':
      return geminiAdapter({ prompt, systemPrompt, maxTokens, temperature, model });
    case 'groq':
      return groqAdapter({ prompt, systemPrompt, maxTokens, temperature, model });
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
```

## 3. Use Cases

### 3.1 Internal Chatbot (Stage 8)
- Query campaigns, leads, sales, content, and sync status using natural language
- Context: The chatbot has access to the user's authorized data only
- Implementation: Function calling / RAG over MongoDB queries
- Security: Chatbot can only read data the user has access to

### 3.2 Content Intelligence (Stage 8)
- Analyze post performance and suggest improvements
- Generate hook ideas based on niche and past performance
- Create content scripts from templates
- Suggest posting schedules

### 3.3 Prospect Diagnostics (Stage 6)
- Generate 30-day digital strategy for prospects
- Score social media presence with evidence
- Summarize competitive landscape

### 3.4 Lead Scoring (Future)
- Predict lead quality based on form data and engagement
- Suggest optimal follow-up timing

## 4. Security Constraints

| Rule                                                        | Enforcement         |
|-------------------------------------------------------------|---------------------|
| AI API keys are server-side only                            | No VITE_ prefix     |
| AI responses never include raw database records             | Sanitize output     |
| Users can only query data they have access to via AI        | clientId filtering  |
| AI-generated content is clearly labeled as AI-generated     | UI indicator        |
| No PII sent to AI providers unless necessary                | Sanitize input      |
| Token usage tracked per client                              | Usage logging       |

## 5. Rate Limiting

- Per-client daily token budget (configurable)
- Per-user hourly request limit
- Graceful degradation when limits are reached
- Usage dashboard for super_admin

## 6. Provider Comparison

| Feature           | Gemini 2.0 Flash         | Groq (Llama 3.1)         |
|-------------------|--------------------------|--------------------------|
| Speed             | Fast                     | Very fast                |
| Cost              | Free tier available      | Free tier available      |
| Context window    | 1M tokens                | 128k tokens              |
| Function calling  | Yes                      | Yes                      |
| Best for          | Complex analysis, long context | Fast chat, quick answers |

## 7. Implementation Notes

- Start with Gemini as default provider
- Add Groq as fallback or for speed-sensitive use cases
- Use streaming for chatbot responses
- Cache common queries to reduce API calls
- Implement retry with provider fallback on errors
