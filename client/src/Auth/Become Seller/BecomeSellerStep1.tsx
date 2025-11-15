import { Box, TextField } from "@mui/material";

interface BecomeSellerStep1Props {
  formik: any;
}

const BecomeSellerStep1 = ({ formik }: BecomeSellerStep1Props) => {
  return (
    <Box className="">
      <p className="text-xl font-bold text-center pb-9">Contact Details</p>
      <div className="space-y-9">
        {/* Mobile */}
        <div>
          <TextField
            fullWidth
            id="mobile"
            name="mobile"
            label="Mobile"
            value={formik.values.mobile}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.mobile && Boolean(formik.errors.mobile)}
            helperText={formik.touched.mobile && formik.errors.mobile}
          />
        </div>

        {/* GSTIN */}
        <div>
          <TextField
            fullWidth
            id="GSTIN"
            name="GSTIN"
            label="GSTIN (eg. 29ABCDE1234F1Z5)" // (29- country code + ABCDE1234F- PAN no. + 1Z5- checksum)
            value={formik.values.GSTIN}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.GSTIN && Boolean(formik.errors.GSTIN)}
            helperText={formik.touched.GSTIN && formik.errors.GSTIN}
          />
        </div>
      </div>
    </Box>
  );
};

export default BecomeSellerStep1;
