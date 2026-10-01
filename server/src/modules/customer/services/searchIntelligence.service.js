/**
 * Search Intelligence Service
 * Provides enterprise-grade semantic normalization, Hindi/Hinglish transliteration mapping,
 * spell correction, and in-feed discovery rails metadata.
 */

const HINGLISH_SYNONYM_MAP = {
  // Footwear & Shoes
  juta: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  joota: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  joote: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  jute: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  juti: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  jutiyan: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  shoes: { target: "shoes", display: "Shoes", category: "footwear", synonyms: ["shoes", "sneakers", "footwear", "jordan", "running"] },
  sneeker: { target: "sneakers", display: "Sneakers", category: "footwear", synonyms: ["sneakers", "shoes", "footwear", "jordan"] },
  sneekers: { target: "sneakers", display: "Sneakers", category: "footwear", synonyms: ["sneakers", "shoes", "footwear", "jordan"] },
  sneakers: { target: "sneakers", display: "Sneakers", category: "footwear", synonyms: ["sneakers", "shoes", "footwear", "jordan"] },
  snickers: { target: "sneakers", display: "Sneakers", category: "footwear", synonyms: ["sneakers", "shoes", "footwear", "jordan"] },
  chappal: { target: "sandals", display: "Sandals & Slippers", category: "footwear", synonyms: ["sandals", "slippers", "chappal", "flip flops"] },
  chappals: { target: "sandals", display: "Sandals & Slippers", category: "footwear", synonyms: ["sandals", "slippers", "chappal", "flip flops"] },
  sandal: { target: "sandals", display: "Sandals & Slippers", category: "footwear", synonyms: ["sandals", "slippers", "chappal", "flip flops"] },
  sandals: { target: "sandals", display: "Sandals & Slippers", category: "footwear", synonyms: ["sandals", "slippers", "chappal", "flip flops"] },
  slippers: { target: "sandals", display: "Sandals & Slippers", category: "footwear", synonyms: ["sandals", "slippers", "chappal", "flip flops"] },

  // Electronics & Mobile
  fon: { target: "phone", display: "Mobile Phones", category: "electronics", synonyms: ["phone", "mobile", "smartphone", "iphone", "android"] },
  fone: { target: "phone", display: "Mobile Phones", category: "electronics", synonyms: ["phone", "mobile", "smartphone", "iphone", "android"] },
  mobile: { target: "phone", display: "Mobile Phones", category: "electronics", synonyms: ["phone", "mobile", "smartphone", "iphone", "android"] },
  mobiles: { target: "phone", display: "Mobile Phones", category: "electronics", synonyms: ["phone", "mobile", "smartphone", "iphone", "android"] },
  smartphone: { target: "phone", display: "Mobile Phones", category: "electronics", synonyms: ["phone", "mobile", "smartphone", "iphone", "android"] },
  "saste phone": { target: "phone", display: "Budget Mobile Phones", category: "electronics", maxPrice: 15000, synonyms: ["phone", "mobile", "smartphone"] },
  "sasta phone": { target: "phone", display: "Budget Mobile Phones", category: "electronics", maxPrice: 15000, synonyms: ["phone", "mobile", "smartphone"] },
  "sasta mobile": { target: "phone", display: "Budget Mobile Phones", category: "electronics", maxPrice: 15000, synonyms: ["phone", "mobile", "smartphone"] },
  ghadi: { target: "smartwatch", display: "Smartwatches", category: "electronics", synonyms: ["smartwatch", "watch", "apple watch", "wearable"] },
  ghadiyan: { target: "smartwatch", display: "Smartwatches", category: "electronics", synonyms: ["smartwatch", "watch", "apple watch", "wearable"] },
  watch: { target: "smartwatch", display: "Smartwatches", category: "electronics", synonyms: ["smartwatch", "watch", "apple watch", "wearable"] },
  smartwatch: { target: "smartwatch", display: "Smartwatches", category: "electronics", synonyms: ["smartwatch", "watch", "apple watch", "wearable"] },
  hedphone: { target: "headphones", display: "Headphones", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },
  hedphones: { target: "headphones", display: "Headphones", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },
  earphone: { target: "headphones", display: "Earphones & Headphones", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },
  earphones: { target: "headphones", display: "Earphones & Headphones", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },
  earbuds: { target: "headphones", display: "Wireless Earbuds", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },
  airpods: { target: "headphones", display: "Wireless Earbuds", category: "electronics", synonyms: ["headphones", "earbuds", "earphones", "audio", "headset"] },

  // Fashion & Apparel
  kapde: { target: "clothing", display: "Clothing & Fashion", category: "fashion", synonyms: ["clothing", "shirt", "dress", "saree", "kurta", "wear"] },
  kapda: { target: "clothing", display: "Clothing & Fashion", category: "fashion", synonyms: ["clothing", "shirt", "dress", "saree", "kurta", "wear"] },
  tshirt: { target: "t-shirt", display: "T-Shirts", category: "fashion", synonyms: ["t-shirt", "tshirt", "tee", "shirt"] },
  "t shirt": { target: "t-shirt", display: "T-Shirts", category: "fashion", synonyms: ["t-shirt", "tshirt", "tee", "shirt"] },
  "t-shirt": { target: "t-shirt", display: "T-Shirts", category: "fashion", synonyms: ["t-shirt", "tshirt", "tee", "shirt"] },
  sari: { target: "saree", display: "Sarees", category: "fashion", synonyms: ["saree", "sari", "banarasi", "kanjivaram", "silk"] },
  saris: { target: "saree", display: "Sarees", category: "fashion", synonyms: ["saree", "sari", "banarasi", "kanjivaram", "silk"] },
  saree: { target: "saree", display: "Sarees", category: "fashion", synonyms: ["saree", "sari", "banarasi", "kanjivaram", "silk"] },
  sarees: { target: "saree", display: "Sarees", category: "fashion", synonyms: ["saree", "sari", "banarasi", "kanjivaram", "silk"] },
  kurti: { target: "kurta", display: "Kurtas & Kurtis", category: "fashion", synonyms: ["kurta", "kurti", "ethnic", "tunic"] },
  kurtis: { target: "kurta", display: "Kurtas & Kurtis", category: "fashion", synonyms: ["kurta", "kurti", "ethnic", "tunic"] },
  kurta: { target: "kurta", display: "Kurtas & Kurtis", category: "fashion", synonyms: ["kurta", "kurti", "ethnic", "tunic"] },
  kurtas: { target: "kurta", display: "Kurtas & Kurtis", category: "fashion", synonyms: ["kurta", "kurti", "ethnic", "tunic"] },
  jeans: { target: "jeans", display: "Jeans & Trousers", category: "fashion", synonyms: ["jeans", "denim", "trousers", "pants"] },
  pent: { target: "pants", display: "Pants & Trousers", category: "fashion", synonyms: ["pants", "trousers", "chinos", "jeans"] },
};

