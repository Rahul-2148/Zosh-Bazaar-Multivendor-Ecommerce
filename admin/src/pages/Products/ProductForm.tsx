import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type {
  CategoryItem,
  BrandItem,
  SellerItem,
  ProductVariant,
} from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  ArrowBackOutlined,
  CheckCircleOutline,
  Close,
  AutoFixHighOutlined,
  DeleteOutline,
  CloudUploadOutlined,
  StarOutlined,
} from "@mui/icons-material";
import { Tabs, Tab, Box, IconButton, CircularProgress } from "@mui/material";
import { uploadMultipleFiles } from "../../utils/uploadToCloudinary";

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Reference Data
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);

  // Category Selection
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
  const [tags, setTags] = useState("");

  // Base Pricing & Stock (for non-variant products or defaults)
  const [mrpPrice, setMrpPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [countInStock, setCountInStock] = useState<number>(0);

  // Media Configuration (Direct File Upload Primary)
  const MAX_PRODUCT_IMAGES = 8;
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Dynamic Category Specifications
  const [specifications, setSpecifications] = useState<
    Array<{ name: string; key: string; value: string; unit?: string }>
  >([]);

  // Generic Variant Builder
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<
    Record<string, string[]>
  >({});
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Load Reference Data
  useEffect(() => {
    let ignore = false;
    Promise.all([
      adminApi.getAllCategories(),
      adminApi.getAllBrands(),
      adminApi.getAllSellers(),
    ])
      .then(([cats, brs, sels]) => {
        if (!ignore) {
          setCategories(cats);
          setBrands(brs);
          setSellers(sels);
          setSellerId((prev) => prev || (sels.length > 0 ? sels[0]._id : ""));
        }
      })
      .catch((err) => console.error("Failed to load reference data", err));

    return () => {
      ignore = true;
    };
  }, []);

  // Load existing product if Edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    let ignore = false;

    adminApi
      .getProductById(id)
      .then((prod) => {
        if (!ignore) {
          setTitle(prod.title);
          setBrand(prod.brand || "");
          setDescription(prod.description || "");
          setMrpPrice(prod.mrpPrice || 0);
          setSellingPrice(prod.sellingPrice || 0);
          setCountInStock(prod.countInStock || 0);
          setImages(prod.images || []);
          setStatus(prod.status || "PUBLISHED");
          setTags(prod.tags?.join(", ") || "");
          setHasVariants(Boolean(prod.hasVariants));
          setVariants(prod.variants || []);
          if (prod.seller?._id) setSellerId(prod.seller._id);

          if (prod.category?._id) {
            adminApi.getCategoryById(prod.category._id).then((cat) => {
              if (!ignore) {
                setSelectedCategory(cat);
                if (cat.parentCategory) {
                  setSelectedL2(cat.parentCategory._id);
                }
              }
            });
          }
          if (prod.specifications) {
            setSpecifications(
              prod.specifications.map((s) => ({
                name: s.name,
                key: s.key,
                value: String(s.value),
                unit: s.unit || "",
              }))
            );
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load product", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  // Derived categories
  const l1Categories = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const l2Categories = useMemo(
    () => categories.filter((c) => c.level === 2 && (c.parentCategory as any)?._id === selectedL1),
    [categories, selectedL1]
  );
  const l3Categories = useMemo(
    () => categories.filter((c) => c.level === 3 && (c.parentCategory as any)?._id === selectedL2),
    [categories, selectedL2]
  );

  // When leaf category is selected, initialize specifications from category attribute definitions
  const handleCategorySelect = async (catId: string) => {
    try {
      const cat = await adminApi.getCategoryById(catId);
      setSelectedCategory(cat);

      // Initialize specifications for non-variant attributes
      const specAttrs = (cat.attributes || []).filter((a) => !a.isVariant);
      setSpecifications(
        specAttrs.map((a) => ({
          name: a.name,
          key: a.key,
          value: "",
          unit: a.allowedUnits?.[0] || "",
        }))
      );

      // Reset variant options
      const varAttrs = (cat.attributes || []).filter((a) => a.isVariant);
      const initialMap: Record<string, string[]> = {};
      varAttrs.forEach((a) => {
        initialMap[a.key] = [];
      });
      setSelectedVariantAttributes(initialMap);
    } catch (err) {
      console.error("Failed to fetch category details", err);
    }
  };

  // Image Upload Handlers
  const handleFilesUpload = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const remaining = MAX_PRODUCT_IMAGES - images.length;
    if (remaining <= 0) {
      alert(`Maximum of ${MAX_PRODUCT_IMAGES} images allowed per product.`);
      return;
    }

    const filesToUpload = Array.from(filesList).slice(0, remaining);
    if (filesList.length > remaining) {
      alert(`Only the first ${remaining} images were selected to stay within the limit of ${MAX_PRODUCT_IMAGES}.`);
    }

    setUploadingImages(true);
    setUploadProgressText(`Uploading ${filesToUpload.length} image(s)...`);
    try {
      const uploadedUrls = await uploadMultipleFiles(
        filesToUpload,
        "products",
        (current, total) => {
          setUploadProgressText(`Uploaded ${current} of ${total}...`);
        }
      );
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error("Batch upload failed:", err);
      alert("Failed to upload one or more images.");
    } finally {
      setUploadingImages(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddImage = () => {
    if (images.length >= MAX_PRODUCT_IMAGES) {
      alert(`Maximum of ${MAX_PRODUCT_IMAGES} images allowed per product.`);
      return;
    }
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  // Generate Cartesian Product Combinations for Variants
  const generateVariantCombinations = () => {
    if (!selectedCategory) return;
    const variantDefs = (selectedCategory.attributes || []).filter(
      (a) => a.isVariant && selectedVariantAttributes[a.key]?.length > 0
    );

    if (variantDefs.length === 0) {
      alert("Please choose options for at least one variant attribute (e.g. Color or RAM).");
      return;
    }

    const keys = variantDefs.map((a) => a.key);
    const arraysToCombine = keys.map((k) => selectedVariantAttributes[k]);

    const cartesian = (args: string[][]): string[][] => {
      const r: string[][] = [];
      const max = args.length - 1;
      function helper(arr: string[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) r.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };

    const combinations = cartesian(arraysToCombine);

    const generatedVariants: ProductVariant[] = combinations.map((combo, idx) => {
      const comboAttrs = combo.map((val, i) => {
        const def = variantDefs[i];
        return {
          name: def.name,
          key: def.key,
          value: val,
        };
      });

      const titleVariant = combo.join(" / ");
      const autoSku = `${title.slice(0, 4).toUpperCase() || "PROD"}-${combo.map((c) => c.slice(0, 3).toUpperCase()).join("-")}-${idx + 1}`;

      return {
        sku: autoSku,
        title: titleVariant,
        attributes: comboAttrs,
        mrpPrice: mrpPrice || 999,
        sellingPrice: sellingPrice || 799,
        countInStock: countInStock || 10,
        images: images.length > 0 ? [images[0]] : [],
        status: "ACTIVE",
      };
    });

    setVariants(generatedVariants);
    setHasVariants(true);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Bulk Variant Price / Stock Application
  const applyBulkToVariants = (bulkSelling: number, bulkMrp: number, bulkStock: number) => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sellingPrice: bulkSelling || v.sellingPrice,
        mrpPrice: bulkMrp || v.mrpPrice,
        countInStock: bulkStock !== undefined ? bulkStock : v.countInStock,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert("Please select a leaf category for this product.");
      return;
    }
    if (images.length === 0) {
      alert("Please add at least one product image.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title,
        brand,
        category: selectedCategory._id,
        seller: sellerId,
        description,
        status,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        images,
        hasVariants,
        specifications,
        mrpPrice: Number(mrpPrice),
        sellingPrice: Number(sellingPrice),
        countInStock: Number(countInStock),
      };

      if (hasVariants && variants.length > 0) {
        payload.variants = variants;
        payload.attributeDefinitions = (selectedCategory.attributes || []).filter((a) => a.isVariant);
      }

      if (isEdit && id) {
        await adminApi.updateProduct(id, payload);
      } else {
        await adminApi.createProduct(payload);
      }

      setSaving(false);
      navigate("/products");
    } catch (err: any) {
      setSaving(false);
      alert(err.response?.data?.message || err.message || "Failed to save product");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product information..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/products")}
          className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
        >
          <ArrowBackOutlined fontSize="small" />
        </button>
        <PageHeader
          title={isEdit ? `Edit Product: ${title}` : "Add New Product"}
          subtitle="Configure multi-category attributes, specifications, media gallery, and variant stock combinations."
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 1 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="1. Basic Information" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
              <Tab label="2. Category Selection" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
              <Tab label="3. Specifications" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
              <Tab label="4. Variants & Pricing" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
              <Tab label="5. Media Gallery" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
              <Tab label="6. Publishing" sx={{ fontSize: "12px", textTransform: "none", fontWeight: 600 }} />
            </Tabs>
          </Box>

          <div className="p-6">
            {/* TAB 0: Basic Info */}
            {activeTab === 0 && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S25 5G"
                    className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Brand *
                    </label>
                    <select
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Assigned Vendor *
                    </label>
                    <select
                      required
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select Vendor</option>
                      {sellers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.sellerName} ({s.businessDetails?.businessName || "Store"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Product Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed commercial description, highlights, key features..."
                    className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Search Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="flagship, android, phone, oled, 5g"
                    className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* TAB 1: Category Selection */}
            {activeTab === 1 && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                    Select Product Category Hierarchy
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Products must belong to a Level 3 Leaf Category to inherit relevant specifications and variant attributes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* L1 */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      1. Department
                    </label>
                    <select
                      value={selectedL1}
                      onChange={(e) => {
                        setSelectedL1(e.target.value);
                        setSelectedL2("");
                        setSelectedCategory(null);
                      }}
                      className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select Department</option>
                      {l1Categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* L2 */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      2. Section
                    </label>
                    <select
                      disabled={!selectedL1}
                      value={selectedL2}
                      onChange={(e) => {
                        setSelectedL2(e.target.value);
                        setSelectedCategory(null);
                      }}
                      className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <option value="">Select Section</option>
                      {l2Categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* L3 */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      3. Leaf Category *
                    </label>
                    <select
                      disabled={!selectedL2}
                      value={selectedCategory?._id || ""}
                      onChange={(e) => handleCategorySelect(e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg text-xs bg-card text-foreground focus:outline-none disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <option value="">Select Leaf Category</option>
                      {l3Categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCategory && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">
                        Selected Category: {selectedCategory.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Configured Attributes:{" "}
                        {selectedCategory.attributes?.length
                           ? selectedCategory.attributes.map((a) => a.name).join(", ")
                          : "None"}
                      </p>
                    </div>
                    <CheckCircleOutline className="text-primary" />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Dynamic Category Specifications */}
            {activeTab === 2 && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                    Category Specifications
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Product-level specifications defined for {selectedCategory?.name || "this category"} (e.g. Processor, Display, Battery, Material).
                  </p>
                </div>

                {!selectedCategory ? (
                  <div className="p-6 bg-muted/60 rounded-xl text-center text-xs text-muted-foreground">
                    Please select a Leaf Category in Step 2 to configure specifications.
                  </div>
                ) : specifications.length === 0 ? (
                  <div className="p-6 bg-muted/60 rounded-xl text-center text-xs text-muted-foreground">
                    This category does not have any non-variant specification attributes configured.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {specifications.map((spec, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-3 bg-muted/60 rounded-xl border border-border"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground">{spec.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">key: {spec.key}</p>
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSpecifications((prev) => {
                                const copy = [...prev];
                                copy[idx].value = val;
                                return copy;
                              });
                            }}
                            placeholder={`Enter ${spec.name}...`}
                            className="w-full px-3 py-1.5 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                          />
                          {spec.unit && (
                            <span className="px-2.5 py-1.5 bg-muted text-muted-foreground text-xs rounded-lg font-medium">
                              {spec.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Variants & Pricing */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                      Generic Variant Generator & Inventory Matrix
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configure independent pricing, SKU, and variant-level stock (e.g. Black / 8GB / 128GB).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-bold text-foreground">
                        Enable Multi-Variant Product
                      </span>
                    </label>
                  </div>
                </div>

                {!hasVariants ? (
                  /* Standalone Base Product Pricing */
                  <div className="p-6 bg-muted/60 rounded-xl border border-border max-w-xl space-y-4">
                    <h5 className="text-xs font-bold text-foreground">Standard Product Pricing & Stock</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(Number(e.target.value))}
                          placeholder="79999"
                          className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          MRP Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={mrpPrice}
                          onChange={(e) => setMrpPrice(Number(e.target.value))}
                          placeholder="84999"
                          className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Available Stock *
                        </label>
                        <input
                          type="number"
                          required
                          value={countInStock}
                          onChange={(e) => setCountInStock(Number(e.target.value))}
                          placeholder="25"
                          className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Multi-Variant Combinatorial Matrix */
                  <div className="space-y-6">
                    {/* Step A: Select Variant Options */}
                    <div className="p-4 bg-muted/60 border border-border rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">
                          Step A: Choose Options for Variant Attributes
                        </p>
                        <button
                          type="button"
                          onClick={generateVariantCombinations}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                        >
                          <AutoFixHighOutlined sx={{ fontSize: 16 }} />
                          Generate Combinations
                        </button>
                      </div>

                      {selectedCategory?.attributes?.filter((a) => a.isVariant).length === 0 ? (
                        <p className="text-xs text-destructive">
                          No variant attributes defined for this category. Go to Categories manager to mark attributes like RAM, Color, Size as "Variant".
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          {selectedCategory?.attributes
                            ?.filter((a) => a.isVariant)
                            .map((attr) => (
                              <div key={attr.key} className="bg-card p-3 rounded-lg border border-border">
                                <label className="block text-xs font-bold text-foreground mb-1">
                                  {attr.name} ({attr.options?.length || 0} options)
                                </label>
                                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                                  {attr.options?.map((opt) => {
                                    const isSelected =
                                      selectedVariantAttributes[attr.key]?.includes(opt);
                                    return (
                                      <button
                                        type="button"
                                        key={opt}
                                        onClick={() => {
                                          setSelectedVariantAttributes((prev) => {
                                            const current = prev[attr.key] || [];
                                            const next = isSelected
                                              ? current.filter((x) => x !== opt)
                                              : [...current, opt];
                                            return { ...prev, [attr.key]: next };
                                          });
                                        }}
                                        className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Step B: Variant Matrix Table */}
                    {variants.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground">
                            Generated Combinations ({variants.length})
                          </p>
                          {/* Quick bulk setter */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-medium">Bulk set:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const p = Number(prompt("Enter Selling Price for all variants:", "74999"));
                                const m = Number(prompt("Enter MRP Price for all variants:", "79999"));
                                const s = Number(prompt("Enter Stock for all variants:", "15"));
                                if (p && m) applyBulkToVariants(p, m, s);
                              }}
                              className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold rounded-md border border-border"
                            >
                              Set Uniform Price / Stock
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-border bg-card">
                          <table className="w-full text-left text-xs text-foreground">
                            <thead className="bg-muted/60 text-[10px] font-bold text-muted-foreground uppercase border-b border-border">
                              <tr>
                                <th className="px-4 py-2.5">Variant</th>
                                <th className="px-4 py-2.5">SKU</th>
                                <th className="px-4 py-2.5">Selling Price (₹)</th>
                                <th className="px-4 py-2.5">MRP Price (₹)</th>
                                <th className="px-4 py-2.5">Stock</th>
                                <th className="px-4 py-2.5">Active</th>
                                <th className="px-4 py-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                              {variants.map((v, idx) => (
                                <tr key={idx} className="hover:bg-surface-hover">
                                  <td className="px-4 py-2 font-semibold text-foreground">
                                    {v.title || v.attributes.map((a) => a.value).join(" / ")}
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={v.sku}
                                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                      className="px-2 py-1 border border-input rounded font-mono text-xs w-32 bg-card text-foreground focus:border-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="number"
                                      value={v.sellingPrice}
                                      onChange={(e) =>
                                        updateVariant(idx, "sellingPrice", Number(e.target.value))
                                      }
                                      className="px-2 py-1 border border-input rounded text-xs w-24 bg-card text-foreground focus:border-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="number"
                                      value={v.mrpPrice}
                                      onChange={(e) =>
                                        updateVariant(idx, "mrpPrice", Number(e.target.value))
                                      }
                                      className="px-2 py-1 border border-input rounded text-xs w-24 bg-card text-foreground focus:border-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="number"
                                      value={v.countInStock}
                                      onChange={(e) =>
                                        updateVariant(idx, "countInStock", Number(e.target.value))
                                      }
                                      className="px-2 py-1 border border-input rounded text-xs w-20 bg-card text-foreground focus:border-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="checkbox"
                                      checked={v.status === "ACTIVE"}
                                      onChange={(e) =>
                                        updateVariant(idx, "status", e.target.checked ? "ACTIVE" : "INACTIVE")
                                      }
                                      className="rounded text-primary focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <IconButton size="small" onClick={() => removeVariant(idx)}>
                                      <DeleteOutline fontSize="small" className="text-destructive" />
                                    </IconButton>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Media Gallery (Direct File Upload Primary) */}
            {activeTab === 4 && (
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Product Media Gallery
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload high-resolution product photos directly from your device. First photo acts as the primary catalog cover.
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    images.length >= MAX_PRODUCT_IMAGES
                      ? "bg-warning-soft text-warning"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {images.length} / {MAX_PRODUCT_IMAGES} Images Uploaded
                  </span>
                </div>

                {/* Primary Drag & Drop Upload Zone */}
                {images.length < MAX_PRODUCT_IMAGES && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilesUpload(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-input hover:border-primary bg-muted/60 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                      onChange={(e) => handleFilesUpload(e.target.files)}
                      disabled={uploadingImages}
                    />

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-1">
                        {uploadingImages ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          <CloudUploadOutlined sx={{ fontSize: 28 }} />
                        )}
                      </div>

                      {uploadingImages ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-primary">
                            {uploadProgressText || "Uploading images..."}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Processing and optimizing media assets...
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-foreground">
                            Click to upload or drag & drop multiple images
                          </p>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            Supports PNG, JPG, WEBP. You can select multiple images at once (up to {MAX_PRODUCT_IMAGES - images.length} more).
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Images Grid with Primary/Cover Badge & Reordering */}
                {images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Arranged Gallery ({images.length} items):
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group rounded-xl border overflow-hidden bg-muted/60 aspect-square p-1.5 transition-all ${
                            idx === 0
                              ? "border-primary ring-2 ring-primary/20 shadow-md"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Product asset ${idx + 1}`}
                            className="w-full h-full object-contain rounded-xl"
                          />

                          {/* Primary Badge */}
                          {idx === 0 ? (
                            <span className="absolute top-2.5 left-2.5 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-tight">
                              Cover / Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              title="Set as cover image"
                              className="absolute top-2.5 left-2.5 bg-card/95 text-foreground hover:text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                            >
                              <StarOutlined sx={{ fontSize: 12, color: "#f59e0b" }} />
                              <span>Set Primary</span>
                            </button>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2.5 right-2.5 p-1 bg-card/95 rounded-full text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                          >
                            <Close sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secondary/Alternative: Paste Image URL Option */}
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
                  >
                    {showUrlInput ? "− Hide manual URL input" : "+ Or add image via external URL"}
                  </button>

                  {showUrlInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-3 py-2 border border-input rounded-lg text-xs bg-card text-foreground focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        disabled={images.length >= MAX_PRODUCT_IMAGES}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Publishing */}
            {activeTab === 5 && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                    Publishing Status
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Control marketplace visibility for this product item.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "PUBLISHED", label: "Published", desc: "Live in store for customers" },
                    { id: "DRAFT", label: "Draft", desc: "Visible only in admin / vendor portal" },
                    { id: "ARCHIVED", label: "Archived", desc: "De-listed from search and sales" },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setStatus(item.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        status === item.id
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
              disabled={activeTab === 0}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
            >
              Previous Step
            </button>

            <div className="flex items-center gap-3">
              {activeTab < 5 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => Math.min(5, prev + 1))}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 shadow-sm cursor-pointer"
                >
                  {saving ? "Saving Product..." : isEdit ? "Update Product" : "Publish Product"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
