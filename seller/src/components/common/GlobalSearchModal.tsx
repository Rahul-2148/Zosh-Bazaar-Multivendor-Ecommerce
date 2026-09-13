import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Close,
  DashboardOutlined,
  Inventory2Outlined,
  AddCircleOutline,
  ShoppingBagOutlined,
  AssignmentReturnOutlined,
  AccountBalanceWalletOutlined,
  StorefrontOutlined,
  TuneOutlined,
  ArrowForward,
} from "@mui/icons-material";
import { productApi, orderApi } from "../../services/api";

interface SearchResultItem {
  id: string;
  category: "Navigation" | "Action" | "Product" | "Order";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load seller's products and orders for live in-depth search
  useEffect(() => {
    if (isOpen) {
      productApi.getProducts()
        .then((res) => {
          setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
        })
        .catch(() => {});

      orderApi.getOrders()
        .then((res) => {
          setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
        })
        .catch(() => {});

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Static navigation routes
  const baseRoutes: SearchResultItem[] = [
    {
      id: "nav-dash",
      category: "Navigation",
      title: "Dashboard Overview",
      subtitle: "Sales, revenue trends, and operational summary",
      icon: <DashboardOutlined className="text-primary" fontSize="small" />,
      action: () => { navigate("/"); onClose(); },
    },
    {
      id: "nav-prod",
      category: "Navigation",
      title: "Product Catalog",
      subtitle: "Manage all products, generic variants, and status",
      icon: <Inventory2Outlined className="text-primary" fontSize="small" />,
      action: () => { navigate("/products"); onClose(); },
    },
    {
      id: "nav-add-prod",
      category: "Action",
      title: "Add New Product",
      subtitle: "Create product with generic variant matrix",
      icon: <AddCircleOutline className="text-emerald-500" fontSize="small" />,
      action: () => { navigate("/products/new"); onClose(); },
    },
    {
      id: "nav-inv",
      category: "Navigation",
      title: "Inventory Center",
      subtitle: "Stock replenishment, variant counts, and low-stock alerts",
      icon: <TuneOutlined className="text-amber-500" fontSize="small" />,
      action: () => { navigate("/inventory"); onClose(); },
    },
    {
      id: "nav-orders",
      category: "Navigation",
      title: "Orders & Fulfillment",
      subtitle: "Track order status, process items, and pack shipments",
      icon: <ShoppingBagOutlined className="text-blue-500" fontSize="small" />,
      action: () => { navigate("/orders"); onClose(); },
    },
    {
      id: "nav-returns",
      category: "Navigation",
      title: "Returns & Refunds",
      subtitle: "Review return requests and customer items",
      icon: <AssignmentReturnOutlined className="text-rose-500" fontSize="small" />,
      action: () => { navigate("/returns"); onClose(); },
    },
    {
      id: "nav-fin",
      category: "Navigation",
      title: "Finances & Settlements",
      subtitle: "Gross sales, platform fees, transactions, and payouts",
      icon: <AccountBalanceWalletOutlined className="text-purple-500" fontSize="small" />,
      action: () => { navigate("/finances"); onClose(); },
    },
    {
      id: "nav-store",
      category: "Navigation",
      title: "Store Profile & KYC",
      subtitle: "Business identity, GSTIN, PAN, bank account, and pickup address",
      icon: <StorefrontOutlined className="text-teal-500" fontSize="small" />,
      action: () => { navigate("/store"); onClose(); },
    },
  ];

  // Dynamic matching
  const filteredNav = baseRoutes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts: SearchResultItem[] = query.trim()
    ? products
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.brand?.toLowerCase().includes(query.toLowerCase()) ||
            p.variants?.some((v: any) => v.sku?.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
        .map((p) => ({
          id: `prod-${p._id}`,
          category: "Product",
          title: p.title,
          subtitle: `₹${p.sellingPrice} • Stock: ${p.countInStock} • ${p.brand}`,
          icon: <Inventory2Outlined className="text-teal-500" fontSize="small" />,
          action: () => { navigate(`/products/${p._id}/edit`); onClose(); },
        }))
    : [];

  const filteredOrders: SearchResultItem[] = query.trim()
    ? orders
        .filter(
          (o) =>
            o._id.toLowerCase().includes(query.toLowerCase()) ||
            o.user?.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            o.orderStatus?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map((o) => ({
          id: `ord-${o._id}`,
          category: "Order",
          title: `Order #${o._id.slice(-6).toUpperCase()} — ${o.user?.fullName || "Customer"}`,
          subtitle: `Status: ${o.orderStatus} • ₹${o.totalSellingPrice}`,
          icon: <ShoppingBagOutlined className="text-blue-500" fontSize="small" />,
          action: () => { navigate(`/orders?id=${o._id}`); onClose(); },
        }))
    : [];

  const allResults = [...filteredNav, ...filteredProducts, ...filteredOrders];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allResults.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % (allResults.length || 1));
      } else if (e.key === "Enter" && allResults[selectedIndex]) {
        e.preventDefault();
        allResults[selectedIndex].action();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allResults, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-surface/50">
          <Search className="text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search products, orders, inventory, or jump to page... (Esc to exit)"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
            >
              <Close fontSize="small" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-surface border border-border rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border/40">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {allResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-surface text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold">{item.title}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-surface text-muted-foreground border border-border/60">
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowForward
                      fontSize="small"
                      className={`transition-transform duration-150 ${
                        isSelected ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-surface/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded-xs text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded-xs text-[10px]">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded-xs text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span>Merchant OS Command Bar</span>
        </div>
      </div>
    </div>
  );
};
