// ============================================================
// CELESTIS CONCLAVE — ADMIN PANEL JS
// All mutations are local until PAT + Push Changes is used.
// ============================================================

// ── PASSWORD HASH ─────────────────────────────────────────────
// SHA-256 of "celestis2025admin" — replace with your own hash
// To generate: open browser console and run:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
const ADMIN_HASH = 'd2915f0e9118f5ae8dbf87f8e7b3686f73d4905b0776284398949d80255dc575';
// ^ Default is SHA-256 of "password" — CHANGE THIS before deploying

// ── LOCAL STATE ───────────────────────────────────────────────
// Deep-clone SITE_DATA so we mutate local state, not the original module
let localData = null;
let pendingChanges = false;

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cloneData() {
    localData = JSON.parse(JSON.stringify(SITE_DATA));
}

function markChanged() {
    pendingChanges = true;
    updatePendingSummary();
}

function updatePendingSummary() {
    const el = document.getElementById('pending-summary');
    if (!el) return;
    if (pendingChanges) {
        el.textContent =
            '⚠ You have unsaved local changes. Enter your GitHub PAT above and click "Push Changes" to publish.';
        el.className = 'pending-summary has-changes';
    } else {
        el.textContent = 'No unsaved changes.';
        el.className = 'pending-summary';
    }
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 30);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 400);
    }, 4500);
}

// ── LOGIN ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('admin-login-btn');
    const passInput = document.getElementById('admin-pass');

    passInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    loginBtn?.addEventListener('click', async () => {
        const val = passInput.value;
        const hash = await sha256(val);
        if (hash === ADMIN_HASH) {
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'grid';
            cloneData();
            initDashboard();
        } else {
            document.getElementById('admin-login-error').style.display = 'block';
            passInput.value = '';
            passInput.focus();
        }
    });
});

// ── PANEL NAVIGATION ──────────────────────────────────────────
function initDashboard() {
    document.querySelectorAll('.admin-nav-item[data-panel]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-item').forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
        });
    });

    renderOverview();
    renderAnnouncement();
    renderProjectsList();
    renderArticlesList();
    renderResourcesList();
    renderTeamList();
    initPushChanges();

    document.getElementById('add-project-btn')?.addEventListener('click', () => openProjectForm());
    document.getElementById('add-article-btn')?.addEventListener('click', () => openArticleForm());
    document.getElementById('add-resource-btn')?.addEventListener('click', () => openResourceForm());
    document.getElementById('add-team-btn')?.addEventListener('click', () => openTeamForm());

    document.getElementById('edit-modal-close')?.addEventListener('click', closeEditModal);
    document.getElementById('edit-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) closeEditModal();
    });
}

// ── OVERVIEW ─────────────────────────────────────────────────
function renderOverview() {
    const stats = document.getElementById('overview-stats');
    if (!stats) return;
    const items = [
        { label: 'Projects', value: localData.projects.length },
        { label: 'Articles', value: localData.articles.length },
        { label: 'Resources', value: localData.resources.length },
        { label: 'Team Members', value: localData.team.length },
        { label: 'Sponsors', value: localData.sponsors.length },
    ];
    stats.innerHTML = items
        .map(
            (s) => `
    <div class="stat-card">
      <div class="stat-number">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `,
        )
        .join('');
    updatePendingSummary();
}

// ── ANNOUNCEMENT ──────────────────────────────────────────────
function renderAnnouncement() {
    const ann = localData.announcement;
    const activeBox = document.getElementById('ann-active');
    const activeLabel = document.getElementById('ann-active-label');
    const msgInput = document.getElementById('ann-message');
    const linkInput = document.getElementById('ann-link');
    const linkTextInput = document.getElementById('ann-link-text');

    if (!activeBox) return;

    activeBox.checked = ann.active;
    activeLabel.textContent = ann.active ? 'Active' : 'Inactive';
    msgInput.value = ann.message || '';
    linkInput.value = ann.link || '';
    linkTextInput.value = ann.linkText || '';

    activeBox.addEventListener('change', () => {
        activeLabel.textContent = activeBox.checked ? 'Active' : 'Inactive';
    });

    document.getElementById('save-announcement')?.addEventListener('click', () => {
        localData.announcement = {
            active: activeBox.checked,
            message: msgInput.value.trim(),
            link: linkInput.value.trim(),
            linkText: linkTextInput.value.trim(),
        };
        markChanged();
        showToast('Announcement saved locally. Push to publish.');
    });
}

