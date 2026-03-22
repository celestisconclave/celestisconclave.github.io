// ============================================================
// CELESTIS CONCLAVE — SHARED UTILITIES
// ============================================================

// Admin password hash (SHA-256 of "celestis2025admin")
// Change this by hashing your desired password and replacing the value below
const ADMIN_HASH = 'a3f8c2e9b1d7f4a6e0c5b9d2f8a1e3c7b5d9f2a4e6c8b0d3f5a7e9c1b4d6f8a2';

// ── ANNOUNCEMENT BANNER ──────────────────────────────────────
function updateNavbarTop() {
    const banner = document.getElementById('announcement-banner');
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const bannerH = banner ? banner.offsetHeight : 0;
    // Subtract 1px so navbar slightly overlaps the banner bottom edge,
    // closing the subpixel gap that appears on certain screen sizes
    navbar.style.top = Math.max(0, bannerH - 1) + 'px';
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

    requestAnimationFrame(() => {
        updateNavbarTop();
    });

    // Re-measure whenever the window resizes, since banner text
    // can reflow to more lines on narrow screens
    window.addEventListener('resize', updateNavbarTop);

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
        <img src="assets/images/logo.png" alt="Celestis Conclave" class="nav-logo-img" onerror="this.style.display='none'">
        <span class="nav-wordmark">
          <span class="nav-wordmark-celestis">Celestis</span>
          <span class="nav-wordmark-conclave">Conclave</span>
        </span>
      </a>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="nav-links">
        ${pages
            .map(
                (p) => `
          <li><a href="${p.href}" class="nav-link ${activePage === p.label ? 'active' : ''}">${p.label}</a></li>
        `,
            )
            .join('')}
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
    links?.querySelectorAll('.nav-link').forEach((link) => {
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
        <p class="footer-tagline">
          <span>Novus</span><span class="tagline-dot">✦</span><span>Ordo</span><span class="tagline-dot">✦</span><span>Astrorum</span>
        </p>
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
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 600);
        if (clickCount >= 3) {
            clickCount = 0;
            window.location.href = 'admin/index.html';
        }
    });
}

// ── MARKDOWN RENDERER (simple) ─────────────────────────────────
function renderMarkdown(md) {
    if (!md) return '';
    // ── FOOTNOTES ──────────────────────────────────────────────
    // Pass 1: collect footnote definitions [^id]: text
    const footnotes = {};
    let fnCounter = 0;
    md = md.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_, id, text) => {
        footnotes[id] = { text: text.trim(), index: null };
        return ''; // remove definition from main text
    });

    // Pass 2: replace inline references [^id] with superscript links
    // We assign index numbers in order of first appearance
    md = md.replace(/\[\^([^\]]+)\]/g, (_, id) => {
        if (!footnotes[id]) return `[^${id}]`; // undefined ref — leave as-is
        if (footnotes[id].index === null) {
            fnCounter++;
            footnotes[id].index = fnCounter;
        }
        const n = footnotes[id].index;
        return `<sup><a href="#fn-${n}" id="fnref-${n}" class="fn-ref">${n}</a></sup>`;
    });

    // Pass 3: build footnotes list to append after article
    let fnHtml = '';
    const fnEntries = Object.values(footnotes)
        .filter((f) => f.index !== null)
        .sort((a, b) => a.index - b.index);

    if (fnEntries.length > 0) {
        const items = Object.entries(footnotes)
            .filter(([_, f]) => f.index !== null)
            .sort(([_, a], [__, b]) => a.index - b.index)
            .map(
                ([_, f]) => `
            <li id="fn-${f.index}" class="fn-item">
            <span class="fn-number">${f.index}</span>
            <span class="fn-text">${f.text}
                <a href="#fnref-${f.index}" class="fn-back" title="Back to text"><i class="fa-solid fa-arrow-left"></i></a>
            </span>
            </li>`,
            )
            .join('');
        fnHtml = `<div class="footnotes"><hr><ol class="fn-list">${items}</ol></div>`;
    }

    let html = md;
    // Fenced code blocks
    html = html.replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => `<pre><code class="language-${lang || 'text'}">${escHtml(code.trim())}</code></pre>`,
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
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\s][^_]*[^_\s]|[^_\s])_/g, '<em>$1</em>');
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
    // Protect display math blocks ($$...$$) from being wrapped in <p> tags
    // Replace them with placeholders before paragraph splitting, restore after
    const mathBlocks = [];
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
        mathBlocks.push(match);
        return `%%MATHBLOCK_${mathBlocks.length - 1}%%`;
    });

    // Paragraphs (double newline)
    html = html
        .split(/\n{2,}/)
        .map((block) => {
            block = block.trim();
            if (!block) return '';
            if (/^%%MATHBLOCK_\d+%%$/.test(block)) return block; // math block — don't wrap
            if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|iframe|div|figure)/.test(block)) return block;
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');

    // Restore display math blocks
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, i) => mathBlocks[parseInt(i)]);
    return html + fnHtml;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── TAG PILL HELPER ────────────────────────────────────────────
function tagPills(tags, clickable = false) {
    return tags
        .map((t) =>
            clickable ? `<button class="tag-pill" data-tag="${t}">${t}</button>` : `<span class="tag-pill">${t}</span>`,
        )
        .join('');
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
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── ON DOM READY ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Don't render banner/nav/footer on admin page
    if (window.location.pathname.includes('/admin/')) return;
    renderAnnouncement();
    renderNavbar(document.body.dataset.page || '');
    renderFooter();

    // Footnote scroll: center target in viewport for all screen sizes
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a.fn-back, .fn-ref');
        if (link) {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.getElementById(href.slice(1));
                if (target) {
                    e.preventDefault();
                    const rect = target.getBoundingClientRect();
                    const scrollY = window.pageYOffset;
                    const targetY = rect.top + scrollY;
                    const centerY = targetY - window.innerHeight / 2 + rect.height / 2;
                    window.scrollTo({ top: centerY, behavior: 'smooth' });
                    history.replaceState(null, '', href);
                }
            }
        }
    });
});
