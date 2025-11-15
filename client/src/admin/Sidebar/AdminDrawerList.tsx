import {
  AccountBoxSharp,
  Add,
  Category,
  Dashboard,
  ElectricBolt,
  Home,
  IntegrationInstructions,
  LocalOffer,
  Logout,
  Notifications,
  Palette,
  Security,
  Settings,
} from "@mui/icons-material";
import { Collapse, Divider, ListItemIcon, ListItemText } from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../Redux Toolkit/Store";

const menu = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: <Dashboard className="text-teal-700" />,
    activeIcon: <Dashboard className="text-white" />,
  },
  {
    name: "Coupons",
    path: "/admin/coupon",
    icon: <IntegrationInstructions className="text-teal-700" />,
    activeIcon: <IntegrationInstructions className="text-white" />,
  },
  {
    name: "Add New Coupon",
    path: "/admin/add-coupon",
    icon: <Add className="text-teal-700" />,
    activeIcon: <Add className="text-white" />,
  },
  {
    name: "Home Page",
    path: "/admin/home-grid",
    icon: <Home className="text-teal-700" />,
    activeIcon: <Home className="text-white" />,
  },
  {
    name: "Electronics Category",
    path: "/admin/electronics-category",
    icon: <ElectricBolt className="text-teal-700" />,
    activeIcon: <ElectricBolt className="text-white" />,
  },
  {
    name: "Shop By Category",
    path: "/admin/shop-by-category",
    icon: <Category className="text-teal-700" />,
    activeIcon: <Category className="text-white" />,
  },
  {
    name: "Deals",
    path: "/admin/deals",
    icon: <LocalOffer className="text-teal-700" />,
    activeIcon: <LocalOffer className="text-white" />,
  },
];

const settingsMenu = [
  {
    name: "Profile Settings",
    path: "/admin/settings/profile",
    icon: <AccountBoxSharp className="text-teal-700" />,
    activeIcon: <AccountBoxSharp className="text-white" />,
  },
  {
    name: "Theme",
    path: "/admin/settings/theme",
    icon: <Palette className="text-teal-700" />,
    activeIcon: <Palette className="text-white" />,
  },
  {
    name: "Notifications",
    path: "/admin/settings/notifications",
    icon: <Notifications className="text-teal-700" />,
    activeIcon: <Notifications className="text-white" />,
  },
  {
    name: "Security",
    path: "/admin/settings/security",
    icon: <Security className="text-teal-700" />,
    activeIcon: <Security className="text-white" />,
  },
];

const bottomMenu = [
  {
    name: "Logout",
    path: "/",
    icon: <Logout className="text-red-500" />,
    activeIcon: <Logout className="text-white" />,
    danger: true,
  },
];

interface DrawerListProps {
  toggleDrawer?: any;
}

const AdminDrawerList = ({ toggleDrawer }: DrawerListProps) => {
  const user = useAppSelector((store) => store.user);
  console.log(user);

  const location = useLocation();
  const navigate = useNavigate();
  const [openSettings, setOpenSettings] = useState(false);

  const handleLogout = () => {
    console.log("handle Logout");
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
        {/* ---------- MAIN MENU & SETTINGS ---------- */}
        <div className="space-y-2">
          <h3 className="px-5 pb-2 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            Main Menu
          </h3>
          {menu.map((item) => (
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

          {/* ---------- SETTINGS SECTION ---------- */}
          <h3 className="mt-6 px-5 pb-2 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            Tools & Settings
          </h3>
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
        </div>

        {/* ---------- BOTTOM MENU ---------- */}
        <div className="mt-6 space-y-2">
          <Divider />

          <p className="px-5 pb-2 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            Admin Panel
          </p>
          <h1 className="px-5 pb-2 text-blue-600 uppercase font-bold tracking-wider text-[13px]">
            {user.user?.fullName}
          </h1>

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

export default AdminDrawerList;