// ── PROJECTS LIST ─────────────────────────────────────────────
function renderProjectsList() {
    const list = document.getElementById('projects-list');
    if (!list) return;
    if (localData.projects.length === 0) {
        list.innerHTML = '<p style="color:var(--clr-text-3);font-size:.9rem">No projects yet.</p>';
        return;
    }
    const featuredCount = localData.projects.filter((p) => p.featured).length;
    list.innerHTML = localData.projects
        .map((p) => {
            const isChecked = p.featured;
            const isDisabled = !isChecked && featuredCount >= 3;
            return `
      <div class="admin-list-item" id="proj-row-${p.id}">
        <img src="../${p.image}" class="admin-list-thumb" alt=""
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 64 40\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'64\\' height=\\'40\\'/%3E%3C/svg%3E'">
        <div class="admin-list-info">
          <div class="admin-list-title">${p.title}</div>
          <div class="admin-list-meta">${p.tags.join(' · ')}</div>
        </div>
        <label class="featured-toggle ${isDisabled ? 'featured-toggle--disabled' : ''}" title="${isDisabled ? 'Maximum 3 featured projects' : 'Toggle featured'}">
          <input type="checkbox"
            ${isChecked ? 'checked' : ''}
            ${isDisabled ? 'disabled' : ''}
            onchange="toggleFeatured('project', ${p.id}, this.checked)">
          <span class="featured-toggle-label">★ Featured</span>
        </label>
        <div class="admin-list-actions">
          <button class="btn-sm" onclick="openProjectForm(${p.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="confirmDelete('project', ${p.id})">Delete</button>
        </div>
      </div>
    `;
        })
        .join('');
}

// ── ARTICLES LIST ─────────────────────────────────────────────
function renderArticlesList() {
    const list = document.getElementById('articles-list');
    if (!list) return;
    if (localData.articles.length === 0) {
        list.innerHTML = '<p style="color:var(--clr-text-3);font-size:.9rem">No articles yet.</p>';
        return;
    }
    const featuredCount = localData.articles.filter((a) => a.featured).length;
    list.innerHTML = localData.articles
        .map((a) => {
            const isChecked = a.featured;
            const isDisabled = !isChecked && featuredCount >= 3;
            return `
      <div class="admin-list-item" id="art-row-${a.id}">
        <img src="../${a.coverImage}" class="admin-list-thumb" alt=""
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 64 40\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'64\\' height=\\'40\\'/%3E%3C/svg%3E'">
        <div class="admin-list-info">
          <div class="admin-list-title">${a.title}</div>
          <div class="admin-list-meta">${a.author} · ${a.date}</div>
        </div>
        <label class="featured-toggle ${isDisabled ? 'featured-toggle--disabled' : ''}" title="${isDisabled ? 'Maximum 3 featured articles' : 'Toggle featured'}">
          <input type="checkbox"
            ${isChecked ? 'checked' : ''}
            ${isDisabled ? 'disabled' : ''}
            onchange="toggleFeatured('article', ${a.id}, this.checked)">
          <span class="featured-toggle-label">★ Featured</span>
        </label>
        <div class="admin-list-actions">
          <button class="btn-sm" onclick="openArticleForm(${a.id})">Edit</button>
          <button class="btn-sm btn-danger" onclick="confirmDelete('article', ${a.id})">Delete</button>
        </div>
      </div>
    `;
        })
        .join('');
}

