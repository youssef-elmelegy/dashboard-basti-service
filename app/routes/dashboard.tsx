// import AppAreaChart from "@/components/AppAreaChart";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import AppBarChart from "@/components/AppBarChart";
// import AppPieChart from "@/components/AppPieChart";
import CardList from "@/components/CardList";
import TodoList from "@/components/TodoList";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/settings">
            <Send className="h-4 w-4" />
            {t("notifications.tester.open")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        <AppBarChart />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <CardList title={t("dashboard.ourChefs")} />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        {/* <AppPieChart /> */}
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <TodoList />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        {/* <AppAreaChart /> */}
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <CardList title={t("dashboard.mostSelling")} />
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
