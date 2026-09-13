import { useParams, useNavigate } from "react-router-dom";
import { Button, Typography } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-5">
      <CheckCircle sx={{ fontSize: 80 }} color="success" />
      <Typography variant="h4" fontWeight="600" color="success.main">
        Payment Successful!
      </Typography>
      <Typography variant="body1" color="text.secondary" className="text-center max-w-md">
        Your order has been placed successfully. You will receive an email confirmation shortly.
      </Typography>
      {orderId && (
        <Typography variant="body2" color="text.secondary">
          Order ID: {orderId.slice(-8).toUpperCase()}
        </Typography>
      )}
      <div className="flex gap-3">
        <Button
          variant="outlined"
          onClick={() => navigate("/orders")}
        >
          View Orders
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
