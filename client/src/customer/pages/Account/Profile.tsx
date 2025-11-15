import { useNavigate } from "react-router-dom";
import AccountRoutes from "../../components/AccountRoutes";
import { Divider } from "@mui/material";
import { performLogout } from "../../../Redux Toolkit/features/Auth/AuthSlice";
import { useAppDispatch } from "../../../Redux Toolkit/Store";

const menu = [
  {
    name: "profile",
    path: "/account",
  },
  {
    name: "orders",
    path: "/account/orders",
  },
  {
    name: "Saved Cards",
    path: "/account/saved-cards",
  },
  {
    name: "Addresses",
    path: "/account/addresses",
  },
  {
    name: "Logout",
    path: "/",
  },
];

const Profile = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  //   const location = useLocation();

  const handleClick = (item: any) => {
    if (item.name === "Logout") return handleLogout();
    navigate(item.path);
  };

  const handleLogout = () => {
    dispatch(performLogout());
    navigate("/");
  };

  return (
    <div className="px-5 lg:px-50 min-h-screen mt-10">
      <div>
        <h1 className="text-xl font-bold pb-5">Account</h1>
      </div>
      <Divider />
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:min-h-[70vh]">
        <div className="col-span-1 lg:border-r border-gray-200 lg:pr-5 py-5 h-full flex flex-row flex-wrap lg:flex-col gap-3">
          {menu.map((item, index) => (
            <div
              onClick={() => handleClick(item)}
              key={item.path}
              className="px-5 py-3 rounded-md hover:bg-teal-500 hover:text-white cursor-pointer"
            >
              <p>{item.name}</p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 lg:pl-5 py-5">
          <AccountRoutes />
          {/* <Order /> */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
