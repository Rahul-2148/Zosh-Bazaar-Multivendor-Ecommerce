import { Card, Divider } from "@mui/material";
import TransactionTable from "../Transactions/TransactionTable";

const Payment = () => {
  return (
    <div className="">
      <div className="space-y-5">
        <Card className="p-5 rounded-md space-y-4">
          <h1 className="">Total Earnings</h1>
          <h1 className="font-bold text-xl pb-1">₹12495</h1>
          <Divider />
          <p className="pt-3">
            Last Payment: <strong>₹0</strong>
          </p>
        </Card>
        <TransactionTable />
      </div>
    </div>
  );
};

export default Payment;
