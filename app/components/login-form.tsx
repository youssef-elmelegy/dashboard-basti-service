import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError(t("auth.login.fillAllFields"));
      return;
    }

    try {
      setLocalLoading(true);
      const response = await authApi.login({ email, password });
      console.log("Login response:", response);
      if (response.success && response.data) {
        console.log("Login successful, updating store and navigating to /");
        // Update Zustand store with admin data
        useAuthStore.setState({
          admin: response.data.admin,
          isAuthenticated: true,
        });
        navigate("/");
      } else {
        setLocalError(response.message || t("auth.login.loginFailed"));
      }
    } catch (err) {
      console.error("Login error:", err);
      const errMsg = err instanceof Error ? err.message : null;
      setLocalError(errMsg || t("auth.login.loginFailed"));
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("auth.login.title")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("auth.login.description")}
          </p>
        </div>

        {localError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {localError}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">{t("auth.login.emailLabel")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="mail@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={localLoading}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">
              {t("auth.login.passwordLabel")}
            </FieldLabel>
            <button
              type="button"
              onClick={() => navigate("/auth/forgot-password")}
              className="ml-auto text-sm underline-offset-4 hover:underline"
              disabled={localLoading}
            >
              {t("auth.login.forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={localLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              disabled={localLoading}
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
          <Button type="submit" disabled={localLoading}>
            {localLoading
              ? t("auth.login.loggingIn")
              : t("auth.login.loginButton")}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
