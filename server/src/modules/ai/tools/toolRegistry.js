/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - TOOL REGISTRY
 * Standard schemas for authoritative commerce tools.
 */

export const COMMERCE_TOOLS = [
  {
    name: 'searchProducts',
    description: 'Search active marketplace catalog by keyword, category, price range, and brand.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product title, brand, or category keywords' },
        maxBudget: { type: 'number', description: 'Maximum price in INR (e.g. 25000)' },
        category: { type: 'string', description: 'Category identifier or name' },
        brand: { type: 'string', description: 'Brand filter' },
        limit: { type: 'number', description: 'Max items to return (1-10, default 4)' },
      },
      required: ['query'],
    },
    mutation: false,
    requiresAuth: false,
  },
  {
    name: 'getProduct',
    description: 'Get authoritative product specifications, price, seller info, live inventory status, and generic variant configurations (RAM, storage, size, color, etc.).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: '24-character hexadecimal MongoDB ObjectId' },
        variantId: { type: 'string', description: 'Optional specific variant ID to inspect' },
        color: { type: 'string', description: 'Optional color attribute to resolve' },
        size: { type: 'string', description: 'Optional size attribute to resolve' },
      },
      required: ['productId'],
    },
    mutation: false,
    requiresAuth: false,
  },
  {
    name: 'resolveVariant',
    description: 'Authoritatively resolve exact product SKU, live pricing, stock availability, and option-level media gallery based on user chosen attributes (e.g. Color=Blue, Size=M, or RAM=12GB).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID or MongoDB ObjectId' },
        color: { type: 'string', description: 'Color attribute (e.g. Blue, Purple)' },
        size: { type: 'string', description: 'Size attribute (e.g. M, L, 9, 10)' },
        sku: { type: 'string', description: 'Exact SKU code if known' },
        attributes: { type: 'object', description: 'Custom attribute map (e.g. { "ram": "12GB", "storage": "256GB" })' },
      },
      required: ['productId'],
    },
    mutation: false,
    requiresAuth: false,
  },
  {
    name: 'compareProducts',
    description: 'Compare 2 to 4 products side-by-side with specifications, prices, ratings, and pros/cons.',
    parameters: {
      type: 'object',
      properties: {
        productIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of 2 to 4 product IDs to compare',
        },
      },
      required: ['productIds'],
    },
    mutation: false,
    requiresAuth: false,
  },
  {
    name: 'getPriceHistory',
    description: 'Retrieve 90-day price trend history, highest, lowest, and current discount for a product.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        days: { type: 'number', description: 'Historical days (default 90)' },
      },
      required: ['productId'],
    },
    mutation: false,
    requiresAuth: false,
  },
  {
    name: 'getCart',
    description: 'View the authenticated shopper current shopping cart items, total amount, and discounts.',
    parameters: {
      type: 'object',
      properties: {},
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getWishlist',
    description: 'Retrieve authenticated shopper wishlist items.',
    parameters: {
      type: 'object',
      properties: {},
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getOrder',
    description: 'Get details of a specific placed order, items, delivery status, and tracking ID.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID or MongoDB ObjectId' },
      },
      required: ['orderId'],
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getDeliveryStatus',
    description: 'Check live logistics tracking, courier checkpoint, and predicted ETA for an order or tracking ID.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID' },
        trackingId: { type: 'string', description: 'Logistics tracking identifier' },
      },
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'checkReturnEligibility',
    description: 'Verify whether an delivered order or item is eligible for return or replacement under seller policy.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID' },
        orderItemId: { type: 'string', description: 'Specific item ID' },
      },
      required: ['orderId'],
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'setPriceAlert',
    description: 'Create an automatic price-drop alert when a product falls below the target price.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        targetPrice: { type: 'number', description: 'Target alert price in INR' },
      },
      required: ['productId', 'targetPrice'],
    },
    mutation: true,
    requiresAuth: true,
  },
  {
    name: 'addToCart',
    description: 'Add a verified product or exact variant to the authenticated user cart. Supports quantity, size, color, exact variantId, and SKU.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        quantity: { type: 'number', description: 'Quantity (1-10, default 1)' },
        variantId: { type: 'string', description: 'Exact variant ID if known' },
        sku: { type: 'string', description: 'Exact variant SKU if known' },
        color: { type: 'string', description: 'Selected color option (e.g. Blue)' },
        size: { type: 'string', description: 'Selected size option (e.g. M)' },
        attributes: { type: 'object', description: 'Additional variant attributes' },
      },
      required: ['productId'],
    },
    mutation: true,
    requiresAuth: true,
    requiresConfirmation: false,
  },
  {
    name: 'updateCart',
    description: 'Update quantity of an item or remove item (quantity: 0) from cart.',
    parameters: {
      type: 'object',
      properties: {
        cartItemId: { type: 'string', description: 'Cart Item ID' },
        quantity: { type: 'number', description: 'New quantity (0 to remove)' },
      },
      required: ['cartItemId', 'quantity'],
    },
    mutation: true,
    requiresAuth: true,
  },
  {
    name: 'getWalletBalance',
    description: 'Get the authenticated customer live Zosh Wallet balance, available balance, reserved balance, and promotional balance.',
    parameters: {
      type: 'object',
      properties: {},
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getPaymentStatus',
    description: 'Check the real-time payment status, attempt history, and transaction references for a specific order or payment intent.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID or MongoDB ObjectId' },
        intentId: { type: 'string', description: 'Payment Intent public ID (e.g. pi_...)' },
      },
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getRefundStatus',
    description: 'Check the authoritative refund status, amounts, and bank transaction reference for a refunded order or item.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID' },
        refundId: { type: 'string', description: 'Refund reference ID if known' },
      },
      required: ['orderId'],
    },
    mutation: false,
    requiresAuth: true,
  },
  {
    name: 'getPaymentOffers',
    description: 'Check active bank offers, card instant discounts, UPI cashbacks, and no-cost EMI options for an order amount.',
    parameters: {
      type: 'object',
      properties: {
        orderAmount: { type: 'number', description: 'Order or cart payable amount in INR' },
        rail: { type: 'string', description: 'Optional payment rail filter (UPI, CARD, NETBANKING, EMI)' },
      },
    },
    mutation: false,
    requiresAuth: false,
  },
];

/**
 * Format tools for Google Gemini format
 */
export function getGeminiToolDeclarations() {
  return [
    {
      functionDeclarations: COMMERCE_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ];
}

/**
 * Format tools for OpenAI / Groq / DeepSeek format
 */
export function getOpenAIToolDeclarations() {
  return COMMERCE_TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
