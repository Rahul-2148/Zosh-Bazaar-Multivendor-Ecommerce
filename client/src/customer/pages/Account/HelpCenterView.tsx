import React, { useState } from "react";
import {
  HelpOutline,
  SearchOutlined,
  LocalShippingOutlined,
  ReplayOutlined,
  PaymentOutlined,
  ShieldOutlined,
  SupportAgentOutlined,
  SmartToyOutlined,
  ExpandMore,
  ShoppingBagOutlined,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../Redux Toolkit/Store";

export const HelpCenterView: React.FC = () => {
  const navigate = useNavigate();
  const { overview } = useAppSelector((store) => store.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const recentOrder = overview?.activeOrders?.[0];

  const faqs = [
    {
      category: "DELIVERY",
      question: "How do I track my delivery in real-time?",
      answer:
        "You can track your package anytime by visiting 'My Orders' and clicking the 'Track Order' button on your active shipment. You will see real-time updates as your package is packed, dispatched, and out for delivery.",
    },
    {
      category: "DELIVERY",
      question: "Can I change my delivery address after placing an order?",
      answer:
        "Address changes are possible while the order status is 'PENDING' or 'PLACED'. Once the seller marks the package as 'SHIPPED', addresses cannot be altered in transit due to logistics routing.",
    },
    {
      category: "RETURNS",
      question: "What is ZoshBazaar's return and refund policy?",
      answer:
        "Most items purchased on ZoshBazaar are eligible for a 7-day hassle-free return after delivery. Simply visit 'Returns & Refunds' or click 'Return Item' on your order details page to schedule a pickup.",
    },
    {
      category: "RETURNS",
      question: "How long does it take for a refund to reflect?",
      answer:
        "Once our courier partner inspects and picks up your returned package, refunds are initiated immediately. UPI refunds reflect within 2-4 hours, while credit/debit card refunds take 3-5 business days depending on your bank.",
    },
    {
      category: "PAYMENTS",
      question: "What payment methods are supported on ZoshBazaar?",
      answer:
        "We support all major Credit & Debit cards (Visa, Mastercard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, and Cash on Delivery (COD) for eligible pincodes.",
    },
    {
      category: "PAYMENTS",
      question: "My payment failed but amount was debited from my bank account. What should I do?",
      answer:
        "Do not worry! In cases of intermittent banking gateway timeouts, debited amounts are automatically auto-reversed by your issuing bank within 24 to 48 hours. If it does not reflect, contact our support with your Bank UTR reference.",
    },
    {
      category: "ACCOUNT",
      question: "How do I update my registered mobile number or email?",
      answer:
        "Go to 'Personal Profile' in your Account Center and click 'Edit Profile'. For password and login protection, head to 'Login & Security' to manage credentials and active sessions.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "ALL" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border/80">
        <h2 className="text-xl font-bold text-foreground">Help & Customer Support</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Find answers to common questions, get order assistance, or speak with our support team
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-card border border-primary/20 space-y-3">
        <h3 className="text-base font-bold text-foreground">How can we help you today?</h3>
        <TextField
          fullWidth
          placeholder="Search for orders, deliveries, returns, refund status, or payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20 }} className="text-muted-foreground" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "background.paper", borderRadius: "0.75rem" }}
        />
      </div>

      {/* Recent Order Quick Help Card (Amazon/Flipkart style) */}
      {recentOrder && (
        <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShoppingBagOutlined sx={{ fontSize: 16 }} className="text-primary" />
              Need help with your recent order?
            </span>
            <span className="text-xs font-semibold text-primary font-mono">
              #{recentOrder._id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                Status: <span className="text-primary capitalize">{recentOrder.orderStatus?.toLowerCase()}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Placed on {new Date(recentOrder.orderDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} &bull; ₹{Number(recentOrder.totalSellingPrice || recentOrder.totalAmount || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/account/orders")}
                sx={{ textTransform: "none", fontWeight: 600, fontSize: 11 }}
              >
                Track Order
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/account/returns")}
                sx={{ textTransform: "none", fontWeight: 600, fontSize: 11 }}
              >
                Return / Replace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Topics", value: "ALL", icon: <HelpOutline sx={{ fontSize: 16 }} /> },
          { label: "Delivery & Tracking", value: "DELIVERY", icon: <LocalShippingOutlined sx={{ fontSize: 16 }} /> },
          { label: "Returns & Refunds", value: "RETURNS", icon: <ReplayOutlined sx={{ fontSize: 16 }} /> },
          { label: "Payments & Vouchers", value: "PAYMENTS", icon: <PaymentOutlined sx={{ fontSize: 16 }} /> },
          { label: "Account & Security", value: "ACCOUNT", icon: <ShieldOutlined sx={{ fontSize: 16 }} /> },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              activeCategory === tab.value
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* FAQ Accordions */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => (
          <Accordion
            key={index}
            sx={{
              borderRadius: "1rem !important",
              border: "1px solid var(--border)",
              boxShadow: "none",
              "&:before": { display: "none" },
              bgcolor: "background.paper",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <p className="text-xs sm:text-sm font-bold text-foreground">{faq.question}</p>
            </AccordionSummary>
            <AccordionDetails>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      {/* Contact & AI Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/80">
        <div className="p-5 rounded-2xl border border-border/80 bg-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <SmartToyOutlined />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-foreground">AI Shopping Assistant</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Have questions about products, active orders, or size recommendations? Chat with our intelligent assistant 24/7.
            </p>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/account/chat")}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.6rem" }}
            >
              Chat with Assistant
            </Button>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <SupportAgentOutlined />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-foreground">Customer Support Desk</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reach our human customer support specialists via email for complex dispute resolution and account inquiries.
            </p>
            <div className="text-xs font-semibold text-primary">
              support@zoshbazaar.com &bull; 9 AM - 9 PM IST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HelpCenterView;
