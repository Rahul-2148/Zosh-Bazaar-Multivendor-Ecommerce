import { CheckCircle, FiberManualRecord } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

const steps = [
  {
    name: "Order Placed",
    description: "on Thu, 2 Sep, 2025",
    value: "PLACED",
  },
  {
    name: "Packed",
    description: "Item Packed in Dispatch Warehouse",
    value: "CONFIRMED",
  },
  {
    name: "Shipped",
    description: "on Thu, 4 Sep, 2025",
    value: "SHIPPED",
  },
  {
    name: "Arriving",
    description: "by 7 sep - 9 sep",
    value: "ARRIVING",
  },
  {
    name: "Arrived",
    description: "on Thu, 9 sep, 2025",
    value: "DELIVERED",
  },
  // {
  //   name: "CANCELLED",
  //   description: "on Thu, 9 sep, 2025",
  //   value: "CANCELLED",
  // },
];

const cancelledSteps = [
  {
    name: "Order Placed",
    description: "on Thu, 2 Sep, 2025",
    value: "PLACED",
  },
  {
    name: "Order Cancelled",
    description: "on Thu, 2 sep, 2025",
    value: "CANCELLED",
  },
];

const currentStep = 2; // change this value based on the current step

const OrderStepper = ({ orderStatus }: any) => {
  const [statusStep, setStatusStep] = useState(steps);

  useEffect(() => {
    if (orderStatus === "CANCELLED") {
      setStatusStep(cancelledSteps);
    } else {
      setStatusStep(steps);
    }
  }, [orderStatus]);

  return (
    <Box className="mx-auto my-10">
      {statusStep.map((step: any, index: number) => (
        <>
          <div key={index} className={`flex px-4`}>
            <div className="flex flex-col items-center">
              <Box
                sx={{ zIndex: -1 }}
                className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${
                  index <= currentStep
                    ? "bg-gray-200 text-teal-500"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step.value === orderStatus ? (
                  <CheckCircle color="primary" />
                ) : (
                  <FiberManualRecord sx={{ zIndex: -1 }} />
                )}
              </Box>
              {index < statusStep.length - 1 && (
                <div
                  className={`border h-20 w-[2px] ${
                    index < currentStep
                      ? "bg-teal-500"
                      : "bg-gray-300 text-gray-600"
                  }`}
                ></div>
              )}
            </div>
            <div className={`ml-2 w-full`}>
              <div
                className={`${
                  step.value === orderStatus
                    ? "bg-primary p-2 text-white font-medium rounded-md -translate-y-3"
                    : ""
                } ${
                  orderStatus === "CANCELLED" && step.value === orderStatus
                    ? "bg-red-500"
                    : ""
                } w-full`}
              >
                <p className={``}>{step.name}</p>
                <p
                  className={`${
                    step.value === orderStatus
                      ? "text-gray-200"
                      : "text-gray-500"
                  } text-xs`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        </>
      ))}
    </Box>
  );
};

export default OrderStepper;
