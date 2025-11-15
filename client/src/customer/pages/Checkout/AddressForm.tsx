import { Box, Grid, TextField } from "@mui/material";
import { useFormik } from "formik";
import { addressValidationSchema } from "../../../Validation/validationSchemas";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { createOrder } from "../../../Redux Toolkit/features/customer/OrderSlice";

const AddressForm = ({ paymentGateway }: { paymentGateway: string }) => {
  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
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
    validationSchema: addressValidationSchema, // Use the imported validation schema
    onSubmit: (values) => {
      console.log("Form submitted:", values);

      dispatch(
        createOrder({
          address: values,
          jwt: localStorage.getItem("jwt") as string,
          paymentGateway,
        })
      );
    },
  });

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <p className="text-xl font-bold text-center pb-5">Contact Details</p>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Grid>
          {/* Mobile */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Mobile"
              name="mobile"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
            />
          </Grid>
          {/* Pincode */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Pin Code"
              name="pincode"
              value={formik.values.pincode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.pincode && Boolean(formik.errors.pincode)}
              helperText={formik.touched.pincode && formik.errors.pincode}
            />
          </Grid>
          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Address (House No, Building, Street)"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
            />
          </Grid>
          {/* Locality/Town */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Locality/Town"
              name="locality"
              value={formik.values.locality}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.locality && Boolean(formik.errors.locality)}
              helperText={formik.touched.locality && formik.errors.locality}
            />
          </Grid>
          {/* City */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city}
            />
          </Grid>
          {/* State */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="State/Province"
              name="state"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.state && Boolean(formik.errors.state)}
              helperText={formik.touched.state && formik.errors.state}
            />
          </Grid>
          {/* Country */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Country/Region"
              name="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.country && Boolean(formik.errors.country)}
              helperText={formik.touched.country && formik.errors.country}
            />
          </Grid>
          {/* Email */}
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AddressForm;
