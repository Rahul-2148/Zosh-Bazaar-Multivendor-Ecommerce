import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  ShoppingCart,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Trash2,
} from "lucide-react";
import { aiCommerceService } from "../../../services/aiCommerceService";
import type {
  ExecutionStep,
  StructuredComparison,
  ActionPayload,
} from "../../../services/aiCommerceService";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { aiTracker } from "../../../services/aiEventTracker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedProducts?: any[];
  suggestedActions?: string[];
  executionSteps?: ExecutionStep[];
  structuredComparison?: StructuredComparison;
  actionPayloads?: ActionPayload[];
}

export const FloatingAIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [persistedContext, setPersistedContext] = useState<Record<string, any>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      role: "assistant",
      content:
        "Hello! I am your Zosh Bazaar AI Shopping Partner 2.0. I can compare verified products, find deals within your budget, check live inventory, and prepare your cart.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        "Find running shoes under ₹3,000",
        "Compare noise cancelling headphones",
        "Top rated festive silk sarees",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      const history = messages
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiCommerceService.chatAssistant(history, persistedContext);

      if (res && res.persistedContext) {
        setPersistedContext(res.persistedContext);
      }

      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedProducts: res.suggestedProducts || [],
        suggestedActions: res.suggestedActions || [],
        executionSteps: res.executionSteps || [],
        structuredComparison: res.structuredComparison,
        actionPayloads: res.actionPayloads || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Default to expanded execution steps for transparency
      if (res.executionSteps && res.executionSteps.length > 0) {
        setExpandedSteps((prev) => ({ ...prev, [assistantMsg.id]: true }));
      }
    } catch (err) {
      console.error("Assistant chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "I encountered a momentary delay reaching the deep inference engine. You can continue browsing or pick from our verified popular categories.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedActions: ["Browse Electronics", "Browse Fashion", "Top Rated Deals"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    const jwt = localStorage.getItem("jwt");
    const productId = product.productId || product._id;
    if (!jwt) {
      navigate("/login");
      return;
    }

    try {
      await dispatch(
        addItemToCart({
          jwt,
          productId,
          size: "Standard",
          quantity: 1,
        })
      );
      setAddedProductIds((prev) => ({ ...prev, [productId]: true }));
      aiTracker.trackAddToCart(productId, product.categoryId, product.sellingPrice || 0);
    } catch (e) {
      console.error("Error adding to cart:", e);
    }
  };

  const toggleStepExpansion = (msgId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const clearMemory = () => {
    setPersistedContext({});
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
            aria-label="Open AI Shopping Assistant"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
              </span>
            </div>
            <span className="text-sm font-semibold tracking-wide">Ask AI Assistant</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-white/90">
              2.0
            </span>
          </button>
        </div>
      )}

      {/* Floating Drawer / Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl ${
            isMinimized
              ? "bottom-6 right-6 w-80 h-16 rounded-2xl overflow-hidden"
              : "bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[480px] sm:max-w-[95vw] h-[100dvh] sm:h-[680px] sm:rounded-2xl"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-700 via-indigo-700 to-purple-800 text-white select-none sm:rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Zosh Shopping AI</h3>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-400/20 text-teal-200 border border-teal-300/30">
                    Neural 2.0
                  </span>
                </div>
                <p className="text-[11px] text-white/70">ReAct Reasoning & Catalog Grounded</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context Memory Bar */}
              {Object.keys(persistedContext).length > 0 && (
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <Sliders className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px] shrink-0">
                      Context:
                    </span>
                    {persistedContext.category && (
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-medium border border-indigo-200 dark:border-indigo-800 shrink-0">
                        {persistedContext.category}
                      </span>
                    )}
                    {persistedContext.maxBudget && (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-medium border border-emerald-200 dark:border-emerald-800 shrink-0">
                        ≤ ₹{persistedContext.maxBudget.toLocaleString("en-IN")}
                      </span>
                    )}
                    {persistedContext.preferredBrand && (
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium border border-purple-200 dark:border-purple-800 shrink-0">
                        {persistedContext.preferredBrand}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearMemory}
                    className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition shrink-0 pl-2"
                    title="Clear remembered search preferences"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {/* Role Header */}
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {msg.role === "assistant" && (
                        <span className="font-semibold text-teal-600 dark:text-teal-400">Zosh AI</span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-tr-xs shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700 shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Execution Steps Transparency Card */}
                    {msg.executionSteps && msg.executionSteps.length > 0 && (
                      <div className="mt-2.5 w-full max-w-[95%] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                        <button
                          onClick={() => toggleStepExpansion(msg.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>Execution Trail ({msg.executionSteps.length} Steps)</span>
                          </div>
                          {expandedSteps[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {expandedSteps[msg.id] && (
                          <div className="p-2.5 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                            {msg.executionSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {step.step}:
                                  </span>{" "}
                                  <span className="text-slate-500 dark:text-slate-400">{step.detail}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Structured Comparison Table */}
                    {msg.structuredComparison && (
                      <div className="mt-3 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="px-3 py-2 bg-gradient-to-r from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border-b border-slate-200 dark:border-slate-700">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                            Side-by-Side Spec Comparison
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300">Feature</th>
                                {msg.structuredComparison.productIds.map((pid) => (
                                  <th
                                    key={pid}
                                    className="p-2 font-semibold text-indigo-600 dark:text-indigo-400 max-w-[140px] truncate"
                                    title={msg.structuredComparison?.productTitles[pid]}
                                  >
                                    {msg.structuredComparison?.productTitles[pid] || pid}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                              {msg.structuredComparison.attributes.map((attr, idx) => (
                                <tr
                                  key={idx}
                                  className={idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/40"}
                                >
                                  <td className="p-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {attr.attributeName}
                                  </td>
                                  {msg.structuredComparison?.productIds.map((pid) => (
                                    <td key={pid} className="p-2 text-slate-600 dark:text-slate-400">
                                      <div className="flex items-center gap-1">
                                        <span>{attr.valuesByProduct[pid] || "—"}</span>
                                        {attr.winnerProductId === pid && (
                                          <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            Best
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Product Cards Carousel */}
                    {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                      <div className="mt-3 w-full">
                        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
                          {msg.suggestedProducts.map((p) => {
                            const pid = p.productId || p._id;
                            const isAdded = addedProductIds[pid];
                            const img =
                              p.images?.[0] ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";

                            return (
                              <div
                                key={pid}
                                className="w-52 shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                              >
                                <div
                                  className="cursor-pointer"
                                  onClick={() => navigate(`/product-details/${p.categoryId || "all"}/${pid}`)}
                                >
                                  <div className="h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                    <img
                                      src={img}
                                      alt={p.title}
                                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                    />
                                  </div>
                                  <div className="p-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                      {p.brand || "Zosh Certified"}
                                    </span>
                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5">
                                      {p.title}
                                    </h4>
                                    <div className="flex items-baseline gap-1.5 mt-2">
                                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        ₹{(p.sellingPrice || 0).toLocaleString("en-IN")}
                                      </span>
                                      {p.mrpPrice && p.mrpPrice > p.sellingPrice && (
                                        <span className="text-[10px] text-slate-400 line-through">
                                          ₹{p.mrpPrice.toLocaleString("en-IN")}
                                        </span>
                                      )}
                                      {p.discountPercent > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600">
                                          {p.discountPercent}% OFF
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-2.5 pt-0">
                                  <button
                                    onClick={() => handleAddToCart(p)}
                                    disabled={isAdded}
                                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                      isAdded
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-teal-600 dark:hover:bg-teal-400 dark:hover:text-white"
                                    }`}
                                  >
                                    {isAdded ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Added to Cart
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Contextual Quick Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(action)}
                            className="px-2.5 py-1 text-xs rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-2xs transition flex items-center gap-1"
                          >
                            <span>{action}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Live Loading Indicator */}
                {loading && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-[80%] text-xs shadow-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Neural retriever reasoning & filtering catalog...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sm:rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about products, compare specs, set budget..."
                    disabled={loading}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-teal-500 outline-hidden transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition active:scale-95 shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
