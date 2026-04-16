const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// ════════════════════════════════════════════
//  ⚙️  INSERISCI QUI LE TUE API KEY
// ════════════════════════════════════════════
const ANTHROPIC_API_KEY  = 'LA_TUA_ANTHROPIC_KEY';   // sk-ant-...
const LIVEAVATAR_API_KEY = 'LA_TUA_LIVEAVATAR_KEY';  // 8b77b...
const AVATAR_ID          = 'IL_TUO_AVATAR_ID';       // 513fd...
const SYSTEM_PROMPT      = `Sei Sofia, una coach virtuale entusiasta e motivante su una piattaforma LMS.
Rispondi SEMPRE in italiano. Le risposte devono essere brevi (2-4 frasi) perché vengono lette ad alta voce.
Sei esperta in matematica, scienze, lingue, coding e tecniche di studio.
Usa esempi pratici e incoraggia sempre lo studente.
[Incolla qui i contenuti del tuo corso]`;
// ════════════════════════════════════════════

// ── 1. Token LiveAvatar ──────────────────────────────
// Il frontend chiama questo endpoint per ottenere un token sicuro
app.post('/api/token', async (req, res) => {
  try {
    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method:  'POST',
      headers: { 'X-API-KEY': LIVEAVATAR_API_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    const token = data?.data?.session_token || data?.data?.token;
    if (!token) return res.status(500).json({ error: 'Token non valido', raw: data });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 2. Avatar ID ─────────────────────────────────────
app.get('/api/avatar-id', (req, res) => {
  res.json({ avatarId: AVATAR_ID });
});

// ── 3. Chat con Claude ───────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages mancanti' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        system:     SYSTEM_PROMPT,
        messages
      })
    });
    const data = await response.json();
    const reply = data?.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Risposta Claude non valida', raw: data });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Coach Backend' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend attivo su porta ${PORT}`));
