import React, { useState } from "react";
import {
  StorefrontOutlined,
  AccountBalanceOutlined,
  VerifiedUserOutlined,
  SaveOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { Button, CircularProgress, Chip } from "@mui/material";
import { useSellerAuth } from "../../context/SellerAuthContext";

export const StoreProfile: React.FC = () => {
  const { seller, updateProfile } = useSellerAuth();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields initialized from current seller state
  const [sellerName, setSellerName] = useState(seller?.sellerName || "");
  const [businessName, setBusinessName] = useState(seller?.businessDetails?.businessName || "");
  const [businessPan, setBusinessPan] = useState(seller?.businessDetails?.businessPan || "");
  const [businessLogo, setBusinessLogo] = useState(seller?.businessDetails?.businessLogo || "");
  const [banner, setBanner] = useState(seller?.businessDetails?.banner || "");
  const [gstin, setGstin] = useState(seller?.GSTIN || "");

  // Bank fields
  const [accountNumber, setAccountNumber] = useState(seller?.bankDetails?.accountNumber || "");
  const [accountHolderName, setAccountHolderName] = useState(seller?.bankDetails?.accountHolderName || "");
  const [bankName, setBankName] = useState(seller?.bankDetails?.bankName || "");
  const [ifscCode, setIfscCode] = useState(seller?.bankDetails?.ifscCode || "");
  const [accountBranch, setAccountBranch] = useState(seller?.bankDetails?.accountBranch || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    try {
      setSaving(true);
      await updateProfile({
        sellerName,
        GSTIN: gstin,
        businessDetails: {
          businessName,
          businessPan,
          businessLogo,
          banner,
        },
        bankDetails: {
          accountNumber,
          accountHolderName,
          bankName,
          ifscCode,
          accountBranch,
          accountHolderEmail: seller?.email || "",
        },
      });
      setSuccessMsg("Store profile & bank details updated successfully!");
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Store Profile & KYC
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your merchant public storefront identity, banking details, and statutory compliance
          </p>
        </div>

        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined fontSize="small" />}
          sx={{
            backgroundColor: "var(--color-primary)",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "10px",
            fontSize: "13px",
            px: 3,
          }}
        >
          {saving ? "Saving Changes..." : "Save Profile"}
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircleOutline fontSize="small" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Account Status Card */}
      <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <VerifiedUserOutlined fontSize="medium" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Merchant Verification Status
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Platform status determined by administration compliance checks
            </span>
          </div>
        </div>

        <Chip
          label={seller?.accountStatus || "ACTIVE"}
          color={seller?.accountStatus === "ACTIVE" ? "success" : "warning"}
          sx={{ fontWeight: 800, fontSize: "11px" }}
        />
      </div>

      {/* 1. Storefront Identity */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <StorefrontOutlined fontSize="small" className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">1. Storefront Identity & Branding</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Seller / Merchant Name</label>
            <input
              type="text"
              required
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Registered Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Retail Private Limited"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Store Logo URL</label>
            <input
              type="url"
              value={businessLogo}
              onChange={(e) => setBusinessLogo(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Store Banner URL</label>
            <input
              type="url"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 2. Statutory & Tax KYC */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <VerifiedUserOutlined fontSize="small" className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">2. Tax Compliance & KYC</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">GSTIN (GST Identification Number)</label>
            <input
              type="text"
              required
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-mono focus:outline-hidden focus:border-primary uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Business PAN Number</label>
            <input
              type="text"
              value={businessPan}
              onChange={(e) => setBusinessPan(e.target.value)}
              placeholder="e.g. ABCDE1234F"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-mono focus:outline-hidden focus:border-primary uppercase"
            />
          </div>
        </div>
      </div>

      {/* 3. Bank Account Information */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <AccountBalanceOutlined fontSize="small" className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">3. Bank Account for Settlements</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Account Holder Name</label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="As on passbook"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank, ICICI Bank"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Bank account number"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-mono focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">IFSC Code</label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="e.g. HDFC0001234"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground font-mono focus:outline-hidden focus:border-primary uppercase"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Account Branch</label>
            <input
              type="text"
              value={accountBranch}
              onChange={(e) => setAccountBranch(e.target.value)}
              placeholder="e.g. Connaught Place, New Delhi"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
