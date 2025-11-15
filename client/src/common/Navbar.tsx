import { Menu } from "@mui/icons-material";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ DrawerList }: any) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // true hoga jab screen "lg" se chhoti hogi
  const isMobile = useMediaQuery((theme: any) =>
    theme.breakpoints.down("lg")
  );

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <div className="h-[10vh] flex items-center px-5 border-b border-gray-300 justify-between">
      <div className="flex items-center gap-3">
        {isMobile && (
          <IconButton onClick={toggleDrawer(true)}>
            <Menu color="primary" />
          </IconButton>
        )}
        <h1
          onClick={() => navigate("/")}
          className="logo text-xl cursor-pointer"
        >
          Zosh Bazaar
        </h1>
      </div>

      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        <DrawerList toggleDrawer={toggleDrawer} />
      </Drawer>
    </div>
  );
};

export default Navbar;
