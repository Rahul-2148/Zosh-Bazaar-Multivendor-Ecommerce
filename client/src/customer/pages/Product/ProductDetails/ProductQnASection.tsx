import React, { useState, useEffect, useMemo } from "react";
import {
  HelpOutline,
  Search,
  VerifiedUserOutlined,
  ThumbUpOutlined,
  SendOutlined,
  ChatBubbleOutline,
  CheckCircle,
  StorefrontOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  InfoOutlined,
} from "@mui/icons-material";
import {
  Button,
  TextField,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Api } from "../../../../config/Api";

export interface AnswerItem {
  _id: string;
  answer: string;
  answeredBy: {
    userId?: string;
    name: string;
    role: "SELLER" | "VERIFIED_BUYER" | "ADMIN" | "COMMUNITY";
  };
  isSellerAnswer: boolean;
  isVerifiedBuyer: boolean;
  upvotes: number;
  answeredAt: string;
}

export interface QuestionItem {
  _id: string;
  question: string;
  askedBy: {
    userId?: string;
    name: string;
  };
  askedAt: string;
  answers: AnswerItem[];
  category?: string;
  tags?: string[];
}

interface ProductQnASectionProps {
  productId: string;
  productTitle?: string;
}

export const ProductQnASection: React.FC<ProductQnASectionProps> = ({
  productId,
  productTitle,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [upvotedMap, setUpvotedMap] = useState<Record<string, boolean>>({});

  // Ask question modal state
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!productId) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await Api.get(`/products/${productId}/questions`);
        if (isMounted && res.data?.questions) {
          setQuestions(res.data.questions);
          // Auto-expand first 2 questions by default
          const initialExpanded: Record<string, boolean> = {};
          res.data.questions.slice(0, 2).forEach((q: QuestionItem) => {
            initialExpanded[q._id] = true;
          });
          setExpandedIds(initialExpanded);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("[ProductQnA] Could not load questions:", err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const toggleExpand = (qId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleUpvote = (ansId: string) => {
    setUpvotedMap((prev) => ({
      ...prev,
      [ansId]: !prev[ansId],
    }));
  };

  const handleAskSubmit = async () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      window.location.href = "/login";
      return;
    }

    if (!questionInput.trim() || questionInput.trim().length < 10) {
      setSubmitError("Please enter a question of at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await Api.post(`/products/${productId}/questions`, {
        question: questionInput.trim(),
      });

      if (res.data?.question) {
        setQuestions((prev) => [res.data.question, ...prev]);
        setSubmitSuccess(true);
        setTimeout(() => {
          setAskDialogOpen(false);
          setQuestionInput("");
          setSubmitSuccess(false);
        }, 1800);
      }
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || "Failed to submit question. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filter questions by search query and category
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchQuery.trim() ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answers.some((a) => a.answer.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" ||
        (q.category && q.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [questions, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    questions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [questions]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-7 shadow-sm my-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ChatBubbleOutline className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Questions & Answers
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Have questions about this item? Search answers or ask verified buyers & seller.
          </p>
        </div>

        <Button
          variant="contained"
          color="primary"
          startIcon={<HelpOutline />}
          onClick={() => setAskDialogOpen(true)}
          sx={{
            textTransform: "none",
            borderRadius: "0.75rem",
            fontWeight: 600,
            px: 2.5,
            py: 1,
            boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.25)",
          }}
        >
          Ask a Question
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions, keywords, or answers (e.g. warranty, size, compatibility)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                onClick={() => setSelectedCategory(cat)}
                color={selectedCategory === cat ? "primary" : "default"}
                variant={selectedCategory === cat ? "filled" : "outlined"}
                sx={{
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: selectedCategory === cat ? 700 : 500,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <CircularProgress size={32} thickness={4} />
            <p className="text-xs">Loading verified answers...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <HelpOutline className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {searchQuery ? "No matching questions found" : "No questions asked yet"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? `Try searching for different keywords or be the first to ask about "${searchQuery}".`
                : "Be the first to ask a question! Verified buyers and the official seller respond promptly."}
            </p>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setQuestionInput(searchQuery);
                setAskDialogOpen(true);
              }}
              sx={{ textTransform: "none", borderRadius: "0.5rem" }}
            >
              Ask this Question
            </Button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = !!expandedIds[q._id];
            return (
              <div
                key={q._id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all"
              >
                {/* Question Row */}
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                  onClick={() => toggleExpand(q._id)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                      Q:
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {q.question}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <span>Asked by {q.askedBy?.name || "Customer"}</span>
                        <span>•</span>
                        <span>{new Date(q.askedAt).toLocaleDateString()}</span>
                        {q.category && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-500 dark:text-indigo-400 font-medium">
                              {q.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <IconButton size="small" sx={{ color: "text.secondary" }}>
                    {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>
                </div>

                {/* Answers Section */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-800/80 space-y-3 pl-6">
                    {q.answers.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg">
                        <InfoOutlined fontSize="small" />
                        <span>Awaiting answer from seller or community. Check back shortly.</span>
                      </div>
                    ) : (
                      q.answers.map((ans) => {
                        const isUpvoted = !!upvotedMap[ans._id];
                        const displayUpvotes = ans.upvotes + (isUpvoted ? 1 : 0);

                        return (
                          <div key={ans._id} className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                                A:
                              </span>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                                  {ans.answer}
                                </p>

                                {/* Answerer Attribution & Badges */}
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {ans.answeredBy?.name || "Marketplace Assistant"}
                                  </span>

                                  {ans.isSellerAnswer && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                      <StorefrontOutlined sx={{ fontSize: 12 }} />
                                      Seller
                                    </span>
                                  )}

                                  {ans.isVerifiedBuyer && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                      <VerifiedUserOutlined sx={{ fontSize: 12 }} />
                                      Verified Buyer
                                    </span>
                                  )}

                                  <span>•</span>
                                  <span>{new Date(ans.answeredAt).toLocaleDateString()}</span>

                                  {/* Upvote button */}
                                  <button
                                    onClick={() => handleUpvote(ans._id)}
                                    className={`ml-auto inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${
                                      isUpvoted
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    <ThumbUpOutlined sx={{ fontSize: 13 }} />
                                    <span>{displayUpvotes > 0 ? displayUpvotes : "Helpful"}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ask Question Dialog */}
      <Dialog
        open={askDialogOpen}
        onClose={() => !submitting && setAskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "1rem",
            p: 1,
            backgroundColor: "background.paper",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Ask a Question
          <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
            {productTitle ? `About "${productTitle}"` : "Get answers from verified buyers and the seller."}
          </p>
        </DialogTitle>

        <DialogContent>
          {submitSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle className="text-emerald-500 w-12 h-12 animate-bounce" />
              <h4 className="font-bold text-gray-800 dark:text-white">Question Submitted!</h4>
              <p className="text-xs text-gray-500 max-w-xs">
                Your question has been sent to the seller and community. You will be notified once answered.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="What would you like to know? (e.g. Is this compatible with iPhone 15? What is the exact fabric composition?)"
                value={questionInput}
                onChange={(e) => {
                  setQuestionInput(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                disabled={submitting}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.75rem",
                  },
                }}
              />

              {submitError && (
                <p className="text-xs text-red-500 font-medium">{submitError}</p>
              )}

              <div className="text-[11px] text-gray-400 flex items-start gap-1.5">
                <InfoOutlined sx={{ fontSize: 15 }} className="shrink-0 mt-0.5" />
                <span>
                  Please do not include personal contact details, offensive language, or payment info.
                </span>
              </div>
            </div>
          )}
        </DialogContent>

        {!submitSuccess && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setAskDialogOpen(false)}
              disabled={submitting}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAskSubmit}
              disabled={submitting || !questionInput.trim()}
              startIcon={submitting ? <CircularProgress size={16} /> : <SendOutlined />}
              sx={{
                textTransform: "none",
                borderRadius: "0.5rem",
                fontWeight: 600,
              }}
            >
              {submitting ? "Submitting..." : "Post Question"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </div>
  );
};
