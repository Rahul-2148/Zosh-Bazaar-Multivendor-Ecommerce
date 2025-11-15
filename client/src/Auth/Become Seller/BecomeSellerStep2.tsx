import { Grid, TextField } from "@mui/material";

interface BecomeSellerStep2Props {
  formik: any;
}

const BecomeSellerStep2 = ({ formik }: BecomeSellerStep2Props) => {
  return (
    <div>
      <Grid container spacing={3}>
        {/* name of pickup address */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="shopName"
            name="pickupAddress.name"
            label="Name"
            value={formik.values.pickupAddress.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.name &&
              Boolean(formik.errors.pickupAddress?.name)
            }
            helperText={
              formik.touched.pickupAddress?.name &&
              formik.errors.pickupAddress?.name
            }
          />
        </Grid>
        {/* email */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="email"
            name="pickupAddress.email"
            label="Email"
            value={formik.values.pickupAddress.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.email &&
              Boolean(formik.errors.pickupAddress?.email)
            }
            helperText={
              formik.touched.pickupAddress?.email &&
              formik.errors.pickupAddress?.email
            }
          />
        </Grid>
        {/* mobile */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="mobile"
            name="pickupAddress.mobile"
            label="Mobile"
            value={formik.values.pickupAddress.mobile}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.mobile &&
              Boolean(formik.errors.pickupAddress?.mobile)
            }
            helperText={
              formik.touched.pickupAddress?.mobile &&
              formik.errors.pickupAddress?.mobile
            }
          />
        </Grid>
        {/* address */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="address"
            name="pickupAddress.address"
            label="Address (House No, Building, Street)"
            value={formik.values.pickupAddress.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.address &&
              Boolean(formik.errors.pickupAddress?.address)
            }
            helperText={
              formik.touched.pickupAddress?.address &&
              formik.errors.pickupAddress?.address
            }
          />
        </Grid>
        {/* locality */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="locality"
            name="pickupAddress.locality"
            label="Locality/Town"
            value={formik.values.pickupAddress.locality}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.locality &&
              Boolean(formik.errors.pickupAddress?.locality)
            }
            helperText={
              formik.touched.pickupAddress?.locality &&
              formik.errors.pickupAddress?.locality
            }
          />
        </Grid>
        {/* city */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="city"
            name="pickupAddress.city"
            label="City"
            value={formik.values.pickupAddress.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.city &&
              Boolean(formik.errors.pickupAddress?.city)
            }
            helperText={
              formik.touched.pickupAddress?.city &&
              formik.errors.pickupAddress?.city
            }
          />
        </Grid>
        {/* state */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="state"
            name="pickupAddress.state"
            label="State/Province"
            value={formik.values.pickupAddress?.state}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.state &&
              Boolean(formik.errors.pickupAddress?.state)
            }
            helperText={
              formik.touched.pickupAddress?.state &&
              formik.errors.pickupAddress?.state
            }
          />
        </Grid>

        {/* pincode */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="pincode"
            name="pickupAddress.pincode"
            label="Pincode"
            value={formik.values.pickupAddress.pincode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.pincode &&
              Boolean(formik.errors.pickupAddress?.pincode)
            }
            helperText={
              formik.touched.pickupAddress?.pincode &&
              formik.errors.pickupAddress?.pincode
            }
          />
        </Grid>

        {/* country */}
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            id="country"
            name="pickupAddress.country"
            label="Country"
            value={formik.values.pickupAddress.country}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.pickupAddress?.country &&
              Boolean(formik.errors.pickupAddress?.country)
            }
            helperText={
              formik.touched.pickupAddress?.country &&
              formik.errors.pickupAddress?.country
            }
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default BecomeSellerStep2;
