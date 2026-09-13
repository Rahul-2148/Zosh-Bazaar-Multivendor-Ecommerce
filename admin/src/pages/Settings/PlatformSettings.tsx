import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { PlatformSettings as IPlatformSettings } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { SaveOutlined } from "@mui/icons-material";

export const PlatformSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [storeName, setStoreName] = useState("Zosh Bazaar");
  const [supportEmail, setSupportEmail] = useState("support@zoshbazaar.com");
  const [supportPhone, setSupportPhone] = useState("+91 9973162148");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [shippingFee, setShippingFee] = useState(79);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [taxRatePercent, setTaxRatePercent] = useState(18);
  const [announcementBanner, setAnnouncementBanner] = useState("");

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data: IPlatformSettings) => {
        if (data) {
          setStoreName(data.storeName || "Zosh Bazaar");
          setSupportEmail(data.supportEmail || "support@zoshbazaar.com");
          setSupportPhone(data.supportPhone || "+91 9973162148");
          setCurrencySymbol(data.currencySymbol || "₹");
          setCurrencyCode(data.currencyCode || "INR");
          setShippingFee(data.shippingFee ?? 79);
          setFreeShippingThreshold(data.freeShippingThreshold ?? 999);
          setTaxRatePercent(data.taxRatePercent ?? 18);
          setAnnouncementBanner(data.announcementBanner || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings({
        storeName,
        supportEmail,
        supportPhone,
        currencySymbol,
        currencyCode,
        shippingFee: Number(shippingFee),
        freeShippingThreshold: Number(freeShippingThreshold),
        taxRatePercent: Number(taxRatePercent),
        announcementBanner,
      });
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaving(false);
      alert(err.response?.data?.message || err.message || "Failed to update settings");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading platform configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Platform & Commercial Settings"
        subtitle="Configure store branding, shipping logistics parameters, GST tax rates, and support channels."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            Marketplace Brand & Support
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Support Email Address *
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer Support Contact *
              </label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Store Announcement Banner
              </label>
              <input
                type="text"
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                placeholder="Notice displayed on customer homepage..."
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Commercial & Shipping */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            Commercial, Shipping & Tax Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Free Shipping Order Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Standard GST / Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-success font-semibold bg-success-soft px-3 py-1.5 rounded-lg border border-success/25">
              ✓ Platform settings saved and live in database!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 ml-auto shadow-sm cursor-pointer"
          >
            <SaveOutlined sx={{ fontSize: 16 }} />
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
