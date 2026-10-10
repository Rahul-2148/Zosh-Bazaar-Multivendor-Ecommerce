/**
 * OpenAPI 3.1 Paths: Customer User Profile & Address Book
 */

export const userPaths = {
  "/api/v1/user/profile": {
    get: {
      tags: ["Customer Profile"],
      summary: "Get Current Customer Profile",
      description: "Resolves customer identity from Bearer token claims and returns personal profile, role, and address references.",
      operationId: "getCurrentUserProfile",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Authenticated customer profile retrieved.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        401: {
          description: "Unauthorized or expired token.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Customer Profile"],
      summary: "Update Customer Profile Details",
      description: "Modifies profile fields such as full name and contact number.",
      operationId: "updateCurrentUserProfile",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                fullName: { type: "string", example: "Priya Sharma" },
                mobile: { type: "string", example: "9876543210" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Profile updated successfully.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
    },
  },
  "/api/v1/user/address": {
    get: {
      tags: ["Customer Addresses"],
      summary: "List Saved Customer Shipping Addresses",
      description: "Returns all saved delivery addresses for the authenticated customer.",
      operationId: "getUserAddresses",
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of shipping addresses.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Address" },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Customer Addresses"],
      summary: "Add New Shipping Address",
      description: "Adds a new delivery address to the customer's address book.",
      operationId: "addUserAddress",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Address" },
          },
        },
      },
      responses: {
        201: {
          description: "Address added successfully.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Address" },
            },
          },
        },
      },
    },
  },
  "/api/v1/user/address/{addressId}/default": {
    patch: {
      tags: ["Customer Addresses"],
      summary: "Set Default Shipping Address",
      description: "Marks the target address as the primary default shipping destination.",
      operationId: "setDefaultAddress",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "addressId",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "65f2a1b9c9e77c0012a9bc41",
        },
      ],
      responses: {
        200: {
          description: "Default address updated.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/user/address/{addressId}": {
    put: {
      tags: ["Customer Addresses"],
      summary: "Update Existing Shipping Address",
      description: "Replaces or updates fields on an existing shipping address.",
      operationId: "updateUserAddress",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "addressId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Address" },
          },
        },
      },
      responses: {
        200: {
          description: "Address updated successfully.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Address" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Customer Addresses"],
      summary: "Delete Shipping Address",
      description: "Removes an address from the customer's address book.",
      operationId: "deleteUserAddress",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "addressId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Address removed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/v1/user/location/reverse-geocode": {
    get: {
      tags: ["Customer Addresses"],
      summary: "Reverse Geocode Geographic Coordinates",
      description: "Converts latitude and longitude into normalized city, postal code, and street components.",
      operationId: "reverseGeocodeCoordinates",
      parameters: [
        {
          name: "lat",
          in: "query",
          required: true,
          schema: { type: "number" },
          example: 12.9716,
        },
        {
          name: "lng",
          in: "query",
          required: true,
          schema: { type: "number" },
          example: 77.5946,
        },
      ],
      responses: {
        200: {
          description: "Geocoded address parts returned.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  city: { type: "string", example: "Bengaluru" },
                  state: { type: "string", example: "Karnataka" },
                  pinCode: { type: "string", example: "560001" },
                  formattedAddress: { type: "string", example: "MG Road, Bengaluru, Karnataka 560001" },
                },
              },
            },
          },
        },
      },
    },
  },
};
