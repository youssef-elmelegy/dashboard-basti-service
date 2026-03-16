import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import logoSvg from "@/assets/logo.svg";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FloatingCake } from "@/components/FloatingCake";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, isLoading, error } = useAuth();
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const locationState = location.state as {
    email: string;
    resetToken: string;
  } | null;

  // Get resetToken from navigation state or localStorage as fallback
  const resetToken =
    locationState?.resetToken || localStorage.getItem("resetToken") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!newPassword || !confirmPassword) {
      setLocalError(t("auth.resetPassword.fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    if (newPassword.length < 8) {
      setLocalError(t("auth.resetPassword.passwordTooShort"));
      return;
    }

    if (!resetToken) {
      setLocalError(t("auth.resetPassword.sessionExpired"));
      // Redirect to forgot password page
      setTimeout(() => {
        navigate("/auth/forgot-password");
      }, 2000);
      return;
    }

    try {
      // Only send newPassword and resetToken to API (not confirmPassword)
      await resetPassword(resetToken, newPassword);
      // Clear resetToken after successful reset
      localStorage.removeItem("resetToken");
      navigate("/auth/login");
    } catch {
      setLocalError(error || t("auth.resetPassword.resetFailed"));
    }
  };

  const isFormValid =
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    newPassword.length >= 8;

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
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-2xl font-bold">
                    {t("auth.resetPassword.title")}
                  </h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    {t("auth.resetPassword.description")}
                  </p>
                </div>

                {(localError || error) && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {localError || error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="new-password">
                    {t("auth.resetPassword.passwordLabel")}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    {t("auth.resetPassword.confirmLabel")}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500 text-center">
                      {t("auth.resetPassword.passwordMismatch")}
                    </p>
                  )}
                {newPassword &&
                  newPassword.length > 0 &&
                  newPassword.length < 8 && (
                    <p className="text-sm text-amber-600 text-center">
                      {t("auth.resetPassword.passwordTooShort")}
                    </p>
                  )}
                <Field>
                  <Button type="submit" disabled={!isFormValid || isLoading}>
                    {isLoading
                      ? t("auth.resetPassword.resetting")
                      : t("auth.resetPassword.resetButton")}
                  </Button>
                </Field>
                <Field>
                  <button
                    type="button"
                    onClick={() => navigate("/auth/login")}
                    className="flex items-center justify-center gap-2 text-sm hover:underline w-full"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="size-4" />
                    {t("auth.forgotPassword.backToLogin")}
                  </button>
                </Field>
              </FieldGroup>
            </form>
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
