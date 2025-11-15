import { useEffect, useState } from "react";
import SellerLogin from "./SellerLogin";
import SellerAccountForm from "./SellerAccountForm";
import { Button } from "@mui/material";
import become_seller from "../../../src/assets/become_seller.jpg";
import { useLocation, useNavigate } from "react-router-dom";

const BecomeSeller = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check query param se login/register decide
  const [isLogin, setIsLogin] = useState(
    new URLSearchParams(location.search).get("login") === "true"
  );

  // Jab bhi URL change ho, state update karo
  useEffect(() => {
    setIsLogin(new URLSearchParams(location.search).get("login") === "true");
  }, [location.search]);

  const handleToggle = () => {
    if (isLogin) {
      // Login page se Register page
      navigate("/become-seller");
    } else {
      // Register page se Login page
      navigate("/become-seller?login=true");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <section className="md:w-1/2 lg:w-1/3 p-5 pt-0 shadow-lg rounded-b-md">
        {/* Conditional form */}
        {isLogin ? <SellerLogin /> : <SellerAccountForm />}

        <div className="mt-10 space-y-2">
          <h1 className="text-center text-sm font-medium">
            Already have an account?
          </h1>

          <Button
            onClick={handleToggle}
            sx={{ py: "12px" }}
            variant="outlined"
            fullWidth
          >
            {isLogin ? "Register" : "Login"}
          </Button>
        </div>
      </section>

      {/* Right side illustration */}
      <section className="hidden md:block md:w-1/2 lg:w-2/3">
        <div className="p-5 pt-0">
          <h1 className="text-3xl font-bold text-center pt-3">
            Join the Marketplace Revolution
          </h1>
          <p className="text-lg text-teal-500 text-center">
            Boost Your Sales Today
          </p>
          <img
            className="w-full object-cover h-96"
            src={become_seller}
            alt="Become a Seller"
          />
        </div>
      </section>
    </div>
  );
};

export default BecomeSeller;
