import React, { useState } from "react";
import {
  Popover,
  Drawer,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import {
  Close,
  LocationOn,
  MyLocation,
  HomeOutlined,
  WorkOutline,
  PlaceOutlined,
  CheckCircle,
  Add,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import {
  detectCurrentGpsLocation,
  selectSavedAddress,
  applyManualPincode,
  verifyPincodeServiceability,
  clearLocationError,
} from "../../Redux Toolkit/features/customer/LocationSlice";
import {
  setDefaultUserAddress,
  addUserAddress,
} from "../../Redux Toolkit/features/customer/UserSlice";

export interface LocationSelectorProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

/**
 * Responsive Location Selector (Flipkart/Amazon marketplace standards).
 * - Desktop: Compact, accessible Popover anchored to header location control.
 * - Mobile: Native-grade Bottom Sheet with safe-area padding.
 * - Enforces Priority Rule: Default Saved Address > Selected Address > Explicit GPS > Manual Pincode.
 * - Never shows raw "Detected Location".
 * - Completely eliminates unneeded "Popular Delivery Hubs" clutter.
 */
export const LocationSelector: React.FC<LocationSelectorProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { activeLocation, isDetectingGps, gpsError, serviceabilityStatus } =
    useAppSelector((store) => store.location);
  const { addresses } = useAppSelector((store) => store.user);
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const [manualPin, setManualPin] = useState("");
  const [loadingPin, setLoadingPin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Address Form State
  const [newAddr, setNewAddr] = useState({
    name: "",
    mobile: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "HOME",
    isDefault: false,
  });

  // Handle Explicit GPS Detection
  const handleUseCurrentLocation = async () => {
    setFormError(null);
    dispatch(clearLocationError());

    try {
      await dispatch(detectCurrentGpsLocation()).unwrap();
      onClose();
    } catch {
      // Error handled via Redux state gpsError
    }
  };

  // Handle Manual Pincode Verification
  const handleVerifyPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = manualPin.trim();
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      setFormError("Please enter a valid 6-digit postal code.");
      return;
    }

    setLoadingPin(true);
    setFormError(null);

    try {
      const res = await dispatch(verifyPincodeServiceability(pin)).unwrap();
      if (res.serviceable) {
        dispatch(
          applyManualPincode({
            pincode: pin,
            city: res.city || "Bengaluru",
            locality: res.locality || res.city || "Bengaluru",
          })
        );
        onClose();
      } else {
        setFormError(res.message || "Delivery currently unavailable for this pincode.");
      }
    } catch (err: any) {
      setFormError(err || "Failed to verify postal serviceability. Please try again.");
    } finally {
      setLoadingPin(false);
    }
  };

  // Handle Selecting a Saved Address
  const handleSelectAddress = (addr: any) => {
    dispatch(selectSavedAddress(addr));
    onClose();
  };

  // Handle Setting an Address as Default
  const handleSetDefault = async (e: React.MouseEvent, addrId: string) => {
    e.stopPropagation();
    if (jwt) {
      await dispatch(setDefaultUserAddress({ jwt, addressId: addrId }));
    }
  };

  // Handle Save New Quick Address
  const handleSaveQuickAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.mobile || !newAddr.address || !newAddr.city || !newAddr.pincode) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (newAddr.pincode.trim().length !== 6 || !/^\d+$/.test(newAddr.pincode.trim())) {
      setFormError("Please enter a valid 6-digit postal code.");
      return;
    }

    if (!jwt) {
      setFormError("Please log in to save shipping addresses to your account.");
      return;
    }

    try {
      const action = await dispatch(
        addUserAddress({
          jwt,
          address: {
            ...newAddr,
            mobile: Number(newAddr.mobile),
            pincode: Number(newAddr.pincode),
            country: "India",
          },
        })
      );

      if (addUserAddress.fulfilled.match(action)) {
        setShowAddForm(false);
        // Select the newly added address immediately
        dispatch(selectSavedAddress(action.payload));
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save address");
    }
  };

  const getAddressIcon = (type: string) => {
    if (type === "WORK") return <WorkOutline sx={{ fontSize: 16 }} className="text-blue-500" />;
    if (type === "OTHER") return <PlaceOutlined sx={{ fontSize: 16 }} className="text-amber-500" />;
    return <HomeOutlined sx={{ fontSize: 16 }} className="text-primary" />;
  };

  // Unified Selector Body
  const renderSelectorContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LocationOn sx={{ fontSize: 18 }} />
          </div>
          <div className="min-w-0">
            <Typography variant="subtitle2" fontWeight="800" className="text-foreground tracking-tight leading-tight truncate">
              Select Delivery Location
            </Typography>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Accurate delivery ETA & local seller inventory
            </p>
          </div>
        </div>
        <IconButton size="small" onClick={onClose} aria-label="Close location selector" className="shrink-0 ml-2">
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Error / Alert Feedback */}
        {(gpsError || formError) && (
          <Alert
            severity="error"
            onClose={() => {
              setFormError(null);
              dispatch(clearLocationError());
            }}
            sx={{ fontSize: "12px", borderRadius: "0.65rem", py: 0.5 }}
          >
            {gpsError || formError}
          </Alert>
        )}

        {serviceabilityStatus && !serviceabilityStatus.serviceable && (
          <Alert severity="warning" sx={{ fontSize: "12px", borderRadius: "0.65rem", py: 0.5 }}>
            {serviceabilityStatus.message || "Pincode is currently outside direct service area."}
          </Alert>
        )}

        {/* 1. Explicit GPS Location Button */}
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingGps}
          startIcon={
            isDetectingGps ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MyLocation sx={{ fontSize: 18 }} />
            )
          }
          sx={{
            py: 1.2,
            borderRadius: "0.75rem",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "13px",
            borderStyle: "dashed",
            justifyContent: "flex-start",
            px: 2.5,
            bgcolor: "primary.soft",
          }}
        >
          {isDetectingGps ? "Detecting precise locality..." : "Use my current location"}
        </Button>

        {/* 2. Manual 6-Digit Pincode Input */}
        <div>
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-border/80"></div>
            <span className="shrink mx-3 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              Or enter a pincode
            </span>
            <div className="flex-grow border-t border-border/80"></div>
          </div>

          <form onSubmit={handleVerifyPincode} className="flex gap-2 mt-1">
            <TextField
              size="small"
              fullWidth
              placeholder="Enter 6-digit Pincode"
              value={manualPin}
              onChange={(e) => setManualPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loadingPin}
              inputProps={{ maxLength: 6, inputMode: "numeric" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "0.65rem",
                  fontSize: "13px",
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={manualPin.length !== 6 || loadingPin}
              sx={{
                borderRadius: "0.65rem",
                textTransform: "none",
                fontWeight: 700,
                minWidth: "75px",
                fontSize: "13px",
              }}
            >
              {loadingPin ? <CircularProgress size={16} color="inherit" /> : "Apply"}
            </Button>
          </form>
        </div>

        {/* 3. Saved Addresses Section (Authenticated Users) */}
        {jwt && addresses && addresses.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Saved Delivery Addresses ({addresses.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Add sx={{ fontSize: 14 }} />
                <span>{showAddForm ? "Cancel" : "Add New"}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
              {addresses.map((addr: any) => {
                const isSelected =
                  activeLocation.selectedAddressId === addr._id ||
                  (activeLocation.source === "DEFAULT_SAVED" && addr.isDefault);

                return (
                  <div
                    key={addr._id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? "bg-primary/10 border-primary ring-1 ring-primary/40"
                        : "bg-card hover:bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground flex-wrap">
                        {getAddressIcon(addr.addressType)}
                        <span>{addr.name}</span>
                        {addr.isDefault && (
                          <Chip
                            label="DEFAULT"
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ height: 18, fontSize: "9px", fontWeight: 800 }}
                          />
                        )}
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 text-primary shrink-0">
                          <CheckCircle sx={{ fontSize: 16 }} />
                          <span className="text-[10px] font-bold uppercase">Selected</span>
                        </div>
                      )}
                    </div>

                    <p className="text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed text-[11px]">
                      {addr.address ? `${addr.address}, ` : ""}
                      {addr.locality ? `${addr.locality}, ` : ""}
                      {addr.city} — <span className="font-bold text-foreground">{addr.pincode}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40 text-[11px]">
                      <span className="text-muted-foreground">📱 {addr.mobile}</span>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => handleSetDefault(e, addr._id)}
                          className="text-primary hover:underline font-bold cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Quick Add Address Form */}
        {showAddForm && (
          <form
            onSubmit={handleSaveQuickAddress}
            className="p-3.5 bg-muted/40 rounded-xl border border-border flex flex-col gap-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <strong className="text-foreground text-xs">New Delivery Address</strong>
              <IconButton size="small" onClick={() => setShowAddForm(false)}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </div>

            <TextField
              size="small"
              fullWidth
              label="Recipient Full Name"
              value={newAddr.name}
              onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
              required
            />

            <TextField
              size="small"
              fullWidth
              label="10-Digit Mobile Number"
              value={newAddr.mobile}
              onChange={(e) =>
                setNewAddr({
                  ...newAddr,
                  mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              required
              inputProps={{ maxLength: 10, inputMode: "numeric" }}
            />

            <TextField
              size="small"
              fullWidth
              label="Flat / House No / Street"
              value={newAddr.address}
              onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <TextField
                size="small"
                label="Locality / Area"
                value={newAddr.locality}
                onChange={(e) => setNewAddr({ ...newAddr, locality: e.target.value })}
                required
              />
              <TextField
                size="small"
                label="City / Town"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                size="small"
                label="State"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                required
              />
              <TextField
                size="small"
                label="Pincode (6 digits)"
                value={newAddr.pincode}
                onChange={(e) =>
                  setNewAddr({
                    ...newAddr,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                required
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ borderRadius: "0.65rem", textTransform: "none", fontWeight: 700, mt: 0.5 }}
            >
              Save & Deliver Here
            </Button>
          </form>
        )}
      </div>

      {/* Mobile Safe Area Padding */}
      {isMobile && <Box sx={{ height: "env(safe-area-inset-bottom, 12px)" }} />}
    </div>
  );

  // Render Drawer on Mobile, Popover on Desktop
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
            maxHeight: "85vh",
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            borderTop: "1px solid var(--border)",
            overflow: "hidden",
          },
        }}
      >
        {/* Drag pill handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1 shrink-0 bg-card">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {renderSelectorContent()}
      </Drawer>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          className:
            "w-[360px] sm:w-[390px] max-h-[85vh] rounded-2xl shadow-2xl border border-border bg-card text-card-foreground p-0 overflow-hidden",
        },
      }}
    >
      {renderSelectorContent()}
    </Popover>
  );
};

export default LocationSelector;
