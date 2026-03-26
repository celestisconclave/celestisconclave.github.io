// ── PROJECTS PAGE JS ─────────────────────────────────────────

let activeProjectTags = new Set();
let projectSearch = '';

function getAllProjectTags() {
    const tags = new Set();
    SITE_DATA.projects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return [...tags].sort();
}

function renderProjectFilters() {
    const container = document.getElementById('project-tag-filters');
    if (!container) return;
    const tags = getAllProjectTags();
    container.innerHTML = tags
        .map(
            (t) => `<button class="tag-pill ${activeProjectTags.has(t) ? 'active' : ''}" data-tag="${t}">${t}</button>`,
        )
        .join('');
    container.querySelectorAll('.tag-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            if (activeProjectTags.has(tag)) {
                activeProjectTags.delete(tag);
                btn.classList.remove('active');
            } else {
                activeProjectTags.add(tag);
                btn.classList.add('active');
            }
            renderProjectsGrid();
        });
    });
}

function filterProjects() {
    let items = SITE_DATA.projects;
    if (projectSearch) {
        const q = projectSearch.toLowerCase();
        items = items.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.shortDesc.toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q)),
        );
    }
    if (activeProjectTags.size > 0) {
        items = items.filter((p) => [...activeProjectTags].every((t) => p.tags.includes(t)));
    }
    return items;
}

function renderProjectsGrid() {
    const grid = document.getElementById('projects-grid');
    const noResults = document.getElementById('no-results');
    if (!grid) return;
    const items = filterProjects();
    noResults.style.display = items.length === 0 ? '' : 'none';
    grid.innerHTML = items
        .map(
            (p) => `
    <a href="project.html?id=${p.id}" class="card proj-card">
      <img class="card-img" src="${p.image}" alt="${p.title}"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 800 450\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'800\\' height=\\'450\\'/%3E%3Ctext fill=\\'%23443a60\\' font-size=\\'80\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3E◈%3C/text%3E%3C/svg%3E'">
      <div class="proj-card-body">
        <div class="card-tags">${tagPills(p.tags)}</div>
        <h3 class="proj-card-title">${p.title}</h3>
        <p class="proj-card-desc">${p.shortDesc}</p>
      </div>
    </a>
  `,
        )
        .join('');
}

function openProjectModal(id) {
    const p = SITE_DATA.projects.find((x) => x.id === id);
    if (!p) return;
    const content = document.getElementById('project-modal-content');
    content.innerHTML = `
    <button class="modal-close" id="project-modal-close" aria-label="Close">×</button>
    <img src="${p.image}" alt="${p.title}" class="modal-hero-img"
      onerror="this.style.display='none'">
    <div class="modal-body">
      <div class="card-tags" style="margin-bottom:1rem">${tagPills(p.tags)}</div>
      <h2 class="modal-title">${p.title}</h2>
      <div class="md-content" style="margin-top:1.25rem">${renderMarkdown(p.longDesc)}</div>
      ${
          p.link
              ? `<a href="${p.link}" target="_blank" rel="noopener" class="btn btn-primary mt-md">
        View Project <i class="fa-solid fa-arrow-right"></i>
      </a>`
              : ''
      }
    </div>
  `;
    document.getElementById('project-modal-close').addEventListener('click', closeProjectModal);
    document.getElementById('project-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('open');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
    renderProjectFilters();
    renderProjectsGrid();

    document.getElementById('project-search')?.addEventListener('input', (e) => {
        projectSearch = e.target.value.trim();
        renderProjectsGrid();
    });

    document.getElementById('project-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('project-modal')) closeProjectModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProjectModal();
    });
});
