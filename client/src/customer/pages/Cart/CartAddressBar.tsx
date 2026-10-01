import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  TextField,
  Radio,
} from "@mui/material";
import {
  Close,
  HomeOutlined,
  WorkOutline,
  PlaceOutlined,
  ChevronRight,
  AddLocationAltOutlined,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  selectSavedAddress,
  applyManualPincode,
} from "../../../Redux Toolkit/features/customer/LocationSlice";
import { useNavigate } from "react-router-dom";

export const CartAddressBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { activeLocation } = useAppSelector((store) => store.location);
  const { addresses } = useAppSelector((store) => store.user);

  const [openSelector, setOpenSelector] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  const handleSelectAddress = (address: any) => {
    dispatch(selectSavedAddress(address));
    setOpenSelector(false);
  };

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincodeInput.trim())) {
      setPincodeError("Please enter a valid 6-digit pincode");
      return;
    }
    setPincodeError("");
    dispatch(
      applyManualPincode({
        pincode: pincodeInput.trim(),
        locality: "Pincode " + pincodeInput.trim(),
        city: "",
        state: "",
      })
    );
    setPincodeInput("");
    setOpenSelector(false);
  };

  // Determine Icon & Label
  const addressType = activeLocation?.addressType || "HOME";
  const icon =
    addressType === "WORK" ? (
      <WorkOutline sx={{ fontSize: 18 }} className="text-primary" />
    ) : addressType === "HOME" ? (
      <HomeOutlined sx={{ fontSize: 18 }} className="text-primary" />
    ) : (
      <PlaceOutlined sx={{ fontSize: 18 }} className="text-primary" />
    );

  const primaryLabel = activeLocation?.headerPrimary || "Deliver to";
  const secondaryAddress =
    activeLocation?.formattedLabel ||
    activeLocation?.headerSecondary ||
    "Select delivery address";

  return (
    <>
      {/* Delivery Address Snippet Bar */}
      <div
        onClick={() => setOpenSelector(true)}
        className="w-full bg-card hover:bg-muted/30 transition-colors border border-border rounded-xl p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 cursor-pointer shadow-xs"
        role="button"
        tabIndex={0}
        aria-label="Change delivery location"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                {primaryLabel}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border">
                {activeLocation?.pincode || "Delivery"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate font-medium">
              {secondaryAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-primary font-bold text-xs sm:text-sm">
          <span className="hidden sm:inline">Change</span>
          <ChevronRight sx={{ fontSize: 20 }} />
        </div>
      </div>

      {/* Address Switcher Dialog */}
      <Dialog
        open={openSelector}
        onClose={() => setOpenSelector(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "1rem",
            p: 1,
            bgcolor: "background.paper",
          },
        }}
      >
        <div className="flex items-center justify-between p-3 pb-2 border-b border-border">
          <DialogTitle sx={{ p: 0, fontSize: "16px", fontWeight: 800 }}>
            Select Delivery Address
          </DialogTitle>
          <IconButton size="small" onClick={() => setOpenSelector(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </div>

        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Saved Addresses List */}
          {addresses && addresses.length > 0 ? (
            <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
                Saved Delivery Addresses
              </span>
              {addresses.map((addr: any) => {
                const isSelected =
                  activeLocation?.selectedAddressId === addr._id ||
                  (activeLocation?.source === "DEFAULT_SAVED" && addr.isDefault);

                return (
                  <div
                    key={addr._id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground shadow-xs"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <Radio
                      checked={isSelected}
                      size="small"
                      sx={{ p: 0, mt: 0.25, color: "primary.main" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {addr.name}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                          {addr.addressType || "Home"}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {addr.address || addr.street}, {addr.locality || addr.city},{" "}
                        {addr.city} - <strong className="text-foreground">{addr.pincode}</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Phone: {addr.mobile}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-muted-foreground">
              No saved addresses found. You can enter a delivery pincode below or add an address in your account.
            </div>
          )}

          {/* Quick Pincode Check Form */}
          <div className="pt-2 border-t border-border">
            <span className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-2">
              Or Enter Delivery Pincode
            </span>
            <form onSubmit={handleApplyPincode} className="flex gap-2">
              <TextField
                size="small"
                fullWidth
                placeholder="Enter 6-digit Pincode"
                value={pincodeInput}
                onChange={(e) => {
                  setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setPincodeError("");
                }}
                error={Boolean(pincodeError)}
                helperText={pincodeError}
                inputProps={{ maxLength: 6, style: { fontSize: "13px" } }}
              />
              <Button
                type="submit"
                variant="outlined"
                color="primary"
                disabled={pincodeInput.length !== 6}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  borderRadius: "0.6rem",
                  px: 2.5,
                }}
              >
                Apply
              </Button>
            </form>
          </div>

          {/* Add New Address Link */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                setOpenSelector(false);
                navigate("/account/addresses");
              }}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <AddLocationAltOutlined sx={{ fontSize: 16 }} />
              Manage or Add New Address in Account
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartAddressBar;
