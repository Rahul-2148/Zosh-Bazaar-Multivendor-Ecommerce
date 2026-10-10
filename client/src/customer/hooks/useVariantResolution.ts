import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { IProduct, IProductVariant } from "../../types/productTypes";

export interface CombinationMatrixItem {
  variantId: string;
  sku: string;
  title: string;
  attributes: Record<string, string>;
  mrpPrice: number;
  sellingPrice: number;
  discountPercent: number;
  countInStock: number;
  inStock: boolean;
  status: string;
  images: any[];
}

export interface UseVariantResolutionReturn {
  hasVariants: boolean;
  selectedVariant: IProductVariant | null;
  selectedAttributes: Record<string, string>;
  attributeKeys: string[];
  attributeDefinitions: Array<{
    name: string;
    key: string;
    options: string[];
  }>;
  availableOptionsByAttribute: Record<string, string[]>;
  galleryImages: string[];
  heroImage: string;
  matchedOptionGroupName: string | null;
  mrpPrice: number;
  sellingPrice: number;
  discountPercent: number;
  savings: number;
  countInStock: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
  sku: string;
  minPrice: number;
  maxPrice: number;
  isPriceRange: boolean;
  priceRangeDisplay: string;
  isOptionValid: (key: string, value: string) => boolean;
  isOptionInStock: (key: string, value: string) => boolean;
  selectOption: (key: string, value: string) => void;
  resetSelections: () => void;
}

/**
 * Extracts clean string URL from primitive string or structured media object
 */
export const extractMediaUrl = (item: any): string => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.secureUrl || item.url || item.relativePath || "";
};

/**
 * Resolves media hierarchy:
 * 1. Exact variant media override
 * 2. Option-level media group (e.g. Color = Blue)
 * 3. Product-level default media
 */
export const resolveClientMedia = (
  product: IProduct | null,
  variant: IProductVariant | null,
  selectedAttrs: Record<string, string> = {}
): { gallery: string[]; matchedGroup: string | null } => {
  if (!product) return { gallery: [], matchedGroup: null };

  // 1. Exact variant media override
  if (variant && Array.isArray(variant.images) && variant.images.length > 0) {
    const urls = variant.images.map(extractMediaUrl).filter(Boolean);
    if (urls.length > 0) {
      return { gallery: Array.from(new Set(urls)), matchedGroup: variant.title || "Variant Override" };
    }
  }

  // 2. Option-level media group (e.g. Color = Blue)
  if (Array.isArray(product.mediaGroups) && product.mediaGroups.length > 0) {
    const effectiveAttrs: Record<string, string> = {};

    if (variant && Array.isArray(variant.attributes)) {
      variant.attributes.forEach((a) => {
        if (a && a.key && a.value) {
          effectiveAttrs[a.key.toLowerCase().trim()] = String(a.value).trim().toLowerCase();
        }
      });
    }

    Object.entries(selectedAttrs).forEach(([k, v]) => {
      if (k && v) {
        effectiveAttrs[k.toLowerCase().trim()] = String(v).trim().toLowerCase();
      }
    });

    for (const mg of product.mediaGroups) {
      const gKey = (mg.optionKey || "color").toLowerCase().trim();
      const gVal = (mg.optionValue || "").trim().toLowerCase();

      if (effectiveAttrs[gKey] && effectiveAttrs[gKey] === gVal) {
        if (Array.isArray(mg.images) && mg.images.length > 0) {
          const urls = mg.images.map(extractMediaUrl).filter(Boolean);
          if (urls.length > 0) {
            return {
              gallery: Array.from(new Set(urls)),
              matchedGroup: mg.name || `${mg.optionValue} Gallery`,
            };
          }
        }
      }
    }
  }

  // 3. Product-level default media
  const defaultUrls = Array.isArray(product.images)
    ? product.images.map(extractMediaUrl).filter(Boolean)
    : [];

  return {
    gallery: Array.from(new Set(defaultUrls)),
    matchedGroup: null,
  };
};

