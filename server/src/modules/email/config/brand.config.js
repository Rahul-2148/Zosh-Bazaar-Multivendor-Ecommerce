/**
 * Zosh Bazaar Email Platform — Brand Design System Tokens
 */

export const brandConfig = Object.freeze({
  name: "Zosh Bazaar",
  legalEntityName: "Zosh Bazaar Marketplace Technologies Pvt. Ltd.",
  tagline: "India's Modern Multi-Vendor Commerce Platform",
  logoUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80",
  faviconUrl: "https://zoshbazaar.com/favicon.ico",
  
  // Design Tokens (Light / Dark safe)
  colors: {
    primary: "#2563eb",       // Rich Royal Blue
    primaryHover: "#1d4ed8",
    secondary: "#0f172a",     // Slate 900
    accent: "#f59e0b",        // Amber 500
    success: "#16a34a",       // Emerald 600
    warning: "#d97706",       // Amber 600
    danger: "#dc2626",        // Red 600
    info: "#0284c7",          // Sky 600
    
    // Backgrounds
    background: "#f8fafc",    // Light canvas
    cardBackground: "#ffffff",
    darkBackground: "#0b1120",// Deep slate dark canvas
    darkCardBackground: "#1e293b",
    
    // Text colors
    textMain: "#1e293b",      // Slate 800
    textMuted: "#64748b",     // Slate 500
    textLight: "#ffffff",
    darkTextMain: "#f1f5f9",  // Slate 100
    darkTextMuted: "#94a3b8", // Slate 400
    
    // Borders
    border: "#e2e8f0",        // Slate 200
    darkBorder: "#334155",    // Slate 700
  },

  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
    headingFontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },

  urls: {
    website: process.env.CLIENT_URL || "http://localhost:5173",
    customerPortal: process.env.CLIENT_URL || "http://localhost:5173",
    sellerPortal: process.env.SELLER_URL || "http://localhost:5175",
    adminPortal: process.env.ADMIN_URL || "http://localhost:5176",
    logisticsPortal: process.env.LOGISTICS_URL || "http://localhost:5174",
    deliveryPartnerPortal: process.env.DELIVERY_PARTNER_URL || "http://localhost:5177",
    helpCenter: `${process.env.CLIENT_URL || "http://localhost:5173"}/help`,
    privacyPolicy: `${process.env.CLIENT_URL || "http://localhost:5173"}/privacy-policy`,
    termsOfService: `${process.env.CLIENT_URL || "http://localhost:5173"}/terms`,
    unsubscribe: `${process.env.CLIENT_URL || "http://localhost:5173"}/account/email-preferences`,
  },

  support: {
    email: "support@zoshbazaar.com",
    phone: "+91 1800 209 8888",
    hours: "Mon - Sat: 9:00 AM - 8:00 PM IST",
    address: {
      line1: "Zosh Bazaar Tower, Outer Ring Road",
      line2: "Bellandur, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      country: "India",
    },
  },

  socialLinks: [
    { name: "Twitter", url: "https://twitter.com/zoshbazaar", icon: "twitter" },
    { name: "Instagram", url: "https://instagram.com/zoshbazaar", icon: "instagram" },
    { name: "LinkedIn", url: "https://linkedin.com/company/zoshbazaar", icon: "linkedin" },
  ],
});
