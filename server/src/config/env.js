import dns from "node:dns";
import dotenv from "dotenv";

// Optimize DNS resolution order on Windows to eliminate IPv6 lookup latency with MongoDB Atlas & cloud APIs
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Load environment variables before any other module executes
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile, quiet: true });
dotenv.config({ quiet: true });
