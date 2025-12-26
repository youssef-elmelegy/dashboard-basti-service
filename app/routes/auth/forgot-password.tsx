import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import logoSvg from "@/assets/logo.svg";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { FloatingCake } from "@/components/FloatingCake";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic here
    if (email) {
      // Send OTP to email and redirect to verification page
      navigate("/auth/otp-verify");
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
                    Enter your email address and we'll send you a link to reset
                    your password
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field>
                  <Button type="submit">Send reset link</Button>
                </Field>
                <Field>
                  <button
                    type="button"
                    onClick={() => navigate("/auth/login")}
                    className="flex items-center justify-center gap-2 text-sm hover:underline w-full"
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
