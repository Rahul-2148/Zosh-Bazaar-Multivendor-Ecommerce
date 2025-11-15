import * as Yup from "Yup";

// Step 1: Tax Details & Mobile Number
const GSTIN_REGEX = /^[0-9A-Z]{15}$/;

export const step1Schema = Yup.object({
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Enter valid 10 digit mobile number")
    .required("Mobile number is required"),
  GSTIN: Yup.string()
    .matches(GSTIN_REGEX, "GSTIN must be exactly 15 alphanumeric characters")
    .required("GSTIN is required (eg. 29ABCDE1234F1Z5)"),
});

// Step 2: Pickup Address
export const step2Schema = Yup.object({
  pickupAddress: Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email")
    .required("Email is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Enter valid 10 digit number")
      .required("Mobile is required"),
    address: Yup.string().required("Address is required"),
    locality: Yup.string().required("Locality is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    pincode: Yup.string()
      .matches(/^[0-9]{6}$/, "Enter valid 6 digit number")
      .required("Pincode is required"),
    country: Yup.string().required("Country is required"),
  }),
});

// Step 3: Bank Details
export const step3Schema = Yup.object({
  bankDetails: Yup.object({
    accountNumber: Yup.string().required("Account number is required"),
    accountHolderName: Yup.string().required("Account holder name is required"),
    bankName: Yup.string().required("Bank name is required"),
    ifscCode: Yup.string().required("IFSC Code is required"),
    accountBranch: Yup.string().required("Branch is required"),
    accountHolderEmail: Yup.string()
      .email("Invalid email")
      .required("Account holder email is required"),
  }),
});

// Step 4: Business Details
export const step4Schema = Yup.object({
  sellerName: Yup.string().required("Seller name is required"),
  businessDetails: Yup.object({
    businessName: Yup.string().required("Business name is required"),
    businessPan: Yup.string().required("Business PAN is required"),
    businessLogo: Yup.string().nullable(),
    banner: Yup.string().nullable(),
  }),
  email: Yup.string().email("Invalid email").required("email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// otp: Yup.string().required("OTP is required"),
