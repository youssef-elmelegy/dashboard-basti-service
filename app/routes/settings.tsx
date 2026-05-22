import { useTranslation } from "react-i18next";
import { NotificationTester } from "@/components/NotificationTester";

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("common.settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Coming soon...</p>
      </div>

      <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-base">
            {t("notifications.tester.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("notifications.tester.description")}
          </p>
        </div>
        <div>
          <NotificationTester />
        </div>
      </div>
    </div>
  );
};

export default Settings;
