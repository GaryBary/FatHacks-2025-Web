// Chatbot
(function initChat() {
  const fab = document.getElementById('chatFab');
  const chat = document.getElementById('chatWidget');
  const closeBtn = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatText');
  const knowledgeEl = document.getElementById('bot-knowledge');
  let knowledge = { name: 'Lacisha', facts: [], qna: [] };
  try { if (knowledgeEl) knowledge = JSON.parse(knowledgeEl.textContent || '{}'); } catch {}

  const openers = (knowledge.openers && Array.isArray(knowledge.openers) && knowledge.openers.length)
    ? knowledge.openers
    : [
        "Aw, look who showed up — Dad’s Night Out edition.",
        "Well hello, midlife spice seeker.",
        "Back from mowing the lawn? Let’s misbehave a little.",
        "Put down the cargo shorts, champ."
      ];
  const punchlines = (knowledge.punchlines && Array.isArray(knowledge.punchlines) && knowledge.punchlines.length)
    ? knowledge.punchlines
    : [
        "I’ll handle the fun — you bring the dad jokes.",
        "No spreadsheets allowed.",
        "We’re turning ‘school night’ into ‘cool night’.",
        "Try to keep up, handsome."
      ];
  const introLine = knowledge.intro || `I’m ${knowledge.name}. Your mischief coach. Ask me about dates, nightlife, golf, food, or who’s coming.`;

  // NEW: fixed API base + status indicator
  const statusEl = document.querySelector('.chat-header .status');
  const urlParamApi = new URLSearchParams(location.search).get('api');
  const API_BASE = ((urlParamApi || window.CHAT_API_URL || '')).replace(/\/$/, '');
  window.__API_BASE__ = API_BASE;

  (async () => {
    if (!statusEl) return;
    if (!API_BASE) {
      statusEl.textContent = 'Local mode';
      return;
    }
    statusEl.textContent = 'LLM: checking…';
    try {
      const r = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
      statusEl.textContent = r.ok ? 'LLM: online' : 'LLM: offline (local)';
    } catch {
      statusEl.textContent = 'LLM: offline (local)';
    }
  })();

  function toggleChat(show) {
    const shouldShow = show ?? chat.hasAttribute('hidden');
    if (shouldShow) chat.removeAttribute('hidden');
    else chat.setAttribute('hidden', '');
    if (shouldShow) input?.focus();
  }
  fab?.addEventListener('click', () => toggleChat(true));
  closeBtn?.addEventListener('click', () => toggleChat(false));

  function addMessage(text, who) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    const stamp = document.createElement('div');
    stamp.className = 'stamp';
    const now = new Date();
    stamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    wrap.appendChild(stamp);
    body?.appendChild(wrap);
    body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }

  function sassyReply(userText) {
    const text = (userText || '').toLowerCase();
    const intent = knowledge.qna.find((p) => text.includes(p.q));
    const opener = openers[Math.floor(Math.random() * openers.length)];
    let core;
    if (intent) core = intent.a;
    else if (text.match(/when|date|time/)) core = (knowledge.qna.find(q=>q.q==='when')?.a) || 'October 16–19, 2025.';
    else if (text.match(/where|location/)) core = (knowledge.qna.find(q=>q.q==='where')?.a) || 'Gold Coast, Australia.';
    else if (text.match(/what.*do|activities|itinerary|plan/)) core = 'Nightlife that thumps, golf that humbles, food that spoils, and mates who hype you up.';
    else if (text.trim() === '') core = 'Say something juicy — nightlife, golf, food, or dates?';
    else core = `I can work with that. Want the scoop on nightlife, golf, food, or when we kick off?`;
    const ender = punchlines[Math.floor(Math.random() * punchlines.length)];
    return `${opener} ${core} ${ender}`;
  }

  // LLM integration (no silent fallback if API is set)
  const chatHistory = [];

  async function callLLM(userText) {
    const payload = {
      messages: [...chatHistory, { role: 'user', content: userText }],
      persona: knowledge
    };

    if (API_BASE) {
      try {
        const resp = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const reply = (data.reply || '').trim();
        if (reply) {
          chatHistory.push({ role: 'user', content: userText });
          chatHistory.push({ role: 'assistant', content: reply });
          return reply;
        }
        throw new Error('Empty LLM reply');
      } catch (e) {
        const hint = `LLM error (${e.message}). Check ${API_BASE}/api/health`;
        return `Hmm… my brain’s snoozing. ${hint}`;
      }
    }

    // No API configured → local persona
    return sassyReply(userText);
  }

  // Intro + submit handler
  addMessage(introLine, 'bot');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input?.value?.trim() || '';
    if (!msg) return;
    addMessage(msg, 'you');
    input.value = '';

    const typing = document.createElement('div');
    typing.className = 'msg bot';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = '...';
    typing.appendChild(b);
    body?.appendChild(typing);
    body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });

    callLLM(msg).then((reply) => {
      typing.remove();
      addMessage(reply, 'bot');
    });
  });
})();
