import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  RadioGroup,
  Radio,
} from "@mui/material";
import { Close, DriveFileMoveOutlined } from "@mui/icons-material";
import type { ICollection } from "../../../../types/wishlistTypes";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import {
  moveSavedItems,
  getWishlist,
} from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { useSnackbar } from "../../../../common/SnackbarProvider";

interface MoveItemsModalProps {
  open: boolean;
  onClose: () => void;
  itemIds: string[];
  collections: ICollection[];
  currentCollectionId?: string;
  onSuccess?: () => void;
}

export const MoveItemsModal: React.FC<MoveItemsModalProps> = ({
  open,
  onClose,
  itemIds,
  collections,
  currentCollectionId,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  // Target collections excluding current collection
  const availableCollections = collections.filter(
    (c) => c._id !== currentCollectionId
  );
  const [targetColId, setTargetColId] = useState<string>(
    availableCollections[0]?._id || ""
  );
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (!targetColId) return;
    setLoading(true);
    try {
      const res = await dispatch(
        moveSavedItems({ itemIds, targetCollectionId: targetColId })
      ).unwrap();

      showSnackbar(res.message || "Items moved successfully", "success");
      dispatch(getWishlist({ collectionId: currentCollectionId }));
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to move items", "error");
    } finally {
      setLoading(false);
    }
  };

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
      <DialogTitle className="flex items-center justify-between pb-2">
        <span className="text-base font-bold text-foreground">
          Move {itemIds.length} {itemIds.length === 1 ? "Item" : "Items"}
        </span>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="flex flex-col gap-3.5 pt-2">
        <p className="text-xs text-muted-foreground">
          Select the destination collection for the selected product
          {itemIds.length > 1 ? "s" : ""}:
        </p>

        {availableCollections.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No other collections available. Create a new collection first.
          </p>
        ) : (
          <RadioGroup
            value={targetColId}
            onChange={(e) => setTargetColId(e.target.value)}
            className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1"
          >
            {availableCollections.map((col) => (
              <div
                key={col._id}
                onClick={() => setTargetColId(col._id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  targetColId === col._id
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.color || "#0d9488" }}
                  />
                  <span className="text-xs font-bold text-foreground truncate">
                    {col.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {col.itemCount ?? 0}
                  </span>
                  <Radio value={col._id} size="small" sx={{ p: 0.25 }} />
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </DialogContent>

      <DialogActions className="px-6 pb-4 pt-2">
        <Button
          onClick={onClose}
          size="small"
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          disabled={!targetColId || loading || availableCollections.length === 0}
          variant="contained"
          size="small"
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : <DriveFileMoveOutlined />
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "0.75rem",
            px: 3,
          }}
        >
          {loading ? "Moving..." : "Move"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveItemsModal;
