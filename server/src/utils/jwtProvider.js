import jwt from "jsonwebtoken";

class JwtProvider {
  createJwt(payload) {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) throw new Error("JWT_SECRET_KEY is not defined");
    return jwt.sign(payload, secret, { expiresIn: "7d" });
  }

  getEmailFromJwt(token) {
    try {
      const secret = process.env.JWT_SECRET_KEY;
      return jwt.verify(token, secret).email;
    } catch (error) {
      return null;
    }
  }

  verifyJwt(token) {
    try {
      const secret = process.env.JWT_SECRET_KEY;
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

export default new JwtProvider();

// constructor is not needed as we are using singleton pattern