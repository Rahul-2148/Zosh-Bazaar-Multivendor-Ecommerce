import { useFormik } from "formik";
import { CreateDealFormValidationSchema } from "../../Validation/adminValidationSchemas";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { menLevelTwo } from "../../data/category/level two/menLevelTwo";

const CreateDealForm = () => {
  const formik = useFormik({
    initialValues: {
      discount: 0,
      category: "",
    },
    validationSchema: CreateDealFormValidationSchema,
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <Box
      onSubmit={formik.handleSubmit}
      component="form"
      sx={{ width: 600, margin: "auto", padding: 3 }}
      className="space-y-6"
    >
      <div>
        <Typography variant="h4" sx={{ textAlign: "center" }}>
          Create New Deal
        </Typography>
      </div>

      <div className="">
        <TextField
          fullWidth
          name="discount"
          label="Discount"
          value={formik.values.discount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.discount && Boolean(formik.errors.discount)}
          helperText={formik.touched.discount && formik.errors.discount}
        ></TextField>
      </div>

      <div>
        <FormControl
          fullWidth
          error={formik.touched.category && Boolean(formik.errors.category)}
        >
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            id="category"
            labelId="category-label"
            name="category"
            value={formik.values.category}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            <MenuItem value="">None</MenuItem>
            {menLevelTwo.map((item, index) => (
              <MenuItem key={index} value={item.categoryId}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
          {formik.touched.category && formik.errors.category && (
            <FormHelperText>{formik.errors.category}</FormHelperText>
          )}
        </FormControl>
      </div>

      <div className="">
        <Button fullWidth sx={{ py: "11px" }} variant="contained" type="submit">
          Create Deal
        </Button>
      </div>
    </Box>
  );
};

export default CreateDealForm;
