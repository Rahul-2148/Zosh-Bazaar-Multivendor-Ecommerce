import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  TextField,
} from "@mui/material";
import { useState } from "react";

interface BecomeSellerStep4Props {
  formik: any;
}

const BecomeSellerStep4 = ({ formik }: BecomeSellerStep4Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-5">
      {/* business name */}
      <div>
        <TextField
          fullWidth
          id="businessName"
          name="businessDetails.businessName"
          label="Business Name"
          value={formik.values.businessDetails?.businessName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.businessDetails?.businessName &&
            Boolean(formik.errors.businessDetails?.businessName)
          }
          helperText={
            formik.touched.businessDetails?.businessName &&
            formik.errors.businessDetails?.businessName
          }
        />
      </div>

      {/* seller name */}
      <div>
        <TextField
          fullWidth
          id="sellerName"
          name="sellerName"
          label="Seller Name"
          value={formik.values.sellerName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.sellerName && Boolean(formik.errors.sellerName)}
          helperText={formik.touched.sellerName && formik.errors.sellerName}
        />
      </div>

      {/* business pan */}
      <div>
        <TextField
          fullWidth
          id="businessPan"
          name="businessDetails.businessPan"
          label="Business PAN"
          value={formik.values.businessDetails?.businessPan}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.businessDetails?.businessPan &&
            Boolean(formik.errors.businessDetails?.businessPan)
          }
          helperText={
            formik.touched.businessDetails?.businessPan &&
            formik.errors.businessDetails?.businessPan
          }
        />
      </div>

      {/* business logo file type */}
      <div>
        <InputLabel shrink={true} htmlFor="businessLogo">
          Upload Business Logo (optional)
        </InputLabel>
        <Input
          type="file"
          id="businessLogo"
          name="businessDetails.businessLogo"
          inputProps={{ accept: "image/*" }}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.businessDetails?.businessLogo &&
            Boolean(formik.errors.businessDetails?.businessLogo)
          }
        />
        {formik.touched.businessDetails?.businessLogo &&
          formik.errors.businessDetails?.businessLogo && (
            <div className="text-red-600 text-sm">
              {formik.errors.businessLogo}
            </div>
          )}
      </div>

      {/* banner */}
      <div>
        <InputLabel shrink={true} htmlFor="banner">
          Upload Banner Image (optional)
        </InputLabel>
        <Input
          type="file"
          id="banner"
          name="businessDetails.banner"
          inputProps={{ accept: "image/*" }}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.businessDetails?.banner &&
            Boolean(formik.errors.businessDetails?.banner)
          }
        />
        {formik.touched.businessDetails?.banner &&
          formik.errors.businessDetails?.banner && (
            <div className="text-red-600 text-sm">{formik.errors.banner}</div>
          )}
      </div>

      {/* email */}
      <div>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />
      </div>

      {/* password */}
      <div>
        <TextField
          fullWidth
          id="Password"
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default BecomeSellerStep4;
