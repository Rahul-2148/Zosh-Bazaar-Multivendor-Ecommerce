import { User } from "../models/user.model.js";
import JwtProvider from "../utils/jwtProvider.js";

class UserService {
  async findUserProfileByJwt(jwt) {
    const email = JwtProvider.getEmailFromJwt(jwt);

    const user = await User.findOne({ email }).populate("addresses");
    if (!user) {
      throw new Error(`User does not exist with email ${email}`);
    }
    return user;
  }

  async findUserByEmail(email) {
    const user = await User.findOne({ email }).populate("addresses");
    if (!user) {
      throw new Error(`User does not exist with email ${email}`);
    }
    return user;
  }
}

export default new UserService();