window.toggleFeatured = function(type, id, value) {
  if (type === 'project') {
    const proj = localData.projects.find(p => p.id === id);
    if (proj) proj.featured = value;
    renderProjectsList();
  } else if (type === 'article') {
    const art = localData.articles.find(a => a.id === id);
    if (art) art.featured = value;
    renderArticlesList();
  }
  markChanged();
  renderOverview();
};

// ── RESOURCES LIST ────────────────────────────────────────────
function renderResourcesList() {
    const list = document.getElementById('resources-list');
    if (!list) return;
    if (localData.resources.length === 0) {
        list.innerHTML = '<p style="color:var(--clr-text-3);font-size:.9rem">No resources yet.</p>';
        return;
    }
    list.innerHTML = localData.resources
        .map(
            (r) => `
    <div class="admin-list-item" id="res-row-${r.id}">
      <div class="admin-list-info">
        <div class="admin-list-title">${r.title}</div>
        <div class="admin-list-meta">${r.category} · ${r.tags.join(' · ')}</div>
      </div>
      <div class="admin-list-actions">
        <button class="btn-sm" onclick="openResourceForm(${r.id})">Edit</button>
        <button class="btn-sm btn-danger" onclick="confirmDelete('resource', ${r.id})">Delete</button>
      </div>
    </div>
  `,
        )
        .join('');
}

// ── TEAM LIST ─────────────────────────────────────────────────
function renderTeamList() {
    const list = document.getElementById('team-list');
    if (!list) return;
    list.innerHTML = localData.team
        .map(
            (m) => `
    <div class="admin-list-item" id="team-row-${m.id}">
      <img src="../${m.photo}" class="admin-list-thumb" alt=""
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 64 40\\'%3E%3Crect fill=\\'%231a1628\\' width=\\'64\\' height=\\'40\\'/%3E%3C/svg%3E'" style="border-radius:50%;width:40px;height:40px;object-fit:cover">
      <div class="admin-list-info">
        <div class="admin-list-title">${m.name}</div>
        <div class="admin-list-meta">${m.role}</div>
      </div>
      <div class="admin-list-actions">
        <button class="btn-sm" onclick="openTeamForm(${m.id})">Edit</button>
        <button class="btn-sm btn-danger" onclick="confirmDelete('team', ${m.id})">Delete</button>
      </div>
    </div>
  `,
        )
        .join('');
}

// ── MODAL HELPERS ─────────────────────────────────────────────
function openEditModal(html) {
    const content = document.getElementById('edit-modal-content');
    content.innerHTML = `<button class="modal-close" id="edit-modal-close">×</button>${html}`;
    document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
    document.getElementById('edit-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('open');
    document.body.style.overflow = '';
}

// Tags input helper
function buildTagsInput(id, initialTags = []) {
    let tags = [...initialTags];
    return {
        html: `
      <div class="tags-input-wrap" id="${id}-wrap">
        ${tags.map((t) => `<span class="tag-removable" data-tag="${t}">${t} <button type="button" onclick="removeTag('${id}','${t}')">×</button></span>`).join('')}
        <input type="text" class="tags-input-inner" id="${id}-input" placeholder="Add tag, press Enter…">
      </div>
    `,
        getWrap: () => document.getElementById(`${id}-wrap`),
        getTags: () => {
            const wrap = document.getElementById(`${id}-wrap`);
            return [...wrap.querySelectorAll('.tag-removable')].map((el) => el.dataset.tag);
        },
        init: () => {
            const input = document.getElementById(`${id}-input`);
            input?.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
                    e.preventDefault();
                    const tag = input.value.trim().replace(/,$/, '');
                    if (!tag) return;
                    const wrap = document.getElementById(`${id}-wrap`);
                    const span = document.createElement('span');
                    span.className = 'tag-removable';
                    span.dataset.tag = tag;
                    span.innerHTML = `${tag} <button type="button" onclick="removeTag('${id}','${tag}')">×</button>`;
                    wrap.insertBefore(span, input);
                    input.value = '';
                }
            });
        },
    };
}

