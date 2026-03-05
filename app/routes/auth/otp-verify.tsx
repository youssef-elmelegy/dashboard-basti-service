import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import logoSvg from "@/assets/logo.svg";
import { FloatingCake } from "@/components/FloatingCake";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, forgotPassword, isLoading, error } = useAuth();
  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const email = (location.state as { email: string } | null)?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (otp.length !== 6) {
      setLocalError("Please enter a valid 6-digit code");
      return;
    }

    if (!email) {
      setLocalError("Email is missing. Please try again.");
      return;
    }

    try {
      const resetToken = await verifyOtp(email, otp);
      // Store resetToken in localStorage as fallback
      localStorage.setItem("resetToken", resetToken);
      navigate("/auth/reset-password", { state: { email, resetToken } });
    } catch (err) {
      setLocalError(error || "Failed to verify code. Please try again.");
    }
  };

  const handleResend = async () => {
    setLocalError(null);
    setOtp("");

    if (!email) {
      setLocalError("Email is missing. Please go back and try again.");
      return;
    }

    try {
      await forgotPassword(email);
    } catch (err) {
      setLocalError(error || "Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <div className="flex justify-center gap-2 md:justify-start">
            <div className="flex items-center gap-2 font-medium">
              <img src={logoSvg} alt="logo" width={24} height={24} />
              <span>Basti</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className={cn("flex flex-col gap-6")}>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">
                      Enter verification code
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      We sent a 6-digit code to your email.
                    </p>
                  </div>

                  {(localError || error) && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                      {localError || error}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="otp" className="sr-only">
                      Verification code
                    </FieldLabel>
                    <InputOTP
                      maxLength={6}
                      id="otp"
                      required
                      value={otp}
                      onChange={setOtp}
                      disabled={isLoading}
                    >
                      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldDescription className="text-center">
                      Enter the 6-digit code sent to your email.
                    </FieldDescription>
                  </Field>
                  <Button
                    type="submit"
                    disabled={otp.length !== 6 || isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                  <FieldDescription className="text-center">
                    Didn&apos;t receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      className="underline hover:text-foreground disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Resend
                    </button>
                  </FieldDescription>
                </FieldGroup>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-muted relative hidden lg:flex items-center justify-center p-6"
        style={{ backgroundColor: "oklch(87.79% 0.23094 129.081)" }}
      >
        <FloatingCake rotation={5} shadowWidth={390} shadowHeight={70} />
      </div>
    </div>
  );
}
