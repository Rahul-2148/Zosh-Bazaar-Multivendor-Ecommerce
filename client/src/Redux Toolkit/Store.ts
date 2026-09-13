import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

// customer reducers import
import authReducer from "./features/Auth/AuthSlice";
import userReducer from "./features/customer/UserSlice";
import productReducer from "./features/customer/ProductSlice";
import orderReducer from "./features/customer/OrderSlice";
import cartReducer from "./features/customer/CartSlice";
import couponReducer from "./features/customer/CouponSlice";
import homeCategoryReducer from "./features/customer/HomeCategorySlice";
import wishlistReducer from "./features/customer/WishlistSlice";
import categoryReducer from "./features/customer/CategorySlice";
import reviewReducer from "./features/customer/ReviewSlice";
import locationReducer from "./features/customer/LocationSlice";

// RTK Query client API
import { clientApi } from "./api/clientApiSlice";

const rootReducer = combineReducers({
  [clientApi.reducerPath]: clientApi.reducer,
  auth: authReducer,
  user: userReducer,
  product: productReducer,
  category: categoryReducer,
  review: reviewReducer,
  order: orderReducer,
  cart: cartReducer,
  coupon: couponReducer,
  homeCategory: homeCategoryReducer,
  wishlist: wishlistReducer,
  location: locationReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clientApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
