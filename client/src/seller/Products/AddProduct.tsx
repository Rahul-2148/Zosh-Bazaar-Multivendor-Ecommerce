import { AddPhotoAlternate, Close } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import { electronicsLevelThree } from "../../data/category/level three/electronicsLevelThree";
import { furnitureLevelThree } from "../../data/category/level three/furnitureLevelThree";
import { menLevelThree } from "../../data/category/level three/menLevelThree";
import { womenLevelThree } from "../../data/category/level three/womenLevelThree";
import { electronicsLevelTwo } from "../../data/category/level two/electronicsLevelTwo";
import { furnitureLevelTwo } from "../../data/category/level two/furnitureLevelTwo";
import { menLevelTwo } from "../../data/category/level two/menLevelTwo";
import { womenLevelTwo } from "../../data/category/level two/womenLevelTwo";
import { mainCategories } from "../../data/category/mainCategory";
import { colors } from "../../data/filter/color";
import { productValidationSchema } from "../../Validation/validationSchemas";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import { createProduct } from "../../Redux Toolkit/features/seller/SellerProductSlice";

const sizes = ["FREE", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

const rams = ["1GB", "2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB"];

const weights = ["1KG", "3KG", "5KG", "10KG", "30KG", "50KG"];

const capacities = ["1ltr", "2ltr", "3ltr", "5ltr", "10ltr", "30ltr", "50ltr"];

const categoryTwo: { [key: string]: any[] } = {
  men: menLevelTwo,
  women: womenLevelTwo,
  kids: [],
  home_furniture: furnitureLevelTwo,
  beauty: [],
  electronics: electronicsLevelTwo,
};

const categoryThree: { [key: string]: any[] } = {
  men: menLevelThree,
  women: womenLevelThree,
  kids: [],
  home_furniture: furnitureLevelThree,
  beauty: [],
  electronics: electronicsLevelThree,
};

const AddProduct = () => {
  const [uploadImage, setUploadImage] = useState(false);
  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
      title: "",
      brand: "",
      description: "",
      mrpPrice: "",
      sellingPrice: "",
      color: "",
      images: [],
      category1: "",
      category2: "",
      category3: "",
      size: "",
      ram: "",
      weight: "",
      capacity: "",
      countInStock: "",
    },
    validationSchema: productValidationSchema, // Use the imported validation schema
    onSubmit: (values) => {
      const jwt = localStorage.getItem("jwt") || "";

      const payload = {
        ...values,
        mrpPrice: Number(values.mrpPrice),
        sellingPrice: Number(values.sellingPrice),
        countInStock: Number(values.countInStock),
      };

      dispatch(createProduct({ jwt, product: payload }));
    },
  });

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setUploadImage(true);

    const image = await uploadToCloudinary(
      file!,
      "Zosh_Bazaar_Ecommerce_Multivendor/product_images",
      "image"
    );

    // Sirf URL store karo
    formik.setFieldValue("images", [...formik.values.images, image.secure_url]);

    setUploadImage(false);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...formik.values.images];
    updatedImages.splice(index, 1);
    formik.setFieldValue("images", updatedImages);
  };

  const childCategory = (category: any, parentCategoryId: any) => {
    return category.filter(
      (child: any) => child.parentCategoryId === parentCategoryId
    );
  };

  return (
    <div className="">
      <h1 className="text-3xl font-bold text-center py-5 uppercase">
        Add Product
      </h1>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* Product Image Upload with Preview */}
          <Grid className="flex flex-wrap gap-5" size={{ xs: 12 }}>
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            <label htmlFor="fileInput" className="relative">
              <span className="flex items-center justify-center w-24 h-24 p-3 cursor-pointer border border-gray-400 rounded-md">
                <AddPhotoAlternate className="text-gray-700" />
              </span>
              {uploadImage && (
                <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center w-24 h-24">
                  <CircularProgress />
                </div>
              )}
            </label>

            <div className="flex flex-wrap gap-2">
              {formik.values.images.map((image, index) => (
                <div className="relative" key={index}>
                  <img
                    src={image}
                    alt={`Product Image ${index + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                  <IconButton
                    onClick={() => handleRemoveImage(index)}
                    size="small"
                    color="error"
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      outline: "none",
                    }}
                  >
                    <Close sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </div>
              ))}
            </div>
          </Grid>

          {/* Product title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              id="title"
              name="title"
              label="Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
          </Grid>

          {/* Product description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              multiline
              minRows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
            />
          </Grid>

          {/* Product brand */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              id="brand"
              name="brand"
              label="Brand"
              value={formik.values.brand}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.brand && Boolean(formik.errors.brand)}
              helperText={formik.touched.brand && formik.errors.brand}
            />
          </Grid>

          {/* Product mrp price */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TextField
              fullWidth
              id="mrpPrice"
              name="mrpPrice"
              label="MRP Price"
              value={formik.values.mrpPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mrpPrice && Boolean(formik.errors.mrpPrice)}
              helperText={formik.touched.mrpPrice && formik.errors.mrpPrice}
            />
          </Grid>

          {/* Product selling price */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TextField
              fullWidth
              id="sellingPrice"
              name="sellingPrice"
              label="Selling Price"
              value={formik.values.sellingPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.sellingPrice &&
                Boolean(formik.errors.sellingPrice)
              }
              helperText={
                formik.touched.sellingPrice && formik.errors.sellingPrice
              }
            />
          </Grid>

          {/* Count in stock */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TextField
              fullWidth
              id="countInStock"
              name="countInStock"
              label="Count in Stock"
              value={formik.values.countInStock}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.countInStock &&
                Boolean(formik.errors.countInStock)
              }
              helperText={
                formik.touched.countInStock && formik.errors.countInStock
              }
            />
          </Grid>

          {/* Product color */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl
              fullWidth
              error={formik.touched.color && Boolean(formik.errors.color)}
            >
              <InputLabel id="color-label">Color</InputLabel>
              <Select
                id="color"
                labelId="color-label"
                name="color"
                value={formik.values.color}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {colors.map((color, index) => (
                  <MenuItem key={index} value={color.name}>
                    {color.name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.color && formik.errors.color && (
                <FormHelperText>{formik.errors.color}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Product size */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="color-label">Size</InputLabel>
              <Select
                id="size"
                labelId="size-label"
                name="size"
                label="Size"
                value={formik.values.size}
                onBlur={formik.handleBlur}
                error={formik.touched.size && Boolean(formik.errors.size)}
                onChange={formik.handleChange}
              >
                <MenuItem value="none">None</MenuItem>
                {sizes.map((size, index) => (
                  <MenuItem key={index} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Product ram */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="color-label">RAM</InputLabel>
              <Select
                id="ram"
                labelId="ram-label"
                name="ram"
                label="RAM"
                value={formik.values.ram}
                onBlur={formik.handleBlur}
                error={formik.touched.ram && Boolean(formik.errors.ram)}
                onChange={formik.handleChange}
              >
                <MenuItem value="none">None</MenuItem>
                {rams.map((ram, index) => (
                  <MenuItem key={index} value={ram}>
                    {ram}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Product weight */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="color-label">Weight</InputLabel>
              <Select
                id="weight"
                labelId="weight-label"
                name="weight"
                label="Weight"
                value={formik.values.weight}
                onBlur={formik.handleBlur}
                error={formik.touched.weight && Boolean(formik.errors.weight)}
                onChange={formik.handleChange}
              >
                <MenuItem value="none">None</MenuItem>
                {weights.map((weight, index) => (
                  <MenuItem key={index} value={weight}>
                    {weight}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Product capacity */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="color-label">Capacity</InputLabel>
              <Select
                id="capacity"
                labelId="capacity-label"
                name="capacity"
                label="Capacity"
                value={formik.values.capacity}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.capacity && Boolean(formik.errors.capacity)
                }
                onChange={formik.handleChange}
              >
                <MenuItem value="none">None</MenuItem>
                {capacities.map((capacity, index) => (
                  <MenuItem key={index} value={capacity}>
                    {capacity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Product category1 (Main Category) */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <FormControl
              fullWidth
              error={
                formik.touched.category1 && Boolean(formik.errors.category1)
              }
            >
              <InputLabel id="category1-label">Category</InputLabel>
              <Select
                id="category1"
                labelId="category1-label"
                name="category1"
                value={formik.values.category1}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {mainCategories.map((mainCategory, index) => (
                  <MenuItem key={index} value={mainCategory.categoryId}>
                    {mainCategory.name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.category1 && formik.errors.category1 && (
                <FormHelperText>{formik.errors.category1}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Product category2 (Sub Category) */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <FormControl
              fullWidth
              error={
                formik.touched.category2 && Boolean(formik.errors.category2)
              }
            >
              <InputLabel id="category2-label">Sub Category</InputLabel>
              <Select
                id="category2"
                labelId="category2-label"
                name="category2"
                value={formik.values.category2}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {formik.values.category1 &&
                  categoryTwo[formik.values.category1].map(
                    (category2, index) => (
                      <MenuItem key={index} value={category2.categoryId}>
                        {category2.name}
                      </MenuItem>
                    )
                  )}
              </Select>
              {formik.touched.category2 && formik.errors.category2 && (
                <FormHelperText>{formik.errors.category2}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Product category3 (Third Level Category) */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <FormControl
              fullWidth
              error={
                formik.touched.category3 && Boolean(formik.errors.category3)
              }
            >
              <InputLabel id="category3-label">Third Level Category</InputLabel>
              <Select
                id="category3"
                labelId="category3-label"
                name="category3"
                value={formik.values.category3}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {formik.values.category2 &&
                  childCategory(
                    categoryThree[formik.values.category1] || [],
                    formik.values.category2
                  )?.map((category3: any, index: number) => (
                    <MenuItem key={index} value={category3.categoryId}>
                      {category3.name}
                    </MenuItem>
                  ))}
              </Select>
              {formik.touched.category3 && formik.errors.category3 && (
                <FormHelperText>{formik.errors.category3}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Add Product Button */}
          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              sx={{ p: "14px" }}
              variant="contained"
              fullWidth
            >
              Add Product
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default AddProduct;

// https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200