window.removeTag = function (wrapperId, tag) {
    const wrap = document.getElementById(`${wrapperId}-wrap`);
    wrap?.querySelector(`.tag-removable[data-tag="${tag}"]`)?.remove();
};

// Image preview helper
function initImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    input?.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// ── PROJECT FORM ──────────────────────────────────────────────
function openProjectForm(id = null) {
    const p = id ? localData.projects.find((x) => x.id === id) : null;
    const tagsControl = buildTagsInput('proj-tags', p ? p.tags : []);
    const isEdit = !!p;

    openEditModal(`
    <h3>${isEdit ? 'Edit Project' : 'Add New Project'}</h3>
    <div class="form-group">
      <label>Project Image</label>
      <div class="image-upload-area">
        <div class="image-upload-icon">🖼</div>
        <div class="image-upload-label">Click or drag to upload image</div>
        <input type="file" id="proj-img-file" accept="image/*">
        <img id="proj-img-preview" class="image-upload-preview"
          ${p ? `src="../${p.image}" style="display:block"` : ''}>
      </div>
      ${isEdit ? `<p style="font-size:.75rem;color:var(--clr-text-3);margin-top:.4rem">Current: ${p.image}</p>` : ''}
    </div>
    <div class="form-group">
      <label for="proj-title">Title *</label>
      <input type="text" id="proj-title" class="form-input" value="${isEdit ? escAttr(p.title) : ''}" placeholder="Project title">
    </div>
    <div class="form-group">
      <label for="proj-short">Short Description *</label>
      <textarea id="proj-short" class="form-textarea" style="min-height:80px">${isEdit ? p.shortDesc : ''}</textarea>
    </div>
    <div class="form-group">
      <label for="proj-long">Full Description (Markdown supported)</label>
      <textarea id="proj-long" class="form-textarea" style="min-height:160px">${isEdit ? p.longDesc : ''}</textarea>
    </div>
    <div class="form-group">
      <label>Tags</label>
      ${tagsControl.html}
    </div>
    <div class="form-group">
      <label for="proj-link">External Link (GitHub, website…)</label>
      <input type="url" id="proj-link" class="form-input" value="${isEdit && p.link ? escAttr(p.link) : ''}" placeholder="https://…">
    </div>
    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
      <button class="btn btn-gold" onclick="saveProject(${id || 'null'})">
        ${isEdit ? 'Save Changes' : 'Add Project'}
      </button>
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
    </div>
  `);

    tagsControl.init();
    initImagePreview('proj-img-file', 'proj-img-preview');
}

window.saveProject = function (id) {
    const title = document.getElementById('proj-title').value.trim();
    const shortDesc = document.getElementById('proj-short').value.trim();
    if (!title || !shortDesc) {
        showToast('Title and short description are required.', 'error');
        return;
    }

    const tags = [...document.getElementById('proj-tags-wrap').querySelectorAll('.tag-removable')].map(
        (el) => el.dataset.tag,
    );
    const imgFile = document.getElementById('proj-img-file').files[0];

    const saveData = (imagePath) => {
        if (id) {
            const proj = localData.projects.find((p) => p.id === id);
            if (proj) {
                proj.title = title;
                proj.shortDesc = shortDesc;
                proj.longDesc = document.getElementById('proj-long').value.trim();
                proj.tags = tags;
                proj.link = document.getElementById('proj-link').value.trim();
                if (imagePath) proj.image = imagePath;
            }
        } else {
            const newId = Math.max(0, ...localData.projects.map((p) => p.id)) + 1;
            localData.projects.push({
                id: newId,
                title,
                shortDesc,
                longDesc: document.getElementById('proj-long').value.trim(),
                tags,
                link: document.getElementById('proj-link').value.trim(),
                featured: false,
                image: imagePath || 'assets/images/projects/placeholder.jpg',
                _newImageFile: imgFile || null,
            });
        }
        markChanged();
        renderProjectsList();
        renderOverview();
        closeEditModal();
        showToast(id ? 'Project updated.' : 'Project added. Push to publish.');
    };

    if (imgFile) {
        const fname = `assets/images/projects/${Date.now()}-${imgFile.name.replace(/\s+/g, '-')}`;
        // Store file ref for upload during push
        if (!window._pendingFiles) window._pendingFiles = {};
        window._pendingFiles[fname] = imgFile;
        saveData(fname);
    } else {
        saveData(null);
    }
};

