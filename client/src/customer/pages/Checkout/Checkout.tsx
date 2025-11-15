import { Add } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControlLabel,
  Modal,
  Radio,
  RadioGroup,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { useState } from "react";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import PricingCard from "../Cart/PricingCard";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 4,
};

const paymentGatewayList = [
  { name: "RAZORPAY", logo: "/razorpay.png" },
  { name: "STRIPE", logo: "/stripe.png" },
];

const Checkout = () => {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState(
    paymentGatewayList[0].name
  );
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAddress(event.target.value);
  };

  const handleChangePaymentGateway = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedPaymentGateway(event.target.value);
  };

  return (
    <div className="pt-10 px-5 sm:px-10 md:px-20 min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE - ADDRESS */}
        <div className="col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" fontWeight="600">
              Delivery Address
            </Typography>
            <Button variant="outlined" onClick={handleOpen}>
              + Add Address
            </Button>
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <AddressCard
                key={index}
                value={index}
                selectedValue={selectedAddress}
                handleChange={handleChangeAddress}
              />
            ))}
          </div>

          <Card
            variant="outlined"
            sx={{ borderStyle: "dashed", borderRadius: "12px" }}
          >
            <CardContent className="flex items-center justify-center">
              <Button startIcon={<Add />} onClick={handleOpen}>
                Add New Address
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE - PAYMENT + SUMMARY */}
        <div className="col-span-1 space-y-6">
          <Card sx={{ borderRadius: "12px" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                className="text-center text-teal-600"
              >
                Choose Payment Gateway
              </Typography>
              <RadioGroup
                row
                value={selectedPaymentGateway}
                onChange={handleChangePaymentGateway}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                {paymentGatewayList.map((item, index) => (
                  <FormControlLabel
                    key={index}
                    value={item.name}
                    control={<Radio />}
                    label={item.name}
                  />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: "12px" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600">
                Order Summary
              </Typography>
              {/* PRICE DETAILS */}
              <PricingCard />
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, borderRadius: "10px" }}
              >
                Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <AddressForm paymentGateway={selectedPaymentGateway} />
        </Box>
      </Modal>
    </div>
  );
};

export default Checkout;
