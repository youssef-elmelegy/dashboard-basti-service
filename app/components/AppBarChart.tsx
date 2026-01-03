import { useTranslation } from "react-i18next";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", custom: 186, premade: 120, sweets: 80 },
  { month: "February", custom: 305, premade: 250, sweets: 200 },
  { month: "March", custom: 237, premade: 180, sweets: 120 },
  { month: "April", custom: 173, premade: 150, sweets: 190 },
  { month: "May", custom: 209, premade: 170, sweets: 130 },
  { month: "June", custom: 214, premade: 190, sweets: 140 },
];

const AppBarChart = () => {
  const { t } = useTranslation();

  const chartConfig = {
    custom: {
      label: t("dashboard.custom"),
      color: "var(--chart-1)",
    },
    premade: {
      label: t("dashboard.premade"),
      color: "var(--chart-2)",
    },
    sweets: {
      label: t("dashboard.sweets"),
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">
        {t("dashboard.totalRevenue")}
      </h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="custom" fill="var(--color-custom)" radius={4} />
          <Bar dataKey="premade" fill="var(--color-premade)" radius={4} />
          <Bar dataKey="sweets" fill="var(--color-sweets)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default AppBarChart;
