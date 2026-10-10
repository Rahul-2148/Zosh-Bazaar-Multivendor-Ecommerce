/**
 * OpenAPI 3.1 Paths: Catalog Discovery, Products, Categories, Brands & Reviews
 */

export const catalogPaths = {
  "/api/v1/product/search/suggestions": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Typeahead Search Autocomplete Suggestions",
      description: "Fast in-memory prefix match for product titles, categories, and brands.",
      operationId: "getProductSearchSuggestions",
      parameters: [{ name: "query", in: "query", required: true, schema: { type: "string" }, example: "shir" }],
      responses: {
        200: {
          description: "List of matching keywords and suggested products.",
          content: { "application/json": { schema: { type: "array", items: { type: "string" } } } },
        },
      },
    },
  },
  "/api/v1/product/search": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Full-Text Product Search",
      description: "Searches titles, descriptions, tags, and category hierarchies with relevance scoring.",
      operationId: "searchProducts",
      parameters: [
        { name: "query", in: "query", required: true, schema: { type: "string" }, example: "cotton shirt" },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        200: {
          description: "Search results matching query.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  totalElements: { type: "integer", example: 48 },
                  totalPages: { type: "integer", example: 3 },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/filters": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Get Category Dynamic Filter Facets",
      description: "Aggregates available sizes, colors, brands, and price ranges for the target category.",
      operationId: "getProductCategoryFilters",
      parameters: [{ name: "category", in: "query", required: false, schema: { type: "string" }, example: "men_clothing" }],
      responses: {
        200: {
          description: "Filter facets returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  colors: { type: "array", items: { type: "string" } },
                  sizes: { type: "array", items: { type: "string" } },
                  brands: { type: "array", items: { type: "string" } },
                  minPrice: { type: "number", example: 299 },
                  maxPrice: { type: "number", example: 4999 },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Filterable Product Listing",
      description: "Retrieves paginated marketplace catalog items filtered by category, brand, color, size, price, and sorting.",
      operationId: "getAllProducts",
      parameters: [
        { name: "category", in: "query", required: false, schema: { type: "string" }, example: "men_clothing" },
        { name: "brand", in: "query", required: false, schema: { type: "string" } },
        { name: "color", in: "query", required: false, schema: { type: "string" } },
        { name: "size", in: "query", required: false, schema: { type: "string" } },
        { name: "minPrice", in: "query", required: false, schema: { type: "number" } },
        { name: "maxPrice", in: "query", required: false, schema: { type: "number" } },
        { name: "sort", in: "query", required: false, schema: { type: "string", enum: ["price_low", "price_high", "newest", "rating"] } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        200: {
          description: "Paginated products list.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  totalElements: { type: "integer", example: 120 },
                  totalPages: { type: "integer", example: 6 },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/{productId}": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Get Product Details by ID",
      description: "Returns complete product details including brand, seller, variant matrix, stock, and media hierarchy.",
      operationId: "getProductById",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" }, example: "65f2a1b9c9e77c0012a9bc30" }],
      responses: {
        200: {
          description: "Product details returned.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
        },
        404: {
          description: "Product not found.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/product/{productId}/resolve-variant": {
    get: {
      tags: ["Catalog & Products"],
      summary: "Dynamic Variant SKU & Price Resolution",
      description: "Authoritatively resolves exact variant SKU, selling price, and stock for chosen attribute combinations (e.g. Color + Size).",
      operationId: "resolveProductVariant",
      parameters: [
        { name: "productId", in: "path", required: true, schema: { type: "string" } },
        { name: "color", in: "query", required: false, schema: { type: "string" }, example: "Blue" },
        { name: "size", in: "query", required: false, schema: { type: "string" }, example: "M" },
      ],
      responses: {
        200: {
          description: "Resolved variant metadata.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sku: { type: "string", example: "ZB-TSHIRT-BLU-M" },
                  sellingPrice: { type: "number", example: 499 },
                  countInStock: { type: "integer", example: 15 },
                  images: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/category/tree": {
    get: {
      tags: ["Categories & Taxonomy"],
      summary: "Get Hierarchical Category Tree",
      description: "Returns nested multi-level navigation taxonomy (Level 1 Root -> Level 2 Department -> Level 3 Subcategory).",
      operationId: "getCategoryTree",
      responses: {
        200: {
          description: "Hierarchical category tree.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/category": {
    get: {
      tags: ["Categories & Taxonomy"],
      summary: "List All Categories",
      description: "Returns flat or level-filtered categories.",
      operationId: "getAllCategories",
      responses: {
        200: {
          description: "Category list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
    post: {
      tags: ["Categories & Taxonomy"],
      summary: "Create Category (Admin Only)",
      description: "Creates a new category in the catalog taxonomy. Requires Admin authorization.",
      operationId: "createCategory",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "categoryId", "level"],
              properties: {
                name: { type: "string", example: "Men's Clothing" },
                categoryId: { type: "string", example: "men_clothing" },
                level: { type: "integer", example: 2 },
                parentCategory: { type: "string", example: "men" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Category created.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/category/{id}": {
    get: {
      tags: ["Categories & Taxonomy"],
      summary: "Get Category by ID",
      operationId: "getCategoryById",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Category object.", content: { "application/json": { schema: { type: "object" } } } },
      },
    },
    patch: {
      tags: ["Categories & Taxonomy"],
      summary: "Update Category (Admin Only)",
      operationId: "updateCategory",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Category updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
    delete: {
      tags: ["Categories & Taxonomy"],
      summary: "Delete Category (Admin Only)",
      operationId: "deleteCategory",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Category deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/brand": {
    get: {
      tags: ["Brands"],
      summary: "List All Marketplace Brands",
      operationId: "getAllBrands",
      responses: { 200: { description: "List of brands.", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } } },
    },
    post: {
      tags: ["Brands"],
      summary: "Create Brand (Admin Only)",
      operationId: "createBrand",
      security: [{ BearerAuth: [] }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, logo: { type: "string" } } } } } },
      responses: { 201: { description: "Brand created.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/brand/{id}": {
    patch: {
      tags: ["Brands"],
      summary: "Update Brand (Admin Only)",
      operationId: "updateBrand",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Brand updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
    delete: {
      tags: ["Brands"],
      summary: "Delete Brand (Admin Only)",
      operationId: "deleteBrand",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Brand deleted.", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } } } },
    },
  },
  "/api/v1/review/product/{productId}": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "Get Product Customer Reviews",
      description: "Retrieves verified customer reviews and ratings breakdown for a product.",
      operationId: "getProductReviews",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Reviews list.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } },
        },
      },
    },
    post: {
      tags: ["Reviews & Ratings"],
      summary: "Submit Customer Review",
      description: "Allows verified buyers to write a product review, submit a 1-5 star rating, and attach photo URLs.",
      operationId: "submitCustomerReview",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reviewText", "reviewRating"],
              properties: {
                reviewText: { type: "string", example: "Great product! Fits nicely." },
                reviewRating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                productImages: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Review created and queued for moderation.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Review" } } },
        },
      },
    },
  },
  "/api/v1/homeCategory/feed": {
    get: {
      tags: ["Storefront Feed"],
      summary: "Marketplace Homepage Feed & Carousels",
      description: "Aggregates hero promotions, featured categories, trending brands, and algorithmic product grids.",
      operationId: "getMarketplaceFeed",
      responses: {
        200: {
          description: "Marketplace feed components.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/product/resolve-variant/{productId}": {
    get: {
      tags: ["Products & Catalog"],
      summary: "Resolve Variant by Attributes",
      operationId: "resolveProductVariantByAttributes",
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Matched SKU variant.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/review/admin/all": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "Admin List All Reviews for Moderation",
      operationId: "adminListReviews",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "All reviews.",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } },
        },
      },
    },
  },
  "/api/v1/review/admin/{id}/status": {
    patch: {
      tags: ["Reviews & Ratings"],
      summary: "Admin Moderate Review Status",
      operationId: "adminUpdateReviewStatus",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["APPROVED", "REJECTED", "FLAGGED"] } } } } },
      },
      responses: {
        200: {
          description: "Review status updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/review/admin/{id}": {
    delete: {
      tags: ["Reviews & Ratings"],
      summary: "Admin Delete Inappropriate Review",
      operationId: "adminDeleteReview",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Review deleted.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
  "/api/v1/homeCategory/home-category": {
    get: {
      tags: ["Storefront Feed"],
      summary: "Get Home Category Configuration",
      operationId: "getHomeCategoryList",
      responses: {
        200: {
          description: "Home categories list.",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
      },
    },
  },
  "/api/v1/homeCategory/categories": {
    post: {
      tags: ["Storefront Feed"],
      summary: "Admin Create Home Category Configuration",
      operationId: "createHomeCategories",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object" } } },
      },
      responses: {
        201: {
          description: "Home category created.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
  "/api/v1/homeCategory/home-category/{id}": {
    patch: {
      tags: ["Storefront Feed"],
      summary: "Admin Update Home Category Configuration",
      operationId: "updateHomeCategory",
      security: [{ BearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object" } } },
      },
      responses: {
        200: {
          description: "Home category updated.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } } },
        },
      },
    },
  },
};
