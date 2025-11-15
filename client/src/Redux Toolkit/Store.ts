import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import { thunk } from "redux-thunk";
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

// seller reducers import
import sellerAuthenticationReducer from "./features/seller/SellerAuthenticationSlice";
import sellerOrderReducer from "./features/seller/SellerOrderSlice";
import sellerProductReducer from "./features/seller/SellerProductSlice";
import sellerReducer from "./features/seller/SellerSlice";
import sellerTransactionReducer from "./features/seller/SellerTransactionSlice";

// admin reducers import
import adminReducer from "./features/admin/AdminSlice";
import adminHomeCategoryReducer from "./features/admin/AdminHomeCategorySlice";
import adminDealReducer from "./features/admin/AdminDealSlice";
import adminCouponReducer from "./features/admin/AdminCouponSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  product: productReducer,
  order: orderReducer,
  cart: cartReducer,
  coupon: couponReducer,
  homeCategory: homeCategoryReducer,

  // seller reducers
  sellerAuth: sellerAuthenticationReducer,
  sellerOrder: sellerOrderReducer,
  sellerProduct: sellerProductReducer,
  seller: sellerReducer,
  sellerTransaction: sellerTransactionReducer,

  // admin reducers
  admin: adminReducer,
  adminHomeCategory: adminHomeCategoryReducer,
  adminDeal: adminDealReducer,
  adminCoupon: adminCouponReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(), //iski wajah se thunk ki jarurat nhi
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
