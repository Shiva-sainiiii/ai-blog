// /api/upload-image.js
// Vercel Serverless Function — uploads images to Cloudinary securely.
// CLOUDINARY_API_SECRET lives ONLY here (server-side env var), never in
// any VITE_ prefixed variable, so it's never bundled into client JS.
// We sign the upload ourselves instead of using an unsigned preset, so
// nobody can hit Cloudinary directly using inspected frontend code.

const crypto = require('crypto');
const axios = require('axios');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Basic in-memory rate limiter, same pattern as generate-blog.js.
const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || [];
  const recent = entry.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function signParams(params, apiSecret) {
  // Cloudinary signature = sha1(sorted "key=value&key=value..." + api_secret)
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
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
    return res.status(429).json({ error: 'Too many uploads. Please wait a minute.' });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary environment variables.');
    return res.status(500).json({ error: 'Image upload is not configured on the server.' });
  }

  const { image, folder } = req.body || {};

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'A base64 "image" data URL is required.' });
  }

  // Rough size guard: base64 is ~33% larger than binary; cap around 6MB
  // encoded (~4.5MB actual file) to match the 5MB limit shown in the UI.
  if (image.length > 6 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image is too large (max ~5MB).' });
  }

  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'File must be an image.' });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadFolder = (folder || 'blog-images').replace(/[^a-zA-Z0-9/_-]/g, '');

    const paramsToSign = { folder: uploadFolder, timestamp };
    const signature = signParams(paramsToSign, CLOUDINARY_API_SECRET);

    const form = new URLSearchParams();
    form.append('file', image);
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('folder', uploadFolder);
    form.append('signature', signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      form,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30_000,
      }
    );

    const { secure_url, public_id } = response.data;

    if (!secure_url) {
      console.error('Cloudinary response missing secure_url:', response.data);
      return res.status(502).json({ error: 'Upload succeeded but response was malformed.' });
    }

    return res.status(200).json({ url: secure_url, publicId: public_id });
  } catch (err) {
    const status = err.response?.status;
    console.error('Cloudinary upload failed:', status, err.response?.data || err.message);

    if (status === 401) {
      return res.status(500).json({ error: 'Cloudinary rejected the request. Check server configuration.' });
    }
    return res.status(500).json({ error: 'Failed to upload image. Please try again.' });
  }
};
