import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  verifyLogin,
  verifySignup,
  resendOtp,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup", verifySignup);
router.post("/login", login);
router.post("/verify-login", verifyLogin);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