/**
 * Enterprise Variant Resolution Hook
 * Computes cascading combination matrix, prevents impossible states,
 * resolves atomic media/pricing/inventory, and maintains deep-link URL state.
 */
export const useVariantResolution = (product: IProduct | null): UseVariantResolutionReturn => {
  const [searchParams, setSearchParams] = useSearchParams();

  const hasVariants = Boolean(
    product?.hasVariants && Array.isArray(product?.variants) && product.variants.length > 0
  );

  // 1. Build Attribute Definitions & Options from variants or product definition
  const { attributeDefinitions, availableOptionsByAttribute, validCombinations } = useMemo(() => {
    if (!hasVariants || !product?.variants) {
      return {
        attributeDefinitions: [],
        availableOptionsByAttribute: {},
        validCombinations: [],
      };
    }

    const optionsMap: Record<string, Set<string>> = {};
    const nameMap: Record<string, string> = {};

    // Initialize from product.attributeDefinitions if present
    if (Array.isArray(product.attributeDefinitions)) {
      product.attributeDefinitions.forEach((def) => {
        const k = (def.key || def.name).toLowerCase().trim();
        nameMap[k] = def.name || def.key;
        optionsMap[k] = new Set(def.options || []);
      });
    }

    const combos: CombinationMatrixItem[] = [];

    // Parse every active variant SKU
    product.variants.forEach((v) => {
      if (v.status !== "INACTIVE") {
        const attrRecord: Record<string, string> = {};

        (v.attributes || []).forEach((a) => {
          if (a && a.key && a.value) {
            const k = (a.key || a.name).toLowerCase().trim();
            const val = String(a.value).trim();
            attrRecord[k] = val;
            nameMap[k] = a.name || nameMap[k] || a.key;
            if (!optionsMap[k]) optionsMap[k] = new Set();
            optionsMap[k].add(val);
          }
        });

        combos.push({
          variantId: v._id,
          sku: v.sku,
          title: v.title,
          attributes: attrRecord,
          mrpPrice: v.mrpPrice,
          sellingPrice: v.sellingPrice,
          discountPercent: v.discountPercent,
          countInStock: v.countInStock,
          inStock: v.countInStock > 0 && v.status === "ACTIVE",
          status: v.status,
          images: v.images || [],
        });
      }
    });

    const formattedDefs = Object.keys(optionsMap).map((k) => ({
      name: nameMap[k] || k.toUpperCase(),
      key: k,
      options: Array.from(optionsMap[k]),
    }));

    const formattedOptions: Record<string, string[]> = {};
    Object.keys(optionsMap).forEach((k) => {
      formattedOptions[k] = Array.from(optionsMap[k]);
    });

    return {
      attributeDefinitions: formattedDefs,
      availableOptionsByAttribute: formattedOptions,
      validCombinations: combos,
    };
  }, [product, hasVariants]);

  const attributeKeys = useMemo(
    () => attributeDefinitions.map((d) => d.key),
    [attributeDefinitions]
  );

  // 2. Initialize Selection from URL Query or First Active Variant
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hasVariants || validCombinations.length === 0) return;

    void Promise.resolve().then(() => {
      // Check if URL has params (e.g. ?color=blue&size=m)
      const initialFromUrl: Record<string, string> = {};
      let urlHasAttributes = false;

      attributeKeys.forEach((key) => {
        const paramVal = searchParams.get(key);
        if (paramVal) {
          initialFromUrl[key] = paramVal;
          urlHasAttributes = true;
        }
      });

      // Check if variantId is directly in URL
      const paramVariantId = searchParams.get("variantId") || searchParams.get("sku");
      if (paramVariantId) {
        const directMatch = validCombinations.find(
          (c) => c.variantId === paramVariantId || c.sku.toUpperCase() === paramVariantId.toUpperCase()
        );
        if (directMatch) {
          setSelectedAttributes(directMatch.attributes);
          return;
        }
      }

      if (urlHasAttributes) {
        // Validate that URL combination is valid; if partial or invalid, fallback safely
        const match = validCombinations.find((c) =>
          Object.entries(initialFromUrl).every(
            ([k, v]) => c.attributes[k]?.toLowerCase() === v.toLowerCase()
          )
        );

        if (match) {
          setSelectedAttributes(match.attributes);
          return;
        }
      }

      // Default: Pick the first active in-stock variant, or first active variant
      const defaultVariant =
        validCombinations.find((c) => c.inStock) || validCombinations[0];

      if (defaultVariant) {
        setSelectedAttributes(defaultVariant.attributes);
      }
    });
  }, [hasVariants, validCombinations, attributeKeys, searchParams]);

  // 3. Resolve Current Matching Variant
  const selectedVariant = useMemo(() => {
    if (!hasVariants || !product?.variants || validCombinations.length === 0) return null;

    // Exact match on all selected attributes
    const exactMatch = validCombinations.find((c) =>
      Object.entries(selectedAttributes).every(
        ([k, v]) => c.attributes[k]?.toLowerCase() === v.toLowerCase()
      )
    );

    if (exactMatch) {
      return product.variants.find((v) => v._id === exactMatch.variantId) || null;
    }

    // Fallback: match by primary attribute (like color)
    if (selectedAttributes.color) {
      const colorMatch = validCombinations.find(
        (c) => c.attributes.color?.toLowerCase() === selectedAttributes.color.toLowerCase()
      );
      if (colorMatch) {
        return product.variants.find((v) => v._id === colorMatch.variantId) || null;
      }
    }

    // Fallback to first active variant
    const fallbackId = validCombinations[0]?.variantId;
    return fallbackId ? product.variants.find((v) => v._id === fallbackId) || null : null;
  }, [hasVariants, product, validCombinations, selectedAttributes]);

  // 4. Cascading Selection Handler
  const selectOption = useCallback(
    (key: string, value: string) => {
      const cleanKey = key.toLowerCase().trim();
      const cleanVal = value.trim();

      setSelectedAttributes((prev) => {
        const next: Record<string, string> = { ...prev, [cleanKey]: cleanVal };

        // Verify if `next` combination exists in validCombinations
        const exactExists = validCombinations.some((c) =>
          Object.entries(next).every(
            ([k, v]) => c.attributes[k]?.toLowerCase() === v.toLowerCase()
          )
        );

        if (exactExists) {
          // Update URL search parameters to reflect new state
          const newParams = new URLSearchParams(searchParams);
          Object.entries(next).forEach(([k, v]) => newParams.set(k, v));
          setSearchParams(newParams, { replace: true });
          return next;
        }

        // Cascading reset: Find a valid combination that preserves the newly selected attribute
        const candidateCombo = validCombinations.find(
          (c) => c.attributes[cleanKey]?.toLowerCase() === cleanVal.toLowerCase()
        );

        if (candidateCombo) {
          const newParams = new URLSearchParams(searchParams);
          Object.entries(candidateCombo.attributes).forEach(([k, v]) => newParams.set(k, v));
          setSearchParams(newParams, { replace: true });
          return candidateCombo.attributes;
        }

        return next;
      });
    },
    [validCombinations, searchParams, setSearchParams]
  );

  // 5. Option Matrix Validation Helpers
  const isOptionValid = useCallback(
    (targetKey: string, targetValue: string) => {
      const cleanKey = targetKey.toLowerCase().trim();
      const cleanVal = targetValue.trim().toLowerCase();

      // Check if there is any valid SKU configuration that pairs targetValue with other currently chosen attributes
      return validCombinations.some((c) => {
        if (c.attributes[cleanKey]?.toLowerCase() !== cleanVal) return false;

        // For primary key like color, it's valid if any SKU exists with that color
        if (cleanKey === "color") return true;

        // For secondary keys (like size), check if it matches current color
        if (selectedAttributes.color) {
          return c.attributes.color?.toLowerCase() === selectedAttributes.color.toLowerCase();
        }

        return true;
      });
    },
    [validCombinations, selectedAttributes]
  );

  const isOptionInStock = useCallback(
    (targetKey: string, targetValue: string) => {
      const cleanKey = targetKey.toLowerCase().trim();
      const cleanVal = targetValue.trim().toLowerCase();

      return validCombinations.some((c) => {
        if (c.attributes[cleanKey]?.toLowerCase() !== cleanVal) return false;
        if (selectedAttributes.color && cleanKey !== "color") {
          if (c.attributes.color?.toLowerCase() !== selectedAttributes.color.toLowerCase()) {
            return false;
          }
        }
        return c.inStock;
      });
    },
    [validCombinations, selectedAttributes]
  );

  const resetSelections = useCallback(() => {
    if (validCombinations[0]) {
      setSelectedAttributes(validCombinations[0].attributes);
      const newParams = new URLSearchParams(searchParams);
      Object.entries(validCombinations[0].attributes).forEach(([k, v]) => newParams.set(k, v));
      setSearchParams(newParams, { replace: true });
    }
  }, [validCombinations, searchParams, setSearchParams]);

  // 6. Pricing, Stock & Media Computation
  const mrpPrice = selectedVariant ? selectedVariant.mrpPrice : product?.mrpPrice || 0;
  const sellingPrice = selectedVariant ? selectedVariant.sellingPrice : product?.sellingPrice || 0;
  const discountPercent =
    mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;
  const savings = Math.max(0, mrpPrice - sellingPrice);

  const countInStock = selectedVariant ? selectedVariant.countInStock : product?.countInStock || 0;
  const isOutOfStock = Boolean(countInStock <= 0 || (selectedVariant && selectedVariant.status === "INACTIVE"));
  const isLowStock = !isOutOfStock && countInStock > 0 && countInStock <= ((product as any)?.lowStockThreshold || 5);

  const sku = selectedVariant?.sku || (product as any)?.sku || "";

  // Derive catalog price range across active variants
  const { minPrice, maxPrice, isPriceRange, priceRangeDisplay } = useMemo(() => {
    if (!hasVariants || validCombinations.length === 0) {
      const p = product?.sellingPrice || 0;
      return {
        minPrice: p,
        maxPrice: p,
        isPriceRange: false,
        priceRangeDisplay: `₹${p.toLocaleString("en-IN")}`,
      };
    }

    const prices = validCombinations.map((c) => c.sellingPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      minPrice: min,
      maxPrice: max,
      isPriceRange: min !== max,
      priceRangeDisplay: min === max ? `₹${min.toLocaleString("en-IN")}` : `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`,
    };
  }, [hasVariants, validCombinations, product]);

  // Authoritative Media Hierarchy Resolution
  const { gallery: galleryImages, matchedGroup: matchedOptionGroupName } = useMemo(() => {
    return resolveClientMedia(product, selectedVariant, selectedAttributes);
  }, [product, selectedVariant, selectedAttributes]);

  const heroImage = galleryImages[0] || extractMediaUrl(product?.images?.[0]) || "";

  return {
    hasVariants,
    selectedVariant,
    selectedAttributes,
    attributeKeys,
    attributeDefinitions,
    availableOptionsByAttribute,
    galleryImages,
    heroImage,
    matchedOptionGroupName,
    mrpPrice,
    sellingPrice,
    discountPercent,
    savings,
    countInStock,
    isOutOfStock,
    isLowStock,
    sku,
    minPrice,
    maxPrice,
    isPriceRange,
    priceRangeDisplay,
    isOptionValid,
    isOptionInStock,
    selectOption,
    resetSelections,
  };
};

export default useVariantResolution;
