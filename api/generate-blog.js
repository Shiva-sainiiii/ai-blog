// /api/generate-blog.js
// Vercel Serverless Function — calls OpenRouter securely.
// The OPENROUTER_API_KEY lives ONLY here (server-side env var), never in
// any VITE_ prefixed variable, so it is never bundled into client JS.

const axios = require('axios');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

// Basic in-memory rate limiter (per serverless instance — good enough to
// blunt casual abuse; for real protection pair with Vercel's own rate
// limiting or a Redis-backed limiter like Upstash).
const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || [];
  const recent = entry.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function setCorsHeaders(res) {
  // Lock this down to your real domain in production, e.g.
  // res.setHeader('Access-Control-Allow-Origin', 'https://yourblog.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function buildPrompt(topic, tone) {
  return `You are a professional blog writer. Write a blog post about: "${topic}".
Tone: ${tone || 'clear, engaging, informative'}.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "title": "a compelling, specific blog title (max 70 chars)",
  "excerpt": "a 1-2 sentence summary/teaser (max 160 chars)",
  "content": "the full blog post body in markdown, at least 400 words, with ## subheadings"
}`;
}

function safeParseModelJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // Strip accidental markdown fences the model sometimes adds anyway.
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage the first {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function looksFabricated(parsed) {
  if (!parsed) return true;
  const { title, excerpt, content } = parsed;
  if (!title || !excerpt || !content) return true;
  if (typeof title !== 'string' || typeof excerpt !== 'string' || typeof content !== 'string') return true;
  if (content.trim().split(/\s+/).length < 50) return true; // suspiciously short
  return false;
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    // Never leak whether/why in detail to the client beyond a generic message.
    console.error('Missing OPENROUTER_API_KEY environment variable.');
    return res.status(500).json({ error: 'AI generation is not configured on the server.' });
  }

  const { topic, tone } = req.body || {};

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'A non-empty "topic" string is required.' });
  }

  if (topic.length > 200) {
    return res.status(400).json({ error: 'Topic is too long (max 200 characters).' });
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(topic.trim(), tone) }],
        temperature: 0.8,
        max_tokens: 1200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          // Recommended by OpenRouter for attribution/rate-limit tiers.
          'HTTP-Referer': process.env.SITE_URL || 'https://vercel.app',
          'X-Title': 'AI Blog Website',
        },
        timeout: 25_000,
      }
    );

    const raw = response.data?.choices?.[0]?.message?.content;
    const parsed = safeParseModelJson(raw);

    if (looksFabricated(parsed)) {
      console.error('Model returned unusable content:', raw?.slice(0, 300));
      return res.status(502).json({ error: 'AI response was malformed. Please try again.' });
    }

    return res.status(200).json({
      title: parsed.title.trim(),
      excerpt: parsed.excerpt.trim(),
      content: parsed.content.trim(),
    });
  } catch (err) {
    // Redact anything that might contain the key or raw upstream payloads.
    const status = err.response?.status;
    console.error('OpenRouter request failed:', status, err.message);

    if (status === 401 || status === 403) {
      return res.status(500).json({ error: 'AI provider rejected the request. Check server configuration.' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'AI provider rate limit reached. Please try again shortly.' });
    }
    return res.status(500).json({ error: 'Failed to generate blog content. Please try again.' });
  }
};
