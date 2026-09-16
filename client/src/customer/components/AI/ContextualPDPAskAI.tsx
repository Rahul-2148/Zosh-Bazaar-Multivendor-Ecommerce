import React from "react";
import { Sparkles, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { openAssistant } from "../../../Redux Toolkit/features/customer/AiAssistantSlice";

interface ContextualPDPAskAIProps {
  product: {
    _id?: string;
    productId?: string;
    title: string;
    brand?: string;
    sellingPrice?: number;
    category?: any;
    highlights?: string[];
    ratings?: any;
  };
  onSelectPrompt?: (prompt: string) => void;
}

export const ContextualPDPAskAI: React.FC<ContextualPDPAskAIProps> = ({
  product,
  onSelectPrompt,
}) => {
  const dispatch = useDispatch();

  const productId = product._id || product.productId;
  const categoryName = typeof product.category === "string" ? product.category : product.category?.name || "";

  // Dynamic contextual prompt pills based on category/product type
  const isPhoneOrTech = /phone|mobile|audio|watch|laptop|earbud/i.test(`${product.title} ${categoryName}`);
  const isFashion = /saree|apparel|clothing|shoes|dress|kurta|shirt/i.test(`${product.title} ${categoryName}`);

  const quickPrompts = isPhoneOrTech
    ? [
        "Is this good for gaming?",
        "Is this worth the price?",
        "Compare with similar phones",
        "Summarize the reviews",
        "Which has better battery?",
      ]
    : isFashion
    ? [
        "Is this worth the price?",
        "Summarize customer reviews",
        "Find me a complete outfit with this",
        "What else should I buy with this?",
        "Can I return or exchange this?",
      ]
    : [
        "Is this worth the price?",
        "Summarize the reviews",
        "Show similar but cheaper",
        "What else should I buy with this?",
        "When was this product cheapest?",
      ];

  const handleChipClick = (promptText: string) => {
    dispatch(
      openAssistant({
        context: {
          pageType: "pdp",
          currentProductId: productId,
          currentProductTitle: product.title,
          currentProductPrice: product.sellingPrice,
          currentProductBrand: product.brand,
          currentProductCategory: categoryName,
        },
        initialMessage: promptText,
      })
    );

    if (onSelectPrompt) {
      onSelectPrompt(promptText);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-500/5 via-indigo-500/5 to-purple-500/5 border border-teal-500/20 dark:border-teal-500/30 p-4 sm:p-5 space-y-3 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              Ask About This Product
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                AI Shopping Guide
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instant answers grounded in verified specs, buyer reviews, and price history
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleChipClick(`Tell me about ${product.title}`)}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition cursor-pointer"
        >
          <span>Open Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contextual Quick Query Chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(prompt)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:border-teal-400 dark:hover:text-teal-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 text-teal-500 shrink-0" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContextualPDPAskAI;
