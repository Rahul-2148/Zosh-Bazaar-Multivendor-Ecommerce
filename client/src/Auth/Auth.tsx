import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { Button, Snackbar } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import { clearMessage } from "../Redux Toolkit/features/Auth/AuthSlice";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const { auth } = useAppSelector((store) => store);

  const dispatch = useAppDispatch();

  const handleCloseSnackbar = () => {
    dispatch(clearMessage()); // message reset कर देंगे ताकि snackbar दुबारा ना खुले
  };

  return (
    <div className="flex justify-center min-h-screen items-center">
      <div
        className={`max-w-md rounded-md shadow-lg flex flex-col ${
          isLogin ? "h-[85vh]" : "min-h-[95vh]"
        }`}
      >
        {/* Banner Image */}
        <img
          className="w-full rounded-t-md object-cover h-40"
          src="https://zosh-bazzar.vercel.app/login_banner.png"
          alt=""
        />

        {/* Form Content */}
        <div className="flex-1 mt-8 px-10">
          {isLogin ? <LoginForm /> : <SignupForm />}

          {/* Footer */}
          <div className="flex items-center justify-center mt-5 gap-1">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button onClick={() => setIsLogin(!isLogin)} variant="text">
              {isLogin ? "Signup" : "Login"}
            </Button>
          </div>
        </div>
      </div>

      <Snackbar
        open={Boolean(auth.message)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={auth.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
};

export default Auth;