// ── ARTICLE FORM ──────────────────────────────────────────────
function openArticleForm(id = null) {
    const a = id ? localData.articles.find((x) => x.id === id) : null;
    const tagsControl = buildTagsInput('art-tags', a ? a.tags : []);
    const isEdit = !!a;

    openEditModal(`
    <h3>${isEdit ? 'Edit Article' : 'Add New Article'}</h3>
    <div class="form-group">
      <label>Cover Image</label>
      <div class="image-upload-area">
        <div class="image-upload-icon">🖼</div>
        <div class="image-upload-label">Click to upload cover image</div>
        <input type="file" id="art-img-file" accept="image/*">
        <img id="art-img-preview" class="image-upload-preview"
          ${a ? `src="../${a.coverImage}" style="display:block"` : ''}>
      </div>
    </div>
    <div class="form-group">
      <label>Article Markdown File (.md)</label>
      <div class="md-upload-area">
        <div class="image-upload-icon">📄</div>
        <div class="image-upload-label">Click to upload .md file</div>
        <input type="file" id="art-md-file" accept=".md,text/markdown">
        <p class="md-upload-filename" id="art-md-filename">${isEdit ? a.mdFile : ''}</p>
      </div>
    </div>
    <div class="form-group">
      <label for="art-title">Title *</label>
      <input type="text" id="art-title" class="form-input" value="${isEdit ? escAttr(a.title) : ''}" placeholder="Article title">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label for="art-author">Author *</label>
        <input type="text" id="art-author" class="form-input" value="${isEdit ? escAttr(a.author) : ''}" placeholder="Author name">
      </div>
      <div class="form-group">
        <label for="art-date">Date *</label>
        <input type="date" id="art-date" class="form-input" value="${isEdit ? a.date : new Date().toISOString().split('T')[0]}">
      </div>
    </div>
    <div class="form-group">
      <label for="art-preview">Preview / Excerpt *</label>
      <textarea id="art-preview" class="form-textarea" style="min-height:80px">${isEdit ? a.preview : ''}</textarea>
    </div>
    <div class="form-group">
      <label>Tags</label>
      ${tagsControl.html}
    </div>
    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
      <button class="btn btn-gold" onclick="saveArticle(${id || 'null'})">
        ${isEdit ? 'Save Changes' : 'Add Article'}
      </button>
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
    </div>
  `);

    tagsControl.init();
    initImagePreview('art-img-file', 'art-img-preview');

    document.getElementById('art-md-file')?.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (f) {
            const el = document.getElementById('art-md-filename');
            el.textContent = f.name;
            el.style.display = 'block';
        }
    });
}

