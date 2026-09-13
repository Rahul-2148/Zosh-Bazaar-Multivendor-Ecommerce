import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, MapPin, Scan, Wallet, User, Play } from "lucide-react";
import { useActiveRoute } from "../../context/ActiveRouteContext";

export const BottomNavBar: React.FC = () => {
  const { activeStop, route } = useActiveRoute();
  const navigate = useNavigate();

  const handleQuickDeliver = () => {
    if (activeStop) {
      navigate(`/stop/${activeStop._id}`);
    } else {
      navigate("/route");
    }
  };

  const isRouteActive = route?.status === "ACTIVE";

  return (
    <nav className="block md:hidden shrink-0 z-40 fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 shadow-lg pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors text-[11px] font-semibold ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Home size={20} />
          <span>Today</span>
        </NavLink>

        <NavLink
          to="/route"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors text-[11px] font-semibold ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <MapPin size={20} />
          <span>Route</span>
        </NavLink>

        {/* Primary Center Action Button: Quick Action to Next Stop */}
        <button
          onClick={handleQuickDeliver}
          className={`-mt-5 w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-background transition-transform active:scale-95 ${
            isRouteActive
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-secondary text-secondary-foreground"
          }`}
          title={activeStop ? `Deliver Stop #${activeStop.stopIndex}` : "View Route"}
          aria-label={activeStop ? `Deliver Stop #${activeStop.stopIndex}` : "View Route"}
        >
          <Play size={20} className="fill-current ml-0.5" />
          <span className="text-[9px] font-extrabold uppercase mt-0.5">
            {activeStop ? `#${activeStop.stopIndex}` : "GO"}
          </span>
        </button>

        <NavLink
          to="/scanner"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors text-[11px] font-semibold ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Scan size={20} />
          <span>Scan</span>
        </NavLink>

        <NavLink
          to="/earnings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors text-[11px] font-semibold ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Wallet size={20} />
          <span>Earn</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors text-[11px] font-semibold ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <User size={20} />
          <span>Me</span>
        </NavLink>
      </div>
    </nav>
  );
};
