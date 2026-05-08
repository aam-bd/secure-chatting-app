import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

const VerifyLoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { verifyLoginOtp, resendOtp, isVerifyingOtp } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    const user = await verifyLoginOtp({ email, otp });
    if (user) {
      navigate("/");
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    await resendOtp(email);
    setIsResending(false);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Two-factor Authentication</h1>
              <p className="text-base-content/60">Enter the OTP sent to {email || "your email"} to complete login.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">One-time password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingOtp}>
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
            <Link to="/login" className="link link-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Secure sign in"
        subtitle="Enter your one-time code to finish signing in securely." 
      />
    </div>
  );
};

export default VerifyLoginPage;
