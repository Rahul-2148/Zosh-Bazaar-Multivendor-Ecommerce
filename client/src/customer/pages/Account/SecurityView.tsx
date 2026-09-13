import React, { useState, useMemo } from "react";
import {
  ShieldOutlined,
  KeyOutlined,
  LockOutlined,
  DevicesOutlined,
  CheckCircle,
  VisibilityOutlined,
  VisibilityOffOutlined,
  CheckCircleOutline,
  Close,
  ArrowForwardOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  Box,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Switch,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { changeUserPassword } from "../../../Redux Toolkit/features/customer/UserSlice";

export const SecurityView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((store) => store.user);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Two-Factor Authentication simulated toggle
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? false);

  // Detect current client device info
  const deviceInfo = useMemo(() => {
    const ua = navigator.userAgent;
    let os = "Desktop";
    if (/Windows/i.test(ua)) os = "Windows PC";
    else if (/Mac/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android Device";
    else if (/iPhone|iPad/i.test(ua)) os = "Apple iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Web Browser";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Google Chrome";
    else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Apple Safari";
    else if (/Edg/i.test(ua)) browser = "Microsoft Edge";

    return { os, browser };
  }, []);

  // Password strength calculator
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "None", color: "bg-muted" };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score: 33, label: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { score: 66, label: "Moderate", color: "bg-amber-500" };
    return { score: 100, label: "Strong", color: "bg-emerald-500" };
  }, [newPassword]);

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async () => {
    setErrorMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        changeUserPassword({
          currentPassword,
          newPassword,
        })
      ).unwrap();

      setSuccessMsg("Password updated successfully!");
      setTimeout(() => {
        setPasswordModalOpen(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b border-border/80">
        <h2 className="text-xl font-bold text-foreground">Login & Account Security</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Protect your account credentials, password policies, and authenticated devices
        </p>
      </div>

      {/* Security Health Card */}
      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-4">
        <ShieldOutlined sx={{ fontSize: 24 }} className="text-emerald-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Your Account Security Status: High</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your login email is verified and protected with bcrypt cryptographic hashing. Keep your credentials safe and avoid sharing passwords.
          </p>
        </div>
      </div>

      {/* Security Items */}
      <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
        {/* Password */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <KeyOutlined sx={{ fontSize: 22 }} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Account Password</p>
              <p className="text-xs text-muted-foreground">
                •••••••••••• (Encrypted with secure one-way salt)
              </p>
            </div>
          </div>
          <Button
            variant="outlined"
            onClick={handleOpenPasswordModal}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
          >
            Change Password
          </Button>
        </div>

        {/* 2FA */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <LockOutlined sx={{ fontSize: 22 }} className="text-primary mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {twoFactor ? "Enabled" : "Optional"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Require a confirmation code whenever you sign in from an unrecognized device
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactor}
            onChange={(e) => setTwoFactor(e.target.checked)}
            color="primary"
          />
        </div>

        {/* Email Verification */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle sx={{ fontSize: 22 }} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Email Authentication</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle sx={{ fontSize: 11 }} /> Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.email} is your registered primary account identifier
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Device Sessions */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <DevicesOutlined sx={{ fontSize: 18 }} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Active Device Sessions (Real-Time)
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Devices and browsers currently authenticated with your ZoshBazaar credentials.
            </p>
          </div>

          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/account/sessions")}
            endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 700, borderRadius: "0.65rem" }}
          >
            Manage All Devices
          </Button>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <DevicesOutlined sx={{ fontSize: 24 }} className="text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">
                  {deviceInfo.os} &bull; {deviceInfo.browser}
                </p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.2 rounded-full">
                  Current Session
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Active now &bull; Secure JWT Session &bull; Realtime Socket Protection
              </p>
            </div>
          </div>

          <Button
            variant="text"
            size="small"
            onClick={() => navigate("/account/sessions")}
            sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
          >
            View Details
          </Button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={passwordModalOpen}
        onClose={() => !loading && setPasswordModalOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "94%", sm: 460 },
            maxHeight: { xs: "92vh", sm: "88vh" },
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            borderRadius: { xs: "1rem", sm: "1.25rem" },
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyOutlined sx={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Change Password
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Protect your account with a strong, unique password
                </p>
              </div>
            </div>
            <IconButton size="small" onClick={() => setPasswordModalOpen(false)} disabled={loading} aria-label="Close modal">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5">
            {errorMsg && (
              <Alert severity="error" sx={{ borderRadius: "0.75rem", fontSize: 12, mb: 0.5 }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert
                icon={<CheckCircleOutline fontSize="inherit" />}
                severity="success"
                sx={{ borderRadius: "0.75rem", fontSize: 12, mb: 0.5 }}
              >
                {successMsg}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              size="small"
              required
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={() => setShowCurrent(!showCurrent)} edge="end">
                    {showCurrent ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                  </IconButton>
                ),
              }}
            />

            <div>
              <TextField
                fullWidth
                label="New Password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="small"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowNew(!showNew)} edge="end">
                      {showNew ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                    </IconButton>
                  ),
                }}
              />
              {newPassword && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Password Strength:</span>
                    <span className="font-bold text-foreground">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="small"
              required
            />
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setPasswordModalOpen(false)}
              disabled={loading}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              disabled={loading}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Update Password"}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};
export default SecurityView;
