import React, { useState } from "react";
import {
  NotificationsActiveOutlined,
  LocalShippingOutlined,
  FavoriteBorder,
  LocalOfferOutlined,
  EmailOutlined,
  SmsOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import {
  Button,
  Switch,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateUserPreferences } from "../../../Redux Toolkit/features/customer/UserSlice";

const NotificationPreferencesForm: React.FC<{ user: any }> = ({ user }) => {
  const dispatch = useAppDispatch();

  const existingPrefs = user?.preferences?.notifications || {
    orderUpdates: true,
    promotions: true,
    priceDrops: true,
    newsletter: false,
    email: true,
    sms: true,
    push: true,
  };

  const [orderUpdates, setOrderUpdates] = useState(existingPrefs.orderUpdates ?? true);
  const [promotions, setPromotions] = useState(existingPrefs.promotions ?? true);
  const [priceDrops, setPriceDrops] = useState(existingPrefs.priceDrops ?? true);
  const [newsletter, setNewsletter] = useState(existingPrefs.newsletter ?? false);
  const [email, setEmail] = useState(existingPrefs.email ?? true);
  const [sms, setSms] = useState(existingPrefs.sms ?? true);
  const [push, setPush] = useState(existingPrefs.push ?? true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await dispatch(
        updateUserPreferences({
          notifications: {
            orderUpdates,
            promotions,
            priceDrops,
            newsletter,
            email,
            sms,
            push,
          },
        })
      ).unwrap();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      // handled in redux
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose what updates you want to receive and how we reach you
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Save Preferences"}
        </Button>
      </div>

      {savedSuccess && (
        <Alert
          icon={<CheckCircleOutline fontSize="inherit" />}
          severity="success"
          sx={{ borderRadius: "0.75rem", fontSize: 13 }}
        >
          Notification preferences saved successfully!
        </Alert>
      )}

      {/* Topics Section */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <NotificationsActiveOutlined sx={{ fontSize: 18 }} className="text-primary" />
          Alert Topics
        </h3>
        <p className="text-xs text-muted-foreground">
          Control notifications for orders, price drops on your saved products, and promotional alerts.
        </p>

        <div className="divide-y divide-border/60">
          {/* Order Updates */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <LocalShippingOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Order & Delivery Updates</p>
                <p className="text-xs text-muted-foreground">
                  Confirmation, dispatch, out for delivery, and return/refund progress
                </p>
              </div>
            </div>
            <Switch
              checked={orderUpdates}
              onChange={(e) => setOrderUpdates(e.target.checked)}
              color="primary"
            />
          </div>

          {/* Price Drops */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FavoriteBorder sx={{ fontSize: 20 }} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Wishlist Price Drops</p>
                <p className="text-xs text-muted-foreground">
                  Instant alerts when products saved in your wishlist or collections drop in price
                </p>
              </div>
            </div>
            <Switch
              checked={priceDrops}
              onChange={(e) => setPriceDrops(e.target.checked)}
              color="primary"
            />
          </div>

          {/* Promotions & Offers */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <LocalOfferOutlined sx={{ fontSize: 20 }} className="text-emerald-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Exclusive Offers & Coupons</p>
                <p className="text-xs text-muted-foreground">
                  Seasonal deals, flash sales, and personalized marketplace promo codes
                </p>
              </div>
            </div>
            <Switch
              checked={promotions}
              onChange={(e) => setPromotions(e.target.checked)}
              color="primary"
            />
          </div>

          {/* Newsletter */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <NotificationsActiveOutlined sx={{ fontSize: 20 }} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Weekly Digest & Newsletter</p>
                <p className="text-xs text-muted-foreground">
                  Curated product guides, seasonal trends, and platform digest
                </p>
              </div>
            </div>
            <Switch
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              color="primary"
            />
          </div>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <EmailOutlined sx={{ fontSize: 18 }} className="text-primary" />
          Delivery Channels
        </h3>
        <p className="text-xs text-muted-foreground">
          Select the communication mediums you prefer for transactional and commercial notifications.
        </p>

        <div className="divide-y divide-border/60">
          {/* Email */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <EmailOutlined sx={{ fontSize: 20 }} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Invoices, tracking links, and account security notifications ({user?.email || "Primary Email"})
                </p>
              </div>
            </div>
            <Switch
              checked={email}
              onChange={(e) => setEmail(e.target.checked)}
              color="primary"
            />
          </div>

          {/* SMS */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <SmsOutlined sx={{ fontSize: 20 }} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">SMS Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Critical delivery OTPs and real-time transit milestones
                </p>
              </div>
            </div>
            <Switch
              checked={sms}
              onChange={(e) => setSms(e.target.checked)}
              color="primary"
            />
          </div>

          {/* Push Notifications */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <NotificationsActiveOutlined sx={{ fontSize: 20 }} className="text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">In-App & Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Instant badge counters and notification drawer alerts inside ZoshBazaar
                </p>
              </div>
            </div>
            <Switch
              checked={push}
              onChange={(e) => setPush(e.target.checked)}
              color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationPreferencesView: React.FC = () => {
  const { user } = useAppSelector((store) => store.user);
  const key = user?._id ? `${user._id}_${JSON.stringify(user.preferences?.notifications || {})}` : "guest";
  return <NotificationPreferencesForm key={key} user={user} />;
};

export default NotificationPreferencesView;
