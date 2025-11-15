import UserService from "../service/user.service.js";

export const getUserProfileByJwt = async (req, res) => {
  try {
    const user = await req.user;
    return res.status(200).json({
      user,
      error: false,
      success: true,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

export const getUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await UserService.findUserByEmail(email);
    return res.status(200).json({
      user,
      error: false,
      success: true,
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const handleErrors = (err, res) => {
  if (err instanceof Error) {
    return res.status(404).json({ message: err.message });
  }
  return res
    .status(500)
    .json({ message: err.message || "Internal Server Error" });
};
