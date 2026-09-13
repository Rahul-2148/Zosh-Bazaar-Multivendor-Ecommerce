import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from "@mui/material";
import {
  DevicesOutlined,
  LaptopOutlined,
  SmartphoneOutlined,
  TabletAndroidOutlined,
  LocationOnOutlined,
  AccessTimeOutlined,
  SecurityOutlined,
  LogoutOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  ShieldOutlined,
  WarningAmberOutlined,
  Close,
} from "@mui/icons-material";
import { Api } from "../../../config/Api";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { performLogout } from "../../../Redux Toolkit/features/Auth/AuthSlice";
import { getCustomerSocket } from "../../../utils/socket";
import { useSnackbar } from "../../../common/SnackbarProvider";

export interface IDeviceSession {
  _id: string;
  sessionId: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent?: boolean;
}

const getClientSessionId = (): string => {
  let id = localStorage.getItem("zosh_session_id");
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("zosh_session_id", id);
  }
  return id;
};

const detectClientDevice = () => {
  const ua = navigator.userAgent;
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  let deviceName = "Personal Computer";
  let browser = "Chrome";
  let os = "Windows";

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = "tablet";
    deviceName = "Tablet Device";
  } else if (/mobile|iphone|android|touch/i.test(ua)) {
    deviceType = "mobile";
    deviceName = /iphone/i.test(ua) ? "Apple iPhone" : "Android Smartphone";
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceName = "Apple Mac";
  } else if (/windows/i.test(ua)) {
    deviceName = "Windows PC";
  }

  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";

  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { deviceType, deviceName, browser, os };
};

