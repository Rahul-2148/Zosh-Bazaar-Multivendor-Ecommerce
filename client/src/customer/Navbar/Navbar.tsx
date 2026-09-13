import {
  AccountCircle,
  AddShoppingCart,
  Close,
  FavoriteBorder,
  Logout,
  Menu,
  Search,
  Storefront,
  DarkModeOutlined,
  LightModeOutlined,
  DesktopWindowsOutlined,
  CheckOutlined,
  LocationOnOutlined,
  NotificationsNoneOutlined,
  AdminPanelSettingsOutlined,
  KeyboardArrowDown,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Tooltip,
  Menu as MuiMenu,
  MenuItem,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { mainCategories } from "../../data/category/mainCategory";
import CategorySheet from "./CategorySheet";
import LocationSelector from "./LocationSelector";
import NotificationsPopover from "./NotificationsPopover";
import SearchSuggestionsDropdown from "./SearchSuggestionsDropdown";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import { performLogout } from "../../Redux Toolkit/features/Auth/AuthSlice";
import { fetchCategoryTree } from "../../Redux Toolkit/features/customer/CategorySlice";
import {
  fetchSearchSuggestions,
  clearSearchSuggestions,
} from "../../Redux Toolkit/features/customer/ProductSlice";
import { fetchUserAddresses } from "../../Redux Toolkit/features/customer/UserSlice";
import {
  syncWithSavedAddresses,
  detectCurrentGpsLocation,
} from "../../Redux Toolkit/features/customer/LocationSlice";
import { useTheme as useAppTheme } from "../../Theme/ThemeContext";
import { getCustomerSocket } from "../../utils/socket";
import { Api } from "../../config/Api";

const Navbar = () => {
  const { user, cart, wishlist } = useAppSelector((store) => store);
  const { tree } = useAppSelector((store) => (store as any).category || { tree: [] });
  const { activeLocation } = useAppSelector((store) => store.location);
  const dispatch = useAppDispatch();

  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Mega Menu State
  const [showSheet, setShowSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const sheetContainerRef = useRef<HTMLDivElement | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popover State
  const [locationAnchorEl, setLocationAnchorEl] = useState<HTMLElement | null>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Dynamic Portal Links
  const sellerPortalUrl = (import.meta.env.VITE_SELLER_PORTAL_URL || "http://localhost:5175").replace(/\/+$/, "");
  const adminPortalUrl = (import.meta.env.VITE_ADMIN_PORTAL_URL || "http://localhost:5176").replace(/\/+$/, "");
  const sellerRegisterUrl = `${sellerPortalUrl}/register`;

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("zosh_recent_searches");
      return stored ? JSON.parse(stored) : ["Headphones", "Sneakers", "Smartwatch"];
    } catch {
      return ["Headphones", "Sneakers", "Smartwatch"];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mode, isDark, setTheme } = useAppTheme();
  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenThemeMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setThemeAnchorEl(e.currentTarget);
  };

  const handleCloseThemeMenu = () => {
    setThemeAnchorEl(null);
  };

  const handleSelectTheme = (newMode: "light" | "dark" | "system") => {
    setTheme(newMode);
    handleCloseThemeMenu();
  };

  const getThemeTooltip = () => {
    if (mode === "system") return "Theme: System (Click to Switch)";
    return isDark ? "Theme: Dark Mode (Click to Switch)" : "Theme: Light Mode (Click to Switch)";
  };

  const { searchSuggestions } = useAppSelector((store) => store.product);
  const jwt = localStorage.getItem("jwt");

  // Fetch addresses on mount if logged in
  useEffect(() => {
    if (jwt) {
      dispatch(fetchUserAddresses(jwt));
      // Fetch initial unread notification count
      Api.get("/notifications?size=1", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then((res) => {
          if (res.data?.success) {
            setUnreadNotifCount(res.data.unreadCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [dispatch, jwt]);

  // Sync saved addresses with LocationSlice whenever addresses are updated
  useEffect(() => {
    if (user.addresses && user.addresses.length > 0) {
      dispatch(syncWithSavedAddresses(user.addresses));
    }
  }, [user.addresses, dispatch]);

  // Proactive realtime location auto-detection on initial app open if no saved address exists
  useEffect(() => {
    // If user has saved addresses in their account, default address has absolute authority
    if (user.addresses && user.addresses.length > 0) return;

    // Check if delivery pincode is cached from a previous session
    const storedPincode = localStorage.getItem("zosh_delivery_pincode");
    const storedLocality = localStorage.getItem("zosh_delivery_locality") || "";
    const isStale =
      storedLocality.includes("India Standard Coverage") ||
      storedLocality.includes("Postal Code");

    if (storedPincode && storedPincode.length === 6 && !isStale) return;

    if (isStale) {
      localStorage.removeItem("zosh_delivery_pincode");
      localStorage.removeItem("zosh_delivery_label");
      localStorage.removeItem("zosh_delivery_locality");
      localStorage.removeItem("zosh_delivery_city");
    }

    // Trigger realtime GPS and IP detection
    dispatch(detectCurrentGpsLocation());
  }, [user.addresses, dispatch]);

  // Real-time socket listener for customer
  useEffect(() => {
    if (user.user?._id) {
      const socket = getCustomerSocket(user.user._id);
      const handleOrderStatusUpdate = (payload: any) => {
        console.log("[Zosh Realtime] Order status updated:", payload);
      };
      const handleNotification = () => {
        setUnreadNotifCount((prev) => prev + 1);
      };

      socket.on("order:status_updated", handleOrderStatusUpdate);
      socket.on("notification:created", handleNotification);
      return () => {
        socket.off("order:status_updated", handleOrderStatusUpdate);
        socket.off("notification:created", handleNotification);
      };
    }
  }, [user.user?._id]);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (searchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        dispatch(fetchSearchSuggestions(searchQuery.trim()));
      }, 250);
    } else {
      dispatch(clearSearchSuggestions());
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, dispatch]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const updated = [cleaned, ...recentSearches.filter((s) => s.toLowerCase() !== cleaned.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem("zosh_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Phase 1: Robust Per-Item Mega Menu Trigger State Machine
  const handleCategoryMouseEnter = (categoryId: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setSelectedCategory(categoryId);
    setShowSheet(true);
  };

  const handleCategoryMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setShowSheet(false);
      setSelectedCategory(null);
    }, 180);
  };

  const handleSheetMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setShowSheet(true);
  };

  const handleSheetMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setShowSheet(false);
      setSelectedCategory(null);
    }, 180);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedCategory(categoryId);
      setShowSheet(true);
    } else if (e.key === "Escape") {
      setShowSheet(false);
      setSelectedCategory(null);
    }
  };

  // Close Mega Menu on Outside Click & Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSheet) {
        setShowSheet(false);
        setSelectedCategory(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showSheet &&
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node) &&
        sheetContainerRef.current &&
        !sheetContainerRef.current.contains(e.target as Node)
      ) {
        setShowSheet(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSheet]);

  useEffect(() => {
    dispatch(fetchCategoryTree());
  }, [dispatch]);

  const navCategories =
    tree && tree.length > 0
      ? tree.map((c: any) => ({ name: c.name, categoryId: c.categoryId }))
      : mainCategories;

  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(performLogout() as any);
    navigate("/");
    setMobileMenuOpen(false);
  };

  const cartItemCount = cart?.cart?.cartItems?.length || 0;
  const wishlistItemCount =
    wishlist?.totalSavedCount ??
    wishlist?.savedProductIds?.length ??
    wishlist?.wishlist?.products?.length ??
    0;

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 50,
        }}
        className="fixed top-0 left-0 right-0 w-full bg-card/95 backdrop-blur-md z-50 shadow-xs"
      >
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-10 xl:px-16 h-[68px] border-b border-border gap-2 sm:gap-4">
        {/* Left: Mobile Menu + Logo + Delivery Location */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {!isLargeScreen && (
            <IconButton onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" size="small">
              <Menu sx={{ fontSize: 24 }} className="text-foreground" />
            </IconButton>
          )}
          <h1
            onClick={() => navigate("/")}
            className="logo text-lg sm:text-2xl cursor-pointer whitespace-nowrap tracking-tight font-black"
          >
            Zosh Bazaar
          </h1>

          {/* Delivery Destination Button */}
          <button
            type="button"
            onClick={(e) => setLocationAnchorEl(e.currentTarget)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-left hover:bg-muted/70 transition-colors border border-transparent hover:border-border cursor-pointer shrink-0"
            title="Choose delivery location"
          >
            <LocationOnOutlined className="text-primary shrink-0" sx={{ fontSize: 18 }} />
            <div className="leading-tight">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {activeLocation.headerPrimary}
              </div>
              <div className="text-xs font-extrabold text-foreground truncate max-w-[185px] lg:max-w-[230px]">
                {activeLocation.headerSecondary}
              </div>
            </div>
            <KeyboardArrowDown sx={{ fontSize: 14 }} className="text-muted-foreground -ml-0.5" />
          </button>
        </div>


        {/* Center: Large Intelligent Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[540px] hidden sm:block">
          <form onSubmit={handleSearch} className="relative group">
            <div className="flex items-center h-[40px] w-full bg-muted/60 dark:bg-surface/80 hover:bg-muted dark:hover:bg-surface border border-border dark:border-border-strong hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-card rounded-full px-3.5 transition-all duration-150">
              <InputBase
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 text-[13px] text-foreground font-medium"
                inputProps={{ "aria-label": "Search products" }}
              />
              {searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery("");
                    dispatch(clearSearchSuggestions());
                  }}
                  className="p-0.5 mr-1"
                >
                  <Close sx={{ fontSize: 16 }} className="text-muted-foreground hover:text-foreground" />
                </IconButton>
              )}
              <IconButton type="submit" size="small" aria-label="Search" className="p-1">
                <Search sx={{ fontSize: 19 }} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
              </IconButton>
            </div>
          </form>

          {showSuggestions && (
            <SearchSuggestionsDropdown
              suggestions={searchSuggestions}
              recentSearches={recentSearches}
              onSelectSearch={(query) => {
                setSearchQuery(query);
                setShowSuggestions(false);
                saveRecentSearch(query);
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }}
              onClearRecent={() => {
                setRecentSearches([]);
                localStorage.removeItem("zosh_recent_searches");
              }}
              loading={false}
              searchQuery={searchQuery}
            />
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search toggle */}
          <div className="sm:hidden">
            <IconButton onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" size="small">
              <Search sx={{ fontSize: 22 }} className="text-foreground" />
            </IconButton>
          </div>

          {/* User Account */}
          {user.user ? (
            <Button
              onClick={() => navigate("/account")}
              className="flex items-center gap-1.5"
              sx={{ textTransform: "none", minWidth: "auto", px: 1 }}
            >
              <Avatar
                sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.main", fontWeight: "bold" }}
              >
                {user.user?.fullName?.charAt(0)?.toUpperCase()}
              </Avatar>
              {isLargeScreen && (
                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-[10px] text-muted-foreground font-semibold">Hello,</div>
                  <div className="text-xs font-bold text-foreground max-w-[90px] truncate">
                    {user.user?.fullName?.split(" ")[0]}
                  </div>
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              startIcon={isLargeScreen ? <AccountCircle /> : undefined}
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "0.65rem",
                px: 2,
              }}
            >
              {isLargeScreen ? "Login" : <AccountCircle />}
            </Button>
          )}

          {/* Role-Specific Portal Switchers */}
          {user.user?.role === "ROLE_SELLER" && (
            <a
              href={sellerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
            >
              <Storefront sx={{ fontSize: 16 }} />
              <span>Seller Panel</span>
            </a>
          )}

          {user.user?.role === "ROLE_ADMIN" && (
            <a
              href={adminPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            >
              <AdminPanelSettingsOutlined sx={{ fontSize: 16 }} />
              <span>Admin Portal</span>
            </a>
          )}


          {/* 3-Way Theme Switcher */}
          <Tooltip title={getThemeTooltip()} placement="bottom">
            <IconButton
              onClick={handleOpenThemeMenu}
              aria-label="Select theme mode"
              size="small"
              sx={{
                p: "6px",
                borderRadius: "8px",
                bgcolor: "var(--surface-hover)",
                color:
                  mode === "system"
                    ? "var(--primary)"
                    : isDark
                    ? "var(--warning)"
                    : "var(--foreground)",
                "&:hover": { bgcolor: "var(--surface-active)" },
                border: "1px solid",
                borderColor: "var(--border)",
              }}
            >
              {mode === "system" ? (
                <DesktopWindowsOutlined sx={{ fontSize: 18 }} />
              ) : isDark ? (
                <DarkModeOutlined sx={{ fontSize: 18 }} />
              ) : (
                <LightModeOutlined sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Theme Switcher Popover Menu */}
          <MuiMenu
            anchorEl={themeAnchorEl}
            open={Boolean(themeAnchorEl)}
            onClose={handleCloseThemeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                borderRadius: "0.75rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                minWidth: 170,
                p: 0.5,
              },
            }}
          >
            <MenuItem
              onClick={() => handleSelectTheme("light")}
              selected={mode === "light"}
              sx={{ fontSize: "13px", gap: 1.5, borderRadius: "6px", py: 1 }}
            >
              <LightModeOutlined sx={{ fontSize: 18, color: "#f59e0b" }} />
              <span className="flex-1 font-medium">Light Mode</span>
              {mode === "light" && <CheckOutlined sx={{ fontSize: 16, color: "primary.main" }} />}
            </MenuItem>
            <MenuItem
              onClick={() => handleSelectTheme("dark")}
              selected={mode === "dark"}
              sx={{ fontSize: "13px", gap: 1.5, borderRadius: "6px", py: 1 }}
            >
              <DarkModeOutlined sx={{ fontSize: 18, color: "#38bdf8" }} />
              <span className="flex-1 font-medium">Dark Mode</span>
              {mode === "dark" && <CheckOutlined sx={{ fontSize: 16, color: "primary.main" }} />}
            </MenuItem>
            <MenuItem
              onClick={() => handleSelectTheme("system")}
              selected={mode === "system"}
              sx={{ fontSize: "13px", gap: 1.5, borderRadius: "6px", py: 1 }}
            >
              <DesktopWindowsOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
              <span className="flex-1 font-medium">System Default</span>
              {mode === "system" && <CheckOutlined sx={{ fontSize: 16, color: "primary.main" }} />}
            </MenuItem>
          </MuiMenu>

          {/* Notifications */}
          <Tooltip title={`Notifications (${unreadNotifCount} unread)`} placement="bottom">
            <IconButton
              onClick={(e) => setNotificationsAnchorEl(e.currentTarget)}
              aria-label="Notifications"
              size="small"
            >
              <Badge badgeContent={unreadNotifCount} color="error" max={99}>
                <NotificationsNoneOutlined sx={{ fontSize: 22 }} className="text-foreground" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Wishlist */}
          <Tooltip title={`Wishlist (${wishlistItemCount} items)`} placement="bottom">
            <IconButton onClick={() => navigate("/wishlist")} aria-label="Wishlist" size="small">
              <Badge badgeContent={wishlistItemCount} color="error" max={99}>
                <FavoriteBorder sx={{ fontSize: 22 }} className="text-foreground" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Cart */}
          <Tooltip title={`Cart (${cartItemCount} items)`} placement="bottom">
            <IconButton onClick={() => navigate("/cart")} aria-label="Cart" size="small">
              <Badge badgeContent={cartItemCount} color="primary" max={99}>
                <AddShoppingCart sx={{ fontSize: 22 }} className="text-foreground" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Become Seller */}
          {isLargeScreen && (!user.user || user.user?.role === "ROLE_CUSTOMER") && (
            <Button
              onClick={() => {
                window.open(sellerRegisterUrl, "_blank", "noopener,noreferrer");
              }}
              variant="outlined"
              startIcon={<Storefront />}
              size="small"
              sx={{
                textTransform: "none",
                whiteSpace: "nowrap",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "0.65rem",
                borderColor: "border.main",
              }}
            >
              Become Seller
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Location Sub-bar (< md) */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-1.5 bg-muted/40 dark:bg-surface/60 border-b border-border/70 text-xs">
        <button
          type="button"
          onClick={(e) => setLocationAnchorEl(e.currentTarget)}
          className="flex items-center gap-1.5 text-left text-foreground hover:text-primary transition-colors truncate max-w-full"
        >
          <LocationOnOutlined className="text-primary shrink-0" sx={{ fontSize: 16 }} />
          <span className="font-semibold text-muted-foreground shrink-0">{activeLocation.headerPrimary}:</span>
          <span className="font-bold truncate max-w-[200px] sm:max-w-[320px]">{activeLocation.headerSecondary}</span>
          <KeyboardArrowDown sx={{ fontSize: 16 }} className="text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Category Nav Strip (Desktop) - Flipkart UI Benchmark: Clean, centered, and uncluttered */}
      {isLargeScreen && (
        <div
          ref={navContainerRef}
          className="relative border-b border-border/80 bg-card/95 backdrop-blur-xs flex items-center justify-center h-[42px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none"
        >
          <ul className="flex items-center justify-center gap-1 sm:gap-2 font-medium text-foreground whitespace-nowrap overflow-x-auto scrollbar-none py-0">
            {navCategories.map((category: any) => {
              const isSelected = showSheet && selectedCategory === category.categoryId;
              return (
                <li
                  key={category.categoryId}
                  tabIndex={0}
                  role="button"
                  aria-haspopup="true"
                  aria-expanded={isSelected}
                  onMouseEnter={() => handleCategoryMouseEnter(category.categoryId)}
                  onMouseLeave={handleCategoryMouseLeave}
                  onKeyDown={(e) => handleCategoryKeyDown(e, category.categoryId)}
                  onClick={() => {
                    setShowSheet(false);
                    navigate(`/products/${category.categoryId}`);
                  }}
                  className={`group relative flex items-center gap-1 h-[42px] px-3.5 lg:px-4 cursor-pointer text-[13px] font-semibold transition-colors duration-150 select-none focus:outline-none ${
                    isSelected
                      ? "text-primary font-bold"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  <span>{category.name}</span>
                  <KeyboardArrowDown
                    className={`transition-transform duration-200 text-muted-foreground group-hover:text-primary ${
                      isSelected ? "rotate-180 text-primary" : ""
                    }`}
                    sx={{ fontSize: 16 }}
                  />
                  {/* Flipkart-style bottom active underline indicator */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-t-full bg-primary transition-all duration-200 ${
                      isSelected
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-50 group-hover:opacity-60 group-hover:scale-x-75"
                    }`}
                  />
                </li>
              );
            })}
          </ul>

          {/* Category Sheet (Desktop) attached directly underneath with seamless debounce */}
          {showSheet && (
            <div
              ref={sheetContainerRef}
              onMouseEnter={handleSheetMouseEnter}
              onMouseLeave={handleSheetMouseLeave}
              className="categorySheet absolute top-full left-6 right-6 lg:left-12 lg:right-12 xl:left-20 xl:right-20 z-50 pt-0 shadow-2xl"
            >
              <CategorySheet
                selectedCategory={selectedCategory || ""}
                setShowSheet={setShowSheet}
              />
            </div>
          )}
        </div>
      )}

      {/* Responsive Location Selector (Desktop Popover + Mobile Bottom Sheet) */}
      <LocationSelector
        anchorEl={locationAnchorEl}
        open={Boolean(locationAnchorEl)}
        onClose={() => setLocationAnchorEl(null)}
      />

      {/* Notifications Popover */}
      <NotificationsPopover
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        userId={user.user?._id}
        onClose={() => {
          setNotificationsAnchorEl(null);
          setUnreadNotifCount(0);
        }}
        onUnreadCountChange={(count: number) => setUnreadNotifCount(count)}
      />

      {/* Mobile Search Bar */}
      {searchOpen && !isLargeScreen && (
        <div className="px-4 py-2 border-b border-border bg-card">
          <form onSubmit={handleSearch} className="flex items-center h-[36px] bg-muted/70 dark:bg-surface/80 border border-border dark:border-border-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-card rounded-full px-3 transition-all">
            <InputBase
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-[13px] text-foreground"
              autoFocus
              inputProps={{ "aria-label": "Search products" }}
            />
            <IconButton type="submit" size="small" aria-label="Search" className="p-0.5">
              <Search sx={{ fontSize: 18 }} className="text-muted-foreground" />
            </IconButton>
            <IconButton size="small" onClick={() => setSearchOpen(false)} aria-label="Close search" className="p-0.5">
              <Close sx={{ fontSize: 17 }} className="text-muted-foreground hover:text-foreground" />
            </IconButton>
          </form>
        </div>
      )}

      {/* Backdrop Scrim for Mega Menu */}
      {showSheet && isLargeScreen && (
        <div
          onClick={() => setShowSheet(false)}
          className="fixed inset-0 top-[108px] bg-black/25 dark:bg-black/60 backdrop-blur-[2px] z-40 transition-opacity duration-200"
        />
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 280 }} role="navigation">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="logo text-xl">Zosh Bazaar</h2>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <Close />
            </IconButton>
          </div>

          {user.user && (
            <div className="p-4 bg-primary/10 border-b border-border">
              <p className="font-medium text-primary">Hi, {user.user?.fullName}</p>
              <p className="text-sm text-primary/80">{user.user?.email}</p>
            </div>
          )}

          <List>
            {navCategories.map((category: any) => (
              <ListItem key={category.categoryId} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(`/products/${category.categoryId}`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemText primary={category.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <div className="border-t">
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { navigate("/orders"); setMobileMenuOpen(false); }}>
                  <ListItemText primary="My Orders" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { navigate("/wishlist"); setMobileMenuOpen(false); }}>
                  <ListItemText primary="Wishlist" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  setMobileMenuOpen(false);
                  window.open(sellerRegisterUrl, "_blank", "noopener,noreferrer");
                }}>
                  <ListItemText primary="Become a Seller" />
                </ListItemButton>
              </ListItem>
            </List>
          </div>

          {user.user && (
            <div className="border-t p-4">
              <Button
                onClick={handleLogout}
                startIcon={<Logout />}
                variant="outlined"
                color="error"
                fullWidth
                size="small"
              >
                Logout
              </Button>
            </div>
          )}
        </Box>
      </Drawer>
    </header>
    {/* Structural layout spacer to prevent page content from being obscured underneath fixed header */}
    <div className="h-[106px] md:h-[110px] shrink-0 pointer-events-none" aria-hidden="true" />
  </>
  );
};

export default Navbar;
