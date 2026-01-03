import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

const mostSellingProducts = [
  {
    id: 1,
    title: "Chocolate Layer Cake",
    badge: "Cake",
    image: "https://loremflickr.com/600/400/cake",
    count: 4300,
  },
  {
    id: 2,
    title: "Strawberry Cheesecake",
    badge: "Cake",
    image: "https://loremflickr.com/600/400/cake,dessert",
    count: 3200,
  },
  {
    id: 3,
    title: "Vanilla Macarons",
    badge: "Sweet",
    image: "https://loremflickr.com/600/400/dessert",
    count: 2400,
  },
  {
    id: 4,
    title: "Red Velvet Cake",
    badge: "Cake",
    image: "https://loremflickr.com/600/400/cake",
    count: 1500,
  },
  {
    id: 5,
    title: "Chocolate Truffles",
    badge: "Sweet",
    image: "https://loremflickr.com/600/400/dessert",
    count: 1200,
  },
];

const chefsList = [
  {
    id: 1,
    title: "Chef John Doe",
    badge: "Pastry Chef",
    image:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Chef Jane Smith",
    badge: "Cake Designer",
    image:
      "https://images.pexels.com/photos/4969918/pexels-photo-4969918.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.9,
  },
  {
    id: 3,
    title: "Chef Michael Johnson",
    badge: "Head Chef",
    image:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
  },
  {
    id: 4,
    title: "Chef Lily Adams",
    badge: "Confectioner",
    image:
      "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.6,
  },
  {
    id: 5,
    title: "Chef Sam Brown",
    badge: "Pastry Chef",
    image:
      "https://images.pexels.com/photos/1680175/pexels-photo-1680175.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.9,
  },
  {
    id: 6,
    title: "Chef Emma Wilson",
    badge: "Cake Designer",
    image:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
  },
  {
    id: 7,
    title: "Chef David Lee",
    badge: "Head Chef",
    image:
      "https://images.pexels.com/photos/4969918/pexels-photo-4969918.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
  },
  {
    id: 8,
    title: "Chef Sophie Martin",
    badge: "Confectioner",
    image:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.9,
  },
];

const CardList = ({ title }: { title: string }) => {
  const { t } = useTranslation();

  interface CardItem {
    id: number;
    title: string;
    badge: string;
    image: string;
    count?: number;
    rating?: number;
  }

  const chefsBadgeTranslations: { [key: string]: string } = {
    "Pastry Chef": t("dashboard.pastryChef"),
    "Cake Designer": t("dashboard.cakeDesigner"),
    "Head Chef": t("dashboard.headChef"),
    Confectioner: t("dashboard.confectioner"),
  };

  const translatedChefsList = chefsList.map((chef) => ({
    ...chef,
    badge: chefsBadgeTranslations[chef.badge] || chef.badge,
  }));

  const list: CardItem[] =
    title === t("dashboard.mostSelling")
      ? mostSellingProducts
      : translatedChefsList;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <ScrollArea className="max-h-112 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-2">
          {list.map((item) => (
            <Card
              key={item.id}
              className="flex-row items-center justify-between gap-4 p-4"
            >
              <div className="w-12 h-12 rounded-sm relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <CardContent className="flex-1 p-0">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <Badge variant="secondary">{item.badge}</Badge>
              </CardContent>
              <CardFooter className="p-0">
                {title === t("dashboard.mostSelling")
                  ? `${item.count! / 1000}K`
                  : `${item.rating}⭐`}
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CardList;
