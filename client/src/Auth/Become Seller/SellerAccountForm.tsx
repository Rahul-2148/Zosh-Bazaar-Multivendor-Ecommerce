import { Button, Step, StepLabel, Stepper } from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import {
  clearSellerAuthMessages,
  createSeller,
} from "../../Redux Toolkit/features/seller/SellerAuthenticationSlice";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from "../../Validation/sellerAccountFormValidationSchema";
import { useSnackbar } from "../../common/SnackbarProvider";
import type { CreateSellerRequest } from "../../types/sellerTypes/sellerAuthTypes";
import BecomeSellerStep1 from "./BecomeSellerStep1";
import BecomeSellerStep2 from "./BecomeSellerStep2";
import BecomeSellerStep3 from "./BecomeSellerStep3";
import BecomeSellerStep4 from "./BecomeSellerStep4";

const steps = [
  "Tax Details & Mobile Number",
  "Pickup Address",
  "Bank Details",
  "Business Details",
];

const getValidationSchema = (step: number) => {
  switch (step) {
    case 0:
      return step1Schema;
    case 1:
      return step2Schema;
    case 2:
      return step3Schema;
    case 3:
      return step4Schema;
    default:
      return step1Schema;
  }
};

// Helper: Deep touched object generate karega
const setNestedTouched = (obj: any) => {
  if (typeof obj !== "object" || obj === null) return true;
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = setNestedTouched(obj[key]);
    return acc;
  }, {} as any);
};

const SellerAccountForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const dispatch = useAppDispatch();
  const { error, message } = useAppSelector((state) => state.sellerAuth);

  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar(); // use global snackbar

  const formik = useFormik<CreateSellerRequest>({
    initialValues: {
      mobile: "",
      GSTIN: "",
      sellerName: "",
      businessDetails: {
        businessName: "",
        businessPan: "",
        businessLogo: "",
        banner: "",
      },
      bankDetails: {
        accountNumber: "",
        accountHolderName: "",
        bankName: "",
        ifscCode: "",
        accountBranch: "",
        accountHolderEmail: "",
      },
      pickupAddress: {
        name: "",
        email: "",
        mobile: "",
        address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        locality: "",
      },
      email: "",
      password: "",
      role: "ROLE_SELLER", // backend default
      accountStatus: "PENDING_VERIFICATION", // backend default
      isEmailVerified: false, // backend default
    },
    validationSchema: getValidationSchema(activeStep),
    onSubmit: (values) => {
      dispatch(createSeller(values));
    },
  });

  // Snackbar auto trigger from global context
  useEffect(() => {
    if (error) {
      showSnackbar(error, "error");
      dispatch(clearSellerAuthMessages());
    }
    if (message) {
      showSnackbar(message, "success");
      formik.resetForm();
      setActiveStep(0);
      dispatch(clearSellerAuthMessages());
      navigate("/become-seller?login=true");
    }
  }, [error, message, dispatch, formik, showSnackbar]);

  return (
    <div>
      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Forms */}
      <div className="mt-20 space-y-10">
        {activeStep === 0 ? (
          <BecomeSellerStep1 formik={formik} />
        ) : activeStep === 1 ? (
          <BecomeSellerStep2 formik={formik} />
        ) : activeStep === 2 ? (
          <BecomeSellerStep3 formik={formik} />
        ) : (
          <BecomeSellerStep4 formik={formik} />
        )}
      </div>

      {/* Stepper Controls */}
      <div className="flex items-center justify-between mt-5">
        <Button
          variant="contained"
          disabled={activeStep === 0}
          onClick={() => setActiveStep(activeStep - 1)}
        >
          Back
        </Button>

        <Button
          variant="contained"
          onClick={async () => {
            if (activeStep === steps.length - 1) {
              await formik.submitForm();
            } else {
              const errors = await formik.validateForm();
              if (Object.keys(errors).length === 0) {
                setActiveStep(activeStep + 1);
              } else {
                formik.setTouched(setNestedTouched(errors));
              }
            }
          }}
        >
          {activeStep === steps.length - 1 ? "Create Account" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default SellerAccountForm;

{
  /* <Button
  variant="contained"
  onClick={
    activeStep === steps.length - 1
      ? () => formik.submitForm()
      : () => setActiveStep(activeStep + 1)
  }
>
  {activeStep === steps.length - 1 ? "Create Account" : "Next"}
</Button>; */
}
