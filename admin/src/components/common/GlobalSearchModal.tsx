import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchOutlined,
  CloseOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  StorefrontOutlined,
  Inventory2Outlined,
  PeopleAltOutlined,
  CategoryOutlined,
  BrandingWatermarkOutlined,
  LocalOfferOutlined,
  ConfirmationNumberOutlined,
  ViewCarouselOutlined,
  ReceiptLongOutlined,
  SettingsOutlined,
  RateReviewOutlined,
  WarehouseOutlined,
  LaunchOutlined,
  HistoryOutlined,
  SubdirectoryArrowLeftOutlined,
  FlashOnOutlined,
  TagOutlined,
} from "@mui/icons-material";
import { adminApi } from "../../api/adminApi";
import { useTheme } from "../../context/ThemeContext";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

type SearchCategory = "ALL" | "NAV" | "ORDERS" | "PRODUCTS" | "SELLERS" | "CUSTOMERS" | "ACTIONS";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Order" | "Product" | "Seller" | "Customer" | "Action" | "Catalog";
  type: SearchCategory;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "primary" | "success" | "warning" | "destructive" | "info" | "neutral";
  action: () => void;
}

const STATIC_NAVIGATION_ITEMS = [
  { title: "Dashboard", path: "/", icon: <DashboardOutlined /> },
  { title: "Orders & Fulfillment", path: "/orders", icon: <ShoppingCartOutlined /> },
  { title: "Vendors & Sellers", path: "/sellers", icon: <StorefrontOutlined /> },
  { title: "Customers", path: "/customers", icon: <PeopleAltOutlined /> },
  { title: "Categories Manager", path: "/categories", icon: <CategoryOutlined /> },
  { title: "Brand Registry", path: "/brands", icon: <BrandingWatermarkOutlined /> },
  { title: "Product Catalog", path: "/products", icon: <Inventory2Outlined /> },
  { title: "Stock Control & Inventory", path: "/inventory", icon: <WarehouseOutlined /> },
  { title: "Reviews & Moderation", path: "/reviews", icon: <RateReviewOutlined /> },
  { title: "Deals & Offers", path: "/deals", icon: <LocalOfferOutlined /> },
  { title: "Coupons & Discounts", path: "/coupons", icon: <ConfirmationNumberOutlined /> },
  { title: "Storefront Banners", path: "/storefront-banners", icon: <ViewCarouselOutlined /> },
  { title: "Transactions & Ledger", path: "/transactions", icon: <ReceiptLongOutlined /> },
  { title: "Platform Settings", path: "/settings", icon: <SettingsOutlined /> },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cached API Data for live deep search
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("admin_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Lazily load data on first modal open
      if (!dataLoaded) {
        Promise.allSettled([
          adminApi.getAllOrders("ALL", 1),
          adminApi.getAllProducts(1),
          adminApi.getAllSellers("ALL"),
          adminApi.getAllCustomers(1),
          adminApi.getAllCategories(),
          adminApi.getAllBrands(true),
        ]).then(([resOrders, resProducts, resSellers, resCustomers, resCategories, resBrands]) => {
          if (resOrders.status === "fulfilled" && resOrders.value?.orders) {
            setOrders(resOrders.value.orders);
          }
          if (resProducts.status === "fulfilled" && resProducts.value?.products) {
            setProducts(resProducts.value.products);
          }
          if (resSellers.status === "fulfilled" && Array.isArray(resSellers.value)) {
            setSellers(resSellers.value);
          }
          if (resCustomers.status === "fulfilled" && resCustomers.value?.customers) {
            setCustomers(resCustomers.value.customers);
          }
          if (resCategories.status === "fulfilled" && Array.isArray(resCategories.value)) {
            setCategories(resCategories.value);
          }
          if (resBrands.status === "fulfilled" && Array.isArray(resBrands.value)) {
            setBrands(resBrands.value);
          }
          setDataLoaded(true);
        });
      }
    }
  }, [open, dataLoaded]);

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("admin_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== text);
    setRecentSearches(updated);
    try {
      localStorage.setItem("admin_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  // Compile full search results based on query
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Quick Actions
    const quickActions: SearchResultItem[] = [
      {
        id: "act-create-product",
        title: "Add New Product",
        subtitle: "Create a new product listing in catalog",
        category: "Action",
        type: "ACTIONS",
        icon: <FlashOnOutlined sx={{ fontSize: 18 }} />,
        badge: "Action",
        badgeColor: "primary",
        action: () => {
          navigate("/products");
          onClose();
        },
      },
      {
        id: "act-create-coupon",
        title: "Create Discount Coupon",
        subtitle: "Issue promotional discount codes",
        category: "Action",
        type: "ACTIONS",
        icon: <ConfirmationNumberOutlined sx={{ fontSize: 18 }} />,
        badge: "Action",
        badgeColor: "primary",
        action: () => {
          navigate("/coupons");
          onClose();
        },
      },
      {
        id: "act-create-deal",
        title: "Launch Category Deal",
        subtitle: "Setup time-limited flash deals",
        category: "Action",
        type: "ACTIONS",
        icon: <LocalOfferOutlined sx={{ fontSize: 18 }} />,
        badge: "Action",
        badgeColor: "primary",
        action: () => {
          navigate("/deals");
          onClose();
        },
      },
      {
        id: "act-toggle-theme",
        title: "Toggle Theme Mode",
        subtitle: "Switch between Light, Dark, or System mode",
        category: "Action",
        type: "ACTIONS",
        icon: <FlashOnOutlined sx={{ fontSize: 18 }} />,
        badge: "Appearance",
        badgeColor: "neutral",
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "act-live-store",
        title: "Open Live Customer Store",
        subtitle: "View storefront as customer in live environment",
        category: "Action",
        type: "ACTIONS",
        icon: <LaunchOutlined sx={{ fontSize: 18 }} />,
        badge: "External",
        badgeColor: "info",
        action: () => {
          window.open(import.meta.env.VITE_STOREFRONT_URL || "http://localhost:5173", "_blank");
          onClose();
        },
      },
    ];

    if (!q) {
      // Empty query: Show Navigation and Quick Actions
      STATIC_NAVIGATION_ITEMS.forEach((nav) => {
        results.push({
          id: `nav-${nav.path}`,
          title: nav.title,
          subtitle: `Admin Section → ${nav.title}`,
          category: "Navigation",
          type: "NAV",
          icon: React.cloneElement(nav.icon, { sx: { fontSize: 18 } }),
          badge: "Page",
          badgeColor: "neutral",
          action: () => {
            navigate(nav.path);
            onClose();
          },
        });
      });
      results.push(...quickActions);
      return results;
    }

    // 1. Filter Navigation
    STATIC_NAVIGATION_ITEMS.forEach((nav) => {
      if (nav.title.toLowerCase().includes(q) || nav.path.toLowerCase().includes(q)) {
        results.push({
          id: `nav-${nav.path}`,
          title: nav.title,
          subtitle: `Go to ${nav.title} page`,
          category: "Navigation",
          type: "NAV",
          icon: React.cloneElement(nav.icon, { sx: { fontSize: 18 } }),
          badge: "Page",
          badgeColor: "neutral",
          action: () => {
            saveRecentSearch(nav.title);
            navigate(nav.path);
            onClose();
          },
        });
      }
    });

    // 2. Filter Orders (Deep In-Depth)
    orders.forEach((ord) => {
      const id = String(ord.id || ord._id || "");
      const buyer = ord.user?.fullName || ord.shippingAddress?.name || "Customer";
      const status = ord.orderStatus || "PENDING";
      const total = ord.totalSellingPrice || ord.totalAmount || 0;
      const paymentMethod = ord.paymentMethod || "";

      if (
        id.toLowerCase().includes(q) ||
        buyer.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        paymentMethod.toLowerCase().includes(q)
      ) {
        results.push({
          id: `order-${id}`,
          title: `Order #${id.slice(-6).toUpperCase()}`,
          subtitle: `Buyer: ${buyer} • Total: ₹${total.toLocaleString("en-IN")}`,
          category: "Order",
          type: "ORDERS",
          icon: <ShoppingCartOutlined sx={{ fontSize: 18 }} />,
          badge: status,
          badgeColor:
            status === "DELIVERED"
              ? "success"
              : status === "CANCELLED"
              ? "destructive"
              : status === "SHIPPED"
              ? "info"
              : "warning",
          action: () => {
            saveRecentSearch(`Order #${id.slice(-6).toUpperCase()}`);
            navigate("/orders");
            onClose();
          },
        });
      }
    });

    // 3. Filter Products (Deep In-Depth)
    products.forEach((prod) => {
      const id = String(prod.id || prod._id || "");
      const title = prod.title || "Untitled Product";
      const category = prod.category?.name || "General";
      const price = prod.sellingPrice || prod.price || 0;
      const stock = prod.quantity ?? prod.countInStock ?? 0;

      if (title.toLowerCase().includes(q) || category.toLowerCase().includes(q)) {
        results.push({
          id: `product-${id}`,
          title,
          subtitle: `Category: ${category} • Stock: ${stock} in inventory`,
          category: "Product",
          type: "PRODUCTS",
          icon: <Inventory2Outlined sx={{ fontSize: 18 }} />,
          badge: `₹${price.toLocaleString("en-IN")}`,
          badgeColor: "primary",
          action: () => {
            saveRecentSearch(title);
            navigate("/products");
            onClose();
          },
        });
      }
    });

    // 4. Filter Sellers / Vendors
    sellers.forEach((seller) => {
      const id = String(seller.id || seller._id || "");
      const storeName = seller.sellerName || seller.businessDetails?.businessName || "Vendor Store";
      const email = seller.email || "";
      const status = seller.accountStatus || "ACTIVE";

      if (storeName.toLowerCase().includes(q) || email.toLowerCase().includes(q) || status.toLowerCase().includes(q)) {
        results.push({
          id: `seller-${id}`,
          title: storeName,
          subtitle: `Email: ${email} • Account: ${status}`,
          category: "Seller",
          type: "SELLERS",
          icon: <StorefrontOutlined sx={{ fontSize: 18 }} />,
          badge: status,
          badgeColor: status === "ACTIVE" ? "success" : status === "SUSPENDED" ? "destructive" : "warning",
          action: () => {
            saveRecentSearch(storeName);
            navigate("/sellers");
            onClose();
          },
        });
      }
    });

    // 5. Filter Customers
    customers.forEach((cust) => {
      const id = String(cust.id || cust._id || "");
      const name = cust.fullName || "Customer";
      const email = cust.email || "";

      if (name.toLowerCase().includes(q) || email.toLowerCase().includes(q)) {
        results.push({
          id: `customer-${id}`,
          title: name,
          subtitle: `Customer Account • ${email}`,
          category: "Customer",
          type: "CUSTOMERS",
          icon: <PeopleAltOutlined sx={{ fontSize: 18 }} />,
          badge: "Buyer",
          badgeColor: "neutral",
          action: () => {
            saveRecentSearch(name);
            navigate("/customers");
            onClose();
          },
        });
      }
    });

    // 6. Filter Categories & Brands
    categories.forEach((cat) => {
      if (cat.name?.toLowerCase().includes(q)) {
        results.push({
          id: `cat-${cat.categoryId || cat._id}`,
          title: cat.name,
          subtitle: `Category • Level ${cat.level || 1}`,
          category: "Catalog",
          type: "NAV",
          icon: <CategoryOutlined sx={{ fontSize: 18 }} />,
          badge: "Category",
          badgeColor: "neutral",
          action: () => {
            saveRecentSearch(cat.name);
            navigate("/categories");
            onClose();
          },
        });
      }
    });

    brands.forEach((brand) => {
      if (brand.name?.toLowerCase().includes(q)) {
        results.push({
          id: `brand-${brand._id || brand.id}`,
          title: brand.name,
          subtitle: `Brand Registry Listing`,
          category: "Catalog",
          type: "NAV",
          icon: <BrandingWatermarkOutlined sx={{ fontSize: 18 }} />,
          badge: "Brand",
          badgeColor: "neutral",
          action: () => {
            saveRecentSearch(brand.name);
            navigate("/brands");
            onClose();
          },
        });
      }
    });

    // 7. Filter Actions
    quickActions.forEach((act) => {
      if (act.title.toLowerCase().includes(q) || act.subtitle?.toLowerCase().includes(q)) {
        results.push(act);
      }
    });

    return results;
  }, [query, orders, products, sellers, customers, categories, brands, navigate, toggleTheme, onClose, recentSearches]);

  // Filtered by active category tab
  const filteredResults = useMemo(() => {
    if (activeTab === "ALL") return searchResults;
    return searchResults.filter((r) => r.type === activeTab);
  }, [searchResults, activeTab]);

  // Keep selection within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected) {
          selected.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredResults, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 cursor-pointer"
    >
      {/* Backdrop scrim with smooth blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Command Palette Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Search Command Palette"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] transition-all duration-200 animate-in fade-in zoom-in-95 cursor-default"
      >
        {/* Top Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface/50">
          <SearchOutlined sx={{ fontSize: 22 }} className="text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, products, sellers, pages, or actions..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base font-medium"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <CloseOutlined sx={{ fontSize: 16 }} />
            </button>
          )}

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
            ESC
          </span>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-surface/30 overflow-x-auto no-scrollbar text-xs">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "NAV", label: "Pages" },
              { id: "ORDERS", label: "Orders" },
              { id: "PRODUCTS", label: "Products" },
              { id: "SELLERS", label: "Vendors" },
              { id: "CUSTOMERS", label: "Customers" },
              { id: "ACTIONS", label: "Actions" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recent Searches (when query is empty) */}
        {!query && recentSearches.length > 0 && activeTab === "ALL" && (
          <div className="px-4 py-2.5 border-b border-border/40 bg-surface/20">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <HistoryOutlined sx={{ fontSize: 14 }} />
              <span>Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term) => (
                <span
                  key={term}
                  onClick={() => setQuery(term)}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-muted/80 hover:bg-muted text-foreground border border-border/60 cursor-pointer transition-colors"
                >
                  <TagOutlined sx={{ fontSize: 12, color: "var(--primary)" }} />
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={(e) => removeRecentSearch(term, e)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                  >
                    <CloseOutlined sx={{ fontSize: 12 }} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
          {filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                      : "hover:bg-surface-hover text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted-foreground group-hover:text-foreground border border-border/60"
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          item.badgeColor === "success"
                            ? "bg-success-soft text-success border border-success/30"
                            : item.badgeColor === "destructive"
                            ? "bg-destructive-soft text-destructive border border-destructive/30"
                            : item.badgeColor === "warning"
                            ? "bg-warning-soft text-warning border border-warning/30"
                            : item.badgeColor === "info"
                            ? "bg-info-soft text-info border border-info/30"
                            : item.badgeColor === "primary"
                            ? "bg-primary-soft text-primary border border-primary-border"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    <div
                      className={`transition-opacity text-xs ${
                        isSelected ? "opacity-100 text-primary" : "opacity-0 text-muted-foreground"
                      }`}
                    >
                      <SubdirectoryArrowLeftOutlined sx={{ fontSize: 15 }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <SearchOutlined sx={{ fontSize: 40 }} className="opacity-30 mb-2" />
              <p className="text-sm font-medium text-foreground">No matches found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for order IDs, product titles, vendor names, or admin sections.
              </p>
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">↵</kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">esc</kbd>
              <span>close</span>
            </span>
          </div>

          <div className="font-semibold text-primary/80">
            {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"}
          </div>
        </div>
      </div>
    </div>
  );
};
