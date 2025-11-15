import {
  AccountCircle,
  AddShoppingCart,
  FavoriteBorder,
  Menu,
  Search,
  Storefront,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { mainCategories } from "../../data/category/mainCategory";
import CategorySheet from "./CategorySheet";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";

const Navbar = () => {
  const { user } = useAppSelector((store) => store);
  // const dispatch = useAppDispatch();

  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [showSheet, setShowSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("men");

  const navigate = useNavigate();

  return (
    <Box className="sticky top-0 left-0 right-0 bg-white blur-bg bg-opacity-80 z-100">
      <div className="flex items-center justify-between px-5 lg:px-20 h-[70px] border-b border-gray-200">
        {/* logo, categories */}
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-2">
            {!isLargeScreen && (
              <IconButton>
                <Menu sx={{ fontSize: 29 }} className="text-gray-700" />
              </IconButton>
            )}
            <h1
              onClick={() => navigate("/")}
              className="logo text-lg md:text-2xl cursor-pointer whitespace-nowrap"
            >
              Zosh Bazaar
            </h1>
          </div>

          <ul className="flex items-center font-medium text-gray-800 whitespace-nowrap">
            {mainCategories.map((category) => (
              <li
                onMouseLeave={() => setShowSheet(false)}
                onMouseEnter={() => {
                  setShowSheet(true);
                  setSelectedCategory(category.categoryId);
                }}
                key={category.categoryId}
                className="mainCategory hover:text-[#00927c] hover:border-b-2 cursor-pointer h-[70px] px-4 border-[#00927c] flex items-center"
              >
                {category.name}
              </li>
            ))}
          </ul>
        </div>

        {/* search, login/avatar, wishlist, cart */}
        <div className="flex items-center gap-4">
          <IconButton>
            <Search sx={{ fontSize: 29 }} className="text-gray-700" />
          </IconButton>
          {user.user ? (
            <Button
              onClick={() => navigate("/account")}
              className="flex items-center gap-2"
            >
              <Avatar
                sx={{ width: 35, height: 35 }}
                src="https://tse2.mm.bing.net/th/id/OIP.j11pt13ZectNBnErbzz1JAHaHa?pid=Api&P=0&h=180"
              />
              <h1 className="text-[13px] whitespace-nowrap">
                {user.user?.fullName && user.user?.fullName}
              </h1>
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              startIcon={<AccountCircle />}
              variant="contained"
            >
              Login
            </Button>
          )}
          <IconButton onClick={() => navigate("/wishlist")}>
            <FavoriteBorder sx={{ fontSize: 29 }} className="text-gray-700" />
          </IconButton>
          <IconButton onClick={() => navigate("/cart")}>
            <AddShoppingCart sx={{ fontSize: 29 }} className="text-gray-700" />
          </IconButton>
          <Button
            onClick={() => navigate("/become-seller")}
            variant="outlined"
            startIcon={<Storefront />}
            className="whitespace-nowrap"
          >
            Become Seller
          </Button>
        </div>
      </div>

      {showSheet && (
        <div
          onMouseLeave={() => setShowSheet(false)}
          onMouseEnter={() => setShowSheet(true)}
          className="categorySheet absolute top-[4.4rem] left-20 right-20"
        >
          <CategorySheet
            selectedCategory={selectedCategory}
            setShowSheet={setShowSheet}
          />
        </div>
      )}
    </Box>
  );
};

export default Navbar;
