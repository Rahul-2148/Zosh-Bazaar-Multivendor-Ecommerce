import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Camera,
  Trash2,
  RotateCcw,
  Sliders,
  ArrowRight,
  CheckCircle2,
  Mic,
} from "lucide-react";
import type { RootState } from "../../../Redux Toolkit/Store";
import {
  closeAssistant,
  setMinimized,
  clearActiveContext,
  addMessage,
  updateLastAssistantMessage,
  appendToLastAssistantContent,
  setLoading,
  setIsStreaming,
  setActiveExecutionSteps,
  clearMessages,
} from "../../../Redux Toolkit/features/customer/AiAssistantSlice";
import type { ChatMessage } from "../../../Redux Toolkit/features/customer/AiAssistantSlice";
import { aiCommerceService } from "../../../services/aiCommerceService";
import type { ExecutionStep } from "../../../services/aiCommerceService";
import AIMessageRenderer from "./AIMessageRenderer";
import AIProductCard from "./AIProductCard";
import AIComparisonMatrix from "./AIComparisonMatrix";
import VisualSearchLensModal from "./VisualSearchLensModal";
import { isSpeechRecognitionSupported } from "../../../utils/speechSupport";

const createPanelMsgId = (prefix: string) => `${prefix}_${Date.now()}`;

