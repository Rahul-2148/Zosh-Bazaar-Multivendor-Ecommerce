import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeOutlined,
  CategoryOutlined,
  FavoriteBorderOutlined,
  ShoppingBagOutlined,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { useAppSelector } from "../../Redux Toolkit/Store";

export const MobileBottomNav: React.FC = () => {
  const { cart, wishlist, user } = useAppSelector((store) => store);

  const cartCount = cart.cart?.cartItems?.length || 0;
  const wishlistCount =
    wishlist.totalSavedCount ??
    wishlist.savedProductIds?.length ??
    wishlist.wishlist?.products?.length ??
    0;
  const isLoggedIn = !!user.user || !!localStorage.getItem("jwt");

  const navItems = [
    {
      label: "Home",
      to: "/",
      icon: <HomeOutlined sx={{ fontSize: 22 }} />,
    },
    {
      label: "Categories",
      to: "/products",
      icon: <CategoryOutlined sx={{ fontSize: 22 }} />,
    },
    {
      label: "Wishlist",
      to: "/wishlist",
      icon: <FavoriteBorderOutlined sx={{ fontSize: 22 }} />,
      badge: wishlistCount,
    },
    {
      label: "Bag",
      to: "/cart",
      icon: <ShoppingBagOutlined sx={{ fontSize: 22 }} />,
      badge: cartCount,
    },
    {
      label: isLoggedIn ? "Account" : "Sign In",
      to: isLoggedIn ? "/account" : "/login?returnTo=/account",
      icon: <PersonOutlineOutlined sx={{ fontSize: 22 }} />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/95 border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`
            }
          >
            <div className="relative flex items-center justify-center">
              {item.icon}

              {/* Dynamic Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 tracking-tight leading-none">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
