import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchUserReturns } from "../../../Redux Toolkit/features/customer/UserSlice";
import {
  AssignmentReturnOutlined,
  ReceiptLongOutlined,
  HelpOutline,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";

export const ReturnsRefundsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { returns } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    if (jwt) {
      setLoading(true);
      dispatch(fetchUserReturns()).finally(() => setLoading(false));
    }
  }, [dispatch, jwt]);

  const filteredReturns = (returns || []).filter((r: any) => {
    if (filterTab === "ACTIVE") return r.orderStatus === "RETURN_REQUESTED";
    if (filterTab === "COMPLETED") return ["RETURNED", "REFUNDED"].includes(r.orderStatus);
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Returns & Refunds</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track reverse pickups, item inspection status, and refund processing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/account/help")}
            startIcon={<HelpOutline sx={{ fontSize: 14 }} />}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "0.65rem" }}
          >
            Return Policy FAQ
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterTab("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterTab === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          All Returns ({returns?.length || 0})
        </button>
        <button
          onClick={() => setFilterTab("ACTIVE")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterTab === "ACTIVE"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          In Progress ({returns?.filter((r: any) => r.orderStatus === "RETURN_REQUESTED").length || 0})
        </button>
        <button
          onClick={() => setFilterTab("COMPLETED")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterTab === "COMPLETED"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          Refunded ({returns?.filter((r: any) => ["RETURNED", "REFUNDED"].includes(r.orderStatus)).length || 0})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CircularProgress size={30} />
          <p className="text-xs text-muted-foreground font-medium">Fetching returns history...</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
            <AssignmentReturnOutlined sx={{ fontSize: 32 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">No active returns or refunds</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              You do not have any items currently in return or refund status. You can request returns for eligible
              delivered items in your Orders page.
            </p>
          </div>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/account/orders")}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "0.65rem", mt: 1 }}
          >
            Go to My Orders
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReturns.map((item: any) => {
            const isRefunded = item.orderStatus === "REFUNDED";

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Return For</span>
                    <div className="font-bold text-foreground">Order #{item._id?.slice(-8).toUpperCase()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isRefunded
                          ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                          : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                      }`}
                    >
                      {item.orderStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Items in Return */}
                <div className="flex flex-col gap-2">
                  {item.orderItems?.map((oi: any) => {
                    const prod = oi.product;
                    const img =
                      typeof prod?.images?.[0] === "object" ? prod.images[0].url : prod?.images?.[0] || "";

                    return (
                      <div key={oi._id} className="flex items-center gap-3">
                        <img
                          src={img || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"}
                          alt={prod?.title || "Product"}
                          className="w-12 h-12 rounded-lg object-cover bg-muted border border-border/60"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-foreground line-clamp-1">{prod?.title || "Item"}</div>
                          <div className="text-muted-foreground">
                            Qty: {oi.quantity} • Refund Value: ₹{oi.sellingPrice?.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Return Progress Stepper */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <ReceiptLongOutlined sx={{ fontSize: 16, color: "var(--primary)" }} />
                    <span>Refund Summary</span>
                  </div>
                  <div className="text-muted-foreground">
                    Expected Refund Amount:{" "}
                    <span className="font-bold text-foreground">
                      ₹{item.totalSellingPrice?.toLocaleString("en-IN")}
                    </span>{" "}
                    (credited back to original payment mode)
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/order/${item._id}`)}
                    sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "0.5rem" }}
                  >
                    View Order Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReturnsRefundsView;
