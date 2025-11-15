// client/src/types/userTypes.ts

import type { Address } from "./addressTypes";

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  mobile: number;
  role: string;
  addresses: Address[]; // imported from addressTypes
  __v?: number;
}

export interface UserState {
  user: IUser | null;
  loading: boolean;
  error: any;
  message: string | null;
}

export interface FetchUserResponse {
  error: boolean;
  success: boolean;
  message?: string;
  user: IUser;
}