window.saveArticle = function (id) {
    const title = document.getElementById('art-title').value.trim();
    const author = document.getElementById('art-author').value.trim();
    const date = document.getElementById('art-date').value;
    const preview = document.getElementById('art-preview').value.trim();
    if (!title || !author || !date || !preview) {
        showToast('Please fill required fields.', 'error');
        return;
    }

    const tags = [...document.getElementById('art-tags-wrap').querySelectorAll('.tag-removable')].map(
        (el) => el.dataset.tag,
    );
    const imgFile = document.getElementById('art-img-file').files[0];
    const mdFile = document.getElementById('art-md-file').files[0];

    const fname = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    if (!window._pendingFiles) window._pendingFiles = {};

    let imgPath = null,
        mdPath = null;
    if (imgFile) {
        imgPath = `assets/articles/images/${fname}.${imgFile.name.split('.').pop()}`;
        window._pendingFiles[imgPath] = imgFile;
    }
    if (mdFile) {
        mdPath = `assets/articles/md/${fname}.md`;
        window._pendingFiles[mdPath] = mdFile;
    }

    if (id) {
        const art = localData.articles.find((a) => a.id === id);
        if (art) {
            art.title = title;
            art.author = author;
            art.date = date;
            art.preview = preview;
            art.tags = tags;
            if (imgPath) art.coverImage = imgPath;
            if (mdPath) art.mdFile = mdPath;
        }
    } else {
        const newId = Math.max(0, ...localData.articles.map((a) => a.id)) + 1;
        localData.articles.push({
            id: newId,
            title,
            author,
            date,
            preview,
            tags,
            featured: false,
            coverImage: imgPath || 'assets/articles/images/placeholder.jpg',
            mdFile: mdPath || `assets/articles/md/${fname}.md`,
        });
    }

    markChanged();
    renderArticlesList();
    renderOverview();
    closeEditModal();
    showToast(id ? 'Article updated.' : 'Article added. Push to publish.');
};

