import {
  AccountBalanceWallet,
  AccountBox,
  Add,
  Home,
  Inventory,
  Logout,
  Receipt,
  ShoppingBag,
  Settings,
  Assessment,
  TrendingUp,
  Store,
  Notifications,
  Security,
  Palette,
} from "@mui/icons-material";
import { Divider, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import { performSellerLogout } from "../../Redux Toolkit/features/seller/SellerAuthenticationSlice";

const mainMenu = [
  {
    name: "Dashboard",
    path: "/seller",
    icon: <Home className="text-teal-700" />,
    activeIcon: <Home className="text-white" />,
  },
  {
    name: "Orders",
    path: "/seller/orders",
    icon: <ShoppingBag className="text-teal-700" />,
    activeIcon: <ShoppingBag className="text-white" />,
  },
  {
    name: "Products",
    path: "/seller/products",
    icon: <Inventory className="text-teal-700" />,
    activeIcon: <Inventory className="text-white" />,
  },
  {
    name: "Add Product",
    path: "/seller/add-product",
    icon: <Add className="text-teal-700" />,
    activeIcon: <Add className="text-white" />,
  },
  {
    name: "Payment",
    path: "/seller/payment",
    icon: <AccountBalanceWallet className="text-teal-700" />,
    activeIcon: <AccountBalanceWallet className="text-white" />,
  },
  {
    name: "Transactions",
    path: "/seller/transactions",
    icon: <Receipt className="text-teal-700" />,
    activeIcon: <Receipt className="text-white" />,
  },
  {
    name: "Account",
    path: "/seller/account",
    icon: <AccountBox className="text-teal-700" />,
    activeIcon: <AccountBox className="text-white" />,
  }
];

const reportsMenu = [
  {
    name: "Sales Report",
    path: "/seller/reports/sales",
    icon: <Assessment className="text-teal-700" />,
    activeIcon: <Assessment className="text-white" />,
  },
  {
    name: "Product Analytics",
    path: "/seller/reports/products",
    icon: <TrendingUp className="text-teal-700" />,
    activeIcon: <TrendingUp className="text-white" />,
  },
  {
    name: "Revenue Trends",
    path: "/seller/reports/revenue",
    icon: <Receipt className="text-teal-700" />,
    activeIcon: <Receipt className="text-white" />,
  },
];

const settingsMenu = [
  {
    name: "Profile Settings",
    path: "/seller/settings/profile",
    icon: <AccountBox className="text-teal-700" />,
    activeIcon: <AccountBox className="text-white" />,
  },
  {
    name: "Store Settings",
    path: "/seller/settings/store",
    icon: <Store className="text-teal-700" />,
    activeIcon: <Store className="text-white" />,
  },
  {
    name: "Notifications",
    path: "/seller/settings/notifications",
    icon: <Notifications className="text-teal-700" />,
    activeIcon: <Notifications className="text-white" />,
  },
  {
    name: "Security",
    path: "/seller/settings/security",
    icon: <Security className="text-teal-700" />,
    activeIcon: <Security className="text-white" />,
  },
];

const bottomMenu = [
  {
    name: "Logout",
    path: "/become-seller?login=true",
    icon: <Logout className="text-red-500" />,
    activeIcon: <Logout className="text-white" />,
    danger: true,
  },
];

interface DrawerListProps {
  toggleDrawer?: any;
}

const SellerDrawerList = ({ toggleDrawer }: DrawerListProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [openReports, setOpenReports] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const handleLogout = () => {
    dispatch(performSellerLogout());
    navigate("/become-seller?login=true");
  };

  const handleClick = (item: any) => () => {
    if (item.name === "Logout") {
      handleLogout();
    }
    navigate(item.path);
    if (toggleDrawer) toggleDrawer(false);
  };

  return (
    <div className="h-full">
      <div className="flex flex-col justify-between h-full w-[300px] border-r border-gray-200 py-5">
        {/* ---------- MAIN MENU ---------- */}
        <div className="space-y-2">
          <h3 className="px-5 pb-2 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            Main Menu
          </h3>
          {mainMenu.map((item) => (
            <div
              onClick={handleClick(item)}
              key={item.path}
              className="pr-9 cursor-pointer"
            >
              <span
                className={`${
                  location.pathname === item.path
                    ? "bg-teal-600 text-white"
                    : "hover:bg-teal-50"
                } flex items-center px-5 py-3 rounded-r-full transition-colors`}
              >
                <ListItemIcon>
                  {location.pathname === item.path
                    ? item.activeIcon
                    : item.icon}
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </span>
            </div>
          ))}
        </div>

        {/* ---------- TOOLS & SETTINGS ---------- */}
        <div className="space-y-2 mt-6">
          <h3 className="px-5 pb-2 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            Tools & Settings
          </h3>

          {/* Reports Accordion */}
          <div
            onClick={() => setOpenReports(!openReports)}
            className="pr-9 cursor-pointer"
          >
            <span
              className={`${
                openReports ? "bg-teal-600 text-white" : "hover:bg-teal-50"
              } flex items-center px-5 py-3 rounded-r-full transition-colors`}
            >
              <ListItemIcon>
                <Assessment
                  className={openReports ? "text-white" : "text-teal-700"}
                />
              </ListItemIcon>
              <ListItemText primary="Reports & Analytics" />
            </span>
          </div>
          <Collapse in={openReports} timeout="auto" unmountOnExit>
            <div className="ml-8 mt-2 space-y-1">
              {reportsMenu.map((item) => (
                <div
                  onClick={handleClick(item)}
                  key={item.path}
                  className="pr-9 cursor-pointer"
                >
                  <span
                    className={`${
                      location.pathname === item.path
                        ? "bg-teal-500 text-white"
                        : "hover:bg-teal-50"
                    } flex items-center px-5 py-2 rounded-r-full transition-colors`}
                  >
                    <ListItemIcon>
                      {location.pathname === item.path
                        ? item.activeIcon
                        : item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.name} />
                  </span>
                </div>
              ))}
            </div>
          </Collapse>

          {/* Settings Accordion */}
          <div
            onClick={() => setOpenSettings(!openSettings)}
            className="pr-9 cursor-pointer"
          >
            <span
              className={`${
                openSettings ? "bg-teal-600 text-white" : "hover:bg-teal-50"
              } flex items-center px-5 py-3 rounded-r-full transition-colors`}
            >
              <ListItemIcon>
                <Settings
                  className={openSettings ? "text-white" : "text-teal-700"}
                />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </span>
          </div>
          <Collapse in={openSettings} timeout="auto" unmountOnExit>
            <div className="ml-8 mt-2 space-y-1">
              {settingsMenu.map((item) => (
                <div
                  onClick={handleClick(item)}
                  key={item.path}
                  className="pr-9 cursor-pointer"
                >
                  <span
                    className={`${
                      location.pathname === item.path
                        ? "bg-teal-500 text-white"
                        : "hover:bg-teal-50"
                    } flex items-center px-5 py-2 rounded-r-full transition-colors`}
                  >
                    <ListItemIcon>
                      {location.pathname === item.path
                        ? item.activeIcon
                        : item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.name} />
                  </span>
                </div>
              ))}
            </div>
          </Collapse>

          {/* Themes (Normal Item) */}
          <div
            onClick={handleClick({ name: "Themes", path: "/seller/themes" })}
            className="pr-9 cursor-pointer"
          >
            <span
              className={`${
                location.pathname === "/seller/themes"
                  ? "bg-teal-600 text-white"
                  : "hover:bg-teal-50"
              } flex items-center px-5 py-3 rounded-r-full transition-colors`}
            >
              <ListItemIcon>
                {location.pathname === "/seller/themes" ? (
                  <Palette className="text-white" />
                ) : (
                  <Palette className="text-teal-700" />
                )}
              </ListItemIcon>
              <ListItemText primary="Themes" />
            </span>
          </div>
        </div>

        {/* ---------- BOTTOM MENU ---------- */}
        <div className="mt-6 space-y-2">
          <Divider />
          {bottomMenu.map((item) => (
            <div
              onClick={handleClick(item)}
              key={item.path}
              className="pr-9 cursor-pointer"
            >
              <span
                className={`${
                  location.pathname === item.path
                    ? "bg-red-600 text-white"
                    : "hover:bg-red-50 text-red-600"
                } flex items-center px-5 py-3 rounded-r-full transition-colors`}
              >
                <ListItemIcon>
                  {location.pathname === item.path
                    ? item.activeIcon
                    : item.icon}
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerDrawerList;
