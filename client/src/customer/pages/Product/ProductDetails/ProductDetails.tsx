import {
  Add,
  AddShoppingCart,
  Favorite,
  LocalShipping,
  Remove,
  Shield,
  Star,
  Wallet,
  WorkspacePremium,
} from "@mui/icons-material";
import { Button, Divider } from "@mui/material";
import { useEffect, useState } from "react";
import SimilarProducts from "./SimilarProducts";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { fetchProductById } from "../../../../Redux Toolkit/features/customer/ProductSlice";
import { useParams } from "react-router-dom";
import { addItemToCart } from "../../../../Redux Toolkit/features/customer/CartSlice";

const ProductDetails = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useAppDispatch();
  const { product } = useAppSelector((store) => store);

  const { productId, categoryId } = useParams();

  useEffect(() => {
    dispatch(fetchProductById(productId as string));
  }, [dispatch]);

  const handleChangeCurrentImage = (index: number) => {
    setCurrentImage(index);
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(value + quantity);
  };

  // add to cart
  const handleAddCartItem = () => {
    dispatch(
      addItemToCart({
        jwt: localStorage.getItem("jwt") as string,
        productId: product?.product?._id as string,
        quantity: quantity,
        size: product?.product?.size as string,
        ram: product?.product?.ram as string,
        weight: product?.product?.weight as string,
        capacity: product?.product?.capacity as string,
      })
    );
  };

  return (
    <div className="min-h-screen px-5 lg:px-20 pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[15%] flex flex-wrap lg:flex-col gap-3">
            {product?.product?.images.map((image, index) => (
              <img
                onClick={() => handleChangeCurrentImage(index)}
                key={index}
                src={image}
                alt={`Product Image ${index + 1}`}
                className="lg:w-full w-[50px] cursor-pointer rounded-md"
              />
            ))}
          </div>
          <div className="w-full lg:w-[85%]">
            <img
              src={product?.product?.images[currentImage]}
              alt="Current Product"
              className="w-full h-auto rounded-md"
            />
          </div>
        </section>
        <section className="">
          <h2 className="font-bold text-2xl">{product?.product?.title}</h2>
          <p className="text-teal-500 font-semibold">
            {product?.product?.brand}
          </p>

          <div className="flex justify-between items-center py-2 border border-gray-300 w-[180px] px-3 mt-5">
            <div className="rating flex items-center gap-1">
              <span>{"4.5"}</span>
              <Star color="primary" />
            </div>
            <Divider orientation="vertical" flexItem />
            <span className="rating-count">{"478 Ratings"}</span>
          </div>
          <div className="space-y-2 pt-5">
            <div className="price flex items-center gap-3 whitespace-nowrap">
              <span className="font-semibold text-lg">
                ₹ {product?.product?.sellingPrice}
              </span>
              <span className="text-sm font-thin line-through text-gray-400">
                ₹ {product?.product?.mrpPrice}
              </span>
              <span className="font-semibold text-teal-600">
                {product?.product?.discountPercent}% Off
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Inclusive of all taxes. Free Shipping above ₹1500.
            </p>
          </div>
          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-4">
              <Shield color="primary" /> <p>Authentic & Quality Assured</p>
            </div>
            <div className="flex items-center gap-4">
              <WorkspacePremium color="primary" />{" "}
              <p>100% money back guarantee</p>
            </div>
            <div className="flex items-center gap-4">
              <LocalShipping color="primary" /> <p>Free Shipping & Returns</p>
            </div>
            <div className="flex items-center gap-4">
              <Wallet color="primary" />{" "}
              <p>Pay on Delivery might be available</p>
            </div>
          </div>
          <div className="mt-7 space-y-2">
            <h1>QUANTITY</h1>
            <div className="flex items-center gap-2 w-[140px] justify-between">
              <Button
                variant="outlined"
                onClick={() => handleQuantityChange(-1)}
              >
                <Remove />
              </Button>
              <span>{quantity}</span>
              <Button
                variant="outlined"
                onClick={() => handleQuantityChange(1)}
              >
                <Add />
              </Button>
            </div>
          </div>
          <div className="mt-12 flex items-center gap-5">
            <Button
            onClick={handleAddCartItem}
              startIcon={<AddShoppingCart />}
              fullWidth
              variant="contained"
              sx={{ py: "1rem" }}
            >
              ADD TO Bag
            </Button>
            <Button
              startIcon={<Favorite />}
              fullWidth
              variant="outlined"
              sx={{ py: "1rem" }}
            >
              Wishlist
            </Button>
          </div>
          <div className="mt-5">
            <p className="text-gray-500 font-semibold">
              {product?.product?.description}
            </p>
          </div>
        </section>
      </div>
      <section className="mt-20">
        <h1 className="text-lg font-bold">Similar Products</h1>
        <div className="pt-5">
          <SimilarProducts />
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
