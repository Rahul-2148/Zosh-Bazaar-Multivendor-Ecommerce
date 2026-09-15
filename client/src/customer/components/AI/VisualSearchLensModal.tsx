import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, X, Sparkles, Image as ImageIcon, ArrowRight, Loader2 } from "lucide-react";
import { aiCommerceService } from "../../../services/aiCommerceService";
import type { VisualSearchResult } from "../../../services/aiCommerceService";

interface VisualSearchLensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisualSearchLensModal: React.FC<VisualSearchLensModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<VisualSearchResult | null>(null);
  const [categoryHint, setCategoryHint] = useState<string>("");

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      performVisualSearch(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (sampleUrl: string, hint: string) => {
    setImagePreview(sampleUrl);
    setCategoryHint(hint);
    performVisualSearch(sampleUrl, hint);
  };

  const performVisualSearch = async (imgData: string, hint?: string) => {
    setLoading(true);
    setSearchResult(null);
    try {
      const res = await aiCommerceService.visualSearch(imgData, hint || categoryHint);
      setSearchResult(res);
    } catch (err) {
      console.error("Visual search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setImagePreview(null);
    setSearchResult(null);
    setCategoryHint("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Zosh Visual Lens
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded border border-teal-500/20">
                  Vision AI
                </span>
              </h3>
              <p className="text-xs text-slate-500">Search products by uploading photos or matching colors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div className="space-y-6">
              {/* Drag and drop dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 flex items-center justify-center text-slate-500 group-hover:text-teal-600 transition mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drop a product photo or click to browse
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Upload an image of clothing, footwear, headphones, or home decor to find exact and visually similar matches
                </p>
              </div>

              {/* Sample Quick Try Options */}
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Or test with sample products
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Audio Headphones",
                      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
                      hint: "Headphones",
                    },
                    {
                      label: "Trail Running Shoes",
                      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
                      hint: "Shoes",
                    },
                    {
                      label: "Silk Saree / Ethnic",
                      url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
                      hint: "Saree",
                    },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSampleSelect(s.url, s.hint)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-teal-500 transition"
                    >
                      <img src={s.url} alt={s.label} className="h-24 w-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="p-2 bg-white dark:bg-slate-800">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {s.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Image Analysis Banner */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <img
                  src={imagePreview}
                  alt="Search query"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shadow-2xs"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Visual Query Loaded
                    </span>
                    {searchResult?.visualFeaturesExtracted?.detectedCategory && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                        Detected: {searchResult.visualFeaturesExtracted.detectedCategory}
                      </span>
                    )}
                  </div>
                  {searchResult?.visualFeaturesExtracted?.dominantColor && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dominant Hue:{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-300">
                        {searchResult.visualFeaturesExtracted.dominantColor}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={resetSearch}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                >
                  Upload New
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Extracting vision embeddings & running vector similarity...
                  </p>
                </div>
              )}

              {/* Matches Results Grid */}
              {searchResult && !loading && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {searchResult.matches.length} Visually Matching Products
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Retrieval Latency: {searchResult.tookMs}ms
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {searchResult.matches.map((item: any) => {
                      const pid = item.productId || item._id;
                      const img =
                        item.images?.[0] ||
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80";

                      return (
                        <div
                          key={pid}
                          onClick={() => {
                            onClose();
                            navigate(`/product-details/${item.categoryId || "all"}/${pid}`);
                          }}
                          className="cursor-pointer group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-teal-500 hover:shadow-md transition flex flex-col"
                        >
                          <div className="h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <img
                              src={img}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-teal-600 uppercase">
                                {item.brand || "Zosh Certified"}
                              </span>
                              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                                {item.title}
                              </h5>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                ₹{(item.sellingPrice || 0).toLocaleString("en-IN")}
                              </span>
                              {item.explanationText && (
                                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium">
                                  Color Match
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualSearchLensModal;
