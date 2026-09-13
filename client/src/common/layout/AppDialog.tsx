import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Max width on desktop. Defaults to 'sm' (600px) */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Automatically transforms into a mobile bottom sheet on <640px screens. Defaults to true. */
  mobileAsBottomSheet?: boolean;
  /** Custom class for content */
  contentClassName?: string;
}

/**
 * Standardized AppDialog primitive.
 * - Renders via portal into document.body (immune to parent container overflow or transforms).
 * - Desktop: Centered, elevated card with smooth borders and backdrop blur.
 * - Mobile: Adapts to an ergonomic Bottom Sheet with safe-area padding.
 * - Pinned header, independent internal scrolling, and pinned actions.
 */
export const AppDialog: React.FC<AppDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  actions,
  maxWidth = "sm",
  mobileAsBottomSheet = true,
  contentClassName = "",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const useBottomSheet = mobileAsBottomSheet && isMobile;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 1300,
          },
        },
        paper: {
          sx: useBottomSheet
            ? {
                m: 0,
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                width: "100%",
                maxWidth: "100%",
                borderTopLeftRadius: "1.5rem",
                borderTopRightRadius: "1.5rem",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                maxHeight: "90vh",
                bgcolor: "var(--card)",
                color: "var(--foreground)",
                borderTop: "1px solid var(--border)",
                borderLeft: "none",
                borderRight: "none",
                borderBottom: "none",
                boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.35)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 1301,
              }
            : {
                m: { xs: 2, sm: 3 },
                borderRadius: "1.25rem",
                bgcolor: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                maxHeight: "88vh",
                zIndex: 1301,
              },
        },
      }}
    >
      {/* Mobile drag handle affordance */}
      {useBottomSheet && (
        <div className="w-full flex justify-center pt-2.5 pb-1 shrink-0 bg-card">
          <div className="w-10 h-1.5 rounded-full bg-border" />
        </div>
      )}

      {/* Pinned Header */}
      <DialogTitle className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <Typography
              variant="h6"
              fontWeight="800"
              className="text-base sm:text-lg text-foreground leading-tight truncate"
            >
              {title}
            </Typography>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close dialog"
          className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
        >
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      {/* Scrollable Body */}
      <DialogContent
        className={`flex-1 overflow-y-auto p-4 sm:p-6 ${contentClassName}`}
        sx={{
          color: "inherit",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(148, 163, 184, 0.3)",
            borderRadius: 9999,
          },
        }}
      >
        {children}
      </DialogContent>

      {/* Pinned Footer Actions */}
      {actions && (
        <DialogActions className="px-4 sm:px-6 py-3.5 border-t border-border bg-card shrink-0 flex items-center justify-end gap-2.5">
          {actions}
        </DialogActions>
      )}

      {/* Mobile safe area spacer */}
      {useBottomSheet && <Box sx={{ height: "env(safe-area-inset-bottom, 12px)" }} />}
    </Dialog>
  );
};

export default AppDialog;