export const SessionsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((store) => store.user);
  const { showSnackbar } = useSnackbar();

  const [sessions, setSessions] = useState<IDeviceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState<boolean>(false);
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentSessionId = useMemo(() => getClientSessionId(), []);

  // Fetch active sessions from server
  const fetchSessions = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setErrorMsg(null);

      try {
        const clientInfo = detectClientDevice();
        // Register / heartbeat current session
        await Api.post(
          "/account/sessions/heartbeat",
          {
            sessionId: currentSessionId,
            ...clientInfo,
            location: "Current Location",
          },
          {
            headers: { "x-session-id": currentSessionId },
          }
        );

        // Fetch all active sessions
        const res = await Api.get("/account/sessions", {
          headers: { "x-session-id": currentSessionId },
        });

        if (res.data?.success && res.data?.sessions) {
          const list: IDeviceSession[] = res.data.sessions;
          setSessions(list);
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || "Failed to load active device sessions.");
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [currentSessionId]
  );

  // Initial fetch and register
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time Socket.io listener for remote revocations
  useEffect(() => {
    if (!user?._id) return;
    const socket = getCustomerSocket(user._id);

    const handleSessionRevoked = (data: {
      sessionId: string | null;
      allOthers: boolean;
      currentSessionId?: string;
    }) => {
      // 1. If this device's session was revoked by another device
      if (data.sessionId === currentSessionId || (data.allOthers && data.currentSessionId !== currentSessionId)) {
        showSnackbar("Your session was terminated from another device. Logging out...", "warning");
        setTimeout(() => {
          dispatch(performLogout());
          window.location.href = "/login";
        }, 1200);
        return;
      }

      // 2. If another device was revoked, update our list in real time
      if (data.sessionId) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== data.sessionId));
        showSnackbar("A device session was successfully revoked in real time.", "info");
      } else if (data.allOthers) {
        setSessions((prev) => prev.filter((s) => s.sessionId === currentSessionId));
        showSnackbar("All other device sessions have been revoked in real time.", "info");
      }
    };

    socket.on("session:revoked", handleSessionRevoked);

    return () => {
      socket.off("session:revoked", handleSessionRevoked);
    };
  }, [user?._id, currentSessionId, dispatch, showSnackbar]);

  // Revoke a single session
  const handleRevokeSingle = async (targetSessionId: string, deviceName: string) => {
    setRevokingId(targetSessionId);
    try {
      await Api.delete(`/account/sessions/${targetSessionId}`, {
        headers: { "x-session-id": currentSessionId },
      });
      setSessions((prev) => prev.filter((s) => s.sessionId !== targetSessionId));
      showSnackbar(`Logged out from ${deviceName}`, "success");
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || "Failed to terminate session", "error");
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOthers = async () => {
    setRevokingAll(true);
    try {
      await Api.post(
        "/account/sessions/revoke-others",
        { currentSessionId },
        {
          headers: { "x-session-id": currentSessionId },
        }
      );
      setSessions((prev) => prev.filter((s) => s.sessionId === currentSessionId));
      showSnackbar("Logged out from all other devices successfully!", "success");
      setConfirmRevokeAllOpen(false);
    } catch (err: any) {
      showSnackbar(err.response?.data?.message || "Failed to log out of other devices", "error");
    } finally {
      setRevokingAll(false);
    }
  };

  const currentSession = useMemo(
    () => sessions.find((s) => s.sessionId === currentSessionId || s.isCurrent) || sessions[0],
    [sessions, currentSessionId]
  );

  const otherSessions = useMemo(
    () => sessions.filter((s) => s.sessionId !== currentSession?.sessionId),
    [sessions, currentSession]
  );

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case "mobile":
        return <SmartphoneOutlined sx={{ fontSize: 24 }} className="text-primary" />;
      case "tablet":
        return <TabletAndroidOutlined sx={{ fontSize: 24 }} className="text-primary" />;
      default:
        return <LaptopOutlined sx={{ fontSize: 24 }} className="text-primary" />;
    }
  };

  const formatLastActive = (dateStr: string) => {
    if (!dateStr) return "Active recently";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "Active now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays === 1) return "Active yesterday";
    return `Active on ${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Live Badge and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-foreground">
              Manage Devices & Active Sessions
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review all phones, tablets, and computers currently authenticated with your account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchSessions(true)}
            disabled={loading || refreshing}
            startIcon={
              refreshing ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <RefreshOutlined sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "0.65rem",
            }}
          >
            {refreshing ? "Syncing..." : "Sync Live"}
          </Button>

          {otherSessions.length > 0 && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => setConfirmRevokeAllOpen(true)}
              disabled={loading || revokingAll}
              startIcon={<LogoutOutlined sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "0.65rem",
                boxShadow: "none",
              }}
            >
              Log Out Other Devices ({otherSessions.length})
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: "0.75rem", fontSize: 12 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Flipkart-grade Security Advisory Notice */}
      <div className="p-4 rounded-2xl border border-primary/25 bg-primary/5 flex items-start gap-3.5">
        <ShieldOutlined className="text-primary mt-0.5 shrink-0" sx={{ fontSize: 22 }} />
        <div className="flex-1 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground mb-0.5">
            Signed in to {sessions.length} active {sessions.length === 1 ? "device" : "devices"}
          </p>
          <span>
            Just like Flipkart & Amazon device protection, if you notice any unfamiliar smartphone,
            cyber café PC, or unusual location, click <strong>"Log Out"</strong> immediately to revoke access and reset your password.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CircularProgress size={32} />
          <p className="text-xs text-muted-foreground font-medium">
            Fetching secure active device sessions...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ================= SECTION 1: CURRENT DEVICE ================= */}
          {currentSession && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircleOutlined sx={{ fontSize: 16 }} className="text-emerald-500" />
                <span>Current Device (This Session)</span>
              </h3>

              <div className="p-5 rounded-2xl border-2 border-primary/60 bg-primary/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {getDeviceIcon(currentSession.deviceType)}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">
                        {currentSession.deviceName}
                      </h4>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                        Current Session • Active Now
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground">
                      {currentSession.browser} on {currentSession.os}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <LocationOnOutlined sx={{ fontSize: 14 }} className="text-primary" />
                        {currentSession.location || "Bengaluru, India"}
                      </span>
                      <span>• IP: {currentSession.ipAddress || "103.15.224.78"}</span>
                      <span className="flex items-center gap-1">
                        <AccessTimeOutlined sx={{ fontSize: 14 }} />
                        Signed in: {new Date(currentSession.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-background/80 px-3 py-1.5 rounded-xl border border-border">
                    🔒 This Device
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: OTHER LOGGED-IN DEVICES ================= */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <DevicesOutlined sx={{ fontSize: 16 }} className="text-primary" />
                <span>Other Logged-In Devices ({otherSessions.length})</span>
              </h3>

              {otherSessions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Can be revoked individually
                </span>
              )}
            </div>

            {otherSessions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border bg-card/60 flex flex-col items-center justify-center text-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <SecurityOutlined sx={{ fontSize: 20 }} />
                </div>
                <p className="text-xs font-bold text-foreground">
                  No other active device sessions
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm">
                  You are currently logged in only on this device. When you log in on mobile apps or other browsers, they will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {otherSessions.map((session) => (
                  <div
                    key={session.sessionId || session._id}
                    className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 mt-0.5">
                        {getDeviceIcon(session.deviceType)}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">
                            {session.deviceName}
                          </h4>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {formatLastActive(session.lastActive)}
                          </span>
                        </div>

                        <p className="text-xs text-foreground font-medium">
                          {session.browser} on {session.os}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <LocationOnOutlined sx={{ fontSize: 13 }} />
                            {session.location || "India"}
                          </span>
                          <span>• IP: {session.ipAddress || "103.xxx.xxx"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:justify-end">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={revokingId === session.sessionId}
                        onClick={() => handleRevokeSingle(session.sessionId, session.deviceName)}
                        startIcon={
                          revokingId === session.sessionId ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <LogoutOutlined sx={{ fontSize: 14 }} />
                          )
                        }
                        sx={{
                          textTransform: "none",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "0.65rem",
                          px: 2.5,
                        }}
                      >
                        {revokingId === session.sessionId ? "Revoking..." : "Log Out"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Revoke All Other Sessions */}
      <Dialog
        open={confirmRevokeAllOpen}
        onClose={() => !revokingAll && setConfirmRevokeAllOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "1.25rem",
              bgcolor: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-rose-600">
            <WarningAmberOutlined />
            <span className="text-base font-bold text-foreground">Log Out All Other Devices?</span>
          </div>
          <IconButton size="small" onClick={() => setConfirmRevokeAllOpen(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent className="flex flex-col gap-3 pt-2 text-xs text-muted-foreground">
          <p>
            You are about to terminate all <strong>{otherSessions.length} active sessions</strong> on other computers, tablets, and smartphones.
          </p>
          <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold">
            Those devices will be logged out in real time immediately and will require signing in again.
          </p>
        </DialogContent>

        <DialogActions className="px-5 pb-4 pt-2">
          <Button
            variant="outlined"
            onClick={() => setConfirmRevokeAllOpen(false)}
            disabled={revokingAll}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRevokeAllOthers}
            disabled={revokingAll}
            startIcon={revokingAll ? <CircularProgress size={16} color="inherit" /> : <LogoutOutlined />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem", px: 2.5 }}
          >
            {revokingAll ? "Logging out..." : "Yes, Log Out All"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SessionsView;
