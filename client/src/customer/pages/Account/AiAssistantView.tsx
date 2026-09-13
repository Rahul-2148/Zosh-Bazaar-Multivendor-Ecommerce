import React, { useState, useEffect, useRef } from "react";
import {
  SmartToyOutlined,
  SendOutlined,
  ShoppingBagOutlined,
  LocalShippingOutlined,
  ReplayOutlined,
  LocalOfferOutlined,
  LocationOnOutlined,
  CreditCardOutlined,
  ArrowForward,
  ContentCopyOutlined,
  CheckCircleOutline,
  DeleteSweepOutlined,
  FavoriteBorder,
} from "@mui/icons-material";
import { Button, TextField, IconButton, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchAccountOverview,
  fetchAvailableCoupons,
} from "../../../Redux Toolkit/features/customer/UserSlice";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  actionCard?: {
    type: "ORDER" | "COUPONS" | "RETURNS" | "ADDRESSES" | "WISHLIST";
    data?: any;
  };
  suggestions?: string[];
}

export const AiAssistantView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, overview, availableCoupons } = useAppSelector(
    (store) => store.user
  );
  const jwt = localStorage.getItem("jwt") || "";

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jwt) {
      dispatch(fetchAccountOverview());
      dispatch(fetchAvailableCoupons());
    }
  }, [dispatch, jwt]);

  const userName = user?.fullName?.split(" ")[0] || "there";

  const initialMessages: Message[] = [
    {
      id: "welcome-1",
      sender: "bot",
      text: `Hello ${userName}! 👋 I am your ZoshBazaar Shopping Assistant. I can track your deliveries, check return & refund status, find active coupons, and help with any shopping questions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: [
        "Where is my latest order?",
        "Show available coupons",
        "Track active returns",
        "What is your return policy?",
      ],
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isTyping]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateBotReply = (userQuery: string): Message => {
    const q = userQuery.toLowerCase().trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Order tracking
    if (q.includes("where") && q.includes("order") || q.includes("track") || q.includes("order status") || q.includes("latest order")) {
      const active = overview?.activeOrders?.[0] || overview?.latestOrder;
      if (active) {
        return {
          id: String(Date.now()),
          sender: "bot",
          text: `Here is your latest order details. Your order #${active._id.slice(-6).toUpperCase()} is currently **${active.orderStatus?.replace(/_/g, " ")}**.`,
          timestamp,
          actionCard: {
            type: "ORDER",
            data: active,
          },
          suggestions: ["How do I cancel this order?", "Check active coupons", "Show all orders"],
        };
      } else {
        return {
          id: String(Date.now()),
          sender: "bot",
          text: "You don't have any orders in transit right now. All your previous purchases have been delivered or cancelled.",
          timestamp,
          suggestions: ["Start shopping", "Show available coupons", "Check my wishlist"],
        };
      }
    }

    // 2. Coupons & Offers
    if (q.includes("coupon") || q.includes("offer") || q.includes("discount") || q.includes("promo") || q.includes("voucher")) {
      if (availableCoupons && availableCoupons.length > 0) {
        return {
          id: String(Date.now()),
          sender: "bot",
          text: `Great news! You have ${availableCoupons.length} active discount coupon(s) available for checkout:`,
          timestamp,
          actionCard: {
            type: "COUPONS",
            data: availableCoupons,
          },
          suggestions: ["Where is my latest order?", "Start shopping", "Check saved addresses"],
        };
      } else {
        return {
          id: String(Date.now()),
          sender: "bot",
          text: "There are currently no active public coupons available. Check back soon during festive flash drops!",
          timestamp,
          suggestions: ["Where is my latest order?", "Check my wishlist"],
        };
      }
    }

    // 3. Returns & Refunds
    if (q.includes("return") || q.includes("refund") || q.includes("exchange")) {
      return {
        id: String(Date.now()),
        sender: "bot",
        text: `📦 **ZoshBazaar Return & Refund Policy:**\n• Most products are eligible for a **7-day doorstep return** after delivery.\n• Once picked up by courier, UPI refunds reflect in **2-4 hours** and card refunds take **3-5 banking days**.\n\nYou have ${overview?.stats?.activeReturns || 0} active return(s) in progress.`,
        timestamp,
        actionCard: {
          type: "RETURNS",
        },
        suggestions: ["Where is my latest order?", "How to return an item?"],
      };
    }

    // 4. Addresses & Delivery
    if (q.includes("address") || q.includes("location") || q.includes("pincode")) {
      return {
        id: String(Date.now()),
        sender: "bot",
        text: `You currently have **${overview?.stats?.savedAddresses || 0} saved shipping address(es)** in your account book. You can manage or add new delivery destinations anytime.`,
        timestamp,
        actionCard: {
          type: "ADDRESSES",
        },
        suggestions: ["Where is my latest order?", "Show available coupons"],
      };
    }

    // 5. Wishlist & Price drops
    if (q.includes("wishlist") || q.includes("price drop") || q.includes("saved item")) {
      const dropCount = overview?.stats?.priceDropCount || 0;
      return {
        id: String(Date.now()),
        sender: "bot",
        text: `You have **${overview?.stats?.savedItemsCount || 0} items saved** in your wishlist.${dropCount > 0 ? ` 🔥 **${dropCount} item(s) have dropped in price!**` : ""}`,
        timestamp,
        actionCard: {
          type: "WISHLIST",
        },
        suggestions: ["Where is my latest order?", "Show available coupons"],
      };
    }

    // 6. Payment issues / payment methods
    if (q.includes("payment") || q.includes("card") || q.includes("upi") || q.includes("failed")) {
      return {
        id: String(Date.now()),
        sender: "bot",
        text: `💳 **Payment Safety at ZoshBazaar:**\n• We accept Cards, UPI, Net Banking, and COD.\n• We use PCI-DSS tokenization and never store full card numbers or CVV.\n• If money was deducted for a failed order, your bank will auto-reverse it within 24-48 hours.`,
        timestamp,
        suggestions: ["Show available coupons", "Where is my latest order?"],
      };
    }

    // 7. Cancellation
    if (q.includes("cancel") || q.includes("cancel order")) {
      return {
        id: String(Date.now()),
        sender: "bot",
        text: `You can cancel any order directly before it ships. Head to **My Orders**, select the active order, and click **Cancel Order**. Refunds are processed instantly to your source payment method.`,
        timestamp,
        suggestions: ["Where is my latest order?", "What is your return policy?"],
      };
    }

    // Default fallback
    return {
      id: String(Date.now()),
      sender: "bot",
      text: `I'm here to help with your ZoshBazaar experience! You can ask me to track your shipments, check your refund status, find active discount codes, or assist with delivery addresses.`,
      timestamp,
      suggestions: [
        "Where is my latest order?",
        "Show available coupons",
        "Track active returns",
        "Check my wishlist",
      ],
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateBotReply(query);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[800px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/80 bg-muted/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <SmartToyOutlined />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                ZoshBazaar Shopping Assistant
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Online 24/7
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Intelligent Order Tracking, Returns, Offers & Account Help
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages(initialMessages)}
          title="Clear Chat History"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <DeleteSweepOutlined sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-xs shadow-xs"
                    : "bg-muted/40 border border-border/70 text-foreground rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Embedded Action Cards */}
                {msg.actionCard?.type === "ORDER" && msg.actionCard.data && (
                  <div className="mt-3 p-3 rounded-xl bg-background border border-border/80 space-y-2.5 text-foreground">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-primary">
                        #{msg.actionCard.data._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {msg.actionCard.data.orderStatus?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <LocalShippingOutlined sx={{ fontSize: 18 }} className="text-primary" />
                      <p className="text-xs text-muted-foreground">
                        Placed on {new Date(msg.actionCard.data.orderDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} &bull; ₹{Number(msg.actionCard.data.totalSellingPrice || msg.actionCard.data.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate("/account/orders")}
                        sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: "0.5rem" }}
                      >
                        Track Shipment
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate("/account/returns")}
                        sx={{ textTransform: "none", fontSize: 11, fontWeight: 600, borderRadius: "0.5rem" }}
                      >
                        Return Item
                      </Button>
                    </div>
                  </div>
                )}

                {msg.actionCard?.type === "COUPONS" && Array.isArray(msg.actionCard.data) && (
                  <div className="mt-3 space-y-2 text-foreground">
                    {msg.actionCard.data.slice(0, 2).map((coupon: any) => (
                      <div
                        key={coupon.code}
                        className="p-3 rounded-xl bg-background border border-primary/20 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-mono font-black text-xs text-primary">{coupon.code}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : "Discount"} &bull; Min ₹{coupon.minimumOrderValue || 0}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <CheckCircleOutline sx={{ fontSize: 13 }} /> Copied
                            </>
                          ) : (
                            <>
                              <ContentCopyOutlined sx={{ fontSize: 13 }} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {msg.actionCard?.type === "RETURNS" && (
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-2 text-foreground">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/account/returns")}
                      sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: "0.5rem" }}
                    >
                      View Returns & Refunds
                    </Button>
                  </div>
                )}

                {msg.actionCard?.type === "ADDRESSES" && (
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-2 text-foreground">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/account/addresses")}
                      sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: "0.5rem" }}
                    >
                      Open Saved Addresses
                    </Button>
                  </div>
                )}

                {msg.actionCard?.type === "WISHLIST" && (
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-2 text-foreground">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/wishlist")}
                      sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: "0.5rem" }}
                    >
                      Open My Wishlist
                    </Button>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground px-1">
                {msg.timestamp}
              </span>

              {/* Suggestions chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted/60 hover:bg-primary/15 text-foreground hover:text-primary border border-border/80 transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-muted/40 border border-border/70 w-fit text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-[11px]">Assistant is checking...</span>
          </div>
        )}

        <div className="h-1" />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-border/80 bg-card shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <TextField
            fullWidth
            placeholder="Ask about orders, delivery dates, coupons, returns..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            size="small"
            autoComplete="off"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "1rem",
                bgcolor: "background.paper",
                fontSize: 13,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!input.trim() || isTyping}
            sx={{
              minWidth: 44,
              width: 44,
              height: 44,
              borderRadius: "1rem",
              p: 0,
            }}
          >
            <SendOutlined sx={{ fontSize: 18 }} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistantView;
