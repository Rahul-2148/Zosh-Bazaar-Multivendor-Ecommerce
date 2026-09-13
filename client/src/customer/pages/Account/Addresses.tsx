import React, { useState } from "react";
import {
  Button,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import {
  LocationOnOutlined,
  AddLocationAltOutlined,
  DeleteOutline,
  EditOutlined,
  CheckCircle,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from "../../../Redux Toolkit/features/customer/UserSlice";
import { syncWithSavedAddresses } from "../../../Redux Toolkit/features/customer/LocationSlice";
import AppDialog from "../../../common/layout/AppDialog";

export const Addresses: React.FC = () => {
  const dispatch = useAppDispatch();
  const { addresses } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      mobile: "",
      address: "",
      locality: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr: any) => {
    setEditingId(addr._id);
    setForm({
      name: addr.name || "",
      mobile: String(addr.mobile || ""),
      address: addr.address || "",
      locality: addr.locality || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: String(addr.pincode || ""),
      country: addr.country || "India",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.address || !form.city || !form.pincode) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.pincode.trim().length !== 6 || !/^\d+$/.test(form.pincode)) {
      setFormError("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    const payload = {
      ...form,
      mobile: Number(form.mobile) || form.mobile,
      pincode: Number(form.pincode) || form.pincode,
    };

    if (editingId) {
      const res = await dispatch(
        updateUserAddress({ jwt, addressId: editingId, address: payload })
      );
      if (updateUserAddress.fulfilled.match(res)) {
        dispatch(syncWithSavedAddresses(res.payload?.addresses || addresses));
      }
    } else {
      const res = await dispatch(addUserAddress({ jwt, address: payload }));
      if (addUserAddress.fulfilled.match(res)) {
        dispatch(syncWithSavedAddresses(res.payload?.addresses || addresses));
      }
    }

    setModalOpen(false);
  };

  const handleDelete = async (addressId: string) => {
    if (window.confirm("Are you sure you want to remove this delivery address?")) {
      const res = await dispatch(deleteUserAddress({ jwt, addressId }));
      if (deleteUserAddress.fulfilled.match(res)) {
        dispatch(syncWithSavedAddresses(res.payload?.addresses || []));
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    const res = await dispatch(setDefaultUserAddress({ jwt, addressId }));
    if (setDefaultUserAddress.fulfilled.match(res)) {
      dispatch(syncWithSavedAddresses(res.payload?.addresses || addresses));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Saved Delivery Addresses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal shipping destinations for faster checkout
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddLocationAltOutlined />}
          onClick={handleOpenAdd}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
        >
          Add New Address
        </Button>
      </div>

      {(!addresses || addresses.length === 0) ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <LocationOnOutlined sx={{ fontSize: 44 }} className="text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No addresses saved yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Save your home or office address to enable instant 1-click checkout.
          </p>
          <Button
            variant="outlined"
            onClick={handleOpenAdd}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr: any) => (
            <div
              key={addr._id}
              className={`p-5 rounded-2xl border bg-card text-card-foreground shadow-xs transition-colors flex flex-col justify-between ${
                addr.isDefault ? "border-primary/60 bg-primary/[0.02]" : "border-border/80 hover:border-primary/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground">{addr.name}</h3>
                      {addr.isDefault && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle sx={{ fontSize: 11 }} />
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                      {addr.addressType || "HOME / DELIVERY"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(addr)}
                      aria-label="Edit address"
                    >
                      <EditOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(addr._id)}
                      aria-label="Delete address"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <DeleteOutline sx={{ fontSize: 16 }} />
                    </IconButton>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {addr.address}
                  {addr.locality && `, ${addr.locality}`}
                  <br />
                  {addr.city}, {addr.state} —{" "}
                  <span className="font-bold text-foreground">{addr.pincode}</span>
                </p>

                <p className="text-xs font-semibold text-foreground mt-2">
                  📞 Mobile: {addr.mobile}
                </p>
              </div>

              {!addr.isDefault && (
                <div className="pt-3 mt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr._id)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Set as Default Delivery Address
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Standardized Responsive Address Form Dialog */}
      <AppDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Delivery Address" : "Add New Delivery Address"}
        subtitle="Fill in accurate details for seamless order dispatch"
        icon={<LocationOnOutlined sx={{ fontSize: 20 }} />}
        maxWidth="sm"
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setModalOpen(false)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {editingId ? "Update Address" : "Save Address"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <Alert severity="error" sx={{ mb: 0.5, fontSize: "12px", borderRadius: "0.5rem" }}>
              {formError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="small"
              required
            />
            <TextField
              fullWidth
              label="10-Digit Mobile Number"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              size="small"
              required
              placeholder="9876543210"
            />
          </div>

          <TextField
            fullWidth
            label="Flat, House No, Building, Street"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            size="small"
            required
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Locality / Area / Landmark"
            value={form.locality}
            onChange={(e) => setForm({ ...form, locality: e.target.value })}
            size="small"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="City / District"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              size="small"
              required
            />
            <TextField
              fullWidth
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              size="small"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="Pincode (6 digits)"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              size="small"
              required
              inputProps={{ maxLength: 6 }}
            />
            <TextField
              fullWidth
              label="Country"
              value={form.country}
              size="small"
              disabled
            />
          </div>
        </div>
      </AppDialog>
    </div>
  );
};

export default Addresses;
