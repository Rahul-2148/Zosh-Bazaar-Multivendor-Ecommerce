import { useFormik } from "formik";
import { CouponFormValidationSchema } from "../../Validation/adminValidationSchemas";
import { Box, TextField, Button, Grid } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import dayjs from "dayjs";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import { createCoupon } from "../../Redux Toolkit/features/admin/AdminCouponSlice";

interface CouponFormValues {
  code: string;
  discountPercentage: number;
  validityStartDate: dayjs.Dayjs | null;
  validityEndDate: dayjs.Dayjs | null;
  minimumOrderValue: number;
}

const CouponForm = () => {
  const dispatch = useAppDispatch();

  const formik = useFormik<CouponFormValues>({
    initialValues: {
      code: "",
      discountPercentage: 0,
      validityStartDate: null,
      validityEndDate: null,
      minimumOrderValue: 0,
    },
    validationSchema: CouponFormValidationSchema,
    onSubmit: (values) => {
      console.log(values);
      dispatch(
        createCoupon({
          code: values.code,
          discount: values.discountPercentage,
          jwt: localStorage.getItem("jwt") as string,
        })
      );
    },
  });

  return (
    <div className="max-w-3xl">
      <Box sx={{ mt: 3 }} component="form" onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* Coupon Code */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              id="code"
              name="code"
              label="Coupon Code"
              value={formik.values.code}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.code && Boolean(formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
            />
          </Grid>

          {/* Discount Percentage */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              id="discountPercentage"
              name="discountPercentage"
              label="Discount Percentage"
              value={formik.values.discountPercentage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.discountPercentage &&
                Boolean(formik.errors.discountPercentage)
              }
              helperText={
                formik.touched.discountPercentage &&
                formik.errors.discountPercentage
              }
            />
          </Grid>

          {/* Validity Start Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  sx={{ width: "100%" }}
                  label="Validity Start Date"
                  value={
                    formik.values.validityStartDate
                      ? dayjs(formik.values.validityStartDate)
                      : null
                  }
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "validityStartDate",
                      newValue ? newValue.toISOString() : null
                    );
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      onBlur: formik.handleBlur,
                      error:
                        formik.touched.validityStartDate &&
                        Boolean(formik.errors.validityStartDate),
                      helperText:
                        formik.touched.validityStartDate &&
                        formik.errors.validityStartDate,
                    },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Grid>

          {/* Validity End Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  sx={{ width: "100%" }}
                  label="Validity End Date"
                  value={
                    formik.values.validityEndDate
                      ? dayjs(formik.values.validityEndDate)
                      : null
                  }
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "validityEndDate",
                      newValue ? newValue.toISOString() : null
                    );
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      onBlur: formik.handleBlur,
                      error:
                        formik.touched.validityEndDate &&
                        Boolean(formik.errors.validityEndDate),
                      helperText:
                        formik.touched.validityEndDate &&
                        formik.errors.validityEndDate,
                    },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Grid>

          {/* Minimum Order Value */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              id="minimumOrderValue"
              name="minimumOrderValue"
              label="Minimum Order Value"
              value={formik.values.minimumOrderValue}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.minimumOrderValue &&
                Boolean(formik.errors.minimumOrderValue)
              }
              helperText={
                formik.touched.minimumOrderValue &&
                formik.errors.minimumOrderValue
              }
            />
          </Grid>

          {/* Submit Button */}
          <Grid size={{ xs: 12 }}>
            <Button
              className="!py-[12px]"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Save Coupon
            </Button>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default CouponForm;