export const AIAssistantPanel: React.FC = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    isMinimized,
    activeContext,
    messages,
    loading,
    isStreaming,
  } = useSelector((state: RootState) => state.aiAssistant);

  const [inputText, setInputText] = useState("");
  const [lensModalOpen, setLensModalOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isExpandedWidth, setIsExpandedWidth] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasSpeechSupport = isSpeechRecognitionSupported();

  const startVoiceListening = () => {
    if (!hasSpeechSupport) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "hi-IN, en-IN";

      recognition.onstart = () => {
        setIsVoiceListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        const captured = finalTrans || interimTrans;
        if (captured) {
          setInputText(captured);
        }
        if (finalTrans) {
          setTimeout(() => {
            setIsVoiceListening(false);
            handleSendMessage(finalTrans.trim());
          }, 350);
        }
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsVoiceListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Auto-scroll on new messages or stream tokens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isOpen, isMinimized]);

  const panelRef = useRef<HTMLElement>(null);

  // Close chatbot when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore clicks inside the assistant panel itself
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }

      // Ignore clicks on floating triggers or modals
      if (
        target.closest('[aria-label="Open AI Shopping Assistant"]') ||
        target.closest('[aria-label="AI Shopping Assistant Shortcut"]') ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      dispatch(closeAssistant());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.keyCode === 27 || e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        dispatch(closeAssistant());
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, isMinimized, dispatch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createPanelMsgId("usr"),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    dispatch(addMessage(userMessage));
    if (!textToSend) setInputText("");
    dispatch(setLoading(true));
    dispatch(setIsStreaming(true));
    dispatch(setActiveExecutionSteps([]));

    const assistantMsgId = createPanelMsgId("asst");
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      executionSteps: [],
      suggestedProducts: [],
      suggestedActions: [],
      isStreaming: true,
    };
    dispatch(addMessage(initialAssistantMsg));

    const conversationHistory = messages
      .concat(userMessage)
      .map((m) => ({ role: m.role, content: m.content }));

    const collectedSteps: ExecutionStep[] = [];

    await aiCommerceService.chatAssistantStream(
      conversationHistory,
      activeContext,
      {
        onStep: (step) => {
          collectedSteps.push(step);
          dispatch(setActiveExecutionSteps([...collectedSteps]));
          dispatch(
            updateLastAssistantMessage({
              executionSteps: [...collectedSteps],
            })
          );
        },
        onToken: (token) => {
          dispatch(appendToLastAssistantContent(token));
        },
        onPayload: (payload) => {
          dispatch(
            updateLastAssistantMessage({
              suggestedProducts: payload.suggestedProducts || [],
              suggestedActions: payload.suggestedActions || [],
              structuredComparison: payload.structuredComparison,
              actionPayloads: payload.actionPayloads || [],
            })
          );
        },
        onDone: () => {
          dispatch(updateLastAssistantMessage({ isStreaming: false }));
          dispatch(setIsStreaming(false));
          dispatch(setLoading(false));
        },
        onError: (err) => {
          console.error("Stream error in AIAssistantPanel:", err);
          dispatch(
            updateLastAssistantMessage({
              content:
                "I experienced a momentary delay connecting to the deep catalog retriever. You can continue asking questions or pick from verified categories below.",
              suggestedActions: ["Browse Electronics", "Browse Fashion", "Top Rated Deals"],
              isStreaming: false,
            })
          );
          dispatch(setIsStreaming(false));
          dispatch(setLoading(false));
        },
      }
    );
  };

  const handleClearContext = () => {
    dispatch(clearActiveContext());
  };

  const handleResetChat = () => {
    dispatch(clearMessages());
  };

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 animate-in fade-in duration-200">
        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Zosh AI Assistant</h4>
          <p className="text-[10px] text-slate-500 truncate">Grounded Shopping Active</p>
        </div>
        <div className="flex items-center gap-1 ml-1 sm:ml-2 shrink-0">
          <button
            type="button"
            onClick={() => dispatch(setMinimized(false))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Expand Assistant"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => dispatch(closeAssistant())}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Visual Search Modal triggerable from chat */}
      <VisualSearchLensModal
        isOpen={lensModalOpen}
        onClose={() => setLensModalOpen(false)}
      />

      {/* Universal Backdrop: clicking outside closes assistant */}
      <div
        onClick={() => dispatch(closeAssistant())}
        className="fixed inset-0 z-40 bg-black/40 md:bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200 cursor-pointer"
      />

      {/* Main Assistant Panel / Sheet */}
      <aside
        ref={panelRef}
        aria-label="AI Shopping Assistant"
        className={`fixed z-50 flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-out overflow-hidden
          /* Mobile & Small Screens (<768px): bottom sheet docked to bottom */
          inset-x-0 bottom-0 w-full h-[90dvh] max-h-[90dvh] rounded-t-3xl border-t
          /* Tablets & Desktops (>=768px): floating card strictly clamped inside viewport */
          md:inset-x-auto md:right-4 md:bottom-4 lg:right-6 lg:bottom-6
          md:w-[440px] ${isExpandedWidth ? "lg:w-[620px] xl:w-[680px]" : "lg:w-[460px]"}
          md:max-w-[calc(100vw-2rem)]
          md:h-[min(640px,calc(100dvh-2.5rem))] md:max-h-[calc(100dvh-2.5rem)]
          md:rounded-3xl md:border
        `}
      >
        {/* Mobile Drag Indicator */}
        <div className="md:hidden w-full flex items-center justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sm:rounded-t-2xl select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Zosh Shopping Assistant
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online • Always here to help
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            {/* Width Toggle (Desktop) */}
            <button
              type="button"
              onClick={() => setIsExpandedWidth(!isExpandedWidth)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isExpandedWidth ? "Narrow Panel" : "Widen Panel"}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Clear Messages */}
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={() => dispatch(setMinimized(true))}
              className="hidden sm:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => dispatch(closeAssistant())}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Bar (if active product or constraints present) */}
        {activeContext && Object.keys(activeContext).length > 0 && (
          <div className="px-3.5 py-1.5 sm:px-4 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Context:
              </span>
              {activeContext.currentProductTitle && (
                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold text-[10px] border border-teal-200 dark:border-teal-800 truncate max-w-[160px] sm:max-w-[200px]">
                  Focus: {activeContext.currentProductTitle}
                </span>
              )}
              {activeContext.maxBudget && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                  ≤ ₹{activeContext.maxBudget.toLocaleString("en-IN")}
                </span>
              )}
              {activeContext.brand && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold text-[10px] border border-purple-200 dark:border-purple-800 shrink-0">
                  {activeContext.brand}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearContext}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5 shrink-0 ml-2 cursor-pointer"
              title="Clear Active Context Filter"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 py-3 sm:px-5 sm:py-4 space-y-3.5 sm:space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in duration-150`}
              >
                {/* Chat Bubble */}
                <div
                  className={`relative max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-[13px] shadow-2xs leading-relaxed ${
                    isUser
                      ? "bg-slate-900 dark:bg-teal-600 text-white rounded-br-xs"
                      : "bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60"
                  }`}
                >


                  {/* Message Content */}
                  {isUser ? (
                    <p className="whitespace-pre-line font-medium">{msg.content}</p>
                  ) : (
                    <AIMessageRenderer content={msg.content} />
                  )}

                  {/* Streaming indicator */}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-teal-500 animate-pulse ml-1 align-middle" />
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Structured Comparison Table */}
                {!isUser && msg.structuredComparison && (
                  <div className="w-full max-w-[96%] mt-2">
                    <AIComparisonMatrix comparison={msg.structuredComparison} />
                  </div>
                )}

                {/* Suggested Products Rail / Grid */}
                {!isUser && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="w-full max-w-[96%] mt-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Verified Matches ({msg.suggestedProducts.length})
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 snap-x snap-mandatory scroll-smooth">
                      {msg.suggestedProducts.map((prod, pIdx) => (
                        <AIProductCard
                          key={prod.productId || prod._id || pIdx}
                          product={prod}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Contextual Quick Action Chips */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleSendMessage(action)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 hover:text-teal-600 dark:hover:border-teal-400 dark:hover:text-teal-300 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition shadow-2xs flex items-center gap-1.5 cursor-pointer select-none active:scale-95"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing / Reasoning Animation */}
          {(loading || (isStreaming && messages[messages.length - 1]?.role === "user")) && (
            <div className="flex items-start gap-2 animate-in fade-in duration-150">
              <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-50 via-teal-50/30 to-indigo-50/30 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0 select-none">
          {[
            { label: "🔥 Best Deals", query: "Show today's best deals" },
            { label: "📦 Track Order", query: "Where is my order?" },
            { label: "👟 Sneakers", query: "Show trending sneakers" },
            { label: "🔄 Return Policy", query: "What is your return policy?" },
            { label: "⚖️ Compare", query: "Compare headphones" },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.query)}
              disabled={loading || isStreaming}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-teal-500 hover:text-teal-700 dark:hover:border-teal-400 dark:hover:text-teal-300 hover:shadow-xs transition shrink-0 whitespace-nowrap active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:rounded-b-2xl shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {/* Visual Search Button */}
            <button
              type="button"
              onClick={() => setLensModalOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/80 dark:hover:bg-slate-750 transition cursor-pointer shrink-0"
              title="Search by photo (Visual Lens)"
              aria-label="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Voice Search (Mic) Button - Only rendered if browser supports speech recognition */}
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={isVoiceListening ? stopVoiceListening : startVoiceListening}
                className={`p-2 sm:p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isVoiceListening
                    ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/80 dark:hover:bg-slate-750"
                }`}
                title={isVoiceListening ? "Tap to stop listening" : "Speak in Hindi or English"}
                aria-label="Voice Search"
              >
                <Mic className={`w-4 h-4 ${isVoiceListening ? "animate-bounce" : ""}`} />
              </button>
            )}

            {/* Input Box OR Active Voice Listening Bar */}
            {isVoiceListening ? (
              <div
                onClick={stopVoiceListening}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 flex items-center gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                  <span className="w-1 h-5 bg-teal-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
                </div>
                <span className="text-xs font-semibold truncate flex-1 animate-pulse">
                  {inputText ? `"${inputText}"` : "Listening... Boliyega (Speak now)"}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600">
                  Tap to stop
                </span>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about phones, compare specs, budget, or reviews..."
                disabled={loading || isStreaming}
                className="flex-1 min-w-0 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-[13px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 border-0 focus:ring-2 focus:ring-teal-500 outline-hidden transition font-medium"
              />
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || loading || isStreaming}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition active:scale-95 shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between px-1 pt-2 text-[10px] text-slate-400">
            <span className="hidden sm:inline">Press Enter to send</span>
            <span className="sm:hidden">Tap send icon</span>
            <span className="flex items-center gap-1 ml-auto">
              <CheckCircle2 className="w-3 h-3 text-teal-600" />
              100% Catalog Verified
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AIAssistantPanel;
