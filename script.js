// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav on link click (mobile)
  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// FAB: scroll to top
const fab = document.getElementById('fab');
if (fab) {
  fab.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Countdown logic
(function initCountdown() {
  // Support both the previous section and the new hero countdown
  const section = document.getElementById('heroCountdown') || document.getElementById('countdown');
  if (!section) return;

  const ids = section.id === 'heroCountdown'
    ? { d: 'hc-days', h: 'hc-hours', m: 'hc-minutes', s: 'hc-seconds' }
    : { d: 'cd-days', h: 'cd-hours', m: 'cd-minutes', s: 'cd-seconds' };

  const daysEl = document.getElementById(ids.d);
  const hoursEl = document.getElementById(ids.h);
  const minutesEl = document.getElementById(ids.m);
  const secondsEl = document.getElementById(ids.s);
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const params = new URLSearchParams(window.location.search);
  const paramDate = params.get('countdown');
  const attrDate = section.getAttribute('data-target-date');
  const targetString = paramDate || attrDate || '';
  const targetTime = Date.parse(targetString);

  if (Number.isNaN(targetTime)) {
    daysEl.textContent = '0';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    console.warn('Invalid countdown target date. Use data-target-date or ?countdown=YYYY-MM-DDTHH:mm:ss');
    return;
  }

  function update() {
    const now = Date.now();
    let diff = Math.max(0, targetTime - now);

    const seconds = Math.floor(diff / 1000) % 60;
    diff = Math.floor(diff / 1000 / 60); // minutes total
    const minutes = diff % 60;
    diff = Math.floor(diff / 60); // hours total
    const hours = diff % 24;
    const days = Math.floor(diff / 24);

    daysEl.textContent = String(days);
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
})();

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
    // lightweight intent matching
    const intent = knowledge.qna.find((p) => text.includes(p.q));

    const opener = openers[Math.floor(Math.random() * openers.length)];

    let core;
    if (intent) {
      core = intent.a;
    } else if (text.match(/when|date|time/)) {
      core = (knowledge.qna.find(q=>q.q==='when')?.a) || 'October 16–19, 2025.';
    } else if (text.match(/where|location/)) {
      core = (knowledge.qna.find(q=>q.q==='where')?.a) || 'Gold Coast, Australia.';
    } else if (text.match(/what.*do|activities|itinerary|plan/)) {
      core = 'Nightlife that thumps, golf that humbles, food that spoils, and mates who hype you up.';
    } else if (text.trim() === '') {
      core = 'Say something juicy — nightlife, golf, food, or dates?';
    } else {
      // default: echo with playful nudge
      core = `I can work with that. Want the scoop on nightlife, golf, food, or when we kick off?`;
    }

    const ender = punchlines[Math.floor(Math.random() * punchlines.length)];

    return `${opener} ${core} ${ender}`;
  }

  // LLM integration
  const chatHistory = [];

  async function callLLM(userText) {
    // Allow ?api=https://... override for quick testing
    const urlParamApi = new URLSearchParams(location.search).get('api');
    const API_BASE = ((urlParamApi || window.CHAT_API_URL || '')).replace(/\/$/, '');
    const payload = {
      messages: [
        ...chatHistory,
        { role: 'user', content: userText }
      ],
      persona: knowledge
    };
    try {
      const resp = await fetch(`${API_BASE || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('bad status');
      const data = await resp.json();
      const reply = (data.reply || '').trim();
      if (reply) {
        chatHistory.push({ role: 'user', content: userText });
        chatHistory.push({ role: 'assistant', content: reply });
      }
      return reply;
    } catch (e) {
      // Fallback to local rules if server/LLM not available
      return sassyReply(userText);
    }
  }

  // Intro
  addMessage(introLine, 'bot');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input?.value?.trim() || '';
    if (!msg) return;
    addMessage(msg, 'you');
    input.value = '';
    // optimistic typing indicator
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