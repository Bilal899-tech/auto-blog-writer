import express from 'express';
import ollama from 'ollama';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, 'posts');
const INDEX_FILE = join(__dirname, 'posts', 'index.json');
const MODEL = 'minimax-m2.1:cloud';

if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR);
if (!existsSync(INDEX_FILE)) writeFileSync(INDEX_FILE, '[]');

const app = express();
app.use(express.json());
app.use(express.static('.'));

function loadIndex() {
  try { return JSON.parse(readFileSync(INDEX_FILE, 'utf-8')); } catch { return []; }
}
function saveIndex(index) {
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

app.get('/api/posts', (req, res) => {
  res.json(loadIndex());
});

app.post('/api/generate', async (req, res) => {
  const topic = (req.body.topic || '').trim();
  const keywords = (req.body.keywords || '').trim();
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  const kwText = keywords ? `Target keywords: ${keywords}` : '';

  const prompt = `You are a professional SEO blog writer. Write a complete blog post in valid JSON.

Topic: "${topic}"
${kwText}

Return ONLY a JSON object with these fields:
- "title": SEO-optimized blog title (50-65 chars)
- "meta_description": Meta description (120-160 chars)
- "slug": URL-friendly slug (lowercase, hyphens)
- "tags": Array of 3-6 relevant tags
- "intro": Opening paragraph (2-3 sentences, hook the reader)
- "headings": Array of 3-5 section headings as strings
- "content": Array of objects, one per section: { "heading": "...", "body": "2-4 paragraphs..." }
- "conclusion": Closing paragraph with call to action
- "reading_time": Estimated reading time in minutes (number)

Example:
{
  "title": "10 Proven SEO Strategies for 2026",
  "meta_description": "Discover the top SEO strategies that will boost your rankings in 2026. From AI content to Core Web Vitals, this guide covers it all.",
  "slug": "seo-strategies-2026",
  "tags": ["SEO", "Content Marketing", "Digital Marketing", "2026 Trends"],
  "intro": "SEO is evolving faster than ever. In 2026, staying ahead means adapting to AI search, user intent, and technical excellence. Here's your complete guide.",
  "headings": ["Why SEO Still Matters", "AI-Powered Content", "Core Web Vitals", "Voice Search Optimization"],
  "content": [
    { "heading": "Why SEO Still Matters", "body": "Despite AI changing how we search, SEO remains critical. Google processes 8.5 billion searches daily, and 68% of online experiences begin with a search engine. ..." },
    { "heading": "AI-Powered Content", "body": "AI isn't replacing content — it's enhancing it. Tools like ChatGPT help writers research faster, but human expertise still drives rankings. ..." }
  ],
  "conclusion": "SEO in 2026 is about blending AI efficiency with human quality. Start implementing these strategies today and watch your traffic grow.",
  "reading_time": 7
}

Make the content informative, engaging, and at least 800 words total. Use real, credible-sounding statistics and examples. Return ONLY valid JSON. No markdown. No explanation.`;

  try {
    const response = await ollama.chat({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.3 }
    });

    const raw = response.message.content;
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let post = {};
    try { post = JSON.parse(cleaned); } catch {
      return res.status(500).json({ error: 'AI returned invalid JSON', raw: cleaned });
    }

    post.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    post.created_at = new Date().toISOString();
    post.topic = topic;
    post.keywords = keywords;

    const html = generateHtml(post);
    writeFileSync(join(POSTS_DIR, post.id + '.html'), html);

    const index = loadIndex();
    index.unshift({
      id: post.id,
      title: post.title,
      slug: post.slug,
      tags: post.tags,
      meta_description: post.meta_description,
      reading_time: post.reading_time,
      created_at: post.created_at,
      topic
    });
    saveIndex(index);

    res.json({ post, html: html.slice(0, 2000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateHtml(post) {
  const sections = (post.content || []).map(s =>
    `<section>
      <h2>${s.heading}</h2>
      ${s.body.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('\n      ')}
    </section>`
  ).join('\n\n    ');

  const tagsHtml = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <meta name="description" content="${post.meta_description || ''}">
  <meta name="keywords" content="${(post.tags || []).join(', ')}">
  <link rel="icon" href="data:,">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #0f172a; color: #e2e8f0; line-height: 1.8; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 2rem; color: #38bdf8; margin-bottom: 0.5rem; line-height: 1.3; }
    .meta { color: #64748b; font-size: 0.85rem; margin-bottom: 2rem; }
    .meta span { margin-right: 1rem; }
    p { margin-bottom: 1.2rem; color: #cbd5e1; }
    h2 { color: #38bdf8; margin: 2rem 0 1rem; font-size: 1.35rem; }
    .tags { margin-bottom: 2rem; }
    .tag { display: inline-block; background: #1e293b; color: #94a3b8; padding: 0.25rem 0.7rem; border-radius: 6px; font-size: 0.8rem; margin: 0.2rem; }
    .intro { font-size: 1.1rem; color: #94a3b8; border-left: 3px solid #334155; padding-left: 1rem; margin-bottom: 2rem; }
    .conclusion { border-top: 1px solid #1e293b; padding-top: 1.5rem; margin-top: 2rem; }
    @media (max-width:550px) { h1 { font-size: 1.5rem; } .container { padding: 1.5rem 1rem; } }
  </style>
</head>
<body>
  <article class="container">
    <div class="tags">${tagsHtml}</div>
    <h1>${post.title}</h1>
    <div class="meta">
      <span>${post.reading_time || 5} min read</span>
      <span>${new Date(post.created_at).toLocaleDateString()}</span>
    </div>
    ${post.intro ? `<p class="intro">${post.intro}</p>` : ''}
    ${sections}
    ${post.conclusion ? `<div class="conclusion"><p>${post.conclusion}</p></div>` : ''}
  </article>
</body>
</html>`;
}

app.get('/post/:id', (req, res) => {
  const file = join(POSTS_DIR, req.params.id + '.html');
  if (!existsSync(file)) return res.status(404).send('Post not found');
  res.sendFile(file);
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`\n[auto-blog-writer] http://localhost:${PORT}`);
  console.log(`nexagaze project — built by Founder Bilal`);
  console.log(`Contact: ai@nexagaze.com | WhatsApp: 03103860653\n`);
});
