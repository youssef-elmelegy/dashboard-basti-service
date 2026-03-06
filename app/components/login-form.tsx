import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError(t("auth.login.fillAllFields"));
      return;
    }

    try {
      await login({ email, password });
      navigate("/");
    } catch {
      setLocalError(error || t("auth.login.loginFailed"));
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

        {(localError || error) && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">{t("auth.login.emailLabel")}</FieldLabel>
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">
              {t("auth.login.passwordLabel")}
            </FieldLabel>
            <button
              type="button"
              onClick={() => navigate("/auth/forgot-password")}
              className="ml-auto text-sm underline-offset-4 hover:underline"
              disabled={isLoading}
            >
              {t("auth.login.forgotPassword")}
            </button>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("auth.login.loggingIn")
              : t("auth.login.loginButton")}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
