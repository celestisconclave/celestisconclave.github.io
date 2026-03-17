// ── HOME PAGE JS ─────────────────────────────────────────────

// Starfield canvas
function initStarfield() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W,
        H,
        stars = [];

    function resize() {
        // Size from the hero section, not the canvas element itself
        const hero = canvas.parentElement;
        W = canvas.width = hero ? hero.offsetWidth : window.innerWidth;
        H = canvas.height = hero ? hero.offsetHeight : window.innerHeight;
    }

    function mkStar() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.4 + 0.3,
            a: Math.random(),
            speed: Math.random() * 0.008 + 0.003,
            dir: Math.random() > 0.5 ? 1 : -1,
        };
    }

    function init() {
        resize();
        stars = Array.from({ length: 160 }, mkStar);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
            s.a += s.speed * s.dir;
            if (s.a <= 0 || s.a >= 1) s.dir *= -1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,185,255,${s.a * 0.7})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
        resize();
        stars = Array.from({ length: 160 }, mkStar);
    });
    init();
    draw();
}

// Sponsors carousel — JS-driven so we can pause on hover and always loop seamlessly
function renderSponsors() {
    const track = document.getElementById('sponsors-track');
    const wrapper = track?.parentElement;
    if (!track || !wrapper) return;

    const sponsors = SITE_DATA.sponsors;
    if (!sponsors.length) return;

    // Render one set first, measure it, then clone enough times to guarantee
    // the total track width is at least 3× the wrapper width (ensures seamless loop
    // even with very few items).
    function buildItem(s) {
        const a = document.createElement('a');
        a.href = s.url;
        a.className = 'sponsor-item';
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = `
      <img src="${s.logo}" alt="${s.name}" class="sponsor-logo" onerror="this.style.display='none'">
      <span class="sponsor-name">${s.name}</span>
    `;
        return a;
    }

    // Build one set to measure natural width
    track.innerHTML = '';
    const GAP = 64; // 4rem at 16px
    sponsors.forEach((s) => track.appendChild(buildItem(s)));

    // Force layout so offsetWidth is available
    requestAnimationFrame(() => {
        const singleSetW = track.scrollWidth;
        const wrapperW = wrapper.offsetWidth || window.innerWidth;

        // How many full copies do we need so total > 3 × wrapperW?
        const copies = Math.max(4, Math.ceil((wrapperW * 3) / singleSetW) + 1);

        // Rebuild with enough copies
        track.innerHTML = '';
        for (let i = 0; i < copies; i++) {
            sponsors.forEach((s) => track.appendChild(buildItem(s)));
        }

        // The loop point: after one full set scrolls off, snap back
        // We scroll at a constant px/frame speed
        const SPEED = 0.5; // px per frame (~30px/s at 60fps)
        let offset = 0;
        let paused = false;
        let hoveredItem = null;

        function step() {
            if (!paused) {
                offset += SPEED;
                // When we've scrolled exactly one set width, snap back to 0
                if (offset >= singleSetW + GAP) offset -= singleSetW + GAP;
                track.style.transform = `translateX(${-offset}px)`;
            }
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);

        // Hover: pause carousel, highlight the item under the pointer
        // We use pointermove on the wrapper to find which item is actually
        // under the cursor by checking bounding rects — this sidesteps the
        // "ghost link" problem where the pointer hits a now-moved element.
        wrapper.addEventListener('pointerenter', () => {
            paused = true;
        });
        wrapper.addEventListener('pointerleave', () => {
            paused = false;
            if (hoveredItem) {
                hoveredItem.classList.remove('hovered');
                hoveredItem = null;
            }
        });

        wrapper.addEventListener('pointermove', (e) => {
            const els = track.querySelectorAll('.sponsor-item');
            let found = null;
            for (const el of els) {
                const r = el.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                    found = el;
                    break;
                }
            }
            if (found !== hoveredItem) {
                if (hoveredItem) hoveredItem.classList.remove('hovered');
                hoveredItem = found;
                if (hoveredItem) hoveredItem.classList.add('hovered');
            }
        });

        // Make clicks work: on pointerup, navigate to the hovered item's href
        wrapper.addEventListener('click', (e) => {
            if (hoveredItem && hoveredItem.href) {
                window.open(hoveredItem.href, '_blank', 'noopener');
            }
            e.preventDefault();
        });
    });
}

