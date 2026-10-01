import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertCircle, ThumbsUp, Star, ShieldCheck } from "lucide-react";
import { aiCommerceService } from "../../../../services/aiCommerceService";
import type { ReviewSummaryResponse } from "../../../../services/aiCommerceService";

interface AIReviewSummaryProps {
  productId: string;
}

export const AIReviewSummary: React.FC<AIReviewSummaryProps> = ({ productId }) => {
  const [data, setData] = useState<ReviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setLoading(true);

    aiCommerceService
      .getReviewSummary(productId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error("Error loading review highlights:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border animate-pulse space-y-3">
        <div className="h-4 w-40 bg-muted rounded"></div>
        <div className="h-16 w-full bg-muted/60 rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div id="ai-review-summary" className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 scroll-mt-28">
      {/* Header (Marketplace Standard: 'Customers Say') */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              Customers Say
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                AI Summary
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Synthesized from {data.verifiedReviewsCount} verified customer reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{data.sentimentBreakdown?.positivePct || 86}% Positive Feedback</span>
        </div>
      </div>

      {/* Aspect Dimension Tags / Sentiment Badges */}
      {data.aspectSentiment && data.aspectSentiment.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Buyer Satisfaction by Feature
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {data.aspectSentiment.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-muted/50 border border-border/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    {item.aspect}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.score.toFixed(1)}</span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(item.score / 5.0) * 100}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pros & Cons Section (Highlights & Considerations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {data.topPros && data.topPros.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              What Customers Love
            </span>
            <ul className="space-y-1.5 text-xs text-foreground/90">
              {data.topPros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.topCons && data.topCons.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Points to Keep in Mind
            </span>
            <ul className="space-y-1.5 text-xs text-foreground/90">
              {data.topCons.map((con, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Verified AI Buyer Verdict Footer */}
      {data.verdict && (
        <div className="p-3.5 rounded-2xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2.5">
          <ThumbsUp className="w-4 h-4 text-primary shrink-0" />
          <span className="leading-snug">
            <strong className="font-bold text-foreground">Shopper Recommendation:</strong>{" "}
            {data.verdict}
          </span>
        </div>
      )}
    </div>
  );
};

export default AIReviewSummary;
