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
import { useTranslation } from "react-i18next";

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, forgotPassword, isLoading, error } = useAuth();
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const email = (location.state as { email: string } | null)?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (otp.length !== 6) {
      setLocalError(t("auth.otp.invalidCode"));
      return;
    }

    if (!email) {
      setLocalError(t("auth.otp.missingEmail"));
      return;
    }

    try {
      const resetToken = await verifyOtp(email, otp);
      // Store resetToken in localStorage as fallback
      localStorage.setItem("resetToken", resetToken);
      navigate("/auth/reset-password", { state: { email, resetToken } });
    } catch {
      setLocalError(error || t("auth.otp.verifyFailed"));
    }
  };

  const handleResend = async () => {
    setLocalError(null);
    setOtp("");

    if (!email) {
      setLocalError(t("auth.otp.resendEmailMissing"));
      return;
    }

    try {
      await forgotPassword(email);
    } catch {
      setLocalError(error || t("auth.otp.resendFailed"));
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
                      {t("auth.otp.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      {t("auth.otp.description")}
                    </p>
                  </div>

                  {(localError || error) && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                      {localError || error}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="otp" className="sr-only">
                      {t("auth.otp.codeLabel")}
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
                      {t("auth.otp.codeDescription")}
                    </FieldDescription>
                  </Field>
                  <Button
                    type="submit"
                    disabled={otp.length !== 6 || isLoading}
                  >
                    {isLoading
                      ? t("auth.otp.verifying")
                      : t("auth.otp.verifyButton")}
                  </Button>
                  <FieldDescription className="text-center">
                    {t("auth.otp.resendQuestion")}{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      className="underline hover:text-foreground disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {t("auth.otp.resendButton")}
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
