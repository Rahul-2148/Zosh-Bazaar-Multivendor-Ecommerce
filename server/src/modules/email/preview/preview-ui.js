const DARK_PREVIEW_INJECTED_CSS = `
  :root {
    color-scheme: dark !important;
    supported-color-schemes: dark !important;
  }
  body, .email-canvas, table.email-canvas {
    background-color: #0b1120 !important;
    color: #f8fafc !important;
  }
  .email-card, table.email-container {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7) !important;
  }
  td.email-content {
    background-color: #1e293b !important;
  }

  /* OTP Component dark mode styles */
  .otp-card {
    background-color: #0f172a !important;
    border: 2px solid #2563eb !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
  }
  .otp-badge {
    background-color: #172554 !important;
    color: #93c5fd !important;
    border: 1px solid #1d4ed8 !important;
  }
  .otp-token-box {
    background-color: #1e293b !important;
    border: 2px solid #3b82f6 !important;
    box-shadow: 0 0 24px rgba(59, 130, 246, 0.35) !important;
  }
  .otp-digits {
    color: #60a5fa !important;
    text-shadow: 0 0 16px rgba(96, 165, 250, 0.5) !important;
  }
  .otp-footer-text {
    color: #93c5fd !important;
  }

  /* Invert or adapt all light cards, boxes, and summary tables */
  table[style*="background-color: #ffffff"],
  table[style*="background-color:#ffffff"],
  table[style*="background-color: #f8fafc"],
  table[style*="background-color:#f8fafc"],
  table[style*="background: #f8fafc"],
  td[style*="background-color: #ffffff"],
  td[style*="background-color:#ffffff"],
  td[style*="background-color: #f8fafc"],
  td[style*="background-color:#f8fafc"],
  div[style*="background-color: #ffffff"],
  div[style*="background-color:#ffffff"],
  div[style*="background-color: #f8fafc"],
  div[style*="background-color:#f8fafc"],
  div[style*="background: #f8fafc"] {
    background-color: #1e293b !important;
    border-color: #334155 !important;
  }

  /* Subtle callouts, highlight boxes */
  table[style*="background-color: #f1f5f9"],
  table[style*="background-color:#f1f5f9"],
  td[style*="background-color: #f1f5f9"],
  td[style*="background-color:#f1f5f9"],
  div[style*="background-color: #f1f5f9"],
  div[style*="background-color:#f1f5f9"],
  div[style*="background: #f1f5f9"] {
    background-color: #0f172a !important;
    border-color: #334155 !important;
  }

  /* Alerts: Red / Danger */
  div[style*="background: #fef2f2"],
  table[style*="background-color: #fef2f2"] {
    background-color: #450a0a !important;
    border-color: #991b1b !important;
    color: #fca5a5 !important;
  }

  /* Alerts: Amber / Warning */
  div[style*="background: #fffbeb"],
  table[style*="background-color: #fffbeb"] {
    background-color: #451a03 !important;
    border-color: #92400e !important;
    color: #fde68a !important;
  }

  /* Headings: Pristine White */
  h1, h2, h3, h4, h5, h6,
  .dark-text-main {
    color: #ffffff !important;
  }

  /* High-Contrast Readable Body Text */
  p,
  .dark-text-muted {
    color: #e2e8f0 !important;
  }

  strong, b {
    color: #ffffff !important;
  }

  /* Muted metadata */
  span[style*="color: #64748b"],
  span[style*="color:#64748b"],
  p[style*="color: #64748b"],
  td[style*="color: #64748b"] {
    color: #94a3b8 !important;
  }

  /* Borders */
  *[style*="border: 1px solid #e2e8f0"],
  *[style*="border:1px solid #e2e8f0"],
  *[style*="border: 1px solid #e5e7eb"],
  *[style*="border:1px solid #e5e7eb"],
  *[style*="border-top: 1px solid #e2e8f0"],
  *[style*="border-bottom: 1px solid #e2e8f0"] {
    border-color: #334155 !important;
  }
`;

