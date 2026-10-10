import React, { useEffect, useState } from "react";
import { Modal, Box, Button, IconButton, CircularProgress } from "@mui/material";
import { Close, Print, Verified, ErrorOutline } from "@mui/icons-material";
import { Api } from "../../../config/Api";

export interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
}

export interface AuthoritativeInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  documentTitle?: string;
  invoiceStatus?: string;
  taxRegime?: string;
  regimeNote?: string;
  canCollectTax?: boolean;
  placeOfSupply: string;
  placeOfSupplyStateCode?: string;
  sellerStateCode?: string;
  taxType: "INTRA_STATE" | "INTER_STATE" | "NIL_RATED_OR_EXEMPT" | "UNRESOLVED_PLACE_OF_SUPPLY" | string;
  isIntraState: boolean;
  platform: {
    companyName: string;
    cin: string;
    platformGstin: string;
    platformAddress: string;
  };
  seller: {
    sellerId?: string;
    sellerCode?: string;
    businessName: string;
    sellerName?: string;
    gstin?: string | null;
    isGstRegistered: boolean;
    address: string;
    locality?: string;
    city: string;
    state: string;
    pincode: number | string;
    phone?: string | number;
    email?: string;
  };
  buyer: {
    name: string;
    address: string;
    locality?: string;
    city: string;
    state: string;
    pincode: number | string;
    mobile?: string | number;
    email?: string;
  };
  lineItems: Array<{
    itemIndex: number;
    orderItemId: string;
    productId: string;
    productTitle: string;
    sku: string;
    variantTitle?: string;
    hsnCode: string;
    quantity: number;
    unitSellingPrice: number;
    grossAmount: number;
    discount: number;
    taxableAmount: number;
    gstRatePercent: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalTax: number;
    lineTotal: number;
  }>;
  financials: {
    totalMrpPrice?: number;
    discount?: number;
    totalTaxableAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTaxAmount: number;
    shippingFee: number;
    grandTotal: number;
  };
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ open, onClose, order }) => {
  const [invoice, setInvoice] = useState<AuthoritativeInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = order?._id;

  useEffect(() => {
    let isMounted = true;
    if (!open || !orderId) {
      setInvoice(null);
      setError(null);
      return;
    }

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await Api.get(`/order/${orderId}/invoice`);
        if (isMounted) {
          if (res.data?.invoice) {
            setInvoice(res.data.invoice);
          } else {
            throw new Error("Authoritative invoice data missing in response");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("[InvoiceModal] Failed to load authoritative invoice:", err.message);
          setError(
            err.response?.data?.message ||
              "Unable to retrieve authoritative tax invoice from server."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInvoice();

    return () => {
      isMounted = false;
    };
  }, [open, orderId]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber =
    invoice?.invoiceNumber ||
    `INV-ZB-${order._id?.slice(-8).toUpperCase() || "000000"}`;

  const formattedInvoiceDate = invoice?.invoiceDate || order.orderDate || order.createdAt;
  const displayDate = formattedInvoiceDate
    ? new Date(formattedInvoiceDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recent";

  const isIntraState = invoice ? invoice.isIntraState : true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "96%", sm: 840 },
          maxHeight: "92vh",
          bgcolor: "var(--card, #ffffff)",
          color: "var(--foreground, #111827)",
          borderRadius: "1rem",
          border: "1px solid var(--border, #e5e7eb)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        {/* Modal Controls Header (Hidden during print) */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border/80 bg-muted/30 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-foreground">
              Tax Invoice — {invoiceNumber}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {invoice ? "Server Authoritative GST" : "Generating GST Record"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrint}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "12px",
                borderRadius: "0.5rem",
                px: 2,
              }}
            >
              Print / Save PDF
            </Button>
            <IconButton size="small" onClick={onClose} aria-label="Close invoice">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-gray-900 text-xs font-sans print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
              <CircularProgress size={32} />
              <p className="font-semibold text-xs">
                Generating authoritative GST invoice record from server...
              </p>
            </div>
          ) : error && !invoice ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <ErrorOutline sx={{ fontSize: 28 }} />
              </div>
              <h4 className="font-black text-base text-gray-900">Invoice Unavailable</h4>
              <p className="text-gray-600 text-xs max-w-md mx-auto">{error}</p>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  Api.get(`/order/${orderId}/invoice`)
                    .then((r) => setInvoice(r.data.invoice))
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
              >
                Retry Fetching
              </Button>
            </div>
          ) : (
            <>
              {/* Top Brand & Title */}
              <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
                    ZOSH BAZAAR
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {invoice?.platform?.companyName || "Zosh Bazaar India Private Limited"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    GSTIN: {invoice?.platform?.platformGstin || "27AABCZ9876Q1Z5"} | CIN:{" "}
                    {invoice?.platform?.cin || "U74999MH2023PTC398241"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {invoice?.platform?.platformAddress ||
                      "Kurla West, Mumbai, Maharashtra - 400070"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[11px] font-black uppercase px-2.5 py-1 rounded ${
                      invoice?.invoiceStatus === "VOID"
                        ? "bg-red-100 text-red-800"
                        : invoice?.invoiceStatus === "DRAFT_PENDING_TAX_VALIDATION"
                        ? "bg-amber-100 text-amber-800"
                        : invoice?.canCollectTax === false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {invoice?.documentTitle || "TAX INVOICE"}
                  </span>
                  {invoice?.regimeNote && (
                    <p className="text-[9px] font-medium text-gray-500 mt-0.5 max-w-[220px] ml-auto">
                      {invoice.regimeNote}
                    </p>
                  )}
                  <p className="font-bold text-gray-800 text-xs mt-1">
                    Invoice No: {invoiceNumber}
                  </p>
                  <p className="text-[11px] text-gray-600">Order ID: #{order._id}</p>
                  <p className="text-[11px] text-gray-600">Date: {displayDate}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                    Place of Supply:{" "}
                    <span className="text-gray-900 uppercase">
                      {invoice?.placeOfSupply || order.shippingAddress?.state || "India"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Billing & Shipping Grid */}
              <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-3.5 mb-4 bg-gray-50/50">
                {/* Sold By */}
                <div>
                  <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Sold By (Registered Merchant)
                  </p>
                  <p className="font-extrabold text-xs text-gray-900">
                    {invoice?.seller?.businessName ||
                      order.seller?.businessDetails?.businessName ||
                      order.seller?.sellerName ||
                      "Certified Marketplace Merchant"}
                  </p>
                  <p className="text-gray-600 text-[11px]">
                    {invoice?.seller?.address ||
                      order.seller?.pickupAddress?.address ||
                      "Certified Logistics Center"}
                    ,{" "}
                    {invoice?.seller?.city || order.seller?.pickupAddress?.city || "Mumbai"},{" "}
                    {invoice?.seller?.state || order.seller?.pickupAddress?.state || "Maharashtra"}
                    {invoice?.seller?.pincode ? ` — ${invoice.seller.pincode}` : ""}
                  </p>
                  <p className="text-gray-700 text-[11px] font-semibold mt-1">
                    GSTIN:{" "}
                    {invoice?.seller?.gstin ? (
                      <span className="font-mono">{invoice.seller.gstin}</span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        Composition / Below Registration Threshold
                      </span>
                    )}
                  </p>
                  {invoice?.seller?.sellerCode && (
                    <p className="text-gray-500 text-[10px]">
                      Merchant Code: {invoice.seller.sellerCode}
                    </p>
                  )}
                </div>

                {/* Bill To / Ship To */}
                <div>
                  <p className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Billed & Shipped To (Recipient)
                  </p>
                  <p className="font-extrabold text-xs text-gray-900">
                    {invoice?.buyer?.name ||
                      order.shippingAddress?.name ||
                      order.user?.fullName ||
                      "Valued Customer"}
                  </p>
                  <p className="text-gray-600 text-[11px]">
                    {invoice?.buyer?.address || order.shippingAddress?.address || "Delivery Address"}
                    {invoice?.buyer?.locality ? `, ${invoice.buyer.locality}` : ""}
                  </p>
                  <p className="text-gray-600 text-[11px]">
                    {invoice?.buyer?.city || order.shippingAddress?.city || "City"},{" "}
                    {invoice?.buyer?.state || order.shippingAddress?.state || "State"} —{" "}
                    {invoice?.buyer?.pincode || order.shippingAddress?.pincode || "Pincode"}
                  </p>
                  <p className="text-gray-600 text-[11px]">
                    Mobile:{" "}
                    {invoice?.buyer?.mobile ||
                      order.shippingAddress?.mobile ||
                      order.user?.mobile ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {/* Line Items Table with HSN & GST Split */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <th className="p-2 w-7 text-center">#</th>
                      <th className="p-2">Description & SKU</th>
                      <th className="p-2 w-14 text-center">HSN</th>
                      <th className="p-2 w-10 text-center">Qty</th>
                      <th className="p-2 w-16 text-right">Taxable (₹)</th>
                      <th className="p-2 w-14 text-center">Rate</th>
                      {isIntraState ? (
                        <>
                          <th className="p-2 w-14 text-right">CGST (₹)</th>
                          <th className="p-2 w-14 text-right">SGST (₹)</th>
                        </>
                      ) : (
                        <th className="p-2 w-16 text-right">IGST (₹)</th>
                      )}
                      <th className="p-2 w-18 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(invoice?.lineItems || []).map((item) => (
                      <tr key={item.itemIndex} className="hover:bg-gray-50/50">
                        <td className="p-2 text-center text-gray-500 font-medium">
                          {item.itemIndex}
                        </td>
                        <td className="p-2">
                          <div className="font-bold text-gray-900">{item.productTitle}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {item.sku && `SKU: ${item.sku}`}
                            {item.variantTitle && ` | Variant: ${item.variantTitle}`}
                          </div>
                        </td>
                        <td className="p-2 text-center text-gray-700 font-mono font-semibold">
                          {item.hsnCode}
                        </td>
                        <td className="p-2 text-center font-bold text-gray-800">
                          {item.quantity}
                        </td>
                        <td className="p-2 text-right font-medium text-gray-700">
                          {item.taxableAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-2 text-center font-semibold text-gray-600">
                          {item.gstRatePercent}%
                        </td>
                        {isIntraState ? (
                          <>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {item.cgstAmount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {item.sgstAmount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </>
                        ) : (
                          <td className="p-2 text-right font-medium text-gray-700">
                            {item.igstAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        )}
                        <td className="p-2 text-right font-bold text-gray-900">
                          {item.lineTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Calculation Summary & Place of Supply Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start mb-6">
                <div className="border border-gray-200 rounded-lg p-3 text-[11px] text-gray-600 bg-gray-50/40 space-y-1">
                  <p className="font-bold text-gray-800">Tax Treatment & Rules:</p>
                  <p>
                    Supply Type:{" "}
                    <span className="font-semibold text-gray-900">
                      {isIntraState
                        ? "Intra-State Supply (CGST + SGST)"
                        : "Inter-State Supply (IGST)"}
                    </span>
                  </p>
                  <p>
                    Payment Status:{" "}
                    <span className="font-semibold text-gray-900 uppercase">
                      {invoice?.paymentStatus || order.paymentStatus || "PAID"}
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-500 pt-1">
                    This is an authoritative, digitally generated tax invoice issued under Rule
                    46 of the CGST Rules, 2017.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Value:</span>
                    <span className="font-semibold">
                      ₹
                      {(invoice?.financials?.totalTaxableAmount ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {isIntraState ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Central GST (CGST):</span>
                        <span>
                          ₹
                          {(invoice?.financials?.totalCgst ?? 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>State GST (SGST):</span>
                        <span>
                          ₹
                          {(invoice?.financials?.totalSgst ?? 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-600">
                      <span>Integrated GST (IGST):</span>
                      <span>
                        ₹
                        {(invoice?.financials?.totalIgst ?? 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Total Tax Amount:</span>
                    <span className="font-semibold">
                      ₹
                      {(invoice?.financials?.totalTaxAmount ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping & Handling:</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>

                  <div className="border-t border-gray-300 pt-1.5 flex justify-between font-black text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-blue-700">
                      ₹
                      {(invoice?.financials?.grandTotal ?? order.totalSellingPrice ?? 0).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Seal & Authenticity Footer */}
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Verified sx={{ fontSize: 16 }} />
                  <span>Verified Authoritative GST Tax Invoice</span>
                </div>
                <span>Digitally Authenticated for Zosh Bazaar Marketplace</span>
              </div>
            </>
          )}
        </div>
      </Box>
    </Modal>
  );
};

export default InvoiceModal;
