import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Close,
  CloudUpload,
  DeleteOutline,
  Add,
  FolderZip,
  Stars,
  Verified,
} from "@mui/icons-material";
import { Api } from "../../../config/Api";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { productCreatedRealtime } from "../../../Redux Toolkit/features/customer/ProductSlice";

interface ProductUploadModalProps {
  open: boolean;
  onClose: () => void;
  categories?: any[];
}

export const ProductUploadModal: React.FC<ProductUploadModalProps> = ({
  open,
  onClose,
  categories = [],
}) => {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [mrpPrice, setMrpPrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [countInStock, setCountInStock] = useState<number | "">(20);

  // Highlights bullet list
  const [highlights, setHighlights] = useState<string[]>([
    "100% Genuine Certified Product",
    "Express Next-Day Delivery Eligible",
  ]);
  const [newHighlight, setNewHighlight] = useState("");

  // Warranty & Return
  const [warrantySummary, setWarrantySummary] = useState("1 Year Brand Warranty");
  const [returnWindowDays, setReturnWindowDays] = useState(7);

  // Images state
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-calculated slug
  const derivedSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "new-product";

  const discountPercent =
    typeof mrpPrice === "number" && typeof sellingPrice === "number" && mrpPrice > sellingPrice
      ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
      : 0;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    // Automatically trigger upload to dedicated server folder
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    formData.append("productSlug", derivedSlug);

    setUploadingImages(true);
    setErrorMsg(null);
    try {
      const res = await Api.post("/upload/product-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setUploadedImages((prev) => [...prev, ...res.data.images]);
        setUploadFolder(res.data.folder);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to upload product images to server.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight("");
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brand.trim() || !sellingPrice || !mrpPrice) {
      setErrorMsg("Please fill in all required product fields.");
      return;
    }

    if (uploadedImages.length === 0) {
      setErrorMsg("Please upload at least 1 image to the dedicated product folder.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        title: title.trim(),
        slug: derivedSlug,
        brand: brand.trim(),
        category: categoryId || (categories[0]?._id ?? undefined),
        description: description.trim() || `${title} - Official marketplace authenticated listing.`,
        mrpPrice: Number(mrpPrice),
        sellingPrice: Number(sellingPrice),
        discountPercent,
        countInStock: Number(countInStock) || 10,
        images: uploadedImages,
        highlights,
        warranty: {
          summary: warrantySummary,
          durationMonths: 12,
          type: "BRAND",
        },
        returnPolicy: {
          returnable: true,
          windowDays: returnWindowDays,
          policyType: "REPLACEMENT_ONLY",
        },
        shippingDetails: {
          weightKg: 0.5,
          dimensionsCm: { length: 15, width: 10, height: 5 },
          freeShipping: true,
          estimatedDeliveryDays: 2,
        },
        status: "PUBLISHED",
      };

      const res = await Api.post("/product", payload);
      if (res.data?.product) {
        dispatch(productCreatedRealtime(res.data.product));
        setSuccessMsg("Product successfully published with dedicated folder media!");
        setTimeout(() => {
          onClose();
          // Reset
          setTitle("");
          setBrand("");
          setUploadedImages([]);
          setSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create product listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CloudUpload fontSize="small" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Real Product & Image Upload</h3>
            <p className="text-xs text-muted-foreground">
              Direct upload to dedicated folder: <code className="text-primary font-semibold">uploads/products/{derivedSlug}/</code>
            </p>
          </div>
        </div>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="pt-4 pb-6">
        <form onSubmit={handleSubmitProduct} className="flex flex-col gap-4 mt-2">
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          {/* Dedicated Folder Notice */}
          <div className="bg-muted/60 border border-border p-3.5 rounded-xl flex items-center gap-3">
            <FolderZip className="text-primary text-2xl shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Dedicated Storage Partition</span>
                <Chip label="Centralized" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
              </p>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {uploadFolder || `server/uploads/products/${derivedSlug}/`}
              </p>
            </div>
          </div>

          {/* Section 1: Basic Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label="Product Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Brand *"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Sony, Apple, Nike"
              fullWidth
              size="small"
              required
            />
          </div>

          {/* Category & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                label="Category"
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((cat: any) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="MRP Price (₹) *"
              type="number"
              value={mrpPrice}
              onChange={(e) => setMrpPrice(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
              required
            />

            <TextField
              label="Selling Price (₹) *"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : "")}
              helperText={discountPercent > 0 ? `${discountPercent}% OFF` : ""}
              fullWidth
              size="small"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField
              label="Stock Quantity"
              type="number"
              value={countInStock}
              onChange={(e) => setCountInStock(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
            />
            <TextField
              label="Warranty Summary"
              value={warrantySummary}
              onChange={(e) => setWarrantySummary(e.target.value)}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Return Policy</InputLabel>
              <Select
                value={returnWindowDays}
                label="Return Policy"
                onChange={(e) => setReturnWindowDays(Number(e.target.value))}
              >
                <MenuItem value={7}>7 Days Replacement</MenuItem>
                <MenuItem value={10}>10 Days Return</MenuItem>
                <MenuItem value={15}>15 Days Return</MenuItem>
                <MenuItem value={30}>30 Days Free Return</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Section 2: Real Multi-Image Upload Area */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">
              Product Images (Stored in dedicated product slug folder)
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary transition-colors bg-card">
              <input
                type="file"
                multiple
                accept="image/*"
                id="product-image-file-input"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadingImages}
              />
              <label
                htmlFor="product-image-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                {uploadingImages ? (
                  <CircularProgress size={32} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CloudUpload />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {uploadingImages
                      ? "Uploading to dedicated folder..."
                      : "Click to browse & upload multiple images"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    JPG, PNG, WEBP, AVIF up to 10MB per file
                  </p>
                </div>
              </label>
            </div>

            {/* Uploaded image previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3">
                {uploadedImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative group border border-border rounded-xl overflow-hidden bg-muted aspect-square flex items-center justify-center"
                  >
                    <img
                      src={img.url}
                      alt={img.filename || `Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <DeleteOutline sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Highlights Bullet List */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
              <Stars fontSize="inherit" className="text-amber-500" />
              <span>Key Highlights & Specifications</span>
            </label>
            <div className="flex gap-2 mb-2">
              <TextField
                size="small"
                fullWidth
                placeholder="Add key feature bullet point..."
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddHighlight}
                disabled={!newHighlight.trim()}
                sx={{ textTransform: "none", shrink: 0 }}
              >
                <Add fontSize="small" />
                <span>Add</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {highlights.map((h, i) => (
                <Chip
                  key={i}
                  label={h}
                  size="small"
                  onDelete={() => handleRemoveHighlight(i)}
                  icon={<Verified sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: 12 }}
                />
              ))}
            </div>
          </div>

          <TextField
            label="Product Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of features, specs, and in-box items..."
            fullWidth
            size="small"
          />

          {/* Submit Buttons */}
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t mt-2">
            <Button onClick={onClose} variant="text" disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || uploadingImages}
              sx={{ minWidth: 160 }}
            >
              {submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Publish Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
