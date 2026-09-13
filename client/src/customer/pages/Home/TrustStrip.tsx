import React from "react";
import {
  LocalShippingOutlined,
  VerifiedUserOutlined,
  AssignmentReturnOutlined,
  SupportAgentOutlined,
} from "@mui/icons-material";

export const TrustStrip: React.FC = () => {
  const trustPoints = [
    {
      icon: <LocalShippingOutlined className="text-primary" sx={{ fontSize: 28 }} />,
      title: "Free Express Delivery",
      subtitle: "On qualifying orders across India",
    },
    {
      icon: <VerifiedUserOutlined className="text-primary" sx={{ fontSize: 28 }} />,
      title: "100% Genuine Products",
      subtitle: "Verified multi-vendor partners",
    },
    {
      icon: <AssignmentReturnOutlined className="text-primary" sx={{ fontSize: 28 }} />,
      title: "7-Day Easy Returns",
      subtitle: "Hassle-free replacement policy",
    },
    {
      icon: <SupportAgentOutlined className="text-primary" sx={{ fontSize: 28 }} />,
      title: "24/7 Dedicated Support",
      subtitle: "Resolution & order guidance",
    },
  ];

  return (
    <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 py-6 border-y border-border/70 bg-card/40 rounded-2xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
        {trustPoints.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {item.title}
              </h4>
              <p className="text-[11px] text-muted-foreground truncate">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustStrip;
