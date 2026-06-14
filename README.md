# Auto Blog Writer — nexagaze project

> Built by Founder Bilal

AI blog post generator. Enter topic → Ollama writes SEO-optimized blog → saves as HTML file with meta tags.

## SEO Keywords
AI blog writer, blog post generator, SEO content generator, Ollama blog writer, automatic blog tool, HTML blog generator, nexagaze, open source blog writer, Founder Bilal

## Tech Stack
- Node.js / Express
- Ollama AI (minimax-m2.1:cloud)
- HTML file generation with meta tags
- JSON index for published posts

## Setup
```bash
npm install
npm start
```

## Features
- Enter any topic for instant blog generation
- Optional custom keywords input
- AI generates SEO title, meta description, and tags
- Complete blog with intro, sections, conclusion
- Saves as standalone HTML file
- Preview blog before publishing
- View all published posts

## 📖 Documentation

### Architecture
Express.js server (port 3005). Topic → Ollama generates full blog → saves as standalone HTML in `posts/` directory.

### Data Flow
1. POST `/api/generate` with topic + optional keywords
2. Ollama returns structured JSON (title, meta_description, headings, content sections, conclusion, tags)
3. Server generates styled HTML page with SEO meta tags
4. Saves to `posts/<id>.html` + updates `posts/index.json` index
5. Returns preview + link to published post

### Features
- SEO-optimized titles (50-65 chars) and meta descriptions (120-160 chars)
- Reading time estimation
- Tags for categorization
- Published blog listing at GET `/api/posts`

## License
MIT — see [LICENSE](LICENSE)

---

**Contact:** ai@nexagaze.com | **WhatsApp:** 03103860653

---

## 🤝 Hire Me

Need a more advanced version? Want this built in Python, Rust, Go, or another language?  
I build custom AI agents, automation tools, and full-stack applications.

**Founder Bilal** — nexagaze  
📧 **Email:** ai@nexagaze.com  
📱 **WhatsApp:** 03103860653  
🌐 **GitHub:** [github.com/your-profile](https://github.com/your-profile)

> *"I don't just build projects — I build solutions that scale."*
