import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/useTheme";
import type { Theme } from "@/components/providers/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const { t, i18n } = useTranslation();

  useEffect(() => {}, [i18n.language]);

  // Create menu items on each render to ensure fresh translations
  const themeItems: { label: string; value: Theme }[] = [
    {
      label: t("common.lightMode"),
      value: "light",
    },
    {
      label: t("common.darkMode"),
      value: "dark",
    },
    {
      label: t("common.systemDefault"),
      value: "system",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title={t("common.theme")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {/* <span className="text-sm ml-4">{t("common.theme")}</span> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeItems.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => setTheme(item.value)}
          >
            {item.label}
            {theme === item.value && <span className="ml-2">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