// Featured projects
function renderFeaturedProjects() {
    const grid = document.getElementById('featured-projects-grid');
    if (!grid) return;
    const featured = SITE_DATA.projects.filter((p) => p.featured).slice(0, 3);
    grid.innerHTML = featured
        .map(
            (p) => `
    <div class="card proj-card reveal" onclick="window.location='projects.html'">
      <img class="card-img" src="${p.image}" alt="${p.title}"
        onerror="this.style.background='var(--clr-bg-card-2)'; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 800 450\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'800\\' height=\\'450\\'/%3E%3Ctext fill=\\'%23443a60\\' font-size=\\'80\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3E◈%3C/text%3E%3C/svg%3E'">
      <div class="proj-card-body">
        <div class="card-tags">${tagPills(p.tags)}</div>
        <h3 class="proj-card-title">${p.title}</h3>
        <p class="proj-card-desc">${p.shortDesc}</p>
      </div>
    </div>
  `,
        )
        .join('');
}

// Featured articles
function renderFeaturedArticles() {
    const grid = document.getElementById('featured-articles-grid');
    if (!grid) return;
    const featured = SITE_DATA.articles.filter((a) => a.featured).slice(0, 3);
    grid.innerHTML = featured
        .map(
            (a) => `
    <div class="card article-card reveal" onclick="window.location='article.html?id=${a.id}'">
      <img class="card-img" src="${a.coverImage}" alt="${a.title}"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 800 450\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'800\\' height=\\'450\\'/%3E%3Ctext fill=\\'%23443a60\\' font-size=\\'80\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3E✦%3C/text%3E%3C/svg%3E'">
      <div class="card-body">
        <div class="article-card-meta">
          <span>${a.author}</span>
          <span>·</span>
          <span>${formatDate(a.date)}</span>
        </div>
        <div class="card-tags">${tagPills(a.tags)}</div>
        <h3 class="article-card-title">${a.title}</h3>
        <p class="article-card-preview">${a.preview}</p>
      </div>
    </div>
  `,
        )
        .join('');
}

// Scroll reveal
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12 },
    );
    els.forEach((el) => obs.observe(el));
}

