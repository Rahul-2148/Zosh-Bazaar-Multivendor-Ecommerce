import React, { useState } from "react";
import {
  PersonOutline,
  EditOutlined,
  CheckCircle,
  EmailOutlined,
  PhoneOutlined,
  CalendarTodayOutlined,
  TranslateOutlined,
  WcOutlined,
  Close,
} from "@mui/icons-material";
import {
  Button,
  Modal,
  Box,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  updateUserProfile,
  updateUserPreferences,
} from "../../../Redux Toolkit/features/customer/UserSlice";

export const ProfileView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [mobile, setMobile] = useState(String(user?.mobile || ""));
  const [gender, setGender] = useState<string>(user?.gender || "OTHER");
  const [dateOfBirth, setDateOfBirth] = useState<string>(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [language, setLanguage] = useState<string>(
    user?.preferences?.language || "English"
  );

  const handleOpenEdit = () => {
    setFullName(user?.fullName || "");
    setMobile(String(user?.mobile || ""));
    setGender(user?.gender || "OTHER");
    setDateOfBirth(
      user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
    );
    setLanguage(user?.preferences?.language || "English");
    setErrorMsg(null);
    setSuccessMsg(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await dispatch(
        updateUserProfile({
          jwt,
          data: {
            fullName: fullName.trim(),
            mobile: Number(mobile) || undefined,
            gender: gender as any,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          },
        })
      ).unwrap();

      await dispatch(
        updateUserPreferences({
          language,
        })
      ).unwrap();

      setSuccessMsg("Profile details updated successfully!");
      setTimeout(() => {
        setEditOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Personal Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal identity, contact details, and language preferences
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditOutlined />}
          onClick={handleOpenEdit}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
        >
          Edit Profile
        </Button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-muted/20 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-2xl font-black text-primary shadow-xs shrink-0">
          {initials}
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-xl font-bold text-foreground">{user?.fullName || "Valued Customer"}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
              <CheckCircle sx={{ fontSize: 13 }} /> Verified Account
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Role: <span className="font-semibold text-foreground">{user?.role === "ROLE_ADMIN" ? "Platform Administrator" : "Marketplace Member"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Customer ID: <span className="font-mono font-semibold text-foreground">{user?._id || "N/A"}</span>
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <PersonOutline sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Full Name</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.fullName || "Not provided"}</p>
          </div>
        </div>

        {/* Email Address */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <EmailOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Email Address</p>
            <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{user?.email || "Not provided"}</p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle sx={{ fontSize: 11 }} /> Primary Verified
            </span>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <PhoneOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.mobile ? `+91 ${user.mobile}` : "Not provided"}</p>
          </div>
        </div>

        {/* Gender */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <WcOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Gender</p>
            <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">
              {user?.gender ? user.gender.toLowerCase() : "Not specified"}
            </p>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <CalendarTodayOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {user?.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Not provided"}
            </p>
          </div>
        </div>

        {/* Preferred Language */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card flex items-start gap-3">
          <TranslateOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">Preferred Language</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {user?.preferences?.language || "English (Default)"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => !loading && setEditOpen(false)}
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
            width: { xs: "94%", sm: 500 },
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
                <PersonOutline sx={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Edit Profile Information
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Update your identity details across Zosh Bazaar
                </p>
              </div>
            </div>
            <IconButton size="small" onClick={() => setEditOpen(false)} disabled={loading} aria-label="Close modal">
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
              <Alert severity="success" sx={{ borderRadius: "0.75rem", fontSize: 12, mb: 0.5 }}>
                {successMsg}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              size="small"
              required
            />

            <TextField
              fullWidth
              label="10-Digit Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              size="small"
              placeholder="9876543210"
              helperText="Used for order tracking SMS and delivery updates"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                fullWidth
                select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                size="small"
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </div>

            <TextField
              fullWidth
              select
              label="Preferred Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              size="small"
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Hindi">हिन्दी (Hindi)</MenuItem>
              <MenuItem value="Bengali">বাংলা (Bengali)</MenuItem>
              <MenuItem value="Tamil">தமிழ் (Tamil)</MenuItem>
              <MenuItem value="Telugu">తెలుగు (Telugu)</MenuItem>
            </TextField>
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setEditOpen(false)}
              disabled={loading}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};
export default ProfileView;
