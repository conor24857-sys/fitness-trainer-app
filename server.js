import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Load .env from the project root if present (Node 20.12+ / 21.7+, no dependency needed).
try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key, or set it in the environment.');
  process.exit(1);
}

app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages
    })
  });

  const data = await response.json();
  res.json({ reply: data.content?.[0]?.text });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
