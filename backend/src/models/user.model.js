import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    encryptedEmail: {
      type: String,
      required: true,
      unique: true,
    },
    encryptedFullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    profilePic: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    eccPublicKey: {
      type: String,
      default: "",
    },
    eccPrivateKey: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
