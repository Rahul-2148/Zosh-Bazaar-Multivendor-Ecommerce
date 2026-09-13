import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  ContentCopy,
  Check,
  Share,
  WhatsApp,
  Telegram,
  Email,
} from "@mui/icons-material";
import type { ICollection } from "../../../../types/wishlistTypes";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import { shareCollection } from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { useSnackbar } from "../../../../common/SnackbarProvider";

interface ShareCollectionModalProps {
  collection: ICollection | null;
  open: boolean;
  onClose: () => void;
}

interface ShareCollectionContentProps {
  collection: ICollection;
  onClose: () => void;
}

const ShareCollectionContent: React.FC<ShareCollectionContentProps> = ({
  collection,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const [shareToken, setShareToken] = useState(collection.shareToken || "");
  const [loading, setLoading] = useState(!collection.shareToken);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!collection.shareToken) {
      dispatch(shareCollection(collection._id))
        .unwrap()
        .then((res) => {
          if (res.shareToken) setShareToken(res.shareToken);
        })
        .catch((err) => {
          showSnackbar(err.message || "Failed to generate share link", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [collection._id, collection.shareToken, dispatch, showSnackbar]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${origin}/wishlist/shared/${shareToken}` : "";

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showSnackbar("Link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: collection?.name || "Zosh Bazaar Collection",
          text: `Check out my curated collection "${collection?.name}" on Zosh Bazaar!`,
          url: shareUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const shareText = encodeURIComponent(
    `Check out "${collection?.name}" on Zosh Bazaar: ${shareUrl}`
  );

  return (
    <>
      <DialogTitle className="flex items-center justify-between pb-2">
        <span className="text-base font-bold text-foreground">Share Collection</span>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="flex flex-col gap-4 pt-2">
        <p className="text-xs text-muted-foreground">
          Anyone with this private link will be able to view the products in{" "}
          <strong className="text-foreground font-semibold">"{collection?.name}"</strong>.
          Your private account details are never shared.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <CircularProgress size={28} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Copy Link Input Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-muted/40">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-foreground focus:outline-hidden truncate"
              />
              <Button
                size="small"
                variant={copied ? "contained" : "outlined"}
                color={copied ? "success" : "primary"}
                onClick={handleCopy}
                startIcon={copied ? <Check /> : <ContentCopy />}
                sx={{
                  textTransform: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  px: 2,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Quick Share via
              </span>
              <div className="grid grid-cols-4 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors group cursor-pointer"
                >
                  <WhatsApp className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(collection?.name || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 hover:border-sky-500/50 hover:bg-sky-500/5 transition-colors group cursor-pointer"
                >
                  <Telegram className="text-sky-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">Telegram</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(collection?.name || "Zosh Bazaar Collection")}&body=${shareText}`}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors group cursor-pointer"
                >
                  <Email className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">Email</span>
                </a>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-colors group cursor-pointer"
                >
                  <Share className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">More</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions className="px-6 pb-4 pt-1">
        <Button
          onClick={onClose}
          size="small"
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export const ShareCollectionModal: React.FC<ShareCollectionModalProps> = ({
  collection,
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "1.25rem",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--foreground)",
          },
        },
      }}
    >
      {open && collection && (
        <ShareCollectionContent
          key={collection._id}
          collection={collection}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

export default ShareCollectionModal;
