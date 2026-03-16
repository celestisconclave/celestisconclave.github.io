// ============================================================
// CELESTIS CONCLAVE — SHARED UTILITIES
// ============================================================

// Admin password hash (SHA-256 of "celestis2025admin")
// Change this by hashing your desired password and replacing the value below
const ADMIN_HASH = "a3f8c2e9b1d7f4a6e0c5b9d2f8a1e3c7b5d9f2a4e6c8b0d3f5a7e9c1b4d6f8a2";

// ── ANNOUNCEMENT BANNER ──────────────────────────────────────
function updateNavbarTop() {
  const banner = document.getElementById('announcement-banner');
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const bannerH = banner ? banner.offsetHeight : 0;
  navbar.style.top = bannerH + 'px';
  // Also push the page content down so it starts below both fixed bars
  document.documentElement.style.setProperty('--banner-height', bannerH + 'px');
}

function renderAnnouncement() {
  const ann = SITE_DATA.announcement;
  if (!ann || !ann.active || !ann.message) return;

  // If the user already dismissed this exact message this session, don't show it again
  // Use encodeURIComponent before btoa to safely handle emoji and non-Latin characters
  const dismissKey = 'ann_dismissed_' + btoa(encodeURIComponent(ann.message)).slice(0, 16);
  if (sessionStorage.getItem(dismissKey)) return;

  const banner = document.createElement('div');
  banner.id = 'announcement-banner';
  banner.className = 'announcement-banner';
  banner.innerHTML = `
    <span class="ann-text">${ann.message}</span>
    ${ann.link ? `<a href="${ann.link}" class="ann-link">${ann.linkText || 'Learn More'} →</a>` : ''}
    <button class="ann-close" id="ann-close-btn" aria-label="Dismiss">&times;</button>
  `;
  document.body.prepend(banner);

  // Push navbar down to sit below the banner
  requestAnimationFrame(() => {
    updateNavbarTop();
  });

  // Close button: record dismissal in sessionStorage, then animate out
  document.getElementById('ann-close-btn').addEventListener('click', () => {
    const dismissKey = 'ann_dismissed_' + btoa(encodeURIComponent(ann.message)).slice(0, 16);
    sessionStorage.setItem(dismissKey, '1');

    banner.style.transition = 'max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease';
    banner.style.overflow = 'hidden';
    banner.style.opacity = '0';
    banner.style.maxHeight = banner.offsetHeight + 'px';
    banner.offsetHeight; // force reflow
    banner.style.maxHeight = '0';
    banner.style.paddingTop = '0';
    banner.style.paddingBottom = '0';

    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.style.transition = 'top 0.3s ease, background 0.25s, box-shadow 0.25s';
      navbar.style.top = '0px';
    }
    // Collapse the content offset too
    document.documentElement.style.setProperty('--banner-height', '0px');

    banner.addEventListener('transitionend', () => banner.remove(), { once: true });
  });
}

// ── NAVBAR ────────────────────────────────────────────────────
function renderNavbar(activePage = '') {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'team.html', label: 'Team' },
    { href: 'projects.html', label: 'Projects' },
    { href: 'blog.html', label: 'Blog' },
    { href: 'resources.html', label: 'Resources' },
    { href: 'contact.html', label: 'Contact' },
  ];

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-logo-link">
        <img src="assets/images/logo.png" alt="Celestis Conclave" class="nav-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="nav-logo-fallback" style="display:none">
          <span class="nav-logo-icon">✦</span>
          <span class="nav-logo-text">Celestis <em>Conclave</em></span>
        </div>
      </a>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="nav-links">
        ${pages.map(p => `
          <li><a href="${p.href}" class="nav-link ${activePage === p.label ? 'active' : ''}">${p.label}</a></li>
        `).join('')}
      </ul>
    </div>
  `;

  // Hamburger toggle
  const hamburger = document.getElementById('nav-hamburger');
  const links = document.getElementById('nav-links');
  hamburger?.addEventListener('click', () => {
    links.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  // Close on nav link click (mobile)
  links?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      hamburger?.classList.remove('open');
    });
  });

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── FOOTER ────────────────────────────────────────────────────
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  let clickCount = 0;
  let clickTimer = null;

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="assets/images/logo.png" alt="Celestis Conclave" class="footer-logo" onerror="this.style.display='none'">
        <p class="footer-tagline">Curiosity. Rigour. Discovery.</p>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <h4>Navigate</h4>
          <a href="index.html">Home</a>
          <a href="about.html">About</a>
          <a href="team.html">Team</a>
          <a href="projects.html">Projects</a>
        </div>
        <div class="footer-col">
          <h4>Content</h4>
          <a href="blog.html">Blog</a>
          <a href="resources.html">Resources</a>
          <a href="contact.html">Contact</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span id="copyright-icon" class="copyright-icon" title="© Celestis Conclave ${new Date().getFullYear()}">©</span>
      <span> ${new Date().getFullYear()} Celestis Conclave. All rights reserved.</span>
    </div>
  `;

  // Secret triple-click on copyright icon
  const copyrightIcon = document.getElementById('copyright-icon');
  copyrightIcon?.addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 600);
    if (clickCount >= 3) {
      clickCount = 0;
      window.location.href = 'admin/index.html';
    }
  });
}

// ── MARKDOWN RENDERER (simple) ─────────────────────────────────
function renderMarkdown(md) {
  if (!md) return '';
  let html = md;
  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${lang || 'text'}">${escHtml(code.trim())}</code></pre>`
  );
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Raw HTML (iframes etc.) — pass through
  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');
  // Unordered list
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Ordered list
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // Paragraphs (double newline)
  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|iframe|div|figure)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  return html;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── TAG PILL HELPER ────────────────────────────────────────────
function tagPills(tags, clickable = false) {
  return tags.map(t =>
    clickable
      ? `<button class="tag-pill" data-tag="${t}">${t}</button>`
      : `<span class="tag-pill">${t}</span>`
  ).join('');
}

// ── FORMAT DATE ────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── SHA-256 (for admin login) ──────────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── ON DOM READY ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Don't render banner/nav/footer on admin page
  if (window.location.pathname.includes('/admin/')) return;
  renderAnnouncement();
  renderNavbar(document.body.dataset.page || '');
  renderFooter();
});