// ── RESOURCE FORM ─────────────────────────────────────────────
function openResourceForm(id = null) {
    const r = id ? localData.resources.find((x) => x.id === id) : null;
    const tagsControl = buildTagsInput('res-tags', r ? r.tags : []);
    const isEdit = !!r;
    const cats = ['Video', 'Course', 'Book', 'Platform', 'Research', 'Notes', 'Tool', 'Other'];

    openEditModal(`
    <h3>${isEdit ? 'Edit Resource' : 'Add New Resource'}</h3>
    <div class="form-group">
      <label for="res-title">Title *</label>
      <input type="text" id="res-title" class="form-input" value="${isEdit ? escAttr(r.title) : ''}" placeholder="Resource name">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label for="res-category">Category *</label>
        <select id="res-category" class="form-select">
          ${cats.map((c) => `<option ${isEdit && r.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="res-link">URL *</label>
        <input type="url" id="res-link" class="form-input" value="${isEdit ? escAttr(r.link) : ''}" placeholder="https://…">
      </div>
    </div>
    <div class="form-group">
      <label for="res-desc">Description *</label>
      <textarea id="res-desc" class="form-textarea" style="min-height:100px">${isEdit ? r.description : ''}</textarea>
    </div>
    <div class="form-group">
      <label>Tags</label>
      ${tagsControl.html}
    </div>
    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
      <button class="btn btn-gold" onclick="saveResource(${id || 'null'})">
        ${isEdit ? 'Save Changes' : 'Add Resource'}
      </button>
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
    </div>
  `);

    tagsControl.init();
}

window.saveResource = function (id) {
    const title = document.getElementById('res-title').value.trim();
    const link = document.getElementById('res-link').value.trim();
    const description = document.getElementById('res-desc').value.trim();
    const category = document.getElementById('res-category').value;
    if (!title || !link || !description) {
        showToast('Please fill required fields.', 'error');
        return;
    }

    const tags = [...document.getElementById('res-tags-wrap').querySelectorAll('.tag-removable')].map(
        (el) => el.dataset.tag,
    );

    if (id) {
        const res = localData.resources.find((r) => r.id === id);
        if (res) Object.assign(res, { title, link, description, category, tags });
    } else {
        const newId = Math.max(0, ...localData.resources.map((r) => r.id)) + 1;
        localData.resources.push({ id: newId, title, link, description, category, tags });
    }

    markChanged();
    renderResourcesList();
    renderOverview();
    closeEditModal();
    showToast(id ? 'Resource updated.' : 'Resource added. Push to publish.');
};

// ── TEAM FORM ─────────────────────────────────────────────────
function openTeamForm(id = null) {
    const m = id ? localData.team.find((x) => x.id === id) : null;
    const isEdit = !!m;

    openEditModal(`
    <h3>${isEdit ? 'Edit Team Member' : 'Add Team Member'}</h3>
    <div class="form-group">
      <label>Photo</label>
      <div class="image-upload-area">
        <div class="image-upload-icon">👤</div>
        <div class="image-upload-label">Click to upload photo</div>
        <input type="file" id="team-img-file" accept="image/*">
        <img id="team-img-preview" class="image-upload-preview"
          ${m ? `src="../${m.photo}" style="display:block"` : ''}>
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label for="team-name">Name *</label>
        <input type="text" id="team-name" class="form-input" value="${isEdit ? escAttr(m.name) : ''}" placeholder="Full name">
      </div>
      <div class="form-group">
        <label for="team-role">Role *</label>
        <input type="text" id="team-role" class="form-input" value="${isEdit ? escAttr(m.role) : ''}" placeholder="e.g. President">
      </div>
    </div>
    <div class="form-group">
      <label for="team-bio">Bio *</label>
      <textarea id="team-bio" class="form-textarea">${isEdit ? m.bio : ''}</textarea>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label for="team-email">Email Address</label>
        <input type="email" id="team-email" class="form-input" value="${isEdit && m.socials?.email ? escAttr(m.socials.email) : ''}" placeholder="name@celestisconclave.org">
      </div>
      <div class="form-group">
        <label for="team-phone">Phone Number</label>
        <input type="tel" id="team-phone" class="form-input" value="${isEdit && m.socials?.phone ? escAttr(m.socials.phone) : ''}" placeholder="+91 98765 43210">
      </div>
    </div>
    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
      <button class="btn btn-gold" onclick="saveTeamMember(${id || 'null'})">
        ${isEdit ? 'Save Changes' : 'Add Member'}
      </button>
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
    </div>
  `);

    initImagePreview('team-img-file', 'team-img-preview');
}

window.saveTeamMember = function (id) {
    const name = document.getElementById('team-name').value.trim();
    const role = document.getElementById('team-role').value.trim();
    const bio = document.getElementById('team-bio').value.trim();
    if (!name || !role || !bio) {
        showToast('Name, role and bio are required.', 'error');
        return;
    }

    const imgFile = document.getElementById('team-img-file').files[0];
    let photoPath = null;

    if (imgFile) {
        photoPath = `assets/images/team/${name.toLowerCase().replace(/\s+/g, '-')}.${imgFile.name.split('.').pop()}`;
        if (!window._pendingFiles) window._pendingFiles = {};
        window._pendingFiles[photoPath] = imgFile;
    }

    const socials = {
        email: document.getElementById('team-email').value.trim() || null,
        phone: document.getElementById('team-phone').value.trim() || null,
    };

    if (id) {
        const mem = localData.team.find((m) => m.id === id);
        if (mem) {
            mem.name = name;
            mem.role = role;
            mem.bio = bio;
            mem.socials = socials;
            if (photoPath) mem.photo = photoPath;
        }
    } else {
        const newId = Math.max(0, ...localData.team.map((m) => m.id)) + 1;
        localData.team.push({
            id: newId,
            name,
            role,
            bio,
            socials,
            photo: photoPath || 'assets/images/team/placeholder.jpg',
        });
    }

    markChanged();
    renderTeamList();
    renderOverview();
    closeEditModal();
    showToast(id ? 'Member updated.' : 'Member added. Push to publish.');
};

// ── DELETE CONFIRM ────────────────────────────────────────────
window.confirmDelete = function (type, id) {
    const titles = {
        project: 'Delete Project',
        article: 'Delete Article',
        resource: 'Delete Resource',
        team: 'Remove Team Member',
    };
    document.getElementById('confirm-title').textContent = titles[type] || 'Delete item?';
    document.getElementById('confirm-modal').classList.add('open');

    const ok = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    const close = document.getElementById('confirm-modal-close');

    const cleanup = () => {
        document.getElementById('confirm-modal').classList.remove('open');
        ok.replaceWith(ok.cloneNode(true));
        cancel.replaceWith(cancel.cloneNode(true));
        close.replaceWith(close.cloneNode(true));
    };

    document.getElementById('confirm-ok').addEventListener('click', () => {
        if (type === 'project') localData.projects = localData.projects.filter((x) => x.id !== id);
        if (type === 'article') localData.articles = localData.articles.filter((x) => x.id !== id);
        if (type === 'resource') localData.resources = localData.resources.filter((x) => x.id !== id);
        if (type === 'team') localData.team = localData.team.filter((x) => x.id !== id);
        markChanged();
        renderProjectsList();
        renderArticlesList();
        renderResourcesList();
        renderTeamList();
        renderOverview();
        cleanup();
        showToast('Item deleted locally. Push to publish removal.');
    });

    document.getElementById('confirm-cancel').addEventListener('click', cleanup);
    document.getElementById('confirm-modal-close').addEventListener('click', cleanup);
};

// ── GITHUB PUSH ───────────────────────────────────────────────
function initPushChanges() {
    document.getElementById('push-btn')?.addEventListener('click', async () => {
        const pat = document.getElementById('gh-pat').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const branch = document.getElementById('gh-branch').value.trim() || 'main';

        if (!pat || !repo) {
            showToast('Please enter your GitHub PAT and repository (owner/repo).', 'error');
            return;
        }

        if (!pendingChanges) {
            showToast('No pending changes to push.', 'info');
            return;
        }

        const confirmed = confirm(
            `This will push changes to ${repo} on branch "${branch}".\n\n` +
                `The following will be updated:\n` +
                `• js/data.js — site content\n` +
                (window._pendingFiles ? `• ${Object.keys(window._pendingFiles).length} media file(s)\n` : '') +
                `\nProceed?`,
        );
        if (!confirmed) return;

        const btn = document.getElementById('push-btn');
        btn.textContent = '↑ Pushing…';
        btn.disabled = true;

        try {
            await pushToGitHub(pat, repo, branch);
            pendingChanges = false;
            window._pendingFiles = {};
            updatePendingSummary();
            showToast('Changes pushed to GitHub successfully!');
        } catch (err) {
            showToast(`Push failed: ${err.message}`, 'error');
            console.error(err);
        } finally {
            btn.textContent = '↑ Push Changes';
            btn.disabled = false;
        }
    });
}

async function pushToGitHub(pat, repo, branch) {
    const base = `https://api.github.com/repos/${repo}`;
    const headers = {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    };

    async function getFileSha(path) {
        try {
            const r = await fetch(`${base}/contents/${path}?ref=${branch}`, { headers });
            if (r.ok) {
                const d = await r.json();
                return d.sha;
            }
        } catch {}
        return null;
    }

    async function pushFile(path, content, message) {
        const sha = await getFileSha(path);
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch,
        };
        if (sha) body.sha = sha;
        const r = await fetch(`${base}/contents/${path}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const err = await r.json();
            throw new Error(err.message || 'GitHub API error');
        }
        return r.json();
    }

    async function pushBinaryFile(path, file, message) {
        const sha = await getFileSha(path);
        const arrayBuf = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        const body = { message, content: b64, branch };
        if (sha) body.sha = sha;
        const r = await fetch(`${base}/contents/${path}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const err = await r.json();
            throw new Error(err.message || 'GitHub API error (binary)');
        }
        return r.json();
    }

    // Build the updated data.js content
    const dataJs = buildDataJs();
    await pushFile('js/data.js', dataJs, 'CMS: update site data');

    // Push any pending media files
    if (window._pendingFiles) {
        for (const [path, file] of Object.entries(window._pendingFiles)) {
            await pushBinaryFile(path, file, `CMS: upload ${path.split('/').pop()}`);
        }
    }
}

function buildDataJs() {
    return `// ============================================================
// CELESTIS CONCLAVE — SITE DATA STORE
// Auto-generated by Admin CMS — ${new Date().toISOString()}
// ============================================================

const SITE_DATA = ${JSON.stringify(localData, null, 2)};

if (typeof module !== 'undefined') module.exports = SITE_DATA;
`;
}

// ── UTILITY ───────────────────────────────────────────────────
function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
