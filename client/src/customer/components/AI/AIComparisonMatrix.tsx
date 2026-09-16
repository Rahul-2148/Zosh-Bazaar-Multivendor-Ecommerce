import React from "react";
import { Award, Check, ShoppingCart, ArrowRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import type { StructuredComparison } from "../../../services/aiCommerceService";

interface AIComparisonMatrixProps {
  comparison: StructuredComparison;
}

export const AIComparisonMatrix: React.FC<AIComparisonMatrixProps> = ({ comparison }) => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  if (!comparison || !comparison.productIds || comparison.productIds.length < 2) {
    return null;
  }

  const { productIds, productTitles = {} } = comparison;
  const attributeRows = comparison.attributes || (comparison as any).attributeRows || [];
  const verdict = comparison.verdictSummary || (comparison as any).verdict;

  const handleAddToCart = (productId: string) => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/login");
      return;
    }
    dispatch(addItemToCart({ jwt, productId, quantity: 1 }));
  };

  return (
    <div className="my-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
      {/* Table Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-teal-600/10 via-indigo-600/10 to-purple-600/10 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center">
            <Award className="w-3 h-3" />
          </div>
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 dark:text-white">
            Verified Specification Matrix
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">
          {productIds.length} Products Compared
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-left min-w-[340px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
              <th className="p-2.5 font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase w-28 shrink-0">
                Specification
              </th>
              {productIds.map((pid, idx) => (
                <th key={pid} className="p-2.5 font-extrabold text-slate-900 dark:text-white text-[11px]">
                  <div className="flex flex-col gap-1">
                    <span className="line-clamp-1">{productTitles[pid] || `Option ${idx + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(pid)}
                      className="w-fit px-2 py-0.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <ShoppingCart className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {attributeRows.map((row: any, rIdx: number) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-2.5 font-bold text-slate-600 dark:text-slate-400 text-[11px] bg-slate-50/40 dark:bg-slate-900/30">
                  {row.attributeName}
                </td>
                {productIds.map((pid) => {
                  const cellVal = row.valuesByProduct?.[pid] ?? row.values?.[pid];
                  return (
                    <td key={pid} className="p-2.5 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                      {cellVal !== undefined && cellVal !== null ? (
                        <span>{String(cellVal)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verdict Summary Footer */}
      {verdict && (
        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 border-t border-teal-200/60 dark:border-teal-900/60 text-[11px] flex items-start gap-2">
          <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-teal-900 dark:text-teal-200 leading-snug">
            <span className="font-bold">Recommendation: </span>
            <span>{verdict}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIComparisonMatrix;
