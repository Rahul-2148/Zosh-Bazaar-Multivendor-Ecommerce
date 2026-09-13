import React, { useState, useEffect, useRef } from "react";
import {
  Popover,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  NotificationsNoneOutlined,
  LocalShippingOutlined,
  PaymentOutlined,
  ShoppingBagOutlined,
  LocalOfferOutlined,
  DoneAll,
  Close,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Api } from "../../config/Api";
import { getCustomerSocket } from "../../utils/socket";

interface NotificationsPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  userId?: string;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  anchorEl,
  open,
  onClose,
  userId,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const onUnreadRef = useRef(onUnreadCountChange);
  useEffect(() => {
    onUnreadRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);


  useEffect(() => {
    if (!open || !jwt) return;
    let mounted = true;
    Api.get("/notifications?size=15", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((res) => {
        if (mounted && res.data?.success) {
          setNotifications(res.data.content || []);
          const count = res.data.unreadCount || 0;
          setUnreadCount(count);
          onUnreadRef.current?.(count);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, jwt]);

  // Realtime Socket listener for live incoming notifications
  useEffect(() => {
    if (userId) {
      const socket = getCustomerSocket(userId);
      const handleNewNotification = (notif: any) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => {
          const next = prev + 1;
          onUnreadRef.current?.(next);
          return next;
        });
      };

      socket.on("notification:created", handleNewNotification);
      return () => {
        socket.off("notification:created", handleNewNotification);
      };
    }
  }, [userId]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    if (!jwt) return;
    try {
      await Api.patch(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        onUnreadCountChange?.(next);
        return next;
      });
      if (link) {
        onClose();
        navigate(link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!jwt) return;
    try {
      await Api.patch("/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBagOutlined sx={{ fontSize: 18 }} className="text-primary" />;
      case "DELIVERY":
        return <LocalShippingOutlined sx={{ fontSize: 18 }} className="text-blue-500" />;
      case "PAYMENT":
        return <PaymentOutlined sx={{ fontSize: 18 }} className="text-emerald-500" />;
      case "OFFER":
      case "PRICE_DROP":
        return <LocalOfferOutlined sx={{ fontSize: 18 }} className="text-amber-500" />;
      default:
        return <NotificationsNoneOutlined sx={{ fontSize: 18 }} className="text-foreground" />;
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          className:
            "w-[340px] sm:w-[380px] max-h-[500px] rounded-2xl shadow-2xl border border-border bg-card text-card-foreground p-0 overflow-hidden",
        },
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <Typography variant="subtitle2" fontWeight="800" className="text-foreground tracking-tight">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {unreadCount} NEW
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              startIcon={<DoneAll sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700, p: "2px 8px" }}
            >
              Mark all read
            </Button>
          )}
          <IconButton size="small" onClick={onClose} aria-label="Close notifications">
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <CircularProgress size={24} color="primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <NotificationsNoneOutlined sx={{ fontSize: 24 }} />
            </div>
            <p className="text-xs font-bold text-foreground">No Notifications Yet</p>
            <p className="text-[11px] text-muted-foreground">
              We'll notify you about your order updates, shipments, and exclusive offers.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleMarkAsRead(notif._id, notif.link)}
              className={`p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer transition-colors duration-150 ${
                notif.isRead
                  ? "bg-card hover:bg-muted/40"
                  : "bg-primary/5 hover:bg-primary/10 border-l-3 border-primary"
              }`}
            >
              <div className="p-2 rounded-xl bg-muted/70 shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </Popover>
  );
};

export default NotificationsPopover;
