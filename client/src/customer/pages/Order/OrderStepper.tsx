import { CheckCircle, FiberManualRecord } from "@mui/icons-material";
import { Box } from "@mui/material";

const steps = [
  {
    name: "Order Placed",
    description: "Your order has been placed",
    value: "PLACED",
  },
  {
    name: "Confirmed",
    description: "Seller has confirmed your order",
    value: "CONFIRMED",
  },
  {
    name: "Shipped",
    description: "Your order has been shipped",
    value: "SHIPPED",
  },
  {
    name: "Out for Delivery",
    description: "Your order is out for delivery",
    value: "ARRIVING",
  },
  {
    name: "Delivered",
    description: "Your order has been delivered",
    value: "DELIVERED",
  },
];

const cancelledSteps = [
  {
    name: "Order Placed",
    description: "Your order was placed",
    value: "PLACED",
  },
  {
    name: "Order Cancelled",
    description: "Your order has been cancelled",
    value: "CANCELLED",
  },
];

const getActiveStep = (orderStatus: string): number => {
  const statusOrder = ["PENDING", "PLACED", "CONFIRMED", "SHIPPED", "ARRIVING", "DELIVERED"];
  return statusOrder.indexOf(orderStatus);
};

const OrderStepper = ({ orderStatus }: { orderStatus?: string }) => {
  const statusStep = orderStatus === "CANCELLED" ? cancelledSteps : steps;
  const activeStep = getActiveStep(orderStatus || "PENDING");

  return (
    <Box className="mx-auto my-5">
      {statusStep.map((step, index) => {
        const isCompleted = orderStatus === "CANCELLED"
          ? step.value === "PLACED"
          : activeStep >= steps.findIndex((s) => s.value === step.value) + 1;
        const isCurrent = step.value === orderStatus;

        return (
          <div key={step.value}>
            <div className="flex px-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted || isCurrent ? (
                    <CheckCircle sx={{ fontSize: 20 }} />
                  ) : (
                    <FiberManualRecord sx={{ fontSize: 12 }} />
                  )}
                </div>
                {index < statusStep.length - 1 && (
                  <div
                    className={`h-12 w-[2px] ${
                      isCompleted ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`font-medium text-sm ${
                    isCurrent
                      ? orderStatus === "CANCELLED"
                        ? "text-destructive font-bold"
                        : "text-primary font-bold"
                      : isCompleted
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </Box>
  );
};

export default OrderStepper;
