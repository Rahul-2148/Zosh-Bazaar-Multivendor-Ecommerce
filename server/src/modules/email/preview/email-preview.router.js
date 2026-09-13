import express from "express";
import { emailRegistry } from "../core/email.registry.js";
import { emailRenderer } from "../core/email.renderer.js";
import { emailService } from "../core/email.service.js";
import { getFixtureForTemplate } from "./fixtures/email.fixtures.js";
import { renderPreviewDashboardHtml } from "./preview-ui.js";

const router = express.Router();

// Production Security Guard
router.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).send("Email preview dashboard is strictly disabled in production environments.");
  }
  next();
});

/**
 * Main Studio Dashboard Page
 */
router.get("/", async (req, res) => {
  try {
    const templates = emailRegistry.getAll();
    const selectedTemplateKey = req.query.template || templates[0]?.templateKey;

    const templateMeta = emailRegistry.get(selectedTemplateKey);
    const fixtureData = getFixtureForTemplate(selectedTemplateKey);

    const rendered = await emailRenderer.render({
      template: templateMeta,
      data: fixtureData,
      locale: req.query.locale || "en-IN",
    });

    const html = renderPreviewDashboardHtml({
      templates,
      selectedTemplateKey,
      selectedTemplateMeta: templateMeta,
      renderedHtml: rendered.html,
      subject: rendered.subject,
      preheader: rendered.preheader,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("[EmailPreviewRouter] Error rendering studio:", err);
    res.status(500).send(`Error loading email preview: ${err.message}`);
  }
});

/**
 * API: List all templates
 */
router.get("/api/templates", (req, res) => {
  const templates = emailRegistry.getAll().map((t) => ({
    key: t.templateKey,
    role: t.recipientRole,
    category: t.category,
    subject: t.subject,
    priority: t.priority,
  }));
  res.json({ count: templates.length, templates });
});

/**
 * API: Render specific template as JSON
 */
router.get("/api/render/:templateKey", async (req, res) => {
  try {
    const { templateKey } = req.params;
    const templateMeta = emailRegistry.get(templateKey);
    const fixtureData = getFixtureForTemplate(templateKey);

    const rendered = await emailRenderer.render({
      template: templateMeta,
      data: fixtureData,
      locale: req.query.locale || "en-IN",
    });

    res.json({
      templateKey,
      subject: rendered.subject,
      preheader: rendered.preheader,
      html: rendered.html,
      text: rendered.text,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * API: Send live test email
 */
router.post("/api/send-test", async (req, res) => {
  try {
    const { templateKey, recipient } = req.body;
    if (!recipient) {
      return res.status(400).json({ error: "Recipient email is required" });
    }
    if (!templateKey) {
      return res.status(400).json({ error: "Template key is required" });
    }

    const fixtureData = getFixtureForTemplate(templateKey);
    const result = await emailService.sendTemplate({
      template: templateKey,
      recipient,
      data: fixtureData,
      sync: true, // immediate dispatch
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
