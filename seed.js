/**
 * seed.js — populate Firestore with sample blog posts.
 *
 * Run locally (NOT on Vercel) with:
 *   node seed.js
 *
 * Requires firebase-admin: npm install --save-dev firebase-admin
 * and a service account key downloaded from:
 *   Firebase Console > Project Settings > Service Accounts > Generate new private key
 * Save it as serviceAccountKey.json in this folder (already .gitignore'd).
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const seedBlogs = [
  {
    title: 'Understanding React Hooks: A Practical Guide',
    excerpt: 'How useState, useEffect, and custom hooks actually work under the hood — with real examples.',
    content: `## Why Hooks Exist

Before hooks, sharing stateful logic between components meant reaching for
render props or higher-order components. Both worked, but wrapped your tree
in extra layers of indirection.

## useState in Practice

**useState** gives a function component memory across renders. Each call
creates an independent slot of state, so calling it multiple times in one
component is both valid and common.

## useEffect for Side Effects

Data fetching, subscriptions, and manually changing the DOM all belong in
**useEffect**. The dependency array controls when it re-runs — an empty
array means "once, after mount."

## Writing Your Own Hook

A custom hook is just a function whose name starts with \`use\` and that
calls other hooks internally. This is how logic like "track window width"
or "debounce a value" gets reused across a whole codebase without
duplicating a single line.

> The rules of hooks exist so React can preserve state correctly between
> renders — that's the whole reason for the "call hooks at the top level"
> rule.`,
    tags: ['react', 'hooks', 'webdev'],
    aiGenerated: true,
    imageUrl: null,
    likes: 4,
    likedBy: [],
    authorName: 'Admin',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  },
  {
    title: 'Why I Moved My Side Projects to Vercel Serverless',
    excerpt: 'A short case for pulling API keys out of the frontend and into functions nobody can inspect.',
    content: `## The Problem With Client-Side API Calls

Any key shipped in a Vite \`VITE_\` variable ends up in the built JS bundle,
plain to read in browser devtools. For free-tier APIs with usage limits,
that's an open invitation to abuse.

## The Serverless Fix

A function under \`/api\` runs on Vercel's infrastructure, not the
visitor's browser. The key lives in an environment variable that never
gets bundled, and the function acts as a controlled gateway — validating
input, rate-limiting, and hiding upstream errors from the client.

## What Changed in Practice

**Deploys got simpler** too: one \`vercel deploy\`, no separate backend
host to manage, and preview URLs for every branch automatically get their
own working API routes.`,
    tags: ['vercel', 'serverless', 'security'],
    aiGenerated: false,
    imageUrl: null,
    likes: 2,
    likedBy: [],
    authorName: 'Admin',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000 * 3)),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000 * 3)),
  },
  {
    title: 'Firestore Security Rules, Explained Without the Jargon',
    excerpt: 'What request.auth actually means, and why "signed in" is not the same as "admin."',
    content: `## The Core Mental Model

Every read or write to Firestore is checked against your rules file before
it touches the database. Rules see who's asking (\`request.auth\`), what
they're asking for (\`resource.data\`), and what they're trying to write
(\`request.resource.data\`).

## A Common Mistake

Checking only \`request.auth != null\` means "any logged-in user," not
"the site admin." If your admin panel relies on an email allowlist that
lives in frontend code, Firestore has no way to see that allowlist — a
determined user could still write directly to the database with the
Firebase SDK.

## The Fix: Custom Claims

Setting a custom claim like \`admin: true\` on a specific user via the
Admin SDK lets your rules check \`request.auth.token.admin == true\`
instead — enforcement moves from "trust the frontend" to "verified by
Firebase itself."`,
    tags: ['firebase', 'firestore', 'security'],
    aiGenerated: false,
    imageUrl: null,
    likes: 7,
    likedBy: [],
    authorName: 'Admin',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000 * 7)),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000 * 7)),
  },
];

async function seed() {
  console.log(`Seeding ${seedBlogs.length} blog posts...`);
  for (const blog of seedBlogs) {
    const ref = await db.collection('blogs').add(blog);
    console.log(`  ✓ Created "${blog.title}" (${ref.id})`);
  }
  console.log('Done. Check your Firebase Console > Firestore.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
