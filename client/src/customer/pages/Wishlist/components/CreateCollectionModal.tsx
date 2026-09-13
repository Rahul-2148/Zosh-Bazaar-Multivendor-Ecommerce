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
import { Close, LockOutlined, ShareOutlined } from "@mui/icons-material";
import type { ICollection } from "../../../../types/wishlistTypes";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import {
  createCollection,
  updateCollection,
} from "../../../../Redux Toolkit/features/customer/WishlistSlice";
import { useSnackbar } from "../../../../common/SnackbarProvider";

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  collectionToEdit?: ICollection | null;
}

const PALETTE = [
  "#0d9488", // Teal (Zosh Primary)
  "#6366f1", // Indigo
  "#ef4444", // Rose/Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#0ea5e9", // Sky
  "#64748b", // Slate
];

interface CollectionFormProps {
  collectionToEdit?: ICollection | null;
  onClose: () => void;
}

const CollectionForm: React.FC<CollectionFormProps> = ({
  collectionToEdit,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const [name, setName] = useState(collectionToEdit?.name || "");
  const [description, setDescription] = useState(collectionToEdit?.description || "");
  const [color, setColor] = useState(collectionToEdit?.color || PALETTE[0]);
  const [visibility, setVisibility] = useState<"PRIVATE" | "SHARED" | "PUBLIC">(
    collectionToEdit?.visibility || "PRIVATE"
  );
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(collectionToEdit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (isEditing && collectionToEdit) {
        await dispatch(
          updateCollection({
            id: collectionToEdit._id,
            data: {
              name: name.trim(),
              description: description.trim(),
              color,
              visibility,
            },
          })
        ).unwrap();
        showSnackbar(`Collection "${name}" updated`, "success");
      } else {
        await dispatch(
          createCollection({
            name: name.trim(),
            description: description.trim(),
            color,
            visibility,
          })
        ).unwrap();
        showSnackbar(`Collection "${name}" created!`, "success");
      }
      onClose();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to save collection", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle className="flex items-center justify-between pb-2">
        <span className="text-base font-bold text-foreground">
          {isEditing ? "Edit Collection" : "Create New Collection"}
        </span>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

        <DialogContent className="flex flex-col gap-4 pt-2">
          {/* Collection Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground block">
              Collection Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Home Office, Gift Ideas, Travel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={Boolean(collectionToEdit?.isSystem)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            {collectionToEdit?.isSystem && (
              <span className="text-[10px] text-muted-foreground">
                System collection name cannot be altered.
              </span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground block">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What are you organizing in this list?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Color Accent */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground block">
              Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                    color === c ? "scale-110 border-foreground shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-bold text-foreground block">
              Privacy & Sharing
            </label>
            <RadioGroup
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="flex flex-col gap-2"
            >
              <div
                onClick={() => setVisibility("PRIVATE")}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  visibility === "PRIVATE"
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Radio value="PRIVATE" size="small" sx={{ p: 0.25, mt: 0.25 }} />
                <div>
                  <div className="flex items-center gap-1">
                    <LockOutlined sx={{ fontSize: 13 }} />
                    <span className="text-xs font-bold text-foreground">Private (Default)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Only you can view and edit this list.</p>
                </div>
              </div>

              <div
                onClick={() => setVisibility("SHARED")}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  visibility === "SHARED"
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <Radio value="SHARED" size="small" sx={{ p: 0.25, mt: 0.25 }} />
                <div>
                  <div className="flex items-center gap-1">
                    <ShareOutlined sx={{ fontSize: 13 }} />
                    <span className="text-xs font-bold text-foreground">Shared Link</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Anyone with the unique link can view this list.</p>
                </div>
              </div>
            </RadioGroup>
          </div>
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
            type="submit"
            disabled={!name.trim() || loading}
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "0.75rem",
              px: 3,
            }}
          >
            {loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : isEditing ? (
              "Update"
            ) : (
              "Create Collection"
            )}
          </Button>
        </DialogActions>
      </form>
    );
};

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  open,
  onClose,
  collectionToEdit,
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
      {open && (
        <CollectionForm
          key={collectionToEdit?._id || "new"}
          collectionToEdit={collectionToEdit}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

export default CreateCollectionModal;
