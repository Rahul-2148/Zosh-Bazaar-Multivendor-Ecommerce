import * as Yup from "Yup";

// address validation schema
export const addressValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Invalid mobile number")
    .required("Mobile is required"),
  address: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  country: Yup.string()
    .min(2, "Country must be at least 2 characters")
    .required("Country is required"),
  pincode: Yup.string()
    .matches(/^[0-9]{6}$/, "Invalid pincode")
    .required("Pincode is required"),
  locality: Yup.string().required("Locality is required"),
});

// product validation schema
export const productValidationSchema = Yup.object({
  title: Yup.string()
    .min(3, "Title must be at least 3 characters")
    .required("Title is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .required("Description is required"),
  brand: Yup.string().required("Brand is required"),
  mrpPrice: Yup.number().required("MRP Price is required"),
  sellingPrice: Yup.number().required("Selling Price is required"),
  countInStock: Yup.number().required("Count in Stock is required"),
  color: Yup.string()
    .min(3, "Color must be at least 3 characters")
    .required("Color is required"),
  images: Yup.array().of(Yup.string()),
  category1: Yup.string().required("Category is required"),
  category2: Yup.string().required("Category 2 is required"),
  category3: Yup.string().required("Category 3 is required"),
  size: Yup.string(),
  ram: Yup.string(),
  weight: Yup.string(),
  capacity: Yup.string(),
});

// login form validation
export const LoginFormValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  otp: Yup.string()
    .length(6, "OTP must be exactly 6 characters")
    .required("OTP is required"),
});

// signup form validation
export const SignupFormValidationSchema = Yup.object({
  fullName: Yup.string()
    .min(3, "Full name must be at least 3 characters")
    .required("Full name is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number")
    .required("Mobile number is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  otp: Yup.string()
    .length(6, "OTP must be exactly 6 characters")
    .required("OTP is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters"),
});

// .matches(/^[0-9]{6}$/, "OTP must be exactly 6 digits")
