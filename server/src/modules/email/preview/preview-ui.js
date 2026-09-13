export function renderPreviewDashboardHtml({
  templates,
  selectedTemplateKey,
  _selectedTemplateMeta,
  renderedHtml,
  subject,
  preheader,
}) {
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
    /* PREVIEW VIEWPORT */
    .viewport-canvas {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      padding: 30px;
      background: #030712;
      transition: background 0.2s;
    }
    .viewport-canvas.dark-mode {
      background: #000000;
    }
    .preview-frame-wrapper {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      transition: all 0.3s ease;
      height: fit-content;
      min-height: 100%;
      border: 1px solid #1f2937;
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
        <div class="brand-sub">${templates.length} Active Templates</div>
      </div>
    </div>
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="Search templates (e.g. order, otp, return)...">
    </div>
    <div class="category-tabs">
      <button class="tab-btn active" data-filter="all">All</button>
      <button class="tab-btn" data-filter="customer">Customer</button>
      <button class="tab-btn" data-filter="seller">Seller</button>
      <button class="tab-btn" data-filter="admin">Admin</button>
      <button class="tab-btn" data-filter="logistics">Logistics</button>
      <button class="tab-btn" data-filter="deliveryPartner">Partner</button>
      <button class="tab-btn" data-filter="system">System</button>
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
        <button class="btn" id="btnDarkModeToggle">Toggle Dark Preview</button>
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
          Dispatches template <strong>${selectedTemplateKey}</strong> with sample fixtures to your real inbox.
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

    // Filter Logic
    let currentFilter = 'all';
    let currentSearch = '';

    function filterTemplates() {
      templateItems.forEach(item => {
        const role = item.dataset.role;
        const key = item.dataset.key.toLowerCase();
        const text = item.innerText.toLowerCase();

        const matchesFilter = currentFilter === 'all' || role.toLowerCase() === currentFilter.toLowerCase();
        const matchesSearch = !currentSearch || key.includes(currentSearch) || text.includes(currentSearch);

        item.style.display = (matchesFilter && matchesSearch) ? 'block' : 'none';
      });
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
        filterTemplates();
      });
    });

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

    // Dark preview toggle
    document.getElementById('btnDarkModeToggle').addEventListener('click', () => {
      viewportCanvas.classList.toggle('dark-mode');
    });

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
            templateKey: '${selectedTemplateKey}',
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
