// Supported payment rails and methods
export const PaymentRail = Object.freeze({
  UPI: "UPI",
  CARD: "CARD",
  NETBANKING: "NETBANKING",
  WALLET: "WALLET",
  EMI: "EMI",
  COD: "COD",
  GIFT_CARD: "GIFT_CARD",
  RAZORPAY: "RAZORPAY",
  SANDBOX: "SANDBOX",
});

export const UPI_APPS = Object.freeze({
  GPAY: { id: "gpay", name: "Google Pay", icon: "gpay" },
  PHONEPE: { id: "phonepe", name: "PhonePe", icon: "phonepe" },
  PAYTM: { id: "paytm", name: "Paytm UPI", icon: "paytm" },
  BHIM: { id: "bhim", name: "BHIM UPI", icon: "bhim" },
  AMAZONPAY: { id: "amazonpay", name: "Amazon Pay UPI", icon: "amazonpay" },
  CRED: { id: "cred", name: "CRED UPI", icon: "cred" },
});

export const POPULAR_BANKS = Object.freeze([
  { code: "HDFC", name: "HDFC Bank", popular: true },
  { code: "ICICI", name: "ICICI Bank", popular: true },
  { code: "SBIN", name: "State Bank of India", popular: true },
  { code: "UTIB", name: "Axis Bank", popular: true },
  { code: "KKBK", name: "Kotak Mahindra Bank", popular: true },
  { code: "PUNB", name: "Punjab National Bank", popular: false },
  { code: "BARB", name: "Bank of Baroda", popular: false },
  { code: "CNRB", name: "Canara Bank", popular: false },
  { code: "INDB", name: "IndusInd Bank", popular: false },
  { code: "YESB", name: "Yes Bank", popular: false },
  { code: "IDFB", name: "IDFC FIRST Bank", popular: false },
]);

export default PaymentRail;
