import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowBack,
  CloudUploadOutlined,
  DeleteOutline,
  AddCircleOutline,
  Close,
  Star,
  StarBorder,
  AutoAwesome,
  TuneOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from "@mui/material";
import { productApi, metaApi } from "../../services/api";
import { uploadMediaFile } from "../../utils/uploadMedia";

interface AttributeDef {
  name: string;
  key: string;
  options: string[];
}

interface VariantItem {
  sku: string;
  title: string;
  attributes: { name: string; key: string; value: string }[];
  mrpPrice: number;
  sellingPrice: number;
  countInStock: number;
  images: string[];
  status: "ACTIVE" | "INACTIVE";
}

interface SpecItem {
  name: string;
  value: string;
}

export const ProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Page state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Metadata
  const [categoriesTree, setCategoriesTree] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Form Fields
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED");

  // Category Level Hierarchy selection
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");
  const [finalCategoryId, setFinalCategoryId] = useState("");

  // Product Images
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Standalone Pricing & Inventory
  const [mrpPrice, setMrpPrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [countInStock, setCountInStock] = useState<number | "">("");

  // Generic Variant Architecture
  const [hasVariants, setHasVariants] = useState(false);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDef[]>([
    { name: "Color", key: "color", options: [] },
  ]);
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // Bulk Variant Controls
  const [bulkMrp, setBulkMrp] = useState<string>("");
  const [bulkSelling, setBulkSelling] = useState<string>("");
  const [bulkStock, setBulkStock] = useState<string>("");

  // Specifications
  const [specifications, setSpecifications] = useState<SpecItem[]>([
    { name: "Warranty", value: "1 Year Manufacturer Warranty" },
  ]);

  // Load Categories & Brands
  useEffect(() => {
    metaApi.getCategoryTree()
      .then((res) => setCategoriesTree(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    metaApi.getBrands()
      .then((res) => setBrands(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Load existing product if editing
  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      productApi.getProductById(id)
        .then((res) => {
          const p = res.data?.product;
          if (!p) return;

          setTitle(p.title || "");
          setBrand(p.brand || "");
          setDescription(p.description || "");
          setStatus(p.status === "DRAFT" ? "DRAFT" : "PUBLISHED");
          setImages(p.images || []);
          setHasVariants(Boolean(p.hasVariants));

          if (p.hasVariants && Array.isArray(p.variants)) {
            setVariants(p.variants);
            if (p.attributeDefinitions?.length > 0) {
              setAttributeDefinitions(
                p.attributeDefinitions.map((a: any) => ({
                  name: a.name,
                  key: a.key,
                  options: a.options || [],
                }))
              );
            }
          } else {
            setMrpPrice(p.mrpPrice || "");
            setSellingPrice(p.sellingPrice || "");
            setCountInStock(p.countInStock || "");
          }

          if (Array.isArray(p.specifications)) {
            setSpecifications(p.specifications.map((s: any) => ({ name: s.name, value: s.value })));
          }

          if (p.category?._id) {
            setFinalCategoryId(p.category._id);
          }
        })
        .catch((err) => {
          console.error("Failed to load product:", err);
          setErrorMsg("Could not load product details.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  // Category Level Filtering
  const l1List = categoriesTree;
  const activeL1 = l1List.find((c) => c.categoryId === selectedL1 || c._id === selectedL1);
  const l2List = activeL1?.children || [];
  const activeL2 = l2List.find((c: any) => c.categoryId === selectedL2 || c._id === selectedL2);
  const l3List = activeL2?.children || [];

  const handleL1Change = (val: string) => {
    setSelectedL1(val);
    setSelectedL2("");
    setSelectedL3("");
    setFinalCategoryId(val);
  };

  const handleL2Change = (val: string) => {
    setSelectedL2(val);
    setSelectedL3("");
    setFinalCategoryId(val);
  };

  const handleL3Change = (val: string) => {
    setSelectedL3(val);
    setFinalCategoryId(val);
  };

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadMediaFile(files[i]);
        setImages((prev) => [...prev, uploaded.secure_url]);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (primaryImageIndex >= indexToRemove && primaryImageIndex > 0) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  // Attribute Definition management
  const addAttributeDef = () => {
    setAttributeDefinitions((prev) => [
      ...prev,
      { name: `Attribute ${prev.length + 1}`, key: `attr_${prev.length + 1}`, options: [] },
    ]);
  };

  const removeAttributeDef = (index: number) => {
    setAttributeDefinitions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOptionToAttr = (attrIndex: number, optionVal: string) => {
    const trimmed = optionVal.trim();
    if (!trimmed) return;
    setAttributeDefinitions((prev) => {
      const copy = [...prev];
      if (!copy[attrIndex].options.includes(trimmed)) {
        copy[attrIndex].options.push(trimmed);
      }
      return copy;
    });
  };

  const handleRemoveOptionFromAttr = (attrIndex: number, optionToRemove: string) => {
    setAttributeDefinitions((prev) => {
      const copy = [...prev];
      copy[attrIndex].options = copy[attrIndex].options.filter((o) => o !== optionToRemove);
      return copy;
    });
  };

  // Automatic Variant Matrix Generator
  const generateVariantCombinations = () => {
    const validDefs = attributeDefinitions.filter(
      (a) => a.name.trim() && a.options.length > 0
    );

    if (validDefs.length === 0) {
      setErrorMsg("Please add at least one attribute with values before generating variants.");
      return;
    }

    setErrorMsg("");

    // Cartesian product of attribute options
    const cartesian = (arrays: any[][]): any[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
        [[]]
      );
    };

    const optionArrays = validDefs.map((d) =>
      d.options.map((opt) => ({ name: d.name, key: d.key, value: opt }))
    );

    const combinations = cartesian(optionArrays);

    const baseSkuPrefix = (title || "PROD")
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase();

    const generated: VariantItem[] = combinations.map((combo, idx) => {
      const variantTitle = combo.map((c: any) => c.value).join(" / ");
      const autoSku = `${baseSkuPrefix}-${Date.now().toString(36).slice(-4)}-${idx + 1}`.toUpperCase();

      // Check if variant already exists with matching attributes to preserve price/stock
      const existing = variants.find((v) =>
        v.attributes.every((attr) =>
          combo.some((c: any) => c.key === attr.key && c.value === attr.value)
        )
      );

      return {
        sku: existing?.sku || autoSku,
        title: variantTitle,
        attributes: combo,
        mrpPrice: existing?.mrpPrice || Number(mrpPrice) || 1999,
        sellingPrice: existing?.sellingPrice || Number(sellingPrice) || 1499,
        countInStock: existing?.countInStock ?? 10,
        images: existing?.images || [],
        status: existing?.status || "ACTIVE",
      };
    });

    setVariants(generated);
  };

  // Bulk Variant Apply
  const applyBulkVariantValues = () => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        mrpPrice: bulkMrp !== "" ? Number(bulkMrp) : v.mrpPrice,
        sellingPrice: bulkSelling !== "" ? Number(bulkSelling) : v.sellingPrice,
        countInStock: bulkStock !== "" ? Number(bulkStock) : v.countInStock,
      }))
    );
  };

  // Specification helpers
  const addSpecification = () => {
    setSpecifications((prev) => [...prev, { name: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Product title is required.");
      return;
    }

    if (!finalCategoryId) {
      setErrorMsg("Please select a valid category.");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("Please upload at least one product image.");
      return;
    }

    if (!hasVariants) {
      if (!mrpPrice || !sellingPrice) {
        setErrorMsg("Please provide MRP and Selling Price.");
        return;
      }
      if (Number(sellingPrice) > Number(mrpPrice)) {
        setErrorMsg("Selling price cannot exceed MRP.");
        return;
      }
    } else {
      if (variants.length === 0) {
        setErrorMsg("Please generate or configure at least one product variant.");
        return;
      }
    }

    // Rearrange images so primary is first
    const finalImages = [...images];
    if (primaryImageIndex > 0 && primaryImageIndex < finalImages.length) {
      const [fav] = finalImages.splice(primaryImageIndex, 1);
      finalImages.unshift(fav);
    }

    const payload: any = {
      title: title.trim(),
      brand: brand.trim() || "Generic",
      description: description.trim(),
      category: finalCategoryId,
      images: finalImages,
      status,
      hasVariants,
      specifications: specifications.filter((s) => s.name.trim() && s.value.trim()),
    };

    if (hasVariants) {
      payload.attributeDefinitions = attributeDefinitions.filter(
        (a) => a.name.trim() && a.options.length > 0
      );
      payload.variants = variants;
      // Auto-compute baseline prices from variants
      payload.sellingPrice = Math.min(...variants.map((v) => v.sellingPrice));
      const match = variants.find((v) => v.sellingPrice === payload.sellingPrice);
      payload.mrpPrice = match?.mrpPrice || variants[0]?.mrpPrice || payload.sellingPrice;
      payload.countInStock = variants.reduce((sum, v) => sum + v.countInStock, 0);
    } else {
      payload.mrpPrice = Number(mrpPrice);
      payload.sellingPrice = Number(sellingPrice);
      payload.countInStock = Number(countInStock) || 0;
    }

    try {
      setSaving(true);
      if (isEditing && id) {
        await productApi.updateProduct(id, payload);
      } else {
        await productApi.createProduct(payload);
      }
      navigate("/products");
    } catch (err: any) {
      console.error("Save product error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <CircularProgress size={36} />
        <span className="text-xs text-muted-foreground">Loading product details...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowBack fontSize="small" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {isEditing ? "Edit Product" : "Create New Product"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure generic variants, dynamic attributes, independent pricing, and media
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="PUBLISHED">Published (Live)</option>
            <option value="DRAFT">Draft</option>
          </select>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined fontSize="small" />}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              fontSize: "13px",
              px: 2.5,
            }}
          >
            {saving ? "Saving..." : isEditing ? "Update Product" : "Publish Product"}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")}>
            <Close fontSize="small" />
          </button>
        </div>
      )}

      {/* 1. Basic Details */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">
          1. Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Product Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apple iPhone 15 Pro Max, Nike Air Zoom Running Shoes"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Brand / Manufacturer <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              list="brand-options"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Select or enter brand"
              className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
            <datalist id="brand-options">
              {brands.map((b) => (
                <option key={b._id} value={b.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Product Description <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description highlighting specifications, features, key advantages..."
            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
          />
        </div>

        {/* Category Hierarchy Selection */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-foreground">
            Category Hierarchy <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Level 1 (Department)</span>
              <select
                value={selectedL1}
                onChange={(e) => handleL1Change(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              >
                <option value="">Select Department</option>
                {l1List.map((c) => (
                  <option key={c._id} value={c.categoryId || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Level 2 (Category)</span>
              <select
                disabled={l2List.length === 0}
                value={selectedL2}
                onChange={(e) => handleL2Change(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary disabled:opacity-50"
              >
                <option value="">Select Category</option>
                {l2List.map((c: any) => (
                  <option key={c._id} value={c.categoryId || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block mb-1">Level 3 (Subcategory)</span>
              <select
                disabled={l3List.length === 0}
                value={selectedL3}
                onChange={(e) => handleL3Change(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary disabled:opacity-50"
              >
                <option value="">Select Subcategory</option>
                {l3List.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Media Management */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">2. Product Media Gallery</h2>
            <p className="text-[11px] text-muted-foreground">
              Upload high-resolution images. Click the star on an image to set it as the primary display photo.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary">{images.length} uploaded</span>
        </div>

        {/* Upload drop zone */}
        <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-surface hover:border-primary/50 transition-colors">
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <CloudUploadOutlined className="text-primary" sx={{ fontSize: 36 }} />
            <div className="text-center">
              <span className="text-xs font-bold text-foreground block">
                Click to upload images or drag files here
              </span>
              <span className="text-[10px] text-muted-foreground">
                PNG, JPG, WEBP supported • Up to 10MB per image
              </span>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadingImage && (
          <div className="flex items-center justify-center gap-2 text-xs text-primary py-2">
            <CircularProgress size={16} color="inherit" />
            <span>Processing and optimizing images...</span>
          </div>
        )}

        {/* Uploaded image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {images.map((url, idx) => {
              const isPrimary = idx === primaryImageIndex;
              return (
                <div
                  key={idx}
                  className={`relative group rounded-xl overflow-hidden border bg-surface aspect-square ${
                    isPrimary ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Tooltip title={isPrimary ? "Primary image" : "Set as primary"}>
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIndex(idx)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isPrimary ? "bg-amber-500 text-white" : "bg-white/20 text-white hover:bg-amber-500"
                        }`}
                      >
                        {isPrimary ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                      </button>
                    </Tooltip>

                    <Tooltip title="Remove image">
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-destructive transition-colors"
                      >
                        <DeleteOutline fontSize="small" />
                      </button>
                    </Tooltip>
                  </div>

                  {isPrimary && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[9px] font-bold tracking-wider uppercase shadow-xs">
                      Primary
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Variant Architecture Toggle */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">3. Catalog Format & Variants</h2>
            <p className="text-[11px] text-muted-foreground">
              Choose whether this is a standalone single item or has generic attributes (RAM, Storage, Size, Color, etc.)
            </p>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                color="primary"
              />
            }
            label={<span className="text-xs font-bold text-foreground">Has Variants</span>}
          />
        </div>

        {/* STANDALONE PRODUCT FORM */}
        {!hasVariants && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                MRP Price (₹) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={mrpPrice}
                onChange={(e) => setMrpPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 2999"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Selling Price (₹) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1999"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
              {mrpPrice && sellingPrice && Number(mrpPrice) > Number(sellingPrice) && (
                <span className="text-[11px] text-emerald-500 font-semibold block">
                  {Math.round(((Number(mrpPrice) - Number(sellingPrice)) / Number(mrpPrice)) * 100)}% Discount
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Initial Stock Count <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* GENERIC VARIANT ARCHITECTURE */}
        {hasVariants && (
          <div className="space-y-6 pt-2">
            {/* Attribute Builder */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Configurable Attributes</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Define custom variant dimensions (e.g. Color, Storage, RAM, Size, Material, Fit, Weight)
                  </p>
                </div>
                <Button
                  type="button"
                  size="small"
                  onClick={addAttributeDef}
                  startIcon={<AddCircleOutline fontSize="small" />}
                  sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
                >
                  Add Dimension
                </Button>
              </div>

              <div className="space-y-3">
                {attributeDefinitions.map((attr, attrIdx) => (
                  <div
                    key={attrIdx}
                    className="p-3 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-1/3">
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttributeDefinitions((prev) => {
                            const c = [...prev];
                            c[attrIdx].name = val;
                            c[attrIdx].key = val.toLowerCase().replace(/[^a-z0-9]/g, "_");
                            return c;
                          });
                        }}
                        placeholder="Attribute Name (e.g. Color, Storage)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground font-semibold focus:outline-hidden focus:border-primary"
                      />
                      {attributeDefinitions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAttributeDef(attrIdx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Close fontSize="small" />
                        </button>
                      )}
                    </div>

                    {/* Attribute option chips & input */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-2/3">
                      {attr.options.map((opt) => (
                        <Chip
                          key={opt}
                          label={opt}
                          size="small"
                          onDelete={() => handleRemoveOptionFromAttr(attrIdx, opt)}
                          sx={{ fontSize: "11px", fontWeight: 600 }}
                        />
                      ))}
                      <input
                        type="text"
                        placeholder="+ Add option (press Enter)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOptionToAttr(attrIdx, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground w-36 focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Generate Matrix Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={generateVariantCombinations}
                  startIcon={<AutoAwesome fontSize="small" />}
                  sx={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                >
                  Generate Variant Matrix
                </Button>
              </div>
            </div>

            {/* Bulk Variant Values Bar */}
            {variants.length > 0 && (
              <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <TuneOutlined fontSize="small" className="text-primary" />
                  <span className="font-bold text-foreground">Bulk Apply to All {variants.length} Variants:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={bulkMrp}
                    onChange={(e) => setBulkMrp(e.target.value)}
                    placeholder="MRP (₹)"
                    className="w-24 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:outline-hidden"
                  />
                  <input
                    type="number"
                    value={bulkSelling}
                    onChange={(e) => setBulkSelling(e.target.value)}
                    placeholder="Selling (₹)"
                    className="w-24 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:outline-hidden"
                  />
                  <input
                    type="number"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    placeholder="Stock"
                    className="w-20 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={applyBulkVariantValues}
                    className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Generated Variant Table */}
            {variants.length > 0 && (
              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Variant Options</th>
                      <th className="py-2.5 px-3 font-semibold">SKU Code</th>
                      <th className="py-2.5 px-3 font-semibold">MRP (₹)</th>
                      <th className="py-2.5 px-3 font-semibold">Selling Price (₹)</th>
                      <th className="py-2.5 px-3 font-semibold">Stock</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {variants.map((v, vIdx) => (
                      <tr key={vIdx} className="hover:bg-surface/50">
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {v.title}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVariants((prev) => {
                                const copy = [...prev];
                                copy[vIdx].sku = val;
                                return copy;
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface border border-border text-xs font-mono w-28 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={v.mrpPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setVariants((prev) => {
                                const copy = [...prev];
                                copy[vIdx].mrpPrice = val;
                                return copy;
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface border border-border text-xs w-24 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={v.sellingPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setVariants((prev) => {
                                const copy = [...prev];
                                copy[vIdx].sellingPrice = val;
                                return copy;
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface border border-border text-xs w-24 focus:outline-hidden font-bold text-primary"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            value={v.countInStock}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setVariants((prev) => {
                                const copy = [...prev];
                                copy[vIdx].countInStock = val;
                                return copy;
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface border border-border text-xs w-20 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={v.status}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setVariants((prev) => {
                                const copy = [...prev];
                                copy[vIdx].status = val;
                                return copy;
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface border border-border text-[11px] focus:outline-hidden"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Specifications & Features */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">4. Specifications & Attributes</h2>
            <p className="text-[11px] text-muted-foreground">
              Add technical specs or package contents for customer discovery
            </p>
          </div>
          <Button
            type="button"
            size="small"
            onClick={addSpecification}
            startIcon={<AddCircleOutline fontSize="small" />}
            sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
          >
            Add Specification
          </Button>
        </div>

        <div className="space-y-2">
          {specifications.map((spec, sIdx) => (
            <div key={sIdx} className="flex items-center gap-2">
              <input
                type="text"
                value={spec.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setSpecifications((prev) => {
                    const c = [...prev];
                    c[sIdx].name = val;
                    return c;
                  });
                }}
                placeholder="Spec Name (e.g. Battery, Material)"
                className="w-1/3 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => {
                  const val = e.target.value;
                  setSpecifications((prev) => {
                    const c = [...prev];
                    c[sIdx].value = val;
                    return c;
                  });
                }}
                placeholder="Spec Value (e.g. 5000 mAh, Titanium)"
                className="w-2/3 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => removeSpecification(sIdx)}
                className="p-1.5 text-muted-foreground hover:text-destructive"
              >
                <DeleteOutline fontSize="small" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