function initSolarSystem() {
    const canvas = document.getElementById('solar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const PLANETS = [
        { name: 'Mercury', color: '#b5b5b5', r: 3, orbitR: 0.13, period: 8 },
        { name: 'Venus', color: '#e8cda0', r: 5, orbitR: 0.2, period: 20 },
        { name: 'Earth', color: '#4fa3e0', r: 5.5, orbitR: 0.28, period: 33 },
        { name: 'Mars', color: '#c1440e', r: 4, orbitR: 0.36, period: 62 },
        { name: 'Jupiter', color: '#c88b3a', r: 11, orbitR: 0.5, period: 130 },
        { name: 'Saturn', color: '#e4d191', r: 9, orbitR: 0.62, period: 210 },
        { name: 'Uranus', color: '#7de8e8', r: 7, orbitR: 0.74, period: 420 },
        { name: 'Neptune', color: '#3f54ba', r: 6.5, orbitR: 0.86, period: 700 },
    ];

    const SUN_COLOR = '#f5d26e';
    const BASE_SIZE = 400;
    let W,
        H,
        cx,
        cy,
        scale,
        startTime = null;
    let mouseCanvasX = null,
        mouseCanvasY = null;

    function resize() {
        const parent = canvas.parentElement;
        W = canvas.width = parent.offsetWidth || 300;
        H = canvas.height = parent.offsetHeight || 300;
        cx = W / 2;
        cy = H / 2;
        scale = Math.min(W, H) * 0.47;
    }

    function rs() {
        return Math.min(W, H) / BASE_SIZE;
    }

    // Returns true if mouse is on the orbit ring OR on the planet body
    function isHighlighted(p, angle) {
        if (mouseCanvasX === null) return false;
        const orbitPx = p.orbitR * scale;
        const pr = Math.max(1.5, p.r * rs());

        // Planet position
        const px = cx + Math.cos(angle) * orbitPx;
        const py = cy + Math.sin(angle) * orbitPx;

        // Distance from mouse to planet centre
        const distToPlanet = Math.hypot(mouseCanvasX - px, mouseCanvasY - py);
        if (distToPlanet <= pr + 4) return true; // on the planet

        // Distance from mouse to orbit ring centre (i.e. the sun)
        const distToSun = Math.hypot(mouseCanvasX - cx, mouseCanvasY - cy);
        // On the orbit ring if within ±5px of the orbit radius
        if (Math.abs(distToSun - orbitPx) <= 5) return true;

        return false;
    }

    function drawOrbit(p, highlighted) {
        const orbitPx = p.orbitR * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitPx, 0, Math.PI * 2);
        if (highlighted) {
            ctx.strokeStyle = `rgba(${p._rgb},0.55)`;
            ctx.lineWidth = 1.5;
        } else {
            ctx.strokeStyle = 'rgba(180,160,255,0.10)';
            ctx.lineWidth = 1;
        }
        ctx.stroke();
    }

    function drawSun() {
        const sr = Math.max(5, 14 * rs());
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr * 3.5);
        grd.addColorStop(0, 'rgba(245,210,110,0.5)');
        grd.addColorStop(1, 'rgba(245,210,110,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, sr * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, sr, 0, Math.PI * 2);
        ctx.fillStyle = SUN_COLOR;
        ctx.shadowColor = SUN_COLOR;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Sun label on hover
        const distToSun = mouseCanvasX !== null ? Math.hypot(mouseCanvasX - cx, mouseCanvasY - cy) : Infinity;
        if (distToSun <= sr * 3.5) {
            const fontSize = Math.max(9, 11 * rs());
            ctx.font = `${fontSize}px Jost, sans-serif`;
            ctx.fillStyle = 'rgba(245,210,110,0.9)';
            ctx.textAlign = 'center';
            ctx.fillText('Sun', cx, cy - sr - 6 * rs());
        }
    }

    function drawPlanet(p, angle, highlighted) {
        const pr = Math.max(1.5, p.r * rs());
        const orbitPx = p.orbitR * scale;
        const px = cx + Math.cos(angle) * orbitPx;
        const py = cy + Math.sin(angle) * orbitPx;

        // Glow — gold when highlighted, planet colour otherwise
        const glowR = highlighted ? pr * 4 : pr * 2.5;
        const glowColor = `rgba(${p._rgb},`;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grd.addColorStop(0, glowColor + (highlighted ? '0.6)' : '1)'));
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = highlighted ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Name label when highlighted
        if (highlighted) {
            const fontSize = Math.max(9, 11 * rs());
            ctx.font = `${fontSize}px Jost, sans-serif`;
            ctx.fillStyle = `rgba(${p._rgb},0.9)`;
            ctx.textAlign = 'center';
            ctx.fillText(p.name, px, py - pr - 6 * rs());
        }

        // Saturn rings
        if (p.name === 'Saturn') {
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(1, 0.28);
            ctx.beginPath();
            ctx.arc(0, 0, pr * 2.2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(228,209,145,0.55)';
            ctx.lineWidth = Math.max(1, 2.5 * rs());
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, pr * 2.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(228,209,145,0.25)';
            ctx.lineWidth = Math.max(1, 1.5 * rs());
            ctx.stroke();
            ctx.restore();
        }
    }

    function frame(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        ctx.clearRect(0, 0, W, H);

        // Pre-compute angles and highlight state for this frame
        const state = PLANETS.map((p) => {
            const angle = (elapsed / (p.period * 1000)) * Math.PI * 2;
            const highlighted = isHighlighted(p, angle);
            return { angle, highlighted };
        });

        // Orbits first (so planets render on top)
        PLANETS.forEach((p, i) => drawOrbit(p, state[i].highlighted));
        drawSun();
        PLANETS.forEach((p, i) => drawPlanet(p, state[i].angle, state[i].highlighted));

        requestAnimationFrame(frame);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseCanvasX = (e.clientX - rect.left) * (W / rect.width);
        mouseCanvasY = (e.clientY - rect.top) * (H / rect.height);
    });

    canvas.addEventListener('mouseleave', () => {
        mouseCanvasX = null;
        mouseCanvasY = null;
    });

    window.addEventListener('resize', resize);
    resize();

    // Pre-compute RGB strings for each planet to avoid parsing in the draw loop
    PLANETS.forEach((p) => {
        const r = parseInt(p.color.slice(1, 3), 16);
        const g = parseInt(p.color.slice(3, 5), 16);
        const b = parseInt(p.color.slice(5, 7), 16);
        p._rgb = `${r},${g},${b}`;
    });

    requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initSolarSystem();
    renderSponsors();
    renderFeaturedProjects();
    renderFeaturedArticles();
    initReveal();
});