const CATEGORY_DISCOVERY_RAILS = {
  footwear: {
    topBrands: ["Puma", "Sparx", "Campus", "Asian", "Red Tape", "Bata", "Nike"],
    popularCategories: [
      { label: "Running Shoes", query: "running shoes" },
      { label: "Sneakers", query: "sneakers" },
      { label: "Casual Shoes", query: "casual shoes" },
      { label: "Formal Shoes", query: "formal shoes" },
      { label: "Sports Shoes", query: "sports shoes" },
    ],
    dealBanner: {
      title: "Mega Footwear Carnival",
      subtitle: "Min. 50% + Extra 10% Off on Top Footwear Brands",
      discountTag: "Limited Time Deals",
    },
    occasionChips: ["Casual Daily", "Running & Gym", "Party & Night Out", "Work & Office"],
  },
  electronics: {
    topBrands: ["Samsung", "Apple", "OnePlus", "Realme", "boAt", "Noise", "Sony"],
    popularCategories: [
      { label: "5G Smartphones", query: "5G phone" },
      { label: "ANC Earbuds", query: "wireless earbuds" },
      { label: "Smartwatches", query: "smartwatch" },
      { label: "Bluetooth Speakers", query: "speaker" },
    ],
    dealBanner: {
      title: "Electronics Mega Carnival",
      subtitle: "Up to 50% Off on Premium Gadgets, Audio & Mobiles",
      discountTag: "Assured Tech Deals",
    },
    occasionChips: ["Gaming", "Work from Home", "Travel Audio", "Fitness Tracking"],
  },
  fashion: {
    topBrands: ["Virasat Weaves", "Tankori", "Roadster", "HRX", "Levi's", "Biba", "Libas"],
    popularCategories: [
      { label: "Pure Silk Sarees", query: "silk saree" },
      { label: "Casual T-Shirts", query: "t-shirt" },
      { label: "Designer Kurtas", query: "kurta" },
      { label: "Slim Fit Jeans", query: "jeans" },
    ],
    dealBanner: {
      title: "Fashion Super Wardrobe",
      subtitle: "Flat 60% Off on Trending Ethnic & Casual Wear",
      discountTag: "Top Rated Brands",
    },
    occasionChips: ["Festive & Wedding", "Casual Wear", "Office Formals", "Weekend Loungewear"],
  },
  default: {
    topBrands: ["Puma", "Samsung", "Virasat Weaves", "boAt", "Campus", "Roadster"],
    popularCategories: [
      { label: "Best Selling Electronics", query: "electronics" },
      { label: "Trending Footwear", query: "shoes" },
      { label: "Ethnic Fashion", query: "saree" },
      { label: "Audio & Accessories", query: "headphones" },
    ],
    dealBanner: {
      title: "Zosh Bazaar Mega Marketplace",
      subtitle: "Verified Authentic Sellers • Fast Express Delivery Across India",
      discountTag: "Curated Selection",
    },
    occasionChips: ["Top Rated", "Best Value", "Flash Deals", "Express Delivery"],
  },
};

