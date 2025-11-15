import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type { FetchUserResponse, UserState } from "../../../types/userTypes";

const API_URL = "/user";

// fetch user profile
export const fetchUserProfile = createAsyncThunk<FetchUserResponse, string>(
  "/user/fetchUserProfile",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await Api.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      // console.log("fetch user profile", response.data);
      return response.data as FetchUserResponse;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: "Signin failed" }
      );
    }
  }
);

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  message: null,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    resetUserState: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.message = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.user = null;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user; // <-- use user inside payload
      state.message =
        action.payload.message || "User profile fetched successfully";
      state.error = null;
    });
    builder.addCase(fetchUserProfile.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      state.message = action.payload?.message || "Failed to fetch user profile";
      state.user = null;
    });
  },
});

export const { resetUserState, clearMessage } = userSlice.actions;
export default userSlice.reducer;
