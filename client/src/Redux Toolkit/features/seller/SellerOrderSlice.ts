import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  FetchSellerOrdersResponse,
  SellerOrderState,
  UpdateOrderStatusResponse,
  DeleteOrderResponse,
} from "../../../types/sellerTypes/sellerOrderTypes";

const initialState: SellerOrderState = {
  orders: [],
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/seller/order";

// fetch seller orders
export const fetchSellerOrders = createAsyncThunk<
  FetchSellerOrdersResponse,
  string
>("/sellerOrders/fetchSellerOrders", async (jwt, { rejectWithValue }) => {
  try {
    const response = await Api.get(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("fetch seller orders", response.data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// update order status
export const updateOrderStatus = createAsyncThunk<
  UpdateOrderStatusResponse,
  { orderId: string; orderStatus: string }
>(
  "/order/updateOrderStatus",
  async ({ orderId, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await Api.patch(
        `${API_URL}/${orderId}/status/${orderStatus}`,
        {}, // empty body
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
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

// delete an order
export const deleteOrder = createAsyncThunk<DeleteOrderResponse, string>(
  "/order/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await Api.delete(`${API_URL}/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const sellerOrderSlice = createSlice({
  name: "sellerOrder",
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // fetch seller orders
    builder.addCase(fetchSellerOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(fetchSellerOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.error = null;
      state.message = action.payload.message ?? null;
    });
    builder.addCase(fetchSellerOrders.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message ?? "Failed to fetch orders";
      state.message = null;
    });

    // update order status
    builder.addCase(updateOrderStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message;
      state.error = null;

      // replace updated order inside state.orders
      const updatedOrder = action.payload.order;
      state.orders = state.orders.map((originalOrder) =>
        originalOrder._id === updatedOrder._id ? updatedOrder : originalOrder
      );
    });
    builder.addCase(updateOrderStatus.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message ?? "Failed to update order status";
      state.message = null;
    });

    // delete an order
    builder.addCase(deleteOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(deleteOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message;
      state.error = null;

      // remove deleted order from state.orders
      const deletedOrder = action.payload.order;
      state.orders = state.orders.filter(
        (originalOrder) => originalOrder._id !== deletedOrder._id
      );
    });
    builder.addCase(deleteOrder.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message ?? "Failed to delete order";
      state.message = null;
    });
  },
});

export const { clearMessage } = sellerOrderSlice.actions;
export default sellerOrderSlice.reducer;
