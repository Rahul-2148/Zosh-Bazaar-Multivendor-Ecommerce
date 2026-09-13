import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutline,
  DoneAll,
  LocalShippingOutlined,
  NotificationsNoneOutlined,
  PaymentOutlined,
  LocalOfferOutlined,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Api } from "../../../config/Api";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "ORDER":
    case "DELIVERY":
      return <LocalShippingOutlined sx={{ fontSize: 20 }} className="text-primary" />;
    case "PAYMENT":
      return <PaymentOutlined sx={{ fontSize: 20 }} className="text-emerald-500" />;
    case "OFFER":
    case "PRICE_DROP":
      return <LocalOfferOutlined sx={{ fontSize: 20 }} className="text-amber-500" />;
    default:
      return <NotificationsNoneOutlined sx={{ fontSize: 20 }} className="text-primary" />;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const fetchNotifications = useCallback(async (p = 1) => {
    if (!jwt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await Api.get(`/notifications?page=${p}&size=15`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setTotalPages(res.data.totalPages || 1);
        setPage(p);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!jwt) {
        setLoading(false);
        return;
      }
      try {
        const res = await Api.get(`/notifications?page=1&size=15`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (mounted && res.data?.success) {
          setNotifications(res.data.notifications || []);
          setTotalPages(res.data.totalPages || 1);
          setPage(1);
        }
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.message || "Failed to load notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jwt]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    if (!jwt) return;
    try {
      await Api.patch(
        `/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (link) {
        navigate(link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!jwt) return;
    try {
      await Api.patch(
        "/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "UNREAD") return !n.isRead;
    return n.type === selectedFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Notifications
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay updated with your orders, price drops, and account alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              startIcon={<DoneAll sx={{ fontSize: 16 }} />}
              size="small"
              variant="outlined"
              sx={{ textTransform: "none", fontSize: "12px", borderRadius: "8px" }}
            >
              Mark all as read
            </Button>
          )}
          <IconButton
            size="small"
            onClick={() => fetchNotifications(page)}
            title="Refresh notifications"
          >
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { label: "All", value: "ALL" },
          { label: `Unread (${unreadCount})`, value: "UNREAD" },
          { label: "Orders", value: "ORDER" },
          { label: "Payments", value: "PAYMENT" },
          { label: "Offers", value: "OFFER" },
        ].map((chip) => (
          <Chip
            key={chip.value}
            label={chip.label}
            size="small"
            clickable
            color={selectedFilter === chip.value ? "primary" : "default"}
            onClick={() => setSelectedFilter(chip.value)}
            sx={{ fontWeight: 600, fontSize: "11px", borderRadius: "8px" }}
          />
        ))}
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CircularProgress size={32} />
          <p className="text-xs text-muted-foreground mt-3">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center border border-destructive/30 bg-destructive/5 rounded-2xl">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => fetchNotifications(page)}
            sx={{ mt: 2, textTransform: "none", borderRadius: "8px" }}
          >
            Try Again
          </Button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-muted/10">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CheckCircleOutline sx={{ fontSize: 28 }} className="text-primary" />
          </div>
          <Typography variant="subtitle1" fontWeight={700} className="text-foreground">
            You're all caught up!
          </Typography>
          <Typography variant="body2" className="text-muted-foreground text-xs mt-1 max-w-xs">
            No {selectedFilter !== "ALL" ? selectedFilter.toLowerCase() : ""} notifications found at this time.
          </Typography>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleMarkAsRead(notif._id, notif.link)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                !notif.isRead
                  ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
                  : "bg-card border-border/70 hover:bg-muted/40"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                {getTypeIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <span
                  className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"
                  title="Unread"
                />
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => fetchNotifications(page - 1)}
                sx={{ textTransform: "none", fontSize: "11px" }}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => fetchNotifications(page + 1)}
                sx={{ textTransform: "none", fontSize: "11px" }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
