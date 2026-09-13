import React from "react";
import {
  AddShoppingCart,
  DriveFileMoveOutlined,
  DeleteOutline,
  Close,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAddToCart: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
  loading?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkAddToCart,
  onBulkMove,
  onBulkDelete,
  loading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 sm:gap-6">
        {/* Count & Deselect */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/40">
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-full hover:bg-background/20 dark:hover:bg-muted transition-colors cursor-pointer text-inherit"
            aria-label="Deselect all"
          >
            <Close sx={{ fontSize: 16 }} />
          </button>
          <span className="text-xs font-bold whitespace-nowrap">
            {selectedCount} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onBulkAddToCart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <AddShoppingCart sx={{ fontSize: 15 }} />
            )}
            <span className="hidden sm:inline">Add to Cart</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onBulkMove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/15 dark:bg-muted text-inherit hover:bg-background/25 dark:hover:bg-muted/80 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <DriveFileMoveOutlined sx={{ fontSize: 16 }} />
            <span>Move</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <DeleteOutline sx={{ fontSize: 16 }} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;
