import React, { useState } from "react";
import {
  Button,
  Modal,
  Box,
  TextField,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import { EditOutlined, Close, VerifiedUser } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateUserProfile } from "../../../Redux Toolkit/features/customer/UserSlice";
import ProfileFieldCard from "./ProfileFieldCard";

const UserDetails = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.fullName || "");
  const [mobile, setMobile] = useState(String(user?.mobile || ""));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenEdit = () => {
    setName(user?.fullName || "");
    setMobile(String(user?.mobile || ""));
    setSuccessMsg(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    await dispatch(
      updateUserProfile({
        jwt,
        data: {
          fullName: name.trim(),
          mobile: Number(mobile) || undefined,
        },
      })
    );

    setSuccessMsg("Profile updated successfully!");
    setTimeout(() => {
      setEditOpen(false);
      setSuccessMsg(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal profile and primary contact details
          </p>
        </div>
        <Button
          variant="outlined"
          startIcon={<EditOutlined />}
          onClick={handleOpenEdit}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem" }}
        >
          Edit Profile
        </Button>
      </div>

      <div className="space-y-4">
        <ProfileFieldCard keys="Full Name" value={user?.fullName || "Not provided"} />
        <ProfileFieldCard keys="Email Address" value={user?.email || "Not provided"} />
        <ProfileFieldCard
          keys="Primary Phone"
          value={user?.mobile ? String(user?.mobile) : "Not provided"}
        />
        <ProfileFieldCard
          keys="Account Tier"
          value={
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <VerifiedUser sx={{ fontSize: 16 }} />
              <span>{user?.role === "ROLE_ADMIN" ? "Administrator" : "Marketplace Member"}</span>
            </div>
          }
        />
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 440 },
            bgcolor: "background.paper",
            borderRadius: "1rem",
            boxShadow: 24,
            p: 3.5,
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
            <Typography variant="h6" fontWeight="700">
              Edit Profile
            </Typography>
            <IconButton size="small" onClick={() => setEditOpen(false)}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, fontSize: "12px", borderRadius: "0.5rem" }}>
              {successMsg}
            </Alert>
          )}

          <div className="flex flex-col gap-4.5">
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Email Address"
              value={user?.email || ""}
              size="small"
              disabled
              helperText="Email cannot be changed directly"
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              size="small"
              inputProps={{ maxLength: 10 }}
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setEditOpen(false)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSave}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem" }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default UserDetails;
