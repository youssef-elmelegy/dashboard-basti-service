import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import logoSvg from "@/assets/logo.svg";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { FloatingCake } from "@/components/FloatingCake";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email) {
      setLocalError("Please enter your email address");
      return;
    }

    try {
      await forgotPassword(email);
      navigate("/auth/otp-verify", { state: { email } });
    } catch (err) {
      setLocalError(error || "Failed to send reset code. Please try again.");
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
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-2xl font-bold">Reset your password</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Enter your email address and we'll send you a code to reset
                    your password
                  </p>
                </div>

                {(localError || error) && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {localError || error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset code"}
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
                    Back to login
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