export function renderPreviewDashboardHtml({
  templates,
  selectedTemplateKey,
  _selectedTemplateMeta,
  renderedHtml,
  subject,
  preheader,
}) {
  const counts = {
    all: templates.length,
    customer: templates.filter((t) => t.recipientRole === "customer").length,
    seller: templates.filter((t) => t.recipientRole === "seller").length,
    admin: templates.filter((t) => t.recipientRole === "admin").length,
    logistics: templates.filter((t) => t.recipientRole === "logistics").length,
    deliveryPartner: templates.filter((t) => t.recipientRole === "deliveryPartner").length,
    system: templates.filter((t) => t.recipientRole === "system").length,
  };

  const safeTemplates = JSON.stringify(
    templates.map((t) => ({
      key: t.templateKey,
      role: t.recipientRole,
      category: t.category,
      subject: t.subject,
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zosh Bazaar — Transactional Email Preview Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-border: #1f2937;
      --surface-hover: #1e293b;
      --primary: #f97316;
      --primary-hover: #ea580c;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --sidebar-width: 380px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    /* SIDEBAR */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--surface);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      height: 100%;
      flex-shrink: 0;
    }
    .brand-header {
      padding: 20px;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-badge {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .search-box {
      padding: 14px 20px;
      border-bottom: 1px solid var(--surface-border);
    }
    .search-input {
      width: 100%;
      background: #1f2937;
      border: 1px solid #374151;
      color: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
    }
    .category-tabs {
      display: flex;
      gap: 6px;
      padding: 10px 16px;
      overflow-x: auto;
      border-bottom: 1px solid var(--surface-border);
      scrollbar-width: none;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid #374151;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover {
      background: #374151;
      color: #fff;
      border-color: #4b5563;
    }
    .tab-count {
      font-size: 10px;
      font-weight: 700;
      opacity: 0.75;
      margin-left: 4px;
      padding: 1px 5px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.1);
    }
    .tab-btn.active .tab-count {
      background: rgba(249, 115, 22, 0.25);
      color: #fb923c;
      opacity: 1;
    }
    .template-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    .template-item {
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: 4px;
      display: block;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }
    .template-item:hover {
      background: var(--surface-hover);
    }
    .template-item.active {
      background: rgba(249, 115, 22, 0.12);
      border-color: rgba(249, 115, 22, 0.4);
    }
    .item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .item-key {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 240px;
    }
    .role-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .role-customer { background: #0284c7; color: #fff; }
    .role-seller { background: #7c3aed; color: #fff; }
    .role-admin { background: #dc2626; color: #fff; }
    .role-logistics { background: #059669; color: #fff; }
    .role-deliveryPartner { background: #d97706; color: #fff; }
    .role-system { background: #4b5563; color: #fff; }
    .item-subject {
      font-size: 13px;
      font-weight: 600;
      color: #e5e7eb;
      line-height: 1.3;
    }
    /* MAIN PREVIEW AREA */
    .preview-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #030712;
    }
    .preview-toolbar {
      background: var(--surface);
      border-bottom: 1px solid var(--surface-border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .meta-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .subject-line {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .preheader-line {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .btn {
      background: #1f2937;
      border: 1px solid #374151;
      color: #e5e7eb;
      font-size: 12px;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #374151;
      color: #fff;
    }
    .btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .btn-group {
      display: flex;
      border: 1px solid #374151;
      border-radius: 6px;
      overflow: hidden;
    }
    .btn-group .btn {
      border: none;
      border-radius: 0;
      border-right: 1px solid #374151;
    }
    .btn-group .btn:last-child {
      border-right: none;
    }
    .btn-group .btn.active {
      background: #374151;
      color: var(--primary);
    }
    .btn.dark-active {
      background: #4f46e5;
      border-color: #6366f1;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
    }
    /* PREVIEW VIEWPORT */
    .viewport-canvas {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      padding: 30px;
      background: #cbd5e1;
      transition: background 0.3s ease;
    }
    .viewport-canvas.dark-mode {
      background: #020617;
    }
    .preview-frame-wrapper {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      height: fit-content;
      min-height: 100%;
      border: 1px solid #94a3b8;
    }
    .preview-frame-wrapper.dark-mode {
      background: #0f172a;
      border-color: #334155;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08);
    }
    .preview-frame-wrapper.desktop {
      width: 650px;
    }
    .preview-frame-wrapper.mobile {
      width: 375px;
    }
    .preview-frame-wrapper.tablet {
      width: 520px;
    }
    iframe {
      width: 100%;
      height: 900px;
      border: none;
      display: block;
      background: #ffffff;
      transition: background 0.3s ease;
    }
    iframe.dark-mode {
      background: #0f172a;
    }
    /* MODAL */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 999;
      align-items: center;
      justify-content: center;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-card {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 12px;
      width: 600px;
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }
    .raw-code {
      background: #030712;
      color: #a7f3d0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 16px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 500px;
      overflow-y: auto;
    }
    .send-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      background: #1f2937;
      border: 1px solid #374151;
      color: #fff;
      margin-top: 8px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="brand-header">
      <div class="brand-badge">ZB</div>
      <div>
        <div class="brand-title">Email Studio</div>
        <div class="brand-sub" id="templateCountSub">${templates.length} Active Templates</div>
      </div>
    </div>
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="Search templates (e.g. order, otp, return)...">
    </div>
    <div class="category-tabs">
      <button class="tab-btn active" data-filter="all">All <span class="tab-count">${counts.all}</span></button>
      <button class="tab-btn" data-filter="customer">Customer <span class="tab-count">${counts.customer}</span></button>
      <button class="tab-btn" data-filter="seller">Seller <span class="tab-count">${counts.seller}</span></button>
      <button class="tab-btn" data-filter="admin">Admin <span class="tab-count">${counts.admin}</span></button>
      <button class="tab-btn" data-filter="logistics">Logistics <span class="tab-count">${counts.logistics}</span></button>
      <button class="tab-btn" data-filter="deliveryPartner">Partner <span class="tab-count">${counts.deliveryPartner}</span></button>
      <button class="tab-btn" data-filter="system">System <span class="tab-count">${counts.system}</span></button>
    </div>
    <div class="template-list" id="templateList">
      ${templates
        .map((t) => {
          const isActive = t.templateKey === selectedTemplateKey ? "active" : "";
          return `
            <a href="/dev/emails?template=${t.templateKey}" class="template-item ${isActive}" data-role="${t.recipientRole}" data-key="${t.templateKey}">
              <div class="item-header">
                <span class="item-key">${t.templateKey}</span>
                <span class="role-badge role-${t.recipientRole}">${t.recipientRole}</span>
              </div>
              <div class="item-subject">${t.subject}</div>
            </a>
          `;
        })
        .join("")}
    </div>
  </aside>

  <!-- PREVIEW CONTAINER -->
  <main class="preview-container">
    <header class="preview-toolbar">
      <div class="meta-details">
        <div class="subject-line">
          <span>${subject || "No Subject"}</span>
        </div>
        <div class="preheader-line">
          Preheader: ${preheader || "None specified"}
        </div>
      </div>
      <div class="controls">
        <div class="btn-group">
          <button class="btn active" id="btnDesktop" title="Desktop View (650px)">Desktop</button>
          <button class="btn" id="btnTablet" title="Tablet View (520px)">Tablet</button>
          <button class="btn" id="btnMobile" title="Mobile View (375px)">Mobile</button>
        </div>
        <button class="btn" id="btnDarkModeToggle" title="Toggle email dark mode preview">🌙 Dark Preview: OFF</button>
        <button class="btn" id="btnViewHtml">Inspect HTML</button>
        <button class="btn btn-primary" id="btnSendTest">Send Test</button>
      </div>
    </header>

    <div class="viewport-canvas" id="viewportCanvas">
      <div class="preview-frame-wrapper desktop" id="frameWrapper">
        <iframe id="previewIframe" srcdoc="${renderedHtml.replace(/"/g, "&quot;")}"></iframe>
      </div>
    </div>
  </main>

  <!-- INSPECT HTML MODAL -->
  <div class="modal-backdrop" id="htmlModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Compiled Safe Email HTML</h3>
        <button class="btn" id="btnCloseHtmlModal">Close</button>
      </div>
      <div class="modal-body">
        <pre class="raw-code" id="rawCodePre">${renderedHtml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      </div>
    </div>
  </div>

  <!-- SEND TEST MODAL -->
  <div class="modal-backdrop" id="sendModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Send Live Email Test</h3>
        <button class="btn" id="btnCloseSendModal">Cancel</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 13px; color: #9ca3af; margin-bottom: 12px;">
          Dispatches template <strong id="modalSelectedTemplateKey">${selectedTemplateKey}</strong> with sample fixtures to your real inbox.
        </p>
        <label style="font-size: 12px; font-weight: 600; text-transform: uppercase;">Recipient Email Address</label>
        <input type="email" id="testRecipientEmail" class="send-input" placeholder="developer@yourcompany.com" required>
        <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;" id="btnSubmitTestSend">
          Dispatch Test Email
        </button>
        <div id="testSendFeedback" style="margin-top: 12px; font-size: 13px; text-align: center;"></div>
      </div>
    </div>
  </div>

  <script>
    const templates = ${safeTemplates};
    const searchInput = document.getElementById('searchInput');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const templateItems = document.querySelectorAll('.template-item');
    const frameWrapper = document.getElementById('frameWrapper');
    const viewportCanvas = document.getElementById('viewportCanvas');

    let currentSelectedKey = "${selectedTemplateKey}";

    // Filter Logic with URL & LocalStorage Persistence
    const urlParams = new URLSearchParams(window.location.search);
    const savedFilter = localStorage.getItem('zosh_email_preview_filter');
    const urlRole = urlParams.get('role');

    // Determine initial active filter
    let currentFilter = 'all';
    if (urlRole) {
      currentFilter = urlRole;
    } else if (savedFilter) {
      currentFilter = savedFilter;
    } else {
      // If template belongs to a specific role, auto-focus that role
      const initialActiveItem = document.querySelector('.template-item.active');
      if (initialActiveItem && initialActiveItem.dataset.role) {
        currentFilter = initialActiveItem.dataset.role;
      }
    }

    let currentSearch = '';

    function syncFilterUI() {
      tabBtns.forEach(btn => {
        if (btn.dataset.filter.toLowerCase() === currentFilter.toLowerCase()) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      filterTemplates();
    }

    function filterTemplates() {
      let visibleCount = 0;
      templateItems.forEach(item => {
        const role = item.dataset.role;
        const key = item.dataset.key.toLowerCase();
        const text = item.innerText.toLowerCase();

        const matchesFilter = currentFilter === 'all' || role.toLowerCase() === currentFilter.toLowerCase();
        const matchesSearch = !currentSearch || key.includes(currentSearch) || text.includes(currentSearch);

        const isVisible = matchesFilter && matchesSearch;
        item.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
      });

      const countEl = document.getElementById('templateCountSub');
      if (countEl) {
        const roleLabels = {
          all: 'All Roles',
          customer: 'Customer',
          seller: 'Seller',
          admin: 'Admin',
          logistics: 'Logistics',
          deliveryPartner: 'Partner',
          system: 'System',
        };
        const roleLabel = roleLabels[currentFilter] || (currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1));
        if (currentFilter === 'all' && !currentSearch) {
          countEl.textContent = templates.length + ' Active Templates';
        } else if (currentSearch) {
          countEl.textContent = visibleCount + ' of ' + templates.length + ' (' + roleLabel + ' Matching)';
        } else {
          countEl.textContent = visibleCount + ' Active Templates (' + roleLabel + ')';
        }
      }
    }

    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      filterTemplates();
    });

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        localStorage.setItem('zosh_email_preview_filter', currentFilter);

        const url = new URL(window.location);
        if (currentFilter !== 'all') {
          url.searchParams.set('role', currentFilter);
        } else {
          url.searchParams.delete('role');
        }
        window.history.replaceState({ template: currentSelectedKey, role: currentFilter }, '', url);

        filterTemplates();
      });
    });

    // Seamless SPA Template Loading (Zero Page Reload - Preserves Filter, Search & Scroll!)
    async function selectTemplate(key, pushHistory = true) {
      if (!key) return;
      currentSelectedKey = key;

      templateItems.forEach(item => {
        if (item.dataset.key === key) {
          item.classList.add('active');
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          item.classList.remove('active');
        }
      });

      const modalKeyEl = document.getElementById('modalSelectedTemplateKey');
      if (modalKeyEl) modalKeyEl.textContent = key;

      try {
        const res = await fetch('/dev/emails/api/render/' + encodeURIComponent(key));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (data.html) {
          previewIframe.srcdoc = data.html;
          const subjectSpan = document.querySelector('.subject-line span');
          if (subjectSpan) subjectSpan.textContent = data.subject || "No Subject";
          const preheaderEl = document.querySelector('.preheader-line');
          if (preheaderEl) preheaderEl.textContent = "Preheader: " + (data.preheader || "None specified");
          const rawCodePre = document.getElementById('rawCodePre');
          if (rawCodePre) rawCodePre.textContent = data.html;
        }
      } catch (err) {
        console.error('[EmailStudio] Failed to load template:', err);
      }

      if (pushHistory) {
        const url = new URL(window.location);
        url.searchParams.set('template', key);
        if (currentFilter && currentFilter !== 'all') {
          url.searchParams.set('role', currentFilter);
        } else {
          url.searchParams.delete('role');
        }
        window.history.pushState({ template: key, role: currentFilter }, '', url);
      }
    }

    templateItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const key = item.dataset.key;
        selectTemplate(key, true);
      });
    });

    // Browser Back / Forward History Navigation
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const template = params.get('template');
      const role = params.get('role') || 'all';

      if (role !== currentFilter) {
        currentFilter = role;
        syncFilterUI();
      }

      if (template && template !== currentSelectedKey) {
        selectTemplate(template, false);
      }
    });

    // Run initial filter sync
    syncFilterUI();

    // Viewport switching
    document.getElementById('btnDesktop').addEventListener('click', function() {
      setActiveViewportBtn(this);
      frameWrapper.className = 'preview-frame-wrapper desktop';
    });
    document.getElementById('btnTablet').addEventListener('click', function() {
      setActiveViewportBtn(this);
      frameWrapper.className = 'preview-frame-wrapper tablet';
    });
    document.getElementById('btnMobile').addEventListener('click', function() {
      setActiveViewportBtn(this);
      frameWrapper.className = 'preview-frame-wrapper mobile';
    });

    function setActiveViewportBtn(btn) {
      document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    // Dark preview engine
    const btnDarkModeToggle = document.getElementById('btnDarkModeToggle');
    const previewIframe = document.getElementById('previewIframe');
    let isDarkMode = localStorage.getItem('zosh_email_dark_preview') === 'true';

    const DARK_MODE_STYLE_ID = 'zosh-dark-preview-styles';
    const darkStyles = ${JSON.stringify(DARK_PREVIEW_INJECTED_CSS)};

    function applyDarkPreview() {
      if (isDarkMode) {
        btnDarkModeToggle.classList.add('dark-active');
        btnDarkModeToggle.innerHTML = '🌙 Dark Preview: ON';
        viewportCanvas.classList.add('dark-mode');
        frameWrapper.classList.add('dark-mode');
        if (previewIframe) previewIframe.classList.add('dark-mode');
      } else {
        btnDarkModeToggle.classList.remove('dark-active');
        btnDarkModeToggle.innerHTML = '☀️ Dark Preview: OFF';
        viewportCanvas.classList.remove('dark-mode');
        frameWrapper.classList.remove('dark-mode');
        if (previewIframe) previewIframe.classList.remove('dark-mode');
      }

      try {
        const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
        if (iframeDoc && iframeDoc.head) {
          let styleTag = iframeDoc.getElementById(DARK_MODE_STYLE_ID);
          if (isDarkMode) {
            if (!styleTag) {
              styleTag = iframeDoc.createElement('style');
              styleTag.id = DARK_MODE_STYLE_ID;
              styleTag.type = 'text/css';
              styleTag.textContent = darkStyles;
              iframeDoc.head.appendChild(styleTag);
            }
            if (iframeDoc.body) iframeDoc.body.classList.add('dark-mode');
          } else {
            if (styleTag) {
              styleTag.remove();
            }
            if (iframeDoc.body) iframeDoc.body.classList.remove('dark-mode');
          }
        }
      } catch (e) {
        console.warn('Unable to access iframe content document:', e);
      }
    }

    btnDarkModeToggle.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      localStorage.setItem('zosh_email_dark_preview', isDarkMode ? 'true' : 'false');
      applyDarkPreview();
    });

    previewIframe.addEventListener('load', () => {
      applyDarkPreview();
    });

    // Run after initial mount
    setTimeout(applyDarkPreview, 100);

    // Modals
    const htmlModal = document.getElementById('htmlModal');
    const sendModal = document.getElementById('sendModal');

    document.getElementById('btnViewHtml').addEventListener('click', () => {
      htmlModal.classList.add('open');
    });
    document.getElementById('btnCloseHtmlModal').addEventListener('click', () => {
      htmlModal.classList.remove('open');
    });

    document.getElementById('btnSendTest').addEventListener('click', () => {
      sendModal.classList.add('open');
    });
    document.getElementById('btnCloseSendModal').addEventListener('click', () => {
      sendModal.classList.remove('open');
    });

    // Send Test Submission
    document.getElementById('btnSubmitTestSend').addEventListener('click', async () => {
      const email = document.getElementById('testRecipientEmail').value.trim();
      const feedback = document.getElementById('testSendFeedback');
      if (!email) {
        feedback.innerText = 'Please enter a valid recipient email.';
        feedback.style.color = '#ef4444';
        return;
      }

      feedback.innerText = 'Dispatching test email...';
      feedback.style.color = '#f97316';

      try {
        const response = await fetch('/dev/emails/api/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateKey: currentSelectedKey,
            recipient: email
          })
        });

        const data = await response.json();
        if (response.ok) {
          feedback.innerText = '✓ Sent successfully! Message ID: ' + data.messageId;
          feedback.style.color = '#10b981';
        } else {
          feedback.innerText = 'Error: ' + data.error;
          feedback.style.color = '#ef4444';
        }
      } catch (err) {
        feedback.innerText = 'Network error: ' + err.message;
        feedback.style.color = '#ef4444';
      }
    });
  </script>
</body>
</html>`;
}
