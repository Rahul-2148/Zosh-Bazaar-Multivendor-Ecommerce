// client/src/types/addressTypes.ts

export interface Address {
  name: string; 
  locality: string; 
  pincode: number | string; 
  address: string; 
  city: string; 
  state: string; 
  mobile: number | string; 
  email: string; 
  country: string; 
  _id?: string;
  __v?: number;
  createdAt?: string;
  updatedAt?: string;
}