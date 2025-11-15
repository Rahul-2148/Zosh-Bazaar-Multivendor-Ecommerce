// Home Category type interface
export interface IHomeCategory {
  _id: string;
  name: string;
  image: string;
  categoryId: string;
  section: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// Redux Slice State
export interface HomeCategoryState {
  homeCategories: any;
  loading: boolean;
  error: any;
  message: string | null;
}

export interface HomePageData {
  grid: IHomeCategory[];
  shopByCategories: IHomeCategory[];
  electronicsCategories: IHomeCategory[];
  deals: any[]; // ya Deal[] agar tumne model banaya hai
  dealCategories: IHomeCategory[];
}

// API Response Types
export interface CreateHomeCategoriesResponse {
  error: boolean;
  success: boolean;
  message?: string;
  homeCategories: HomePageData; // ✅ abhi sahi hai
}

export interface GetAllHomeCategoriesResponse {
  error: boolean;
  success: boolean;
  message?: string;
  homeCategories: IHomeCategory[];
}

export interface UpdateHomeCategoryResponse {
  error: boolean;
  success: boolean;
  message?: string;
  homeCategory: IHomeCategory; // single object
}
