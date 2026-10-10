/**
 * Zosh Bazaar — Enterprise Statutory Tax Classification & Invoicing Engine
 * Implements statutory Indian GST compliance rules (CGST Act, 2017):
 * - Maintained HSN/SAC statutory schedules with effective dates and valuation thresholds
 * - Registered (Tax Invoice) vs Composition (Bill of Supply) vs Unregistered (Commercial Receipt)
 * - Intra-State (CGST + SGST) vs Inter-State (IGST) place of supply
 * - Precise paise decomposition & conservation (no penny rounding drift)
 */

export const GST_STATE_CODES = Object.freeze({
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "haryana": "06",
  "delhi": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "daman and diu": "25",
  "dadra and nagar haveli": "26",
  "maharashtra": "27",
  "andhra pradesh": "28",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamil nadu": "33",
  "puducherry": "34",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "andhra pradesh (new)": "37",
  "ladakh": "38",
});

/**
 * Maintained Statutory Schedule of HSN/SAC Codes & Valuation Thresholds
 */
export const STATUTORY_TAX_SCHEDULE = Object.freeze({
  // Apparel & Textile (Chapter 61 & 62)
  // Statutory rule: Apparel selling price <= ₹1,000 taxed at 5%; > ₹1,000 taxed at 12%
  "610910": {
    hsnCode: "610910",
    description: "T-shirts, singlets and other vests, knitted or crocheted, of cotton",
    categoryKey: "apparel",
    standardRate: 12,
    valuationThresholds: [
      { maxPrice: 1000, rate: 5, condition: "Valuation <= ₹1,000 per unit" },
      { minPrice: 1000.01, rate: 12, condition: "Valuation > ₹1,000 per unit" },
    ],
    effectiveFrom: "2017-07-01",
  },
  "620300": {
    hsnCode: "620300",
    description: "Men's or boys' suits, ensembles, jackets, trousers, shirts and shorts",
    categoryKey: "apparel",
    standardRate: 12,
    valuationThresholds: [
      { maxPrice: 1000, rate: 5, condition: "Valuation <= ₹1,000 per unit" },
      { minPrice: 1000.01, rate: 12, condition: "Valuation > ₹1,000 per unit" },
    ],
    effectiveFrom: "2017-07-01",
  },
  "620400": {
    hsnCode: "620400",
    description: "Women's or girls' suits, ensembles, dresses, skirts and trousers",
    categoryKey: "apparel",
    standardRate: 12,
    valuationThresholds: [
      { maxPrice: 1000, rate: 5, condition: "Valuation <= ₹1,000 per unit" },
      { minPrice: 1000.01, rate: 12, condition: "Valuation > ₹1,000 per unit" },
    ],
    effectiveFrom: "2017-07-01",
  },
  // Footwear (Chapter 64)
  // Statutory rule: Footwear selling price <= ₹1,000 taxed at 5%; > ₹1,000 taxed at 18%
  "640399": {
    hsnCode: "640399",
    description: "Footwear with outer soles of rubber, plastics, leather or composition leather",
    categoryKey: "footwear",
    standardRate: 18,
    valuationThresholds: [
      { maxPrice: 1000, rate: 5, condition: "Valuation <= ₹1,000 per pair" },
      { minPrice: 1000.01, rate: 18, condition: "Valuation > ₹1,000 per pair" },
    ],
    effectiveFrom: "2017-07-01",
  },
  // Electronics & Mobile Telephony (Chapter 85)
  "851713": {
    hsnCode: "851713",
    description: "Smartphones and cellular network telecommunication equipment",
    categoryKey: "electronics",
    standardRate: 18,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  "847130": {
    hsnCode: "847130",
    description: "Portable automatic data processing machines, weighing not more than 10 kg (laptops/tablets)",
    categoryKey: "electronics",
    standardRate: 18,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  "851679": {
    hsnCode: "851679",
    description: "Electro-thermic appliances of a kind used for domestic purposes",
    categoryKey: "appliances",
    standardRate: 18,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  // Beauty & Cosmetics (Chapter 33)
  "330499": {
    hsnCode: "330499",
    description: "Beauty or make-up preparations and preparations for the care of the skin",
    categoryKey: "beauty",
    standardRate: 18,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  // Books & Educational Material (Chapter 49)
  "490110": {
    hsnCode: "490110",
    description: "Printed books, brochures, leaflets and similar printed matter (Nil Rated)",
    categoryKey: "books",
    standardRate: 0,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  // Groceries & Packaged Food (Chapter 21)
  "210690": {
    hsnCode: "210690",
    description: "Food preparations, health food supplements, tea and edible ingredients",
    categoryKey: "grocery",
    standardRate: 5,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
  // Default General Merchandise SAC
  "998319": {
    hsnCode: "998319",
    description: "Other trade merchandise and marketplace supplies not elsewhere specified",
    categoryKey: "general",
    standardRate: 18,
    valuationThresholds: null,
    effectiveFrom: "2017-07-01",
  },
});

/**
 * Category keyword to statutory HSN mapping
 */
const CATEGORY_HSN_MAP = [
  { match: ["t-shirt", "tshirt", "shirt", "kurta", "saree", "dress", "pant", "jeans", "apparel", "clothing"], hsn: "610910" },
  { match: ["shoe", "sneaker", "footwear", "sandal", "boot", "heels", "slippers"], hsn: "640399" },
  { match: ["phone", "mobile", "smartphone", "5g", "headphone", "earphone", "watch", "smartwatch"], hsn: "851713" },
  { match: ["laptop", "computer", "tablet", "pc", "desktop"], hsn: "847130" },
  { match: ["appliance", "kettle", "iron", "mixer", "toaster", "blender", "microwave"], hsn: "851679" },
  { match: ["beauty", "cosmetic", "serum", "cream", "shampoo", "lotion", "lipstick", "perfume"], hsn: "330499" },
  { match: ["book", "novel", "guide", "magazine", "dictionary", "textbook"], hsn: "490110" },
  { match: ["grocery", "food", "spice", "tea", "coffee", "snack", "organic"], hsn: "210690" },
];

class TaxService {
  /**
   * Validates HSN/SAC syntax (4 to 8 digits)
   */
  isValidHsnSac(code) {
    if (!code || typeof code !== "string") return false;
    return /^\d{4,8}$/.test(code.trim());
  }

  /**
   * Validates statutory 15-character Indian GSTIN
   * Format: 2 state digits + 5 PAN letters + 4 PAN digits + 1 PAN letter + 1 entity + Z + 1 checksum
   */
  isValidGstin(gstin) {
    if (!gstin || typeof gstin !== "string") return false;
    const clean = gstin.trim().toUpperCase();
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
  }

  /**
   * Resolves 2-digit GST state code from state name
   */
  resolveStateCode(stateName) {
    if (!stateName || typeof stateName !== "string") return "99";
    const clean = stateName.trim().toLowerCase().replace(/[^a-z\s]/g, "").trim();
    return GST_STATE_CODES[clean] || "99";
  }

  /**
   * Determines the legal tax regime and document title for a seller
   */
  determineSellerTaxRegime(seller) {
    if (!seller) {
      return {
        regime: "UNREGISTERED",
        isGstRegistered: false,
        isComposition: false,
        canCollectTax: false,
        documentTitle: "COMMERCIAL RECEIPT",
        regimeNote: "Unregistered Merchant — No Tax Collected under GST Law",
      };
    }

    const gstin = (seller.GSTIN || "").trim().toUpperCase();
    const isComposition = Boolean(
      seller.businessDetails?.isCompositionScheme ||
      seller.isCompositionScheme ||
      seller.accountType === "COMPOSITION"
    );

    if (isComposition) {
      return {
        regime: "COMPOSITION",
        isGstRegistered: Boolean(gstin),
        isComposition: true,
        canCollectTax: false,
        documentTitle: "BILL OF SUPPLY",
        regimeNote: "Composition Scheme Dealer — Not Entitled to Collect Tax on Supplies (Sec 10 CGST Act)",
      };
    }

    if (this.isValidGstin(gstin)) {
      return {
        regime: "REGULAR",
        isGstRegistered: true,
        isComposition: false,
        canCollectTax: true,
        documentTitle: "TAX INVOICE",
        regimeNote: "Registered Taxable Merchant — Tax Invoice Issued under Rule 46 of CGST Rules, 2017",
      };
    }

    return {
      regime: "UNREGISTERED",
      isGstRegistered: false,
      isComposition: false,
      canCollectTax: false,
      documentTitle: "COMMERCIAL RECEIPT / BILL OF SUPPLY",
      regimeNote: "Unregistered Merchant — No Tax Collected from Recipient",
    };
  }

  /**
   * Classifies a product's HSN/SAC code and applicable GST rate,
   * evaluating statutory valuation thresholds against unit selling price.
   */
  classifyProductTax(product, unitSellingPrice = 0) {
    // 1. Explicit validated product override
    if (product?.hsnCode && this.isValidHsnSac(product.hsnCode)) {
      const explicitHsn = product.hsnCode.trim();
      const scheduleEntry = STATUTORY_TAX_SCHEDULE[explicitHsn];

      // Check valuation threshold if statutory schedule applies
      let rate = Number(product.gstRate);
      if (isNaN(rate) || rate < 0 || rate > 28) {
        rate = scheduleEntry?.standardRate ?? 18;
      }

      if (scheduleEntry?.valuationThresholds && unitSellingPrice > 0) {
        for (const t of scheduleEntry.valuationThresholds) {
          if (t.maxPrice && unitSellingPrice <= t.maxPrice) {
            rate = t.rate;
            break;
          }
          if (t.minPrice && unitSellingPrice >= t.minPrice) {
            rate = t.rate;
            break;
          }
        }
      }

      return {
        hsnCode: explicitHsn,
        description: scheduleEntry?.description || "Marketplace Catalog Product",
        gstRatePercent: rate,
        gstRateFraction: rate / 100,
        isStatutoryClassified: true,
        source: "PRODUCT_OVERRIDE",
      };
    }

    // 2. Resolve via Category / Taxonomy keywords
    const catName = (product?.category?.name || product?.category?.categoryId || "").toLowerCase();
    const title = (product?.title || "").toLowerCase();

    let resolvedHsn = "998319";

    // First check category taxonomy (most authoritative)
    if (catName) {
      for (const rule of CATEGORY_HSN_MAP) {
        if (rule.match.some((kw) => catName.includes(kw))) {
          resolvedHsn = rule.hsn;
          break;
        }
      }
    }

    // Fall back to title keywords if taxonomy is unclassified
    if (resolvedHsn === "998319" && title) {
      for (const rule of CATEGORY_HSN_MAP) {
        if (rule.match.some((kw) => title.includes(kw))) {
          resolvedHsn = rule.hsn;
          break;
        }
      }
    }

    const schedule = STATUTORY_TAX_SCHEDULE[resolvedHsn] || STATUTORY_TAX_SCHEDULE["998319"];
    let finalRate = schedule.standardRate;

    // Apply statutory valuation thresholds (e.g. Apparel/Footwear <= 1000 INR vs > 1000 INR)
    if (schedule.valuationThresholds && unitSellingPrice > 0) {
      for (const t of schedule.valuationThresholds) {
        if (t.maxPrice && unitSellingPrice <= t.maxPrice) {
          finalRate = t.rate;
          break;
        }
        if (t.minPrice && unitSellingPrice >= t.minPrice) {
          finalRate = t.rate;
          break;
        }
      }
    }

    return {
      hsnCode: schedule.hsnCode,
      description: schedule.description,
      gstRatePercent: finalRate,
      gstRateFraction: finalRate / 100,
      isStatutoryClassified: resolvedHsn !== "998319",
      source: "STATUTORY_CATALOG_SCHEDULE",
    };
  }

  /**
   * Computes tax decomposition for an item with strict paise conservation.
   */
  computeItemTax({
    unitSellingPrice,
    quantity,
    discount = 0,
    taxClassification,
    sellerRegime,
    isIntraState,
  }) {
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Math.max(0, Number(unitSellingPrice) || 0);
    const grossAmount = Math.round(unitPrice * qty * 100) / 100;
    const itemDiscount = Math.min(grossAmount, Math.round(Number(discount || 0) * 100) / 100);
    const netGross = Math.round((grossAmount - itemDiscount) * 100) / 100;

    // If seller is UNREGISTERED or COMPOSITION, they cannot collect tax
    if (!sellerRegime.canCollectTax || taxClassification.gstRatePercent === 0) {
      return {
        unitSellingPrice: unitPrice,
        quantity: qty,
        grossAmount,
        discount: itemDiscount,
        netGross,
        taxableAmount: netGross,
        gstRatePercent: 0,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 0,
        lineTotal: netGross,
        hsnCode: taxClassification.hsnCode,
        taxType: "NIL_RATED_OR_EXEMPT",
      };
    }

    const rateFraction = taxClassification.gstRateFraction;
    const taxableAmount = Math.round((netGross / (1 + rateFraction)) * 100) / 100;
    const totalTax = Math.round((netGross - taxableAmount) * 100) / 100;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstRate = taxClassification.gstRatePercent / 2;
      sgstRate = taxClassification.gstRatePercent / 2;
      cgstAmount = Math.round((totalTax / 2) * 100) / 100;
      sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100; // Conservation guarantee
    } else {
      igstRate = taxClassification.gstRatePercent;
      igstAmount = totalTax;
    }

    return {
      unitSellingPrice: unitPrice,
      quantity: qty,
      grossAmount,
      discount: itemDiscount,
      netGross,
      taxableAmount,
      gstRatePercent: taxClassification.gstRatePercent,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      lineTotal: netGross,
      hsnCode: taxClassification.hsnCode,
      taxType: isIntraState ? "INTRA_STATE" : "INTER_STATE",
    };
  }
}

export default new TaxService();
