import {
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import {
  LocationOnOutlined,
  CheckCircle,
  LocalShippingOutlined,
  PaymentOutlined,
  StorefrontOutlined,
  ArrowForward,
  ArrowBack,
  AddLocationAltOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { createOrder } from "../../../Redux Toolkit/features/customer/OrderSlice";
import {
  fetchUserAddresses,
  addUserAddress,
} from "../../../Redux Toolkit/features/customer/UserSlice";
import { syncWithSavedAddresses } from "../../../Redux Toolkit/features/customer/LocationSlice";
import { useNavigate } from "react-router-dom";
import AppDialog from "../../../common/layout/AppDialog";

const Checkout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, order, user, location } = useAppSelector((store) => store);
  const jwt = localStorage.getItem("jwt") || "";

  // Multi-step Checkout: 1 = Address, 2 = Review Packages, 3 = Payment
  const [activeStep, setActiveStep] = useState(1);

  const [customSelectedAddress, setCustomSelectedAddress] = useState<any>(null);
  const selectedAddress =
    customSelectedAddress ||
    (location?.activeLocation?.selectedAddressId
      ? user.addresses?.find((a: any) => a._id === location.activeLocation.selectedAddressId)
      : null) ||
    user.addresses?.find((a: any) => a.isDefault) ||
    user.addresses?.[0] ||
    null;
  const setSelectedAddress = setCustomSelectedAddress;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    name: "",
    mobile: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "HOME" as "HOME" | "WORK",
    isDefault: false,
    country: "India",
  });

  const handleOpenAddAddress = () => {
    setAddressForm({
      name: user.user?.fullName || "",
      mobile: user.user?.mobile ? String(user.user.mobile) : "",
      address: "",
      locality: location?.activeLocation?.locality || "",
      city: location?.activeLocation?.city || "",
      state: location?.activeLocation?.state || "",
      pincode: location?.activeLocation?.pincode || "",
      addressType: "HOME",
      isDefault: (!user.addresses || user.addresses.length === 0),
      country: "India",
    });
    setAddressFormError(null);
    setShowAddressForm(true);
  };

  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserCart(jwt));
      dispatch(fetchUserAddresses(jwt));
    }
  }, [dispatch, jwt]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    setAddressFormError(null);
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.name ||
      !addressForm.mobile ||
      !addressForm.address ||
      !addressForm.city ||
      !addressForm.pincode
    ) {
      setAddressFormError("Please fill out all required fields.");
      return;
    }

    if (addressForm.pincode.trim().length !== 6 || !/^\d+$/.test(addressForm.pincode)) {
      setAddressFormError("Please enter a valid 6-digit Indian postal code.");
      return;
    }

    const action = await dispatch(
      addUserAddress({
        jwt,
        address: {
          ...addressForm,
          mobile: Number(addressForm.mobile) || addressForm.mobile,
          pincode: Number(addressForm.pincode) || addressForm.pincode,
        },
      })
    );

    if (addUserAddress.fulfilled.match(action)) {
      const saved = (action.payload as any)?.address;
      if (saved) {
        setSelectedAddress(saved);
        dispatch(syncWithSavedAddresses([...(user.addresses || []), saved]));
      }
      setShowAddressForm(false);
      setAddressForm({
        name: "",
        mobile: "",
        address: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        addressType: "HOME",
        isDefault: false,
        country: "India",
      });
    } else {
      setAddressFormError("Failed to save address. Please try again.");
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) return;

    dispatch(
      createOrder({
        address: selectedAddress,
        jwt,
        paymentGateway: selectedPaymentMethod,
      })
    ).then((action: any) => {
      if (action.payload?.payment_link_url) {
        window.location.href = action.payload.payment_link_url;
      } else if (action.payload?.paymentOrder?._id) {
        navigate(`/payment-success/${action.payload.paymentOrder._id}`);
      } else if (action.payload?.order?.[0]?._id) {
        navigate(`/payment-success/${action.payload.order[0]._id}`);
      }
    });
  };

  const cartData = cart?.cart;

  // Group items by Seller for visual package fulfillment review
  const sellerPackages = useMemo(() => {
    if (!cartData?.cartItems) return [];
    const map = new Map<string, { seller: any; items: any[] }>();

    cartData.cartItems.forEach((item: any) => {
      const seller = item.product?.seller;
      const sellerId = seller?._id?.toString() || "default-vendor";

      if (!map.has(sellerId)) {
        map.set(sellerId, {
          seller: seller || { sellerName: "Zosh Certified Fulfillment" },
          items: [],
        });
      }
      map.get(sellerId)!.items.push(item);
    });

    return Array.from(map.values());
  }, [cartData]);

  if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-5">
        <Typography variant="h5" fontWeight="700">
          Your cart is empty
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Return to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-10 min-h-[calc(100vh-140px)] w-full">
      {/* Checkout Stepper Progress */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />

          {/* Step 1 */}
          <div
            onClick={() => setActiveStep(1)}
            className={`flex flex-col items-center gap-1 cursor-pointer ${
              activeStep >= 1 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                activeStep >= 1
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border"
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold">Address</span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => selectedAddress && setActiveStep(2)}
            className={`flex flex-col items-center gap-1 ${
              selectedAddress ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            } ${activeStep >= 2 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                activeStep >= 2
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border"
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold">Review</span>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => selectedAddress && setActiveStep(3)}
            className={`flex flex-col items-center gap-1 ${
              selectedAddress ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            } ${activeStep >= 3 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                activeStep >= 3
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border"
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Form + Summary Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Step Form Container */}
        <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
          {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
          {activeStep === 1 && (
            <div className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <LocationOnOutlined className="text-primary" />
                  <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg">
                    Select Delivery Address
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddLocationAltOutlined />}
                  onClick={handleOpenAddAddress}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem" }}
                >
                  + Add Address
                </Button>
              </div>

              {(!user.addresses || user.addresses.length === 0) && (
                <div className="border border-dashed border-border rounded-2xl p-8 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No saved addresses found. Please add receiver details and delivery destination to proceed.
                  </p>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenAddAddress}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
                  >
                    Add Delivery Address
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {user.addresses?.map((addr: any) => {
                  const isSelected = selectedAddress?._id === addr._id;

                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border/70 hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{addr.name}</span>
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                              {addr.addressType || "HOME"}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                DEFAULT
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                DELIVERING HERE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            {addr.address}
                            {addr.locality && `, ${addr.locality}`}, {addr.city}, {addr.state} —{" "}
                            <span className="font-bold text-foreground">{addr.pincode}</span>
                          </p>
                          <p className="text-xs font-semibold text-foreground mt-1">
                            📞 Phone: {addr.mobile}
                          </p>
                        </div>

                        {isSelected && <CheckCircle className="text-primary" sx={{ fontSize: 20 }} />}
                      </div>
                    </div>
                  );
                })}

                {/* Flipkart/Amazon Benchmark: Add New Address Option Card in the list */}
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-bold text-xs cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <AddLocationAltOutlined sx={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-primary">+ Add A New Delivery Address</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Add receiver details & address for this order</span>
                  </div>
                </button>
              </div>

              {selectedAddress && (
                <div className="pt-4 flex justify-end">
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForward />}
                    onClick={() => setActiveStep(2)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "0.75rem",
                      px: 3.5,
                      py: 1,
                    }}
                  >
                    Continue to Package Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: REVIEW VENDOR PACKAGES ================= */}
          {activeStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2">
                <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg text-foreground">
                  Review Multi-Vendor Packages ({sellerPackages.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<ArrowBack />}
                  onClick={() => setActiveStep(1)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Change Address
                </Button>
              </div>

              {sellerPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <StorefrontOutlined className="text-primary" sx={{ fontSize: 20 }} />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Package {idx + 1}: Sold by{" "}
                          <span className="text-primary font-black">
                            {pkg.seller?.businessDetails?.businessName ||
                              pkg.seller?.sellerName ||
                              "Zosh Certified Partner"}
                          </span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <LocalShippingOutlined sx={{ fontSize: 13 }} />
                          Estimated Delivery: 2-4 business days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {pkg.items.map((item: any) => (
                      <div key={item._id} className="flex gap-3 items-center">
                        <img
                          src={item.selectedVariant?.image || item.product?.images?.[0] || ""}
                          alt=""
                          className="w-12 h-14 object-contain rounded-lg border border-border/60 bg-muted/30 p-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {item.product?.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Qty: {item.quantity} · Size: {item.size || "Standard"}
                          </p>
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-foreground">
                          ₹{item.sellingPrice?.toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => setActiveStep(1)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
                >
                  Back to Address
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForward />}
                  onClick={() => setActiveStep(3)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PAYMENT SELECTION ================= */}
          {activeStep === 3 && (
            <div className="border border-border/80 bg-card text-card-foreground rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <PaymentOutlined className="text-primary" />
                <Typography variant="h6" fontWeight="700" className="text-base sm:text-lg">
                  Select Payment Method
                </Typography>
              </div>

              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="flex flex-col gap-3"
              >
                {/* Razorpay Online */}
                <div
                  onClick={() => setSelectedPaymentMethod("RAZORPAY")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === "RAZORPAY"
                      ? "border-primary bg-primary/5"
                      : "border-border/70 hover:border-primary/40 bg-card"
                  }`}
                >
                  <FormControlLabel
                    value="RAZORPAY"
                    control={<Radio />}
                    label={
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          Pay Online via Razorpay
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, & Wallets
                        </p>
                      </div>
                    }
                  />
                </div>

                {/* Cash on Delivery (COD) */}
                <div
                  onClick={() => setSelectedPaymentMethod("COD")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === "COD"
                      ? "border-primary bg-primary/5"
                      : "border-border/70 hover:border-primary/40 bg-card"
                  }`}
                >
                  <FormControlLabel
                    value="COD"
                    control={<Radio />}
                    label={
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          Cash on Delivery (COD)
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pay in cash or QR scan at your doorstep upon delivery
                        </p>
                      </div>
                    }
                  />
                </div>
              </RadioGroup>

              <div className="flex justify-between pt-4 border-t border-border/60">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => setActiveStep(2)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
                >
                  Back to Packages
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePlaceOrder}
                  disabled={order.loading}
                  sx={{
                    py: 1.2,
                    px: 3.5,
                    borderRadius: "0.75rem",
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(13, 148, 136, 0.4)",
                  }}
                >
                  {order.loading ? (
                    <CircularProgress size={22} sx={{ color: "white" }} />
                  ) : selectedPaymentMethod === "COD" ? (
                    `Confirm Order — ₹${cartData.totalSellingPrice?.toLocaleString("en-IN")}`
                  ) : (
                    `Pay ₹${cartData.totalSellingPrice?.toLocaleString("en-IN")} via Razorpay`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Commercial Summary */}
        <div className="w-full lg:w-[360px] shrink-0 mt-8 lg:mt-0 lg:sticky lg:top-[128px]">
          <div className="border border-border/80 bg-card text-card-foreground rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <Typography variant="h6" fontWeight="800" className="text-foreground tracking-tight">
              Order Summary
            </Typography>

            <Divider />

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Items ({cartData.totalItem} items)</span>
                <span className="text-foreground font-semibold">
                  ₹{cartData.totalMrpPrice?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Promotional Discount</span>
                <span>
                  -₹
                  {(
                    (cartData.totalMrpPrice || 0) - (cartData.totalSellingPrice || 0)
                  )?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Standard Delivery</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
              </div>
              <Divider />
              <div className="flex justify-between font-extrabold text-base pt-1">
                <span>Total Payable</span>
                <span className="text-primary font-black text-xl">
                  ₹{cartData.totalSellingPrice?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {selectedAddress && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
                <span className="font-bold text-foreground block mb-0.5">Delivering to:</span>
                <p className="text-muted-foreground truncate">{selectedAddress.name} ({selectedAddress.pincode})</p>
                <p className="text-muted-foreground truncate">{selectedAddress.city}, {selectedAddress.state}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-medium">
              <VerifiedUserOutlined sx={{ fontSize: 15 }} className="text-primary" />
              <span>100% Genuine Multi-Vendor Fulfillment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Responsive Address Form Dialog (Flipkart/Amazon Benchmark) */}
      <AppDialog
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        title="Add Delivery Address (Receiver Details)"
        subtitle="Enter receiver contact and shipping destination for this order"
        icon={<LocationOnOutlined sx={{ fontSize: 20 }} />}
        maxWidth="sm"
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setShowAddressForm(false)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAddress}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "0.75rem",
                px: 3.5,
                boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)",
              }}
            >
              Save & Deliver Here
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {addressFormError && (
            <Alert severity="error" sx={{ mb: 0.5, fontSize: "12px", borderRadius: "0.5rem" }}>
              {addressFormError}
            </Alert>
          )}

          {/* Receiver / Contact Information */}
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              1. Receiver Contact Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <TextField
                fullWidth
                label="Full Name (Receiver Name)"
                name="name"
                value={addressForm.name}
                onChange={handleAddressChange}
                size="small"
                required
                placeholder="Receiver name"
              />
              <TextField
                fullWidth
                label="10-Digit Mobile Number"
                name="mobile"
                value={addressForm.mobile}
                onChange={handleAddressChange}
                size="small"
                required
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Destination Address Details */}
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              2. Delivery Destination
            </span>
            <div className="flex flex-col gap-3.5">
              <TextField
                fullWidth
                label="Flat / House No. / Building / Street"
                name="address"
                value={addressForm.address}
                onChange={handleAddressChange}
                size="small"
                required
                multiline
                rows={2}
                placeholder="Flat 302, Green Valley Apartments"
              />

              <TextField
                fullWidth
                label="Locality / Area / Landmark"
                name="locality"
                value={addressForm.locality}
                onChange={handleAddressChange}
                size="small"
                placeholder="Near Metro Station"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <TextField
                  fullWidth
                  label="City / District"
                  name="city"
                  value={addressForm.city}
                  onChange={handleAddressChange}
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={addressForm.state}
                  onChange={handleAddressChange}
                  size="small"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <TextField
                  fullWidth
                  label="Pincode (6 digits)"
                  name="pincode"
                  value={addressForm.pincode}
                  onChange={handleAddressChange}
                  size="small"
                  required
                  inputProps={{ maxLength: 6 }}
                />
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={addressForm.country}
                  size="small"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Address Type & Default Options */}
          <div className="pt-2 border-t border-border/60 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              3. Address Type
            </span>
            <RadioGroup
              row
              value={addressForm.addressType}
              onChange={(e) =>
                setAddressForm({ ...addressForm, addressType: e.target.value as any })
              }
            >
              <FormControlLabel
                value="HOME"
                control={<Radio size="small" />}
                label={<span className="text-xs font-semibold">Home (All Day Delivery)</span>}
              />
              <FormControlLabel
                value="WORK"
                control={<Radio size="small" />}
                label={<span className="text-xs font-semibold">Work (Delivery between 10 AM - 5 PM)</span>}
              />
            </RadioGroup>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                />
              }
              label={
                <span className="text-xs font-medium text-foreground">
                  Make this my default delivery address
                </span>
              }
            />
          </div>
        </div>
      </AppDialog>
    </div>
  );
};

export default Checkout;
