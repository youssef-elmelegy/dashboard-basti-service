import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  // <html dir/lang> is kept in sync centrally in i18n/config.ts via the
  // "languageChanged" listener, so we only need to switch the language here.
  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  };

  // Create menu items on each render to ensure fresh translations
  const languageItems = [
    {
      label: t("common.english"),
      lang: "en",
    },
    {
      label: t("common.arabic"),
      lang: "ar",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-2">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languageItems.map((item) => (
          <DropdownMenuItem
            key={item.lang}
            onClick={() => toggleLanguage(item.lang)}
          >
            {item.label}
            {i18n.language === item.lang && <span className="ms-2">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
