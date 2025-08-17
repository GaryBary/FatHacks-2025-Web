import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static site
app.use(express.static(__dirname));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Chat proxy
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: 'OPENAI_API_KEY missing in .env' });
    }

    const { messages = [], persona = {} } = req.body || {};

    const name = persona.name || 'Host';
    const facts = Array.isArray(persona.facts) ? persona.facts : [];
    const qna = Array.isArray(persona.qna) ? persona.qna : [];
    const style = persona.style || 'Playful, cheeky, confident, a little inappropriate but friendly. Keep replies short and high‑energy.';

    const knowledge = `Facts about event/site:\n- ${facts.join('\n- ')}\n\nQ&A hints:\n${qna.map(q => `- ${q.q}: ${q.a}`).join('\n')}`;

    const system = `You are ${name}, a sassy, cheeky female host for a guys' getaway on the Gold Coast. Persona: ${style}. You tease playfully, never cruel. No explicit sexual content. Stay within brand tone.\n\nUse the knowledge below to answer. If unsure, improvise helpful, on‑brand responses.\n\n${knowledge}`;

    const chatMessages = [
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.8,
      messages: chatMessages
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'I’ve lost my marbles — try again?';
    return res.json({ reply });
 } catch (err) {
  console.error('LLM error:', err?.response?.data || err?.message || err);
  return res
    .status(500)
    .json({ error: 'Chat failed', detail: err?.response?.data || err?.message || String(err) });
}
});
// Simple test endpoint to show exact LLM error/reply
app.get('/api/test', async (_req, res) => {
  try {
    if (!openai) return res.status(500).json({ ok: false, error: 'Missing OPENAI_API_KEY' });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "pong" and nothing else.' }]
    });
    const reply = completion.choices?.[0]?.message?.content || '';
    return res.json({ ok: true, reply });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'error',
      detail: err?.response?.data || String(err)
    });
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});




