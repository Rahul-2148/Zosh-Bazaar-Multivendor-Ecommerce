/**
 * Zosh Bazaar — Enterprise Developer Portal UI Renderer
 * Ultra-smooth 120fps responsive architecture with collapsible icon-only sidebar,
 * tagda interactive API reference, multi-language code snippets, and zero framework overhead.
 */

export function renderDeveloperPortalHtml({ sections, openApiSpec }) {
  const specJsonStr = JSON.stringify(openApiSpec).replace(/</g, '\\u003c');
  const sectionsJsonStr = JSON.stringify(sections).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <script>
    (function() {
      try {
        var urlParams = new URLSearchParams(window.location.search);
        var themeParam = urlParams.get('theme');
        var savedTheme = localStorage.getItem('zb-docs-theme');
        var theme = 'dark';
        if (themeParam === 'light' || themeParam === 'dark') {
          theme = themeParam;
          localStorage.setItem('zb-docs-theme', themeParam);
        } else if (savedTheme === 'light' || savedTheme === 'dark') {
          theme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          theme = 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Zosh Bazaar — Enterprise Developer Portal & API Reference</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-canvas: #090d16;
      --bg-surface: #0f172a;
      --bg-surface-elevated: #1e293b;
      --bg-surface-hover: #334155;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.16);
      --border-glow: rgba(59, 130, 246, 0.4);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-faint: #64748b;
      --accent-primary: #3b82f6;
      --accent-primary-hover: #2563eb;
      --accent-primary-glow: rgba(59, 130, 246, 0.25);
      --accent-success: #10b981;
      --accent-warning: #f59e0b;
      --accent-danger: #ef4444;
      --accent-purple: #8b5cf6;
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --sidebar-width-expanded: 300px;
      --sidebar-width-mini: 68px;
      --sidebar-width: var(--sidebar-width-expanded);
      --header-height: 64px;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    [data-theme="light"] {
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f1f5f9;
      --bg-surface-hover: #e2e8f0;
      --border-subtle: #e2e8f0;
      --border-strong: #cbd5e1;
      --border-glow: rgba(37, 99, 235, 0.35);
      --text-main: #0f172a;
      --text-muted: #334155;
      --text-faint: #64748b;
      --accent-primary: #2563eb;
      --accent-primary-hover: #1d4ed8;
      --accent-primary-glow: rgba(37, 99, 235, 0.18);
      --accent-success: #059669;
      --accent-warning: #d97706;
      --accent-danger: #dc2626;
      --accent-purple: #7c3aed;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body {
      height: 100%;
      font-family: var(--font-sans);
      background: var(--bg-canvas);
      color: var(--text-main);
      font-size: 14.5px;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }

    /* Top Navigation Header */
    header.portal-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--header-height);
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 100;
      transition: background 0.25s var(--ease-smooth);
    }
    [data-theme="light"] header.portal-header {
      background: rgba(255, 255, 255, 0.9);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Sidebar toggle button (Mobile Drawer & Desktop Icon-Only toggle) */
    .btn-icon-toggle {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s var(--ease-smooth);
      flex-shrink: 0;
    }
    .btn-icon-toggle:hover {
      color: var(--text-main);
      border-color: var(--accent-primary);
      background: var(--bg-surface-hover);
      box-shadow: 0 0 12px var(--accent-primary-glow);
    }
    .btn-icon-toggle svg {
      transition: transform 0.25s var(--ease-smooth);
    }
    body.sidebar-mini .btn-icon-toggle svg {
      transform: rotate(180deg);
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
      flex-shrink: 0;
    }
    .brand-title {
      font-weight: 800;
      font-size: 17px;
      letter-spacing: -0.02em;
      background: linear-gradient(90deg, var(--text-main), var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    }
    .brand-tag {
      font-size: 11px;
      font-weight: 700;
      background: var(--accent-primary-glow);
      color: var(--accent-primary);
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--border-glow);
      white-space: nowrap;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .search-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 7px 14px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s var(--ease-smooth);
    }
    .search-trigger:hover {
      border-color: var(--accent-primary);
      color: var(--text-main);
      box-shadow: 0 0 16px var(--accent-primary-glow);
    }
    .search-shortcut {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
    }
    .btn-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-main);
      transition: all 0.2s var(--ease-smooth);
      white-space: nowrap;
    }
    .btn-header:hover {
      background: var(--bg-surface-hover);
      border-color: var(--accent-primary);
    }
    .btn-header.primary {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 4px 14px var(--accent-primary-glow);
    }
    .btn-header.primary:hover {
      background: var(--accent-primary-hover);
    }
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s var(--ease-smooth);
      flex-shrink: 0;
    }
    .theme-toggle:hover {
      color: var(--text-main);
      border-color: var(--accent-primary);
    }

    /* Layout Structure */
    .portal-container {
      display: flex;
      padding-top: var(--header-height);
      min-height: 100vh;
      position: relative;
    }

    /* Smooth 120fps Collapsible Sidebar */
    aside.portal-sidebar {
      width: var(--sidebar-width);
      position: fixed;
      top: var(--header-height);
      bottom: 0;
      left: 0;
      height: calc(100vh - var(--header-height));
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      overflow: hidden;
      padding: 0;
      z-index: 80;
      transition: width 0.26s var(--ease-smooth), transform 0.26s var(--ease-smooth);
      will-change: width, transform;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    #sidebarNavigation {
      flex: 1 1 0%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 10px;
      box-sizing: border-box;
    }

    /* Mobile Backdrop Overlay */
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 110;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s var(--ease-smooth);
    }
    .sidebar-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Sidebar Footer Toggle (Desktop) */
    .sidebar-footer {
      flex-shrink: 0;
      position: relative;
      width: 100%;
      background: var(--bg-surface);
      border-top: 1px solid var(--border-subtle);
      padding: 10px 12px;
      z-index: 2;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      transition: padding 0.26s var(--ease-smooth);
    }
    .sidebar-collapse-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      font-family: var(--font-sans);
      transition: all 0.2s var(--ease-smooth);
    }
    .sidebar-collapse-btn:hover {
      color: var(--text-main);
      border-color: var(--accent-primary);
      background: var(--bg-surface-hover);
    }
    .collapse-icon {
      transition: transform 0.26s var(--ease-smooth);
      flex-shrink: 0;
    }
    .collapse-label {
      flex: 1;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.2s var(--ease-smooth);
    }
    .collapse-shortcut {
      font-family: var(--font-mono);
      font-size: 10px;
      background: var(--bg-surface);
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }

    /* Collapsed (Mini / Icon-Only) State on Desktop */
    @media (min-width: 1025px) {
      body.sidebar-mini {
        --sidebar-width: var(--sidebar-width-mini);
      }
      body.sidebar-mini #sidebarNavigation {
        padding: 14px 6px;
      }
      body.sidebar-mini .nav-category-title {
        opacity: 0;
        height: 0;
        margin: 0;
        padding: 0;
        overflow: hidden;
        pointer-events: none;
      }
      body.sidebar-mini .nav-item {
        justify-content: center;
        padding: 0;
        margin: 6px auto;
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
      }
      body.sidebar-mini .nav-item-title,
      body.sidebar-mini .nav-badge {
        opacity: 0;
        max-width: 0;
        overflow: hidden;
        pointer-events: none;
        margin: 0;
        padding: 0;
        white-space: nowrap;
        display: none;
      }
      body.sidebar-mini .sidebar-footer {
        padding: 10px 8px;
      }
      body.sidebar-mini .sidebar-collapse-btn {
        justify-content: center;
        padding: 8px 0;
      }
      body.sidebar-mini .collapse-icon {
        transform: rotate(180deg);
      }
      body.sidebar-mini .collapse-label,
      body.sidebar-mini .collapse-shortcut {
        display: none;
      }
    }

    /* Floating Tooltip in Desktop Mini Mode */
    .floating-nav-tooltip {
      position: fixed;
      z-index: 999;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-strong);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5), 0 0 12px var(--accent-primary-glow);
      pointer-events: none;
      opacity: 0;
      transform: translateX(6px);
      transition: opacity 0.16s ease, transform 0.16s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .floating-nav-tooltip.visible {
      opacity: 1;
      transform: translateX(0);
    }
    .tooltip-badge {
      font-size: 10px;
      font-weight: 700;
      background: var(--accent-primary);
      color: #ffffff;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .nav-category {
      margin-bottom: 22px;
    }
    .nav-category-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 6px;
      padding-left: 10px;
      transition: opacity 0.2s ease;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s var(--ease-smooth);
      margin-bottom: 3px;
    }
    .nav-item:hover {
      background: var(--bg-surface-elevated);
      color: var(--text-main);
    }
    .nav-item.active {
      background: var(--accent-primary-glow);
      color: var(--accent-primary);
      font-weight: 600;
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }
    .nav-item-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-item-title {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 4px;
      background: var(--bg-surface-elevated);
      color: var(--text-faint);
      border: 1px solid var(--border-subtle);
    }
    .nav-item.active .nav-badge {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }

    /* Main Content Area */
    main.portal-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      min-width: 0;
      padding: 32px 40px 100px;
      max-width: 1400px;
      transition: margin-left 0.26s var(--ease-smooth);
      will-change: margin-left;
    }

    /* Content Typography & Components */
    .content-header {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .content-category {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .content-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
      line-height: 1.22;
    }

    /* Modern Markdown Typography & Structure */
    .markdown-body h1 { font-size: 24px; font-weight: 800; margin: 32px 0 14px; letter-spacing: -0.02em; }
    .markdown-body h2 { font-size: 20px; font-weight: 700; margin: 28px 0 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; }
    .markdown-body h3 { font-size: 16.5px; font-weight: 700; margin: 24px 0 10px; color: var(--text-main); }
    .markdown-body h4 { font-size: 14.5px; font-weight: 700; margin: 18px 0 8px; color: var(--text-main); }
    .markdown-body p { margin-bottom: 14px; color: var(--text-muted); font-size: 14.5px; line-height: 1.65; }
    .markdown-body strong { color: var(--text-main); font-weight: 700; }
    .markdown-body a { color: var(--accent-primary); text-decoration: none; font-weight: 600; }
    .markdown-body a:hover { text-decoration: underline; }

    /* Lists & Nested Workflows Hierarchy */
    .markdown-body ol {
      margin: 12px 0 20px 24px;
      padding-left: 6px;
      color: var(--text-muted);
    }
    .markdown-body ol > li {
      margin-bottom: 12px;
      font-size: 14.5px;
      line-height: 1.6;
    }
    .markdown-body ol > li > strong {
      color: var(--text-main);
      font-size: 15px;
    }
    .markdown-body ul {
      margin: 8px 0 12px 20px;
      padding-left: 6px;
      list-style-type: disc;
      color: var(--text-muted);
    }
    .markdown-body ul > li {
      margin-bottom: 6px;
      font-size: 14px;
      line-height: 1.55;
    }
    .markdown-body ul ul {
      margin: 4px 0 6px 18px;
      list-style-type: circle;
    }
    .markdown-body hr.divider {
      border: 0;
      height: 1px;
      background: var(--border-subtle);
      margin: 28px 0;
    }
    .markdown-body blockquote {
      margin: 16px 0;
      padding: 12px 18px;
      background: var(--bg-surface);
      border-left: 3px solid var(--accent-primary);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: var(--text-muted);
      font-style: italic;
    }
    .markdown-body code {
      background: var(--bg-surface-elevated);
      color: var(--accent-primary);
      padding: 2px 7px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 13px;
      border: 1px solid var(--border-subtle);
    }
    .markdown-body pre code {
      background: transparent;
      padding: 0;
      border: none;
      font-size: 13px;
      color: inherit;
    }

    /* Code Blocks */
    .code-container {
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      margin: 16px 0;
      overflow: hidden;
    }
    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: var(--bg-surface-elevated);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--text-faint);
    }
    .copy-btn {
      background: transparent;
      border: 1px solid var(--border-strong);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-sans);
      transition: all 0.15s ease;
    }
    .copy-btn:hover { color: var(--text-main); background: var(--bg-surface-hover); }
    .copy-btn.copied { background: var(--accent-success); color: white; border-color: var(--accent-success); }
    pre {
      padding: 14px 16px;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.55;
      color: var(--text-main);
    }
    code {
      font-family: var(--font-mono);
      background: var(--bg-surface-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      border: 1px solid var(--border-subtle);
    }
    pre code { background: none; padding: 0; border: none; }

    /* Tables */
    .table-container {
      overflow-x: auto;
      margin: 18px 0;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--bg-surface);
      -webkit-overflow-scrolling: touch;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: var(--bg-surface-elevated);
      padding: 10px 14px;
      font-weight: 600;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-strong);
      white-space: nowrap;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Method Badges */
    .method-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 11px;
      padding: 4px 9px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .method-badge.get { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .method-badge.post { background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .method-badge.patch { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .method-badge.put { background: rgba(139, 92, 246, 0.18); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.4); }
    .method-badge.delete { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    /* ==========================================================
       TAGDA API REFERENCE OVERHAUL & FULL RESPONSIVENESS
       ========================================================== */
    .api-hero-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
      border: 1px solid var(--border-glow);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .api-hero-card::after {
      content: '';
      position: absolute;
      top: -50%; right: -20%;
      width: 250px; height: 250px;
      background: radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%);
      pointer-events: none;
    }
    .api-hero-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .api-hero-desc {
      color: var(--text-muted);
      font-size: 14.5px;
      max-width: 800px;
      margin-bottom: 20px;
    }
    .api-hero-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
    }
    .api-stat-chip {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .api-stat-chip .chip-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-faint);
    }
    .api-stat-chip .chip-val {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
      font-family: var(--font-mono);
    }

    /* Filters Bar */
    .api-control-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 18px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .portal-quick-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .portal-quick-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-right: 4px;
    }
    .portal-chip {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.18s var(--ease-smooth);
    }
    .portal-chip:hover {
      color: var(--text-main);
      border-color: var(--accent-primary);
      background: var(--bg-surface-hover);
    }
    .portal-chip.active {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
      box-shadow: 0 2px 10px var(--accent-primary-glow);
    }

    .api-filter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .method-pill-group {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .method-pill-group::-webkit-scrollbar { display: none; }

    .method-pill-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s var(--ease-smooth);
      white-space: nowrap;
    }
    .method-pill-btn:hover {
      background: var(--bg-surface-hover);
      color: var(--text-main);
      border-color: var(--border-strong);
    }
    .method-pill-btn.active {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
      box-shadow: 0 4px 12px var(--accent-primary-glow);
    }
    .pill-count {
      font-size: 10px;
      font-weight: 700;
      opacity: 0.85;
      background: rgba(0, 0, 0, 0.28);
      padding: 1px 6px;
      border-radius: 10px;
      font-family: var(--font-mono);
    }

    .tag-select-wrapper {
      position: relative;
    }
    .tag-select {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 7px 32px 7px 12px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-family: var(--font-sans);
      outline: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      transition: border-color 0.2s ease;
    }
    .tag-select:focus {
      border-color: var(--accent-primary);
    }
    .tag-select-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-faint);
    }
    .tag-select option { background: var(--bg-surface); color: var(--text-main); }

    .api-search-wrapper {
      position: relative;
      flex: 1;
      min-width: 240px;
    }
    .api-search-wrapper svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-faint);
      pointer-events: none;
    }
    .api-search-input {
      width: 100%;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 8px 36px 8px 36px;
      border-radius: var(--radius-md);
      color: var(--text-main);
      font-size: 13.5px;
      outline: none;
      transition: all 0.2s ease;
    }
    .api-search-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 12px var(--accent-primary-glow);
    }
    .api-search-clear {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-faint);
      cursor: pointer;
      font-size: 14px;
      display: none;
    }
    .api-search-clear.visible { display: block; }

    /* API Card List */
    .api-endpoints-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .api-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all 0.22s var(--ease-smooth);
    }
    .api-card:hover {
      border-color: var(--border-glow);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
    }
    .api-card.expanded {
      border-color: var(--accent-primary);
      box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15), 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    /* Fully Responsive Card Header */
    .api-card-header {
      padding: 14px 18px;
      cursor: pointer;
      user-select: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .api-card-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .api-endpoint-path-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }
    .api-path {
      font-family: var(--font-mono);
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-main);
      word-break: break-all;
    }
    .path-param {
      color: var(--accent-warning);
      font-weight: 700;
    }
    .api-chevron {
      width: 20px;
      height: 20px;
      color: var(--text-faint);
      transition: transform 0.25s var(--ease-smooth);
      flex-shrink: 0;
    }
    .api-card.expanded .api-chevron {
      transform: rotate(180deg);
      color: var(--accent-primary);
    }

    .api-card-header-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .api-summary {
      font-size: 13px;
      color: var(--text-muted);
      flex: 1;
      min-width: 200px;
    }
    .api-badges-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .api-auth-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--bg-surface-elevated);
      color: var(--text-faint);
      border: 1px solid var(--border-subtle);
    }
    .api-auth-badge.secured {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.35);
    }
    .api-tag-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--bg-surface-elevated);
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    /* Card Expanded Body */
    .api-card-body {
      display: none;
      padding: 20px;
      border-top: 1px solid var(--border-subtle);
      background: rgba(11, 15, 25, 0.65);
      animation: fadeIn 0.2s ease;
    }
    .api-card.expanded .api-card-body {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section-subtitle {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin: 18px 0 8px;
    }

    /* Tabbed Code Snippet Switcher */
    .snippet-tabs-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-surface-elevated);
      padding: 4px 6px;
      border-top-left-radius: var(--radius-md);
      border-top-right-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      border-bottom: none;
    }
    .snippet-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-mono);
      transition: all 0.15s ease;
    }
    .snippet-tab-btn.active {
      background: var(--accent-primary);
      color: white;
    }
    .snippet-code-box {
      border-top-left-radius: 0 !important;
      border-top-right-radius: 0 !important;
      margin-top: 0 !important;
    }

    /* Response Badges */
    .response-status-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .resp-pill {
      font-size: 12px;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }
    .resp-pill.success { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .resp-pill.client-err { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .resp-pill.server-err { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    /* Search Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding: 10vh 16px 20px;
      z-index: 200;
    }
    .modal-backdrop.open { display: flex; }
    .search-modal {
      width: 100%;
      max-width: 600px;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }
    .modal-input-wrapper {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-input {
      width: 100%;
      background: transparent;
      border: none;
      font-size: 15px;
      color: var(--text-main);
      outline: none;
      font-family: var(--font-sans);
    }
    .modal-results {
      max-height: 420px;
      overflow-y: auto;
      padding: 8px;
    }
    .result-item {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      transition: all 0.15s ease;
    }
    .result-item:hover, .result-item.selected {
      background: var(--bg-surface-elevated);
      color: var(--text-main);
    }

    /* ==========================================================
       DEDICATED LIGHT THEME UI OVERHAUL & CONTRAST EXCELLENCE
       ========================================================== */
    [data-theme="light"] {
      color: #0f172a;
    }

    /* Light Theme Header */
    [data-theme="light"] header.portal-header {
      background: rgba(255, 255, 255, 0.94);
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    [data-theme="light"] .brand-title {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    [data-theme="light"] .brand-tag {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    [data-theme="light"] .btn-icon-toggle,
    [data-theme="light"] .theme-toggle,
    [data-theme="light"] .btn-header,
    [data-theme="light"] .search-trigger {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    [data-theme="light"] .btn-icon-toggle:hover,
    [data-theme="light"] .theme-toggle:hover,
    [data-theme="light"] .btn-header:hover,
    [data-theme="light"] .search-trigger:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    [data-theme="light"] .btn-header.primary {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.25);
    }
    [data-theme="light"] .btn-header.primary:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
    [data-theme="light"] .search-shortcut {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #64748b;
    }

    /* Light Theme Sidebar */
    [data-theme="light"] aside.portal-sidebar {
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
    }
    [data-theme="light"] .nav-category-title {
      color: #64748b;
    }
    [data-theme="light"] .nav-item {
      color: #475569;
    }
    [data-theme="light"] .nav-item:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    [data-theme="light"] .nav-item.active {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
      border-left: 3px solid #2563eb;
    }
    [data-theme="light"] .nav-badge {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    [data-theme="light"] .nav-item.active .nav-badge {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
    [data-theme="light"] .sidebar-footer {
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
    }
    [data-theme="light"] .sidebar-collapse-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    [data-theme="light"] .sidebar-collapse-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Light Theme Main Content & Prose */
    [data-theme="light"] .content-header {
      border-bottom: 1px solid #e2e8f0;
    }
    [data-theme="light"] .content-title {
      color: #0f172a;
    }
    [data-theme="light"] .markdown-body h1,
    [data-theme="light"] .markdown-body h2,
    [data-theme="light"] .markdown-body h3,
    [data-theme="light"] .markdown-body h4 {
      color: #0f172a;
    }
    [data-theme="light"] .markdown-body h2 {
      border-bottom: 1px solid #e2e8f0;
    }
    [data-theme="light"] .markdown-body p,
    [data-theme="light"] .markdown-body ul,
    [data-theme="light"] .markdown-body ol,
    [data-theme="light"] .markdown-body li {
      color: #334155;
    }
    [data-theme="light"] .markdown-body strong {
      color: #0f172a;
    }
    [data-theme="light"] .markdown-body blockquote {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      color: #475569;
    }
    [data-theme="light"] .markdown-body code {
      background: #f1f5f9;
      color: #1d4ed8;
      border: 1px solid #cbd5e1;
    }

    /* Light Theme API Hero Card */
    [data-theme="light"] .api-hero-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%);
      border: 1px solid #bfdbfe;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.08), 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    [data-theme="light"] .api-hero-card::after {
      background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
    }
    [data-theme="light"] .api-hero-title {
      color: #0f172a;
    }
    [data-theme="light"] .api-hero-desc {
      color: #475569;
    }
    [data-theme="light"] .api-stat-chip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    [data-theme="light"] .api-stat-chip .chip-label {
      color: #64748b;
    }
    [data-theme="light"] .api-stat-chip .chip-val {
      color: #0f172a;
    }

    /* Light Theme Control Panel & Filters */
    [data-theme="light"] .api-control-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    [data-theme="light"] .portal-quick-label {
      color: #64748b;
    }
    [data-theme="light"] .portal-quick-bar {
      border-bottom: 1px solid #e2e8f0;
    }
    [data-theme="light"] .portal-chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    [data-theme="light"] .portal-chip:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    [data-theme="light"] .portal-chip.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }
    [data-theme="light"] .method-pill-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    [data-theme="light"] .method-pill-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    [data-theme="light"] .method-pill-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
    }
    [data-theme="light"] .pill-count {
      background: rgba(0, 0, 0, 0.07);
      color: inherit;
    }
    [data-theme="light"] .tag-select {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }
    [data-theme="light"] .tag-select option {
      background: #ffffff;
      color: #0f172a;
    }
    [data-theme="light"] .api-search-input {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }
    [data-theme="light"] .api-search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    [data-theme="light"] .api-search-clear {
      color: #94a3b8;
    }
    [data-theme="light"] .api-search-clear:hover {
      color: #0f172a;
    }

    /* Light Theme API Cards */
    [data-theme="light"] .api-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    [data-theme="light"] .api-card:hover {
      border-color: #93c5fd;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    [data-theme="light"] .api-card.expanded {
      border-color: #2563eb;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    [data-theme="light"] .api-path {
      color: #0f172a;
      font-weight: 700;
    }
    [data-theme="light"] .path-param {
      color: #d97706;
    }
    [data-theme="light"] .api-summary {
      color: #475569;
    }
    [data-theme="light"] .api-auth-badge {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    [data-theme="light"] .api-auth-badge.secured {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }
    [data-theme="light"] .api-tag-badge {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    [data-theme="light"] .api-card-body {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    [data-theme="light"] .section-subtitle {
      color: #64748b;
    }

    /* Method Badges - WCAG AAA Contrast in Light Mode */
    [data-theme="light"] .method-badge.get { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    [data-theme="light"] .method-badge.post { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    [data-theme="light"] .method-badge.patch { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    [data-theme="light"] .method-badge.put { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
    [data-theme="light"] .method-badge.delete { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Response Pills in Light Mode */
    [data-theme="light"] .resp-pill.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    [data-theme="light"] .resp-pill.client-err { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    [data-theme="light"] .resp-pill.server-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Tables in Light Mode */
    [data-theme="light"] .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    [data-theme="light"] th {
      background: #f8fafc;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 700;
    }
    [data-theme="light"] td {
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    [data-theme="light"] tr:hover td {
      background: #f8fafc;
    }

    /* Developer-Grade Dark IDE Code Blocks in Both Modes */
    [data-theme="light"] .snippet-tabs-bar {
      background: #1e293b;
      border-color: #334155;
    }
    [data-theme="light"] .snippet-tab-btn {
      color: #94a3b8;
    }
    [data-theme="light"] .snippet-tab-btn:hover {
      color: #f8fafc;
    }
    [data-theme="light"] .snippet-tab-btn.active {
      background: #2563eb;
      color: #ffffff;
    }
    [data-theme="light"] .code-container {
      background: #0b0f19;
      border-color: #1e293b;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
    [data-theme="light"] .code-header {
      background: #111827;
      border-bottom: 1px solid #1f2937;
      color: #9ca3af;
    }
    [data-theme="light"] pre {
      color: #e2e8f0;
    }
    [data-theme="light"] .copy-btn {
      border-color: #374151;
      color: #9ca3af;
    }
    [data-theme="light"] .copy-btn:hover {
      color: #ffffff;
      background: #1f2937;
    }
    [data-theme="light"] code {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }
    pre code {
      background: transparent !important;
      color: inherit !important;
      border: none !important;
    }

    /* Light Theme Search Modal */
    [data-theme="light"] .modal-backdrop {
      background: rgba(15, 23, 42, 0.45);
    }
    [data-theme="light"] .search-modal {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.16);
    }
    [data-theme="light"] .modal-input-wrapper {
      border-bottom: 1px solid #e2e8f0;
    }
    [data-theme="light"] .modal-input {
      color: #0f172a;
    }
    [data-theme="light"] .result-item {
      color: #475569;
    }
    [data-theme="light"] .result-item:hover,
    [data-theme="light"] .result-item.selected {
      background: #f1f5f9;
      color: #0f172a;
    }
    [data-theme="light"] .floating-nav-tooltip {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    /* ==========================================================
       MEDIA QUERIES FOR ALL SCREEN BREAKPOINTS
       ========================================================== */
    /* Mobile Drawer (< 1024px) */
    @media (max-width: 1024px) {
      aside.portal-sidebar {
        transform: translate3d(-100%, 0, 0);
        width: 300px !important;
        max-width: 85vw;
        box-shadow: 20px 0 50px rgba(0, 0, 0, 0.7);
        z-index: 120;
        background: var(--bg-surface);
      }
      aside.portal-sidebar.mobile-open {
        transform: translate3d(0, 0, 0);
      }
      /* Always show full labels in mobile drawer regardless of mini state */
      .nav-category-title {
        display: block !important;
        opacity: 1 !important;
        height: auto !important;
      }
      .nav-item-title {
        display: block !important;
        opacity: 1 !important;
        max-width: none !important;
      }
      .nav-badge {
        display: inline-block !important;
        opacity: 1 !important;
      }
      .nav-item {
        justify-content: flex-start !important;
        width: 100% !important;
        height: auto !important;
        padding: 9px 12px !important;
        margin: 2px 0 !important;
      }
      .sidebar-footer {
        display: none !important;
      }

      main.portal-content {
        margin-left: 0 !important;
        padding: 24px 20px 80px;
      }
      .btn-icon-toggle { display: flex; }
      .search-shortcut { display: none; }
    }

    /* Mobile Phones (< 640px) */
    @media (max-width: 640px) {
      header.portal-header {
        padding: 0 12px;
      }
      .brand-title { font-size: 15px; }
      .brand-tag { display: none; }
      .header-actions .btn-header span { display: none; }
      .header-actions .search-trigger span { display: none; }
      .search-trigger { padding: 7px 10px; }
      .btn-header { padding: 7px 10px; }

      main.portal-content {
        padding: 16px 12px 60px;
      }
      .content-title { font-size: 24px; }
      .api-hero-card { padding: 16px; }
      .api-hero-title { font-size: 20px; }
      .api-hero-desc { font-size: 13.5px; margin-bottom: 16px; }
      .api-control-panel { padding: 14px 12px; }
      .api-filter-row { flex-direction: column; align-items: stretch; }
      .method-pill-group { width: 100%; justify-content: flex-start; }
      .method-pill-btn { font-size: 11px; padding: 5px 10px; }
      .tag-select-wrapper { width: 100%; }
      .tag-select { width: 100%; }
      .api-card-header { padding: 12px; }
      .api-path { font-size: 12.5px; }
      .api-summary { min-width: 100%; font-size: 12.5px; }
      .api-card-body { padding: 14px 12px; }
      pre { font-size: 12px; padding: 10px 12px; }
    }

    /* Very Small Mobile (< 360px) */
    @media (max-width: 360px) {
      .method-pill-btn { font-size: 10px; padding: 4px 8px; }
      .brand-title { display: none; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="portal-header">
    <div class="header-left">
      <!-- Sidebar Toggle (Mobile Drawer & Desktop Icon-Only Toggle) -->
      <button class="btn-icon-toggle" id="sidebarToggleBtn" aria-label="Toggle Sidebar Navigation" title="Toggle Sidebar (Ctrl+B)">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
        </svg>
      </button>

      <a href="#overview" class="header-brand">
        <div class="brand-icon">ZB</div>
        <span class="brand-title">Zosh Bazaar</span>
        <span class="brand-tag">Developer Portal</span>
      </a>
    </div>

    <div class="header-actions">
      <div class="search-trigger" id="searchTrigger" title="Quick Search (Ctrl+K)">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <span>Search docs...</span>
        <span class="search-shortcut">⌘K</span>
      </div>

      <a href="/api-docs" target="_blank" class="btn-header primary" title="Open Interactive Swagger UI in new tab">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        <span>Swagger UI</span>
      </a>

      <a href="/api-docs/openapi.json" target="_blank" class="btn-header" title="Download OpenAPI JSON Specification">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <span>JSON</span>
      </a>

      <button class="theme-toggle" id="themeToggle" aria-label="Toggle Theme" title="Toggle Theme (Dark / Light)">
        <svg id="themeIconSun" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
      </button>
    </div>
  </header>

  <!-- Mobile Backdrop Overlay -->
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

  <!-- Floating Tooltip for Desktop Mini Mode -->
  <div id="floatingNavTooltip" class="floating-nav-tooltip"></div>

  <!-- Layout Container -->
  <div class="portal-container">
    <!-- Sidebar -->
    <aside class="portal-sidebar" id="portalSidebar">
      <div id="sidebarNavigation"></div>

      <!-- Desktop Sidebar Footer Toggle -->
      <div class="sidebar-footer">
        <button class="sidebar-collapse-btn" id="sidebarFooterToggleBtn" title="Toggle Sidebar (Ctrl+B)">
          <svg class="collapse-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
          <span class="collapse-label">Collapse Sidebar</span>
          <span class="collapse-shortcut">⌘B</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="portal-content" id="portalContent">
      <div id="activeContentContainer"></div>
    </main>
  </div>

  <!-- Quick Search Modal (Ctrl+K) -->
  <div class="modal-backdrop" id="searchModalBackdrop">
    <div class="search-modal">
      <div class="modal-input-wrapper">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" class="modal-input" id="modalSearchInput" placeholder="Search guides, endpoints, parameters, models..." autofocus>
        <span class="search-shortcut">ESC</span>
      </div>
      <div class="modal-results" id="modalSearchResults"></div>
    </div>
  </div>

  <!-- Client State & Logic -->
  <script>
    const SPEC = ${specJsonStr};
    const SECTIONS = ${sectionsJsonStr};

    let activeView = 'overview';
    let currentMethodFilter = 'ALL';
    let currentPortalFilter = 'ALL';
    let currentTagFilter = 'ALL';
    let apiFilterQuery = '';
    let isSidebarMini = localStorage.getItem('zb-sidebar-mini') === 'true';

    // SVG Icons Map for Sections
    const SECTION_ICONS = {
      'overview': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      'quickstart': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
      'security-rbac': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      'payments-ledger': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12M6 8h12M6 13h3c6.667 0 6.667-10 0-10H6m0 10l8.5 8"/></svg>',
      'realtime-socket': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>',
      'portal-customer': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
      'portal-seller': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" stroke-width="2"/></svg>',
      'portal-admin': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      'portal-logistics': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke-width="2"/></svg>',
      'portal-delivery': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="18.5" cy="17.5" r="3.5" stroke-width="2"/><circle cx="5.5" cy="17.5" r="3.5" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>',
      'error-handling': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>',
      'api-reference': '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" stroke-width="2"/><polyline points="8 6 2 12 8 18" stroke-width="2"/></svg>'
    };

    // Apply saved Mini Sidebar state only on desktop
    if (isSidebarMini && window.innerWidth > 1024) {
      document.body.classList.add('sidebar-mini');
    }

    // Robust Markdown Renderer with nested lists, tables, code blocks and typography
    function renderMarkdown(md) {
      if (!md) return '';

      const codeBlocks = [];
      let text = md.replace(/\`\`\`([a-z0-9_-]*)\\n([\\s\\S]*?)\`\`\`/gim, (match, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(
          '<div class="code-container">' +
          '<div class="code-header"><span>' + (lang || 'code') + '</span><button class="copy-btn" onclick="copySnippet(this)">Copy</button></div>' +
          '<pre><code>' + escapeHtml(code.trim()) + '</code></pre></div>'
        );
        return '\\n\\n@@CODEBLOCK_' + idx + '@@\\n\\n';
      });

      function parseInline(str) {
        if (!str) return '';
        return str
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
          .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
          .replace(/__([^_]+)__/g, '<strong>$1</strong>')
          .replace(/\`([^\\\`]+)\`/g, '<code>$1</code>')
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      }

      const lines = text.split('\\n');
      const output = [];

      let inTable = false;
      let tableHeaderParsed = false;
      let listStack = [];

      function closeAllLists() {
        while (listStack.length > 0) {
          const top = listStack.pop();
          output.push('</li></' + top.type + '>');
        }
      }

      function closeTable() {
        if (inTable) {
          output.push('</tbody></table></div>');
          inTable = false;
          tableHeaderParsed = false;
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        if (!trimmed) {
          closeTable();
          closeAllLists();
          continue;
        }

        if (trimmed.startsWith('@@CODEBLOCK_')) {
          closeTable();
          closeAllLists();
          output.push(trimmed);
          continue;
        }

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          closeAllLists();
          const cells = trimmed.split('|').slice(1, -1).map(c => parseInline(c.trim()));
          if (!inTable) {
            inTable = true;
            tableHeaderParsed = false;
            output.push('<div class="table-container"><table><thead><tr>' + cells.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>');
          } else if (!tableHeaderParsed && cells.every(c => c.replace(/[:-\\s]/g, '') === '')) {
            tableHeaderParsed = true;
          } else {
            output.push('<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>');
          }
          continue;
        } else {
          closeTable();
        }

        if (trimmed.startsWith('#')) {
          closeAllLists();
          const m = trimmed.match(/^(#{1,6})\\s+(.*)$/);
          if (m) {
            const level = m[1].length;
            output.push('<h' + level + '>' + parseInline(m[2]) + '</h' + level + '>');
            continue;
          }
        }

        if (trimmed.startsWith('>')) {
          closeAllLists();
          const quoteText = trimmed.replace(/^>\\s*/, '');
          output.push('<blockquote>' + parseInline(quoteText) + '</blockquote>');
          continue;
        }

        if (/^(\\*\\*\\*|---|___)$/.test(trimmed)) {
          closeAllLists();
          output.push('<hr class="divider">');
          continue;
        }

        const orderedMatch = rawLine.match(/^(\\s*)(\\d+)\\.\\s+(.*)$/);
        const unorderedMatch = rawLine.match(/^(\\s*)([-*])\\s+(.*)$/);

        if (orderedMatch || unorderedMatch) {
          const isOrdered = !!orderedMatch;
          const indent = (isOrdered ? orderedMatch[1] : unorderedMatch[1]).length;
          const content = parseInline(isOrdered ? orderedMatch[3] : unorderedMatch[3]);
          const listType = isOrdered ? 'ol' : 'ul';

          if (listStack.length === 0) {
            listStack.push({ type: listType, indent: indent });
            output.push('<' + listType + '><li>' + content);
          } else {
            const current = listStack[listStack.length - 1];
            if (indent > current.indent) {
              listStack.push({ type: listType, indent: indent });
              output.push('<' + listType + '><li>' + content);
            } else if (indent < current.indent) {
              while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
                const popped = listStack.pop();
                output.push('</li></' + popped.type + '>');
              }
              if (listStack.length > 0 && listStack[listStack.length - 1].type === listType) {
                output.push('</li><li>' + content);
              } else {
                if (listStack.length > 0) {
                  const popped = listStack.pop();
                  output.push('</li></' + popped.type + '>');
                }
                listStack.push({ type: listType, indent: indent });
                output.push('<' + listType + '><li>' + content);
              }
            } else {
              if (current.type === listType) {
                output.push('</li><li>' + content);
              } else {
                output.push('</li></' + current.type + '><' + listType + '><li>' + content);
                current.type = listType;
              }
            }
          }
          continue;
        }

        if (listStack.length > 0 && rawLine.match(/^\\s{2,}\\S/)) {
          output.push('<div class="list-item-desc">' + parseInline(trimmed) + '</div>');
          continue;
        }

        closeAllLists();
        output.push('<p>' + parseInline(trimmed) + '</p>');
      }

      closeTable();
      closeAllLists();

      let html = output.join('\\n');

      html = html.replace(/@@CODEBLOCK_(\\d+)@@/g, (match, idx) => {
        return codeBlocks[Number(idx)] || '';
      });

      return html;
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.copySnippet = function(btn) {
      const container = btn.closest('.code-container');
      const pre = container.querySelector('pre code');
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.classList.add('copied');
        btn.innerText = 'Copied!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerText = 'Copy';
        }, 1800);
      });
    };

    // Floating Tooltip Handler for Desktop Mini Mode
    const floatingTooltip = document.getElementById('floatingNavTooltip');
    function initFloatingTooltips() {
      const items = document.querySelectorAll('.nav-item');
      items.forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (document.body.classList.contains('sidebar-mini') && window.innerWidth > 1024) {
            const rect = el.getBoundingClientRect();
            const title = el.getAttribute('data-tooltip-title') || '';
            const badge = el.getAttribute('data-tooltip-badge') || '';
            let content = '<span>' + escapeHtml(title) + '</span>';
            if (badge) content += '<span class="tooltip-badge">' + escapeHtml(badge) + '</span>';
            floatingTooltip.innerHTML = content;
            floatingTooltip.style.top = (rect.top + (rect.height / 2) - 15) + 'px';
            floatingTooltip.style.left = (rect.right + 12) + 'px';
            floatingTooltip.classList.add('visible');
          }
        });
        el.addEventListener('mouseleave', () => {
          floatingTooltip.classList.remove('visible');
        });
        el.addEventListener('click', () => {
          floatingTooltip.classList.remove('visible');
        });
      });
    }

    // Render Navigation Sidebar
    function renderSidebar() {
      const container = document.getElementById('sidebarNavigation');
      const categories = {};

      SECTIONS.forEach(s => {
        if (!categories[s.category]) categories[s.category] = [];
        categories[s.category].push({ id: s.id, title: s.title, badge: s.badge });
      });

      categories["API Reference"] = [
        { id: "api-reference", title: "Interactive Endpoints", badge: "248 Ops" }
      ];

      let html = '';
      for (const [catName, items] of Object.entries(categories)) {
        html += '<div class="nav-category">';
        html += '<div class="nav-category-title">' + catName + '</div>';
        items.forEach(it => {
          const isActive = activeView === it.id ? 'active' : '';
          const iconSvg = SECTION_ICONS[it.id] || SECTION_ICONS['overview'];
          html += '<a class="nav-item ' + isActive + '" onclick="switchView(\\'' + it.id + '\\')" data-tooltip-title="' + escapeHtml(it.title) + '" data-tooltip-badge="' + (it.badge || '') + '">';
          html += '<span class="nav-item-icon">' + iconSvg + '</span>';
          html += '<span class="nav-item-title">' + it.title + '</span>';
          if (it.badge) html += '<span class="nav-badge">' + it.badge + '</span>';
          html += '</a>';
        });
        html += '</div>';
      }
      container.innerHTML = html;
      initFloatingTooltips();
    }

    // Switch View
    window.switchView = function(viewId) {
      activeView = viewId;
      window.location.hash = viewId;
      renderSidebar();
      renderContent();
      closeMobileSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Render Main Content
    function renderContent() {
      const container = document.getElementById('activeContentContainer');

      if (activeView === 'api-reference') {
        renderApiReferenceView(container);
        return;
      }

      const section = SECTIONS.find(s => s.id === activeView) || SECTIONS[0];
      let html = '<div class="content-header">';
      html += '<div class="content-category">' + section.category + '</div>';
      html += '<h1 class="content-title">' + section.title + '</h1>';
      html += '</div>';
      html += '<div class="markdown-body">' + renderMarkdown(section.content) + '</div>';
      container.innerHTML = html;
    }

    // Identify Portal Domain for Route Path
    function getPortalForPath(path) {
      if (path.includes('/seller')) return 'Seller';
      if (path.includes('/admin')) return 'Admin';
      if (path.includes('/logistics')) return 'Logistics';
      if (path.includes('/delivery-partner') || path.includes('/delivery')) return 'Delivery';
      return 'Customer';
    }

    // Format Path Parameters with Color Highlighting
    function formatPathWithParams(p) {
      return escapeHtml(p).replace(/(\\{[a-zA-Z0-9_]+\\}|:[a-zA-Z0-9_]+)/g, '<span class="path-param">$1</span>');
    }

    // Render API Reference View
    function renderApiReferenceView(container) {
      const paths = SPEC.paths || {};
      const operations = [];
      const tagCounts = {};
      const methodCounts = { ALL: 0, GET: 0, POST: 0, PATCH: 0, DELETE: 0 };
      const portalCounts = { ALL: 0, Customer: 0, Seller: 0, Admin: 0, Logistics: 0, Delivery: 0 };

      for (const [p, methods] of Object.entries(paths)) {
        for (const [m, op] of Object.entries(methods)) {
          const mUpper = m.toUpperCase();
          if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(mUpper)) {
            const primaryTag = (op.tags && op.tags[0]) || 'General';
            tagCounts[primaryTag] = (tagCounts[primaryTag] || 0) + 1;
            methodCounts.ALL++;
            if (methodCounts[mUpper] !== undefined) methodCounts[mUpper]++;

            const portal = getPortalForPath(p);
            portalCounts.ALL++;
            if (portalCounts[portal] !== undefined) portalCounts[portal]++;

            operations.push({
              path: p,
              method: mUpper,
              portal: portal,
              summary: op.summary || p,
              description: op.description || '',
              tags: op.tags || ['General'],
              security: op.security || [],
              parameters: op.parameters || [],
              requestBody: op.requestBody,
              responses: op.responses || {},
              operationId: op.operationId || ''
            });
          }
        }
      }

      let html = '<div class="api-hero-card">';
      html += '<div class="content-category">API Reference</div>';
      html += '<h1 class="api-hero-title">Interactive OpenAPI Reference</h1>';
      html += '<p class="api-hero-desc">Explore, filter, and inspect parameters for all ' + operations.length + ' operations across Zosh Bazaar\\'s 5 production portals. Copy production-ready snippets in cURL, JavaScript, and Python.</p>';

      // Hero Stat Chips
      html += '<div class="api-hero-bar">';
      html += '<div class="api-stat-chip"><span class="chip-label">Total Routes</span><span class="chip-val">' + operations.length + '</span></div>';
      html += '<div class="api-stat-chip"><span class="chip-label">Spec Version</span><span class="chip-val">OpenAPI 3.1</span></div>';
      html += '<div class="api-stat-chip"><span class="chip-label">Secured APIs</span><span class="chip-val">100% RBAC</span></div>';
      html += '<div class="api-stat-chip"><span class="chip-label">Subsystems</span><span class="chip-val">5 Portals</span></div>';
      html += '</div>';
      html += '</div>';

      // Control Panel
      html += '<div class="api-control-panel">';

      // Quick Portal Chips
      html += '<div class="portal-quick-bar">';
      html += '<span class="portal-quick-label">Portals:</span>';
      ['ALL', 'Customer', 'Seller', 'Admin', 'Logistics', 'Delivery'].forEach(port => {
        const cls = currentPortalFilter === port ? 'active' : '';
        const count = portalCounts[port] || 0;
        html += '<button class="portal-chip ' + cls + '" onclick="setPortalFilter(\\'' + port + '\\')">' + port + ' (' + count + ')</button>';
      });
      html += '</div>';

      // Method Pills & Tag Dropdown Row
      html += '<div class="api-filter-row">';

      // Method Pills
      html += '<div class="method-pill-group">';
      ['ALL', 'GET', 'POST', 'PATCH', 'DELETE'].forEach(m => {
        const cls = currentMethodFilter === m ? 'active' : '';
        const count = methodCounts[m] || 0;
        html += '<button class="method-pill-btn ' + cls + '" onclick="setMethodFilter(\\'' + m + '\\')">';
        html += '<span>' + m + '</span>';
        html += '<span class="pill-count">' + count + '</span>';
        html += '</button>';
      });
      html += '</div>';

      // Domain Tag Select
      html += '<div class="tag-select-wrapper">';
      html += '<select class="tag-select" id="tagSelect" onchange="setTagFilter(this.value)">';
      html += '<option value="ALL">All Domain Groups (' + Object.keys(tagCounts).length + ')</option>';
      Object.keys(tagCounts).sort().forEach(t => {
        const sel = currentTagFilter === t ? 'selected' : '';
        html += '<option value="' + escapeHtml(t) + '" ' + sel + '>' + escapeHtml(t) + ' (' + tagCounts[t] + ')</option>';
      });
      html += '</select>';
      html += '<svg class="tag-select-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
      html += '</div>';

      html += '</div>'; // filter row

      // Search bar row
      html += '<div class="api-filter-row">';
      html += '<div class="api-search-wrapper">';
      html += '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
      html += '<input type="text" class="api-search-input" id="apiSearchInput" placeholder="Filter by endpoint route, keyword, or operation ID..." value="' + escapeHtml(apiFilterQuery) + '" oninput="setApiSearchQuery(this.value)">';
      html += '<button class="api-search-clear ' + (apiFilterQuery ? 'visible' : '') + '" onclick="clearApiSearch()">✕</button>';
      html += '</div>';
      html += '</div>';

      html += '</div>'; // control panel

      // Filter operations
      const filtered = operations.filter(op => {
        if (currentMethodFilter !== 'ALL' && op.method !== currentMethodFilter) return false;
        if (currentPortalFilter !== 'ALL' && op.portal !== currentPortalFilter) return false;
        if (currentTagFilter !== 'ALL' && !op.tags.includes(currentTagFilter)) return false;
        if (apiFilterQuery) {
          const q = apiFilterQuery.toLowerCase();
          return op.path.toLowerCase().includes(q) ||
                 op.summary.toLowerCase().includes(q) ||
                 op.operationId.toLowerCase().includes(q) ||
                 op.tags.join(' ').toLowerCase().includes(q);
        }
        return true;
      });

      html += '<div class="api-endpoints-list">';
      if (filtered.length === 0) {
        html += '<div style="padding:48px 20px; text-align:center; background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-subtle); color:var(--text-faint);">';
        html += '<svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0 auto 12px; display:block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        html += '<h3 style="font-size:16px; font-weight:700; color:var(--text-main); margin-bottom:6px;">No matching operations found</h3>';
        html += '<p>Try clearing your query or resetting filter parameters.</p>';
        html += '<button class="btn-header" style="margin:16px auto 0;" onclick="clearAllFilters()">Reset All Filters</button>';
        html += '</div>';
      } else {
        filtered.forEach((op, idx) => {
          const isSecured = op.security && op.security.length > 0;
          const authScheme = isSecured ? Object.keys(op.security[0])[0] : 'Public';
          const methodCls = op.method.toLowerCase();

          html += '<div class="api-card" id="card-' + idx + '">';

          // Card Header (Responsive Flex Column)
          html += '<div class="api-card-header" onclick="toggleCard(' + idx + ')">';

          // Row 1: Method badge + Path + Chevron
          html += '<div class="api-card-header-top">';
          html += '<div class="api-endpoint-path-wrap">';
          html += '<span class="method-badge ' + methodCls + '">' + op.method + '</span>';
          html += '<span class="api-path">' + formatPathWithParams(op.path) + '</span>';
          html += '</div>';
          html += '<svg class="api-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
          html += '</div>';

          // Row 2: Summary + Badges
          html += '<div class="api-card-header-meta">';
          html += '<div class="api-summary">' + escapeHtml(op.summary) + '</div>';
          html += '<div class="api-badges-wrap">';
          if (isSecured) {
            html += '<span class="api-auth-badge secured">🔒 ' + escapeHtml(authScheme) + '</span>';
          } else {
            html += '<span class="api-auth-badge">🌐 Public</span>';
          }
          html += '<span class="api-tag-badge">' + escapeHtml(op.tags[0] || 'API') + '</span>';
          html += '</div>';
          html += '</div>';

          html += '</div>'; // card header

          // Card Body (Expanded)
          html += '<div class="api-card-body">';
          if (op.description) {
            html += '<p style="margin-bottom:14px; color:var(--text-muted); font-size:13.5px;">' + escapeHtml(op.description) + '</p>';
          }

          // Parameters
          if (op.parameters && op.parameters.length > 0) {
            html += '<div class="section-subtitle">Parameters (' + op.parameters.length + ')</div>';
            html += '<div class="table-container"><table><thead><tr><th>Name</th><th>In</th><th>Required</th><th>Description</th></tr></thead><tbody>';
            op.parameters.forEach(p => {
              html += '<tr>';
              html += '<td><code>' + escapeHtml(p.name) + '</code></td>';
              html += '<td><span class="nav-badge">' + escapeHtml(p.in) + '</span></td>';
              html += '<td>' + (p.required ? '<span style="color:#ef4444; font-weight:700;">Yes</span>' : '<span style="color:var(--text-faint);">No</span>') + '</td>';
              html += '<td>' + escapeHtml(p.description || '-') + '</td>';
              html += '</tr>';
            });
            html += '</tbody></table></div>';
          }

          // Request Body Schema Preview (if POST/PUT/PATCH)
          if (op.requestBody && op.requestBody.content) {
            html += '<div class="section-subtitle">Request Body (' + (op.requestBody.required ? 'Required' : 'Optional') + ')</div>';
            const jsonSchema = op.requestBody.content["application/json"]?.schema;
            if (jsonSchema) {
              html += '<div class="code-container" style="margin-top:6px;">';
              html += '<div class="code-header"><span>application/json</span><button class="copy-btn" onclick="copySnippet(this)">Copy</button></div>';
              html += '<pre><code>' + escapeHtml(JSON.stringify(jsonSchema, null, 2)) + '</code></pre>';
              html += '</div>';
            }
          }

          // Response Status Codes
          html += '<div class="section-subtitle">Responses</div>';
          html += '<div class="response-status-group">';
          for (const [code, resp] of Object.entries(op.responses)) {
            const pillCls = code.startsWith('2') ? 'success' : (code.startsWith('4') ? 'client-err' : 'server-err');
            html += '<span class="resp-pill ' + pillCls + '">' + escapeHtml(code) + ' ' + escapeHtml(resp.description || '') + '</span>';
          }
          html += '</div>';

          // Tabbed Code Snippet Switcher (cURL / Fetch / Python)
          html += '<div class="section-subtitle">Production Code Snippets</div>';
          html += '<div class="snippet-tabs-bar" id="tabs-' + idx + '">';
          html += '<button class="snippet-tab-btn active" onclick="switchSnippetTab(this, ' + idx + ', \\'curl\\')">cURL</button>';
          html += '<button class="snippet-tab-btn" onclick="switchSnippetTab(this, ' + idx + ', \\'fetch\\')">JavaScript (fetch)</button>';
          html += '<button class="snippet-tab-btn" onclick="switchSnippetTab(this, ' + idx + ', \\'python\\')">Python (requests)</button>';
          html += '</div>';

          // Generated code snippets
          const curlCode = 'curl -X ' + op.method + ' "' + window.location.origin + op.path + '" \\\\\\n' +
                           (isSecured ? '  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\\\\n' : '') +
                           '  -H "Content-Type: application/json"';

          const fetchCode = 'const response = await fetch("' + window.location.origin + op.path + '", {\\n' +
                            '  method: "' + op.method + '",\\n' +
                            '  headers: {\\n' +
                            '    "Content-Type": "application/json",\\n' +
                            (isSecured ? '    "Authorization": "Bearer YOUR_ACCESS_TOKEN",\\n' : '') +
                            '  },\\n' +
                            (op.requestBody ? '  body: JSON.stringify({ /* payload */ }),\\n' : '') +
                            '});\\nconst data = await response.json();\\nconsole.log(data);';

          const pythonCode = 'import requests\\n\\nurl = "' + window.location.origin + op.path + '"\\nheaders = {\\n    "Content-Type": "application/json",\\n' +
                             (isSecured ? '    "Authorization": "Bearer YOUR_ACCESS_TOKEN",\\n' : '') +
                             '}\\n\\nresponse = requests.' + op.method.toLowerCase() + '(url, headers=headers)\\nprint(response.json())';

          html += '<div class="code-container snippet-code-box" id="box-' + idx + '">';
          html += '<div class="code-header"><span id="lang-label-' + idx + '">cURL</span><button class="copy-btn" onclick="copySnippet(this)">Copy</button></div>';
          html += '<pre><code id="code-target-' + idx + '">' + escapeHtml(curlCode) + '</code></pre>';
          html += '</div>';

          // Hidden snippet data
          html += '<script type="application/json" id="snippets-data-' + idx + '">' + JSON.stringify({ curl: curlCode, fetch: fetchCode, python: pythonCode }) + '<\\/script>';

          // Actions
          html += '<div style="margin-top:16px; display:flex; justify-content:flex-end; gap:10px;">';
          html += '<a href="/api-docs#/' + encodeURIComponent(op.tags[0] || 'default') + '/' + encodeURIComponent(op.operationId) + '" target="_blank" class="btn-header primary" style="font-size:12.5px;">';
          html += '<span>Try in Swagger UI</span>';
          html += '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>';
          html += '</a>';
          html += '</div>';

          html += '</div>'; // card body
          html += '</div>'; // card
        });
      }
      html += '</div>';
      container.innerHTML = html;
    }

    window.toggleCard = function(idx) {
      const card = document.getElementById('card-' + idx);
      if (card) card.classList.toggle('expanded');
    };

    window.switchSnippetTab = function(btn, idx, lang) {
      const tabsBar = document.getElementById('tabs-' + idx);
      const codeTarget = document.getElementById('code-target-' + idx);
      const langLabel = document.getElementById('lang-label-' + idx);
      const dataEl = document.getElementById('snippets-data-' + idx);

      if (!tabsBar || !codeTarget || !dataEl) return;
      const data = JSON.parse(dataEl.textContent);

      tabsBar.querySelectorAll('.snippet-tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      langLabel.innerText = lang.toUpperCase();
      codeTarget.innerText = data[lang] || '';
    };

    window.setPortalFilter = function(portal) {
      currentPortalFilter = portal;
      renderContent();
    };

    window.setMethodFilter = function(method) {
      currentMethodFilter = method;
      renderContent();
    };

    window.setTagFilter = function(tag) {
      currentTagFilter = tag;
      renderContent();
    };

    window.setApiSearchQuery = function(q) {
      apiFilterQuery = q;
      const clearBtn = document.querySelector('.api-search-clear');
      if (clearBtn) {
        if (q) clearBtn.classList.add('visible');
        else clearBtn.classList.remove('visible');
      }
      renderContent();
    };

    window.clearApiSearch = function() {
      apiFilterQuery = '';
      renderContent();
    };

    window.clearAllFilters = function() {
      currentMethodFilter = 'ALL';
      currentPortalFilter = 'ALL';
      currentTagFilter = 'ALL';
      apiFilterQuery = '';
      renderContent();
    };

    // Sidebar Toggle (Desktop Mini Mode + Mobile Drawer)
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarFooterToggleBtn = document.getElementById('sidebarFooterToggleBtn');
    const portalSidebar = document.getElementById('portalSidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    function toggleSidebarState() {
      if (window.innerWidth <= 1024) {
        portalSidebar.classList.toggle('mobile-open');
        sidebarBackdrop.classList.toggle('active');
      } else {
        document.body.classList.toggle('sidebar-mini');
        const isMini = document.body.classList.contains('sidebar-mini');
        localStorage.setItem('zb-sidebar-mini', isMini ? 'true' : 'false');
      }
    }

    sidebarToggleBtn.addEventListener('click', toggleSidebarState);
    if (sidebarFooterToggleBtn) {
      sidebarFooterToggleBtn.addEventListener('click', toggleSidebarState);
    }

    sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    function closeMobileSidebar() {
      portalSidebar.classList.remove('mobile-open');
      sidebarBackdrop.classList.remove('active');
    }

    // Keyboard Shortcuts (Ctrl+B / ⌘B for Sidebar, Ctrl+K / ⌘K for Search)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarState();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeSearchModal();
        closeMobileSidebar();
      }
    });

    // Quick Search Modal Logic
    const searchTrigger = document.getElementById('searchTrigger');
    const modalBackdrop = document.getElementById('searchModalBackdrop');
    const modalInput = document.getElementById('modalSearchInput');
    const modalResults = document.getElementById('modalSearchResults');

    function openSearchModal() {
      modalBackdrop.classList.add('open');
      modalInput.value = '';
      renderSearchResults('');
      setTimeout(() => modalInput.focus(), 60);
    }

    function closeSearchModal() {
      modalBackdrop.classList.remove('open');
    }

    searchTrigger.addEventListener('click', openSearchModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeSearchModal();
    });

    modalInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });

    function renderSearchResults(query) {
      const q = query.toLowerCase().trim();
      let matches = [];

      if (!q) {
        matches = SECTIONS.slice(0, 5).map(s => ({
          title: s.title,
          category: s.category,
          action: () => { switchView(s.id); closeSearchModal(); }
        }));
      } else {
        SECTIONS.forEach(s => {
          if (s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)) {
            matches.push({
              title: s.title,
              category: 'Guide: ' + s.category,
              action: () => { switchView(s.id); closeSearchModal(); }
            });
          }
        });

        for (const [p, methods] of Object.entries(SPEC.paths || {})) {
          for (const [m, op] of Object.entries(methods)) {
            if (p.toLowerCase().includes(q) || (op.summary && op.summary.toLowerCase().includes(q))) {
              matches.push({
                title: m.toUpperCase() + ' ' + p,
                category: 'API: ' + (op.summary || 'Endpoint'),
                action: () => {
                  switchView('api-reference');
                  apiFilterQuery = p;
                  closeSearchModal();
                }
              });
            }
          }
        }
      }

      let html = '';
      matches.slice(0, 10).forEach(m => {
        html += '<div class="result-item" onclick="selectResult(' + matches.indexOf(m) + ')">';
        html += '<span style="font-weight:600;">' + escapeHtml(m.title) + '</span>';
        html += '<span class="nav-badge">' + escapeHtml(m.category) + '</span>';
        html += '</div>';
      });
      if (matches.length === 0) {
        html = '<div style="padding:24px; text-align:center; color:var(--text-faint)">No matches found for "' + escapeHtml(query) + '"</div>';
      }
      modalResults.innerHTML = html;
      window.__activeMatches = matches;
    }

    window.selectResult = function(idx) {
      if (window.__activeMatches && window.__activeMatches[idx]) {
        window.__activeMatches[idx].action();
      }
    };

    // Dynamic Theme Icons & Controller
    const SUN_ICON = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>';
    const MOON_ICON = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';

    function updateThemeIcon(theme) {
      const btn = document.getElementById('themeToggle');
      if (btn) {
        if (theme === 'light') {
          btn.innerHTML = MOON_ICON;
          btn.setAttribute('title', 'Switch to Dark Mode (Ctrl+D)');
          btn.setAttribute('aria-label', 'Switch to Dark Mode');
        } else {
          btn.innerHTML = SUN_ICON;
          btn.setAttribute('title', 'Switch to Light Mode (Ctrl+D)');
          btn.setAttribute('aria-label', 'Switch to Light Mode');
        }
      }
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      updateThemeIcon(theme);
    }

    function toggleThemeMode() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('zb-docs-theme', next);
      } catch (e) {}

      // Clean query parameter from URL so it doesn't lock future refreshes
      try {
        const cleanUrl = new URL(window.location.href);
        if (cleanUrl.searchParams.has('theme')) {
          cleanUrl.searchParams.delete('theme');
          window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : '') + cleanUrl.hash);
        }
      } catch (e) {}
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleThemeMode);
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleThemeMode();
      }
    });

    // Theme initialization sync
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);

    // Clean theme query parameter from URL on initial load so future refreshes use localStorage
    try {
      const initUrl = new URL(window.location.href);
      if (initUrl.searchParams.has('theme')) {
        initUrl.searchParams.delete('theme');
        window.history.replaceState({}, '', initUrl.pathname + (initUrl.search ? initUrl.search : '') + initUrl.hash);
      }
    } catch (e) {}

    // Hash Routing & Deep Linking
    function handleHashRoute() {
      if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'api-reference' || SECTIONS.some(s => s.id === hash)) {
          activeView = hash;
        }
      }
      renderSidebar();
      renderContent();
    }

    window.addEventListener('hashchange', () => {
      handleHashRoute();
    });

    handleHashRoute();
  </script>
</body>
</html>`;
}
