import React, { useState, useEffect } from "react";
import {
  DownloadOutlined,
  DeleteForeverOutlined,
  WarningAmberOutlined,
  Close,
  PauseCircleOutlined,
  CheckCircleOutlined,
  TimerOutlined,
  SupportAgentOutlined,
  ArrowForward,
  LockOutlined,
  ShieldOutlined,
  CancelOutlined,
} from "@mui/icons-material";
import {
  Button,
  Modal,
  Box,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  downloadUserData,
  updateUserPreferences,
  deactivateAccount,
  requestAccountDeletion,
  sendDeletionOTP,
  verifyDeletionOTP,
  confirmAccountDeletion,
  cancelAccountDeletion,
  getDeletionStatus,
  getLifecycleConfig,
  submitSupportDeletionRequest,
} from "../../../Redux Toolkit/features/customer/UserSlice";
import { performLogout } from "../../../Redux Toolkit/features/Auth/AuthSlice";

// ── Styles ──────────────────────────────────────────────
const modalBoxStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "92vw", sm: 520 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "var(--card-bg, #fff)",
  borderRadius: "16px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
  p: { xs: 2.5, sm: 4 },
};

// ── Deletion Flow Steps ──────────────────────────────────
const DELETION_STEPS = ["Select Reason", "Verify Identity", "Confirm Deletion"];