export const searchIntelligenceService = {
  /**
   * Intelligently parses raw user query for Hinglish, transliteration, and spelling typos.
   */
  processSearchQuery(rawQuery = "", isExact = false) {
    const trimmed = (rawQuery || "").trim();
    if (!trimmed) {
      return {
        query: "",
        originalQuery: "",
        showingResultsFor: "",
        isCorrected: false,
        searchInsteadUrl: "",
        curatedRails: CATEGORY_DISCOVERY_RAILS.default,
      };
    }

    // If user clicked "Search instead for X", bypass correction
    if (isExact === true || isExact === "true") {
      return {
        query: trimmed,
        originalQuery: trimmed,
        showingResultsFor: trimmed,
        isCorrected: false,
        searchInsteadUrl: "",
        curatedRails: CATEGORY_DISCOVERY_RAILS.default,
      };
    }

    const lower = trimmed.toLowerCase();

    // Direct synonym / Hinglish lookup
    if (HINGLISH_SYNONYM_MAP[lower]) {
      const match = HINGLISH_SYNONYM_MAP[lower];
      const isDiff = match.target.toLowerCase() !== lower;
      return {
        query: match.target,
        synonyms: match.synonyms || [match.target],
        originalQuery: trimmed,
        showingResultsFor: match.display,
        isCorrected: isDiff,
        searchInsteadUrl: isDiff ? `/search?q=${encodeURIComponent(trimmed)}&exact=true` : "",
        curatedRails: CATEGORY_DISCOVERY_RAILS[match.category] || CATEGORY_DISCOVERY_RAILS.default,
        inferredMaxPrice: match.maxPrice,
      };
    }

    // Multi-word phrase check (e.g. "saste joote", "chappal for men")
    for (const [key, match] of Object.entries(HINGLISH_SYNONYM_MAP)) {
      const wordBoundaryRegex = new RegExp(`\\b${key}\\b`, "i");
      if (wordBoundaryRegex.test(lower)) {
        const replaced = lower.replace(wordBoundaryRegex, match.target);
        const isDiff = replaced !== lower;
        return {
          query: replaced,
          synonyms: match.synonyms || [match.target],
          originalQuery: trimmed,
          showingResultsFor: match.display,
          isCorrected: isDiff,
          searchInsteadUrl: isDiff ? `/search?q=${encodeURIComponent(trimmed)}&exact=true` : "",
          curatedRails: CATEGORY_DISCOVERY_RAILS[match.category] || CATEGORY_DISCOVERY_RAILS.default,
          inferredMaxPrice: match.maxPrice,
        };
      }
    }

    // Category detection for discovery rails
    let detectedCategory = "default";
    let detectedSynonyms = [trimmed];
    if (/shoe|sneaker|boot|sandal|footwear|heel|slipper/i.test(lower)) {
      detectedCategory = "footwear";
      detectedSynonyms = ["shoes", "sneakers", "footwear", "jordan", "running"];
    } else if (/phone|mobile|audio|watch|laptop|earbud|headphone|gadget/i.test(lower)) {
      detectedCategory = "electronics";
      detectedSynonyms = ["phone", "mobile", "smartphone", "iphone", "android"];
    } else if (/saree|cloth|dress|shirt|kurta|jeans|pant|fashion/i.test(lower)) {
      detectedCategory = "fashion";
      detectedSynonyms = ["saree", "sari", "clothing", "dress", "kurta"];
    }

    return {
      query: trimmed,
      synonyms: detectedSynonyms,
      originalQuery: trimmed,
      showingResultsFor: trimmed,
      isCorrected: false,
      searchInsteadUrl: "",
      curatedRails: CATEGORY_DISCOVERY_RAILS[detectedCategory] || CATEGORY_DISCOVERY_RAILS.default,
    };
  },
};
