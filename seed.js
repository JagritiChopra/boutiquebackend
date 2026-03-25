import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import dns from "dns";
dns.setServers(["1.1.1.1"]); 

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const existing = await User.findOne({ email: "admin@boutique.com" });
  if (existing) {
    console.log("Admin already exists. Exiting.");
    process.exit(0);
  }

  await User.create({
    name: "Admin",
    email: "admin@chintpurni.boutique.com",
    password: "admin@123",
    role: "admin",
    phone: "0000000000",
  });

  console.log("✅ Admin created — email: admin@boutique.com  password: admin123");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