export const PrivacyView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((store) => store.user);

  // Config
  const [config, setConfig] = useState<any>(null);

  // Privacy toggles
  const [personalization, setPersonalization] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Deactivation
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Deletion lifecycle
  const [deletionStatus, setDeletionStatus] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [deletionReason, setDeletionReason] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<any[]>([]);

  // Customer care fallback
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportReason, setSupportReason] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportResult, setSupportResult] = useState<any>(null);

  // Load config + deletion status on mount
  useEffect(() => {
    dispatch(getLifecycleConfig()).unwrap().then((r: any) => setConfig(r.config)).catch(() => {});
    dispatch(getDeletionStatus()).unwrap().then((r: any) => setDeletionStatus(r)).catch(() => {});
  }, [dispatch]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // ── Handlers ──────────────────────────────────────────

  const handleTogglePersonalization = async (checked: boolean) => {
    setPersonalization(checked);
    await dispatch(updateUserPreferences({ theme: user?.preferences?.theme || "system" }));
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const res = await dispatch(downloadUserData()).unwrap();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `zoshbazaar_account_data_${Date.now()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { /* ignore */ }
    setDownloading(false);
  };

  // Deactivation
  const handleDeactivate = async () => {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await dispatch(deactivateAccount(deactivateReason)).unwrap();
      setDeactivateOpen(false);
      dispatch(performLogout());
      navigate("/");
    } catch (err: any) {
      setDeactivateError(err?.message || "Deactivation failed");
    }
    setDeactivating(false);
  };

  // Deletion Step 1: Request
  const handleRequestDeletion = async () => {
    setLoading(true);
    setError(null);
    setBlockers([]);
    try {
      const res = await dispatch(requestAccountDeletion(deletionReason)).unwrap();
      if (res.eligible) {
        setActiveStep(1);
      } else {
        setBlockers(res.blockers || []);
        setError("Account deletion is currently blocked. Please resolve the issues below.");
      }
    } catch (err: any) {
      setError(err?.message || "Request failed");
    }
    setLoading(false);
  };

  // Deletion Step 2: Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dispatch(sendDeletionOTP()).unwrap();
      setOtpSent(true);
      setOtpCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  // Deletion Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      await dispatch(verifyDeletionOTP(otp)).unwrap();
      setActiveStep(2);
      setSuccessMsg("Identity verified. Please confirm deletion.");
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    }
    setLoading(false);
  };

  // Deletion Step 3: Confirm
  const handleConfirmDeletion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dispatch(confirmAccountDeletion()).unwrap();
      setSuccessMsg(res.message);
      setDeleteOpen(false);
      // Refresh status
      dispatch(getDeletionStatus()).unwrap().then((r: any) => setDeletionStatus(r)).catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Confirmation failed");
    }
    setLoading(false);
  };

  // Cancel deletion
  const handleCancelDeletion = async () => {
    setLoading(true);
    setError(null);
    try {
      await dispatch(cancelAccountDeletion()).unwrap();
      setDeletionStatus(null);
      setSuccessMsg("Deletion cancelled. Your account is fully active.");
    } catch (err: any) {
      setError(err?.message || "Cancellation failed");
    }
    setLoading(false);
  };

  // Customer care
  const handleSupportRequest = async () => {
    setSupportLoading(true);
    try {
      const res = await dispatch(submitSupportDeletionRequest(supportReason)).unwrap();
      setSupportResult(res);
    } catch (err: any) {
      setError(err?.message || "Support request failed");
    }
    setSupportLoading(false);
  };

  const gracePeriodDays = config?.gracePeriodDays || 14;
  const hasPendingDeletion = deletionStatus?.hasPendingDeletion;
  const daysRemaining = deletionStatus?.daysRemaining;

  return (
    <div className="account-privacy-view">
      {/* Success message banner */}
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2, borderRadius: "12px" }}>
          {successMsg}
        </Alert>
      )}

      {/* ── Pending Deletion Banner ─────────────────────── */}
      {hasPendingDeletion && (
        <div style={{
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          border: "1px solid #fca5a5",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TimerOutlined style={{ color: "#dc2626", fontSize: 28 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 16 }}>
                Account Deletion Scheduled
              </div>
              <div style={{ color: "#7f1d1d", fontSize: 13, marginTop: 2 }}>
                Your account will be permanently deleted in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>.
                You can cancel anytime before then.
              </div>
            </div>
          </div>
          <Button
            variant="contained"
            startIcon={<CancelOutlined />}
            onClick={handleCancelDeletion}
            disabled={loading}
            sx={{
              alignSelf: "flex-start",
              bgcolor: "#16a34a",
              "&:hover": { bgcolor: "#15803d" },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {loading ? <CircularProgress size={20} /> : "Cancel Deletion & Keep Account"}
          </Button>
        </div>
      )}

      {/* ── Data & Personalization ─────────────────────── */}
      <div className="privacy-section" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <ShieldOutlined style={{ color: "var(--accent, #6366f1)" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Data & Personalization</h3>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 18px", background: "var(--surface-bg, #f8f9fa)", borderRadius: 12, marginBottom: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Personalized Recommendations</div>
            <div style={{ fontSize: 12, color: "var(--text-muted, #888)", marginTop: 2 }}>
              Allow us to personalize your shopping experience
            </div>
          </div>
          <Switch checked={personalization} onChange={(_, c) => handleTogglePersonalization(c)} />
        </div>

        <Button
          variant="outlined"
          startIcon={downloading ? <CircularProgress size={16} /> : <DownloadOutlined />}
          onClick={handleDownloadData}
          disabled={downloading}
          fullWidth
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.2,
            borderColor: "var(--border-color, #e0e0e0)",
            color: "var(--text-primary, #1a1a1a)",
          }}
        >
          {downloading ? "Preparing Download..." : "Download My Data"}
        </Button>
      </div>

      {/* ── Deactivate Account ─────────────────────────── */}
      {!hasPendingDeletion && (
        <div style={{
          padding: "18px 20px",
          background: "var(--surface-bg, #f8f9fa)",
          borderRadius: 14,
          marginBottom: 16,
          border: "1px solid var(--border-color, #e5e7eb)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <PauseCircleOutlined style={{ color: "#f59e0b" }} />
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Deactivate Account</h4>
            <Chip label="Reversible" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600, fontSize: 11, height: 22 }} />
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted, #666)", margin: "0 0 14px 0", lineHeight: 1.5 }}>
            Temporarily pause your account. Your data stays safe and you can reactivate anytime by signing in.
          </p>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setDeactivateOpen(true)}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13 }}
          >
            Deactivate My Account
          </Button>
        </div>
      )}

      {/* ── Delete Account ─────────────────────────────── */}
      {!hasPendingDeletion && (
        <div style={{
          padding: "18px 20px",
          background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
          borderRadius: 14,
          border: "1px solid #fecaca",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <DeleteForeverOutlined style={{ color: "#dc2626" }} />
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#dc2626" }}>Permanently Delete Account</h4>
            <Chip label="Irreversible" size="small" sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 600, fontSize: 11, height: 22 }} />
          </div>
          <p style={{ fontSize: 13, color: "#7f1d1d", margin: "0 0 6px 0", lineHeight: 1.5 }}>
            Permanently delete your account and all associated data. This action cannot be undone after the {gracePeriodDays}-day grace period.
          </p>
          <p style={{ fontSize: 12, color: "#991b1b", margin: "0 0 14px 0" }}>
            <strong>What gets deleted:</strong> Profile, addresses, cart, wishlist, saved items, notifications, sessions.
            <br />
            <strong>What's retained (anonymized):</strong> Order history, payment records (for legal compliance).
          </p>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteForeverOutlined />}
            onClick={() => { setDeleteOpen(true); setActiveStep(0); setError(null); setBlockers([]); setOtp(""); setOtpSent(false); }}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13 }}
          >
            Delete My Account
          </Button>

          {/* Customer Care fallback link */}
          {config?.enableCustomerCareFallback && (
            <Button
              size="small"
              startIcon={<SupportAgentOutlined />}
              onClick={() => setSupportOpen(true)}
              sx={{ ml: 1.5, textTransform: "none", fontSize: 12, color: "#6b7280" }}
            >
              Request via Customer Care
            </Button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
       *  DEACTIVATION MODAL
       * ════════════════════════════════════════════════ */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)}>
        <Box sx={modalBoxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
              <PauseCircleOutlined sx={{ mr: 1, verticalAlign: "middle", color: "#f59e0b" }} />
              Deactivate Account
            </h3>
            <IconButton onClick={() => setDeactivateOpen(false)} size="small"><Close /></IconButton>
          </div>

          <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
            Your account will be paused. You can reactivate anytime by signing back in.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Reason for deactivation</InputLabel>
            <Select
              value={deactivateReason}
              label="Reason for deactivation"
              onChange={(e) => setDeactivateReason(e.target.value)}
              sx={{ borderRadius: "10px" }}
            >
              {(config?.deactivationReasons || ["Taking a break", "Privacy concerns", "Other"]).map((r: string) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {deactivateError && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{deactivateError}</Alert>}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onClick={() => setDeactivateOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleDeactivate}
              disabled={deactivating || !deactivateReason}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
            >
              {deactivating ? <CircularProgress size={20} /> : "Deactivate"}
            </Button>
          </div>
        </Box>
      </Modal>

      {/* ══════════════════════════════════════════════════
       *  DELETION WIZARD MODAL
       * ════════════════════════════════════════════════ */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Box sx={modalBoxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#dc2626" }}>
              <DeleteForeverOutlined sx={{ mr: 1, verticalAlign: "middle" }} />
              Delete Account
            </h3>
            <IconButton onClick={() => setDeleteOpen(false)} size="small"><Close /></IconButton>
          </div>

          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {DELETION_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: 12, fontWeight: 600 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {loading && <LinearProgress color="error" sx={{ mb: 2, borderRadius: 1 }} />}
          {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: "10px" }}>{error}</Alert>}

          {/* Step 0: Select Reason */}
          {activeStep === 0 && (
            <div>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Why do you want to delete your account?</InputLabel>
                <Select
                  value={deletionReason}
                  label="Why do you want to delete your account?"
                  onChange={(e) => setDeletionReason(e.target.value)}
                  sx={{ borderRadius: "10px" }}
                >
                  {(config?.deletionReasons || ["No longer need the account", "Privacy concerns", "Other"]).map((r: string) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Blockers */}
              {blockers.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {blockers.map((b, i) => (
                    <Alert key={i} severity="warning" sx={{ mb: 1, borderRadius: "10px" }}>
                      <strong>{b.type.replace(/_/g, " ")}</strong>: {b.message}
                    </Alert>
                  ))}
                </div>
              )}

              <Alert severity="warning" icon={<WarningAmberOutlined />} sx={{ mb: 2, borderRadius: "10px" }}>
                <strong>This is permanent.</strong> After the {gracePeriodDays}-day grace period, all your personal data will be irreversibly deleted.
              </Alert>

              <Button
                fullWidth
                variant="contained"
                color="error"
                endIcon={<ArrowForward />}
                onClick={handleRequestDeletion}
                disabled={loading || !deletionReason}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, py: 1.3 }}
              >
                {loading ? <CircularProgress size={20} /> : "Check Eligibility & Continue"}
              </Button>
            </div>
          )}

          {/* Step 1: Verify Identity (OTP) */}
          {activeStep === 1 && (
            <div>
              <div style={{
                textAlign: "center",
                padding: "20px 0 16px",
              }}>
                <LockOutlined sx={{ fontSize: 48, color: "#dc2626", mb: 1 }} />
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Verify Your Identity</div>
                <div style={{ fontSize: 13, color: "var(--text-muted, #666)" }}>
                  We'll send a verification code to <strong>{user?.email}</strong>
                </div>
              </div>

              {!otpSent ? (
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={handleSendOTP}
                  disabled={loading}
                  sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, py: 1.3, mb: 1 }}
                >
                  {loading ? <CircularProgress size={20} /> : "Send Verification Code"}
                </Button>
              ) : (
                <div>
                  <Alert severity="success" sx={{ mb: 2, borderRadius: "10px" }}>
                    Verification code sent to your email.
                  </Alert>

                  <TextField
                    fullWidth
                    label="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputProps={{ maxLength: 6, style: { textAlign: "center", letterSpacing: 8, fontSize: 24, fontWeight: 700 } }}
                    sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    endIcon={<ArrowForward />}
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length < 6}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, py: 1.3, mb: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : "Verify & Continue"}
                  </Button>

                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={handleSendOTP}
                    disabled={loading || otpCooldown > 0}
                    sx={{ textTransform: "none", fontSize: 12 }}
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend Code"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Final Confirmation */}
          {activeStep === 2 && (
            <div>
              <div style={{
                textAlign: "center",
                padding: "16px 0",
                background: "#fef2f2",
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <WarningAmberOutlined sx={{ fontSize: 48, color: "#dc2626", mb: 1 }} />
                <div style={{ fontWeight: 800, fontSize: 18, color: "#dc2626" }}>Final Confirmation</div>
                <div style={{ fontSize: 13, color: "#7f1d1d", marginTop: 4, padding: "0 20px" }}>
                  After confirming, your account will be scheduled for permanent deletion.
                  You have <strong>{gracePeriodDays} days</strong> to change your mind.
                </div>
              </div>

              <div style={{
                background: "var(--surface-bg, #f9fafb)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>What happens next:</div>
                <div>✅ You can still use your account during the grace period</div>
                <div>✅ You can cancel deletion anytime before the deadline</div>
                <div>⚠️ After {gracePeriodDays} days, all personal data is permanently removed</div>
                <div>📦 Order history will be anonymized (not deleted) for compliance</div>
              </div>

              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleConfirmDeletion}
                disabled={loading}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, py: 1.3, mb: 1 }}
              >
                {loading ? <CircularProgress size={20} /> : `Yes, Delete After ${gracePeriodDays} Days`}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setDeleteOpen(false)}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
              >
                I Changed My Mind
              </Button>
            </div>
          )}
        </Box>
      </Modal>

      {/* ══════════════════════════════════════════════════
       *  CUSTOMER CARE MODAL
       * ════════════════════════════════════════════════ */}
      <Modal open={supportOpen} onClose={() => setSupportOpen(false)}>
        <Box sx={modalBoxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>
              <SupportAgentOutlined sx={{ mr: 1, verticalAlign: "middle", color: "#6366f1" }} />
              Delete via Customer Care
            </h3>
            <IconButton onClick={() => setSupportOpen(false)} size="small"><Close /></IconButton>
          </div>

          {!supportResult ? (
            <>
              <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
                Our Customer Care team will review your request and respond within 48 hours via email.
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for deletion (optional)"
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSupportRequest}
                disabled={supportLoading}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, py: 1.2, bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {supportLoading ? <CircularProgress size={20} /> : "Submit Request to Support"}
              </Button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircleOutlined sx={{ fontSize: 56, color: "#16a34a", mb: 1 }} />
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Request Submitted</div>
              <div style={{ fontSize: 13, color: "var(--text-muted, #666)", marginBottom: 12 }}>
                {supportResult.message}
              </div>
              <Chip label={`Reference: ${supportResult.referenceId}`} sx={{ fontWeight: 600, fontSize: 12 }} />
              <Button fullWidth variant="outlined" onClick={() => { setSupportOpen(false); setSupportResult(null); }} sx={{ mt: 2, borderRadius: "10px", textTransform: "none" }}>
                Close
              </Button>
            </div>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default PrivacyView;
