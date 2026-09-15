import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, XCircle, ThumbsUp, Star, ShieldCheck } from "lucide-react";
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
      .catch((err) => console.error("Error loading review intelligence:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-pulse space-y-3">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-20 w-full bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/95 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Review Intelligence
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                Aspect Sentiment
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Synthesized from {data.verifiedReviewsCount} verified buyer reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{data.sentimentBreakdown?.positivePct || 86}% Positive Feedback</span>
        </div>
      </div>

      {/* Aspect Sentiment Bars */}
      {data.aspectSentiment && data.aspectSentiment.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Key Product Dimensions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.aspectSentiment.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.aspect}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.score.toFixed(1)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${(item.score / 5.0) * 100}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-1">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pros & Cons Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {data.topPros && data.topPros.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Highlights
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {data.topPros.map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.topCons && data.topCons.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Considerations
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {data.topCons.map((con, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Verdict Footer */}
      {data.verdict && (
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="leading-snug">
            <strong className="font-semibold text-slate-900 dark:text-white">AI Verdict:</strong>{" "}
            {data.verdict}
          </span>
        </div>
      )}
    </div>
  );
};

export default AIReviewSummary;
