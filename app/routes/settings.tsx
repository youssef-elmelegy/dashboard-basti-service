import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { NotificationTester } from "@/components/NotificationTester";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("common.settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Coming soon...</p>
      </div>

      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-base">
              {t("notifications.tester.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("notifications.tester.description")}
            </p>
          </div>
        </div>
        <NotificationTester />
      </div>
    </div>
  );
};

export default Settings;
