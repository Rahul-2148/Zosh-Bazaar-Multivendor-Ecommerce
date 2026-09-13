import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { Close, Add, Check } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../../Redux Toolkit/Store";
import {
  getWishlist,
  saveProductToCollections,
  createCollection,
} from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { Api } from "../../../../config/Api";
import { useSnackbar } from "../../../../common/SnackbarProvider";

interface SaveToCollectionModalProps {
  product: any;
  variantId?: string | null;
  open: boolean;
  onClose: () => void;
}

interface SaveToCollectionContentProps {
  product: any;
  variantId?: string | null;
  onClose: () => void;
}

const SaveToCollectionContent: React.FC<SaveToCollectionContentProps> = ({
  product,
  variantId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { collections } = useAppSelector((store) => store.wishlist);

  const [selectedColIds, setSelectedColIds] = useState<string[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick collection creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);

  const productId = product?._id || product?.id || (typeof product === "string" ? product : "");
  const productTitle = product?.title || "Product";
  const productImage =
    product?.images?.[0]?.url || product?.images?.[0] || product?.snapshot?.image || "";
  const productPrice = product?.sellingPrice || 0;

  // Load existing collections & product's current collection status
  useEffect(() => {
    let active = true;
    if (collections.length === 0) {
      dispatch(getWishlist());
    }

    Api.get(`/wishlist/product-status/${productId}`)
      .then((res) => {
        if (active && res.data?.collectionIds) {
          setSelectedColIds(res.data.collectionIds);
        }
      })
      .catch(() => {
        // If not in any, check default favorites
        const defaultCol = collections.find((c) => c.isDefault);
        if (active && defaultCol) {
          setSelectedColIds([defaultCol._id]);
        }
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [productId, dispatch, collections]);

  const handleToggleCollection = (colId: string) => {
    setSelectedColIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    setCreatingLoading(true);
    try {
      const result = await dispatch(
        createCollection({
          name: newColName.trim(),
          visibility: "PRIVATE",
        })
      ).unwrap();

      if (result.collection) {
        setSelectedColIds((prev) => [...prev, result.collection._id]);
        setNewColName("");
        setIsCreating(false);
        showSnackbar(`Collection "${result.collection.name}" created!`, "success");
      }
    } catch (err: any) {
      showSnackbar(err.message || "Failed to create collection", "error");
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        saveProductToCollections({
          productId,
          collectionIds: selectedColIds,
          variantId: variantId || undefined,
        })
      ).unwrap();

      showSnackbar("Saved shopping lists updated!", "success");
      onClose();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <DialogTitle className="flex items-center justify-between pb-2">
        <span className="text-base font-bold text-foreground">Save to Collection</span>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="flex flex-col gap-4 pt-2">
        {/* Product Snapshot */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/60">
          <img
            src={productImage || "https://via.placeholder.com/60"}
            alt={productTitle}
            className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {productTitle}
            </h4>
            <p className="text-xs font-extrabold text-primary mt-0.5">
              ₹{productPrice.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Collections List */}
        {loadingStatus ? (
          <div className="flex justify-center py-6">
            <CircularProgress size={28} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {collections.map((col) => {
              const isChecked = selectedColIds.includes(col._id);
              return (
                <div
                  key={col._id}
                  onClick={() => handleToggleCollection(col._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "border-primary/60 bg-primary/5 text-foreground"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: col.color || "#0d9488" }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-foreground block truncate">
                        {col.name}
                      </span>
                      {col.description && (
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {col.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {col.itemCount || 0}
                    </span>
                    <Checkbox
                      checked={isChecked}
                      size="small"
                      color="primary"
                      sx={{ p: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Create Collection */}
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 border border-dashed border-border rounded-xl text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Add sx={{ fontSize: 16 }} />
            <span>Create New Collection</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateCollection}
            className="p-3 rounded-xl border border-primary/40 bg-primary/5 flex flex-col gap-2"
          >
            <span className="text-[11px] font-bold text-foreground block">
              New Collection
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Gaming Setup, Birthday Ideas"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                autoFocus
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="small"
                variant="contained"
                disabled={!newColName.trim() || creatingLoading}
                sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
              >
                {creatingLoading ? <CircularProgress size={14} color="inherit" /> : "Add"}
              </Button>
            </div>
          </form>
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
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "0.75rem",
            px: 3,
          }}
        >
          {saving ? "Saving..." : "Done"}
        </Button>
      </DialogActions>
    </>
  );
};

export const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
  product,
  variantId,
  open,
  onClose,
}) => {
  const productId = product?._id || product?.id || (typeof product === "string" ? product : "");

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
      {open && productId && (
        <SaveToCollectionContent
          key={`${productId}_${variantId || ""}`}
          product={product}
          variantId={variantId}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

export default SaveToCollectionModal;
