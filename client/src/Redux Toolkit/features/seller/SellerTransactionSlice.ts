import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  FetchTransactionsBySellerResponse,
  SellerTransactionsState,
} from "../../../types/sellerTypes/sellerTransactionTypes";
import { Api } from "../../../config/Api";

const initialState: SellerTransactionsState = {
  transactions: [],
  loading: false,
  error: null,
  message: null,
};

const API_URL = "/transactions";

// --------- Thunks ---------

export const fetchTransactionsBySeller = createAsyncThunk<
  FetchTransactionsBySellerResponse,
  string,
  { rejectValue: { message: string } }
>(
  "transactions/fetchTransactionsBySeller",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/seller`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("fetch transactions by seller", response.data);
      return response.data as FetchTransactionsBySellerResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch transactions" }
      );
    }
  }
);

const sellerTransactionSlice = createSlice({
  name: "sellerTransactions",
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetch transactions by seller
    // pending
    builder.addCase(fetchTransactionsBySeller.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });

    // fulfilled
    builder.addCase(fetchTransactionsBySeller.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions = action.payload.transactions;
      state.error = null;
      state.message = action.payload.message;
    });

    // rejected
    builder.addCase(fetchTransactionsBySeller.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch transactions";
      state.message = null;
    });
  },
});

export const { clearMessage } = sellerTransactionSlice.actions;
export default sellerTransactionSlice.reducer;
