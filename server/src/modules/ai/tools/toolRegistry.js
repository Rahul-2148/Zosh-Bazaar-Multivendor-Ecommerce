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
    description: 'Get authoritative product specifications, price, seller info, and live inventory status.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: '24-character hexadecimal MongoDB ObjectId' },
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
    description: 'Add a verified product to the authenticated user cart. Requires quantity and optional size.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        quantity: { type: 'number', description: 'Quantity (1-10, default 1)' },
        size: { type: 'string', description: 'Selected size option if applicable' },
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
