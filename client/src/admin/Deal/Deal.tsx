import { useState } from "react";
import DealTable from "./DealTable";
import DealCategoryTable from "./DealCategoryTable";
import CreateDealForm from "./CreateDealForm";
import { Button } from "@mui/material";

const tabs = ["Deals", "Categories", "Create Deal"];

const Deal = () => {
  const [activeTab, setActiveTab] = useState("Deals");

  return (
    <div className="">
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? "contained" : "outlined"}
          >
            {tab}
          </Button>
        ))}
      </div>
      <div className="mt-5">
        {activeTab === "Deals" ? (
          <DealTable />
        ) : activeTab === "Categories" ? (
          <DealCategoryTable />
        ) : (
          <div className="mt-5 border-t border-gray-300 flex flex-col justify-center items-center h-[70vh]">
            <CreateDealForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default Deal;
