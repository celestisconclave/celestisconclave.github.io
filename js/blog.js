// ── BLOG PAGE JS ─────────────────────────────────────────────

let activeBlogTags = new Set();
let blogSearch = '';

function getAllBlogTags() {
  const tags = new Set();
  SITE_DATA.articles.forEach(a => a.tags.forEach(t => tags.add(t)));
  return [...tags].sort();
}

function renderBlogFilters() {
  const container = document.getElementById('blog-tag-filters');
  if (!container) return;
  const tags = getAllBlogTags();
  container.innerHTML = tags.map(t =>
    `<button class="tag-pill ${activeBlogTags.has(t) ? 'active' : ''}" data-tag="${t}">${t}</button>`
  ).join('');
  container.querySelectorAll('.tag-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (activeBlogTags.has(tag)) { activeBlogTags.delete(tag); btn.classList.remove('active'); }
      else { activeBlogTags.add(tag); btn.classList.add('active'); }
      renderBlogGrid();
    });
  });
}

function filterArticles() {
  let items = [...SITE_DATA.articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (blogSearch) {
    const q = blogSearch.toLowerCase();
    items = items.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.preview.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (activeBlogTags.size > 0) {
    items = items.filter(a => [...activeBlogTags].every(t => a.tags.includes(t)));
  }
  return items;
}

function renderBlogGrid() {
  const grid = document.getElementById('blog-grid');
  const noResults = document.getElementById('no-results');
  if (!grid) return;
  const items = filterArticles();
  noResults.style.display = items.length === 0 ? '' : 'none';
  grid.innerHTML = items.map(a => `
    <a href="article.html?id=${a.id}" class="blog-card card">
      <div class="blog-card-img-wrap">
        <img class="card-img blog-card-img" src="${a.coverImage}" alt="${a.title}"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 800 450\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'800\\' height=\\'450\\'/%3E%3Ctext fill=\\'%23443a60\\' font-size=\\'80\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3E✦%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="card-body">
        <div class="article-card-meta">
          <span>${a.author}</span>
          <span>·</span>
          <span>${formatDate(a.date)}</span>
        </div>
        <div class="card-tags" style="margin-bottom:0.6rem">${tagPills(a.tags)}</div>
        <h3 class="article-card-title">${a.title}</h3>
        <p class="article-card-preview">${a.preview}</p>
      </div>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlogFilters();
  renderBlogGrid();

  document.getElementById('blog-search')?.addEventListener('input', e => {
    blogSearch = e.target.value.trim();
    renderBlogGrid();
  });
});
