import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  OrderState,
  FetchSingleOrderResponse,
  FetchOrderHistoryResponse,
  FetchOrderItemResponse,
  IPaymentOrder,
  IOrder,
} from "../../../types/orderTypes";

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
  orderItem: null,
  currentOrder: null,
  paymentOrder: null,
  message: null,
};

const API_URL = "/order";

// 🔹 fetch user order history
export const fetchUserOrderHistory = createAsyncThunk<
  FetchOrderHistoryResponse,
  string
>("/order/fetchUserOrderHistory", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/user-order-history`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// 🔹 fetch order by id
export const fetchOrderById = createAsyncThunk<
  FetchSingleOrderResponse,
  { jwt: string; orderId: string }
>("/order/fetchOrderById", async ({ jwt, orderId }, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/${orderId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// 🔹 create order
export const createOrder = createAsyncThunk<
  { order: any; paymentOrder: IPaymentOrder; message?: string },
  { address: any; jwt: string; paymentGateway: string }
>(
  "/order/createOrder",
  async ({ address, jwt, paymentGateway }, { rejectWithValue }) => {
    try {
      const response = await Api.post(
        `${API_URL}/create`,
        { shippingAddress: address },
        {
          headers: { Authorization: `Bearer ${jwt}` },
          params: { paymentMethod: paymentGateway },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// 🔹 fetch order item by id
export const fetchOrderItemById = createAsyncThunk<
  FetchOrderItemResponse,
  { jwt: string; orderItemId: string }
>(
  "/order/fetchOrderItemById",
  async ({ jwt, orderItemId }, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/item/${orderItemId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// 🔹 payment success handler
export const paymentSuccessHandler = createAsyncThunk<
  { message: string },
  { jwt: string; paymentId: string; paymentLinkId: string }
>(
  "/order/paymentSuccessHandler",
  async ({ jwt, paymentId, paymentLinkId }, { rejectWithValue }) => {
    try {
      const response = await Api.get(`/payment/${paymentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        params: { paymentLinkId },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// cancel order
export const cancelOrder = createAsyncThunk<
  { message: string; order: IOrder },
  string
>("/order/cancelOrder", async (orderId, { rejectWithValue }) => {
  try {
    const response = await Api.put(
      `${API_URL}/${orderId}/cancel`,
      {},
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      }
    );
    return response.data; // { message, order }
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// delete an order
export const deleteOrder = createAsyncThunk<
  { message: string; order: IOrder }, // 👈 include order
  string
>("/order/deleteOrder", async (orderId, { rejectWithValue }) => {
  try {
    const response = await Api.delete(`${API_URL}/${orderId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    return response.data; // { message, order }
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// 🔹 Slice
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
      state.orderItem = null;
      state.orders = [];
      state.paymentOrder = null;
      state.message = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch user order history
    builder.addCase(fetchUserOrderHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.orders = [];
    });
    builder.addCase(fetchUserOrderHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload.orderHistory;
      state.message = action.payload.message || "Orders fetched successfully";
    });
    builder.addCase(fetchUserOrderHistory.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message =
        action.payload?.message || "Failed to fetch order history";
      state.orders = [];
    });

    // fetch order by id
    builder.addCase(fetchOrderById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.currentOrder = null;
    });
    builder.addCase(fetchOrderById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
      state.message = action.payload.message || "Order fetched successfully";
    });
    builder.addCase(fetchOrderById.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch order";
      state.currentOrder = null;
    });

    // fetch order item by id
    builder.addCase(fetchOrderItemById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.orderItem = null;
    });
    builder.addCase(fetchOrderItemById.fulfilled, (state, action) => {
      state.loading = false;
      state.orderItem = action.payload.orderItem;
      state.message =
        action.payload.message || "Order item fetched successfully";
    });
    builder.addCase(fetchOrderItemById.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch order item";
      state.orderItem = null;
    });

    // create order
    builder.addCase(createOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
      state.paymentOrder = action.payload.paymentOrder;
      state.message = action.payload.message || "Order created successfully";
    });
    builder.addCase(createOrder.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to create order";
    });

    // payment success handler
    builder.addCase(paymentSuccessHandler.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(paymentSuccessHandler.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message || "Payment successful";
    });
    builder.addCase(paymentSuccessHandler.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Payment failed";
    });

    // cancel order
    builder.addCase(cancelOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
      state.message = action.payload.message || "Order cancelled successfully";
    });
    builder.addCase(cancelOrder.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to cancel order";
    });

    // delete an order
    builder.addCase(deleteOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
      state.message = action.payload.message || "Order deleted successfully";
    });
    builder.addCase(deleteOrder.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to delete order";
    });
  },
});

export const { resetOrderState, clearMessage } = orderSlice.actions;
export default orderSlice.reducer;
