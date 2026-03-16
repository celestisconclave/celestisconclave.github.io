# Celestis Conclave — Website

A premium, academically-styled STEM club website with a full content management system.

## Structure

```
celestis/
├── index.html          # Home
├── about.html          # About & Philosophy
├── team.html           # Meet the Team
├── projects.html       # Projects (with modal + filters)
├── blog.html           # Blog listing (with filters)
├── article.html        # Individual article reader
├── resources.html      # Curated resources
├── contact.html        # Contact / Apply form
│
├── admin/
│   ├── index.html      # Admin dashboard (triple-click © to access)
│   ├── admin.css
│   └── admin.js
│
├── css/
│   ├── styles.css      # Shared styles
│   ├── home.css
│   ├── about.css
│   ├── team.css
│   ├── projects.css
│   ├── blog.css
│   ├── article.css
│   ├── resources.css
│   └── contact.css
│
├── js/
│   ├── data.js         # ← ALL site content lives here (CMS target)
│   ├── app.js          # Shared utilities, navbar, footer
│   ├── home.js
│   ├── projects.js
│   └── blog.js
│
└── assets/
    ├── images/
    │   ├── logo.png            # ← Place your logo here
    │   ├── projects/           # Project images
    │   ├── team/               # Team member photos
    │   └── sponsors/           # Sponsor logos
    └── articles/
        ├── md/                 # Markdown article files
        └── images/             # Article cover images
```

## Setup

1. **Add your logo**: Place `logo.png` in `assets/images/`. The site will use it in the navbar and footer automatically.

2. **Edit content**: All site content (projects, articles, resources, team) is in `js/data.js`. Edit this file directly, or use the Admin panel.

3. **Deploy**: Push to GitHub and enable GitHub Pages (Settings → Pages → Branch: `main`, folder: `/root`).

## Admin Panel

**Access**: Triple-click the `©` symbol in the footer of any page.

**Default password**: `password`

> ⚠️ **Change the password before deploying!** See below.

### Changing the Admin Password

1. Open your browser console on any page
2. Run:
   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-new-password'))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
   ```
3. Copy the resulting hash
4. Open `admin/admin.js` and replace the value of `ADMIN_HASH` with your hash

### Using the Admin Panel

1. Log in with your access code
2. Enter your GitHub PAT in the top bar (needs `repo` scope)
3. Enter your repository as `username/repo-name`
4. Make changes (add/edit/delete projects, articles, resources, team members, announcement)
5. Click **Push Changes** — a confirmation dialog will list everything being pushed
6. Changes go live after GitHub Pages rebuilds (usually 1–2 minutes)

### GitHub PAT

Generate at: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens

Required permissions: `Contents: Read and write`

**The PAT is never stored** — it only exists in memory for the duration of the session.

## Adding Articles

Articles are written in Markdown and stored in `assets/articles/md/`. The format supports:

- Headings (`#`, `##`, etc.)
- Bold, italic, inline code
- Fenced code blocks with language syntax hints
- Blockquotes
- Images: `![alt](url)`
- Links: `[text](url)`
- Embedded videos/iframes (raw HTML is passed through)
- Horizontal rules (`---`)
- Unordered and ordered lists

## Design System

| Token | Value |
|-------|-------|
| Primary | `#7c3aed` (deep purple) |
| Accent | `#d4a843` (gold) |
| Background | `#0d0b14` |
| Heading font | Cormorant Garamond (serif) |
| Body font | Jost (sans-serif) |
| Code font | JetBrains Mono |

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). Uses `crypto.subtle` for password hashing (HTTPS required in production).
