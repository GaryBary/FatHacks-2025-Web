Fat Hacks 2025

Static site with an optional LLM-backed chatbot.

Structure
- index.html, styles.css, script.js — static frontend (works on any static host)
- server.js — optional Node proxy to OpenAI (or compatible) for the chatbot
- bot-knowledge JSON (inside index.html) — edit persona, openers, punchlines, facts, and Q&A

Run locally (no admin)
If you cannot install Node system-wide, use a portable Node:
1. Download a portable Node release (Windows x64 zip) from https://nodejs.org/dist/latest-v22.x/
2. Unzip somewhere in your user folder, add the node.exe folder to PATH for the current session:
   $env:Path = "C:\\path\\to\\node-v22.x.x-win-x64;" + $env:Path
   node -v
3. In the project folder:
   npm install
   copy .env.example .env  # and set OPENAI_API_KEY
   npm start
4. Open http://localhost:3000

Deploy
Option A: GitHub Pages (frontend) + Render (server)
- Push this repo to GitHub
- Enable GitHub Pages (deploy from root or main branch)
- Create a new Web Service on Render.com: connect repo, set Build Command npm install, Start Command node server.js, add OPENAI_API_KEY env var
- After deploy, set the frontend to call your server by defining:
  <script>window.CHAT_API_URL = 'https://your-render-service.onrender.com';</script>
  Place that before script.js in index.html or inject via your hosting.
  Quick test without committing: append ?api=URL when opening the page:
  e.g. index.html?api=https://your-render-service.onrender.com

Option B: Everything on a single VPS/host
- Keep server.js and static files together and run npm start. It serves the static site and /api/chat.

Security
- Never commit .env (API keys). .gitignore already excludes it.
- The server enforces persona context but you should still validate content if embedding elsewhere.

Persona
Edit the JSON block with id bot-knowledge in index.html. Fields: name, intro, openers, punchlines, facts, qna.

