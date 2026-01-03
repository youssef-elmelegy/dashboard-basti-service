import { create } from "zustand";
import type { AddOn } from "@/data/products";

interface AddOnStore {
  addOns: AddOn[];
  addAddOn: (addOn: AddOn) => void;
  updateAddOn: (id: string, addOn: Omit<AddOn, "id">) => void;
  deleteAddOn: (id: string) => void;
  toggleAddOnActive: (id: string) => void;
}

export const useAddOnStore = create<AddOnStore>((set) => ({
  addOns: [
    {
      id: "sweet1",
      name: "Chocolate Truffles",
      description: "Rich, creamy chocolate truffles with various flavors",
      images: [
        "https://images.unsplash.com/photo-1624353365960-3da42522f891?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1599599810694-2fa3a60c7f49?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1571877227200-a0fb556c2a11?w=500&h=500&fit=crop",
      ],
      category: "sweets",
      price: 25,
      tags: ["birthday", "custom"],
      isActive: true,
    },
    {
      id: "sweet2",
      name: "Macarons Set",
      description: "Delicate French macarons in assorted colors and flavors",
      images: [
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1587080190519-41793a63f3cb?w=500&h=500&fit=crop",
      ],
      category: "sweets",
      price: 35,
      tags: ["wedding", "anniversary"],
      isActive: true,
    },
    {
      id: "addon1",
      name: "Birthday Card",
      description: "Beautiful custom birthday greeting card",
      images: [
        "https://imgs.search.brave.com/bbgBcVcY31G6tKq5FJzOdT7LWuKlSXA6KIxqyveu-JM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cGFwZXJzb3VyY2Uu/Y29tL2Nkbi9zaG9w/L2ZpbGVzLzYyMjkw/ODAxNy5qcGc_dj0x/NzUzMzkxNzU2Jndp/ZHRoPTk5Ng",
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&h=500&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.3",
      ],
      category: "card",
      price: 5,
      tags: ["birthday", "greeting"],
      isActive: true,
    },
    {
      id: "addon2",
      name: "Helium Balloons",
      description: "Colorful helium balloons bundle (12 pack)",
      images: [
        "https://imgs.search.brave.com/G857IE5Qf94BmG1140eECgSNWpfXQJvjwYDTBm1tLi4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE1/MDQxOTY2MDY2NzIt/YWVmNWM5Y2VmYzky/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZpeGxp/Yj1yYi00LjEuMCZp/eGlkPU0zd3hNakEz/ZkRCOE1IeHlaV0Z5/WTJoOE9IeDhZbUZz/Ykc5dmJuTjhaVzU4/TUh4OE1IeDhmREE9",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&h=500&fit=crop&crop=focalpoint&fp-x=0.4&fp-y=0.5",
      ],
      category: "balloon",
      price: 15,
      tags: ["birthday", "decoration"],
      isActive: true,
    },
    {
      id: "addon3",
      name: "Scented Candles",
      description: "Premium scented candles for cake decoration",
      images: [
        "https://imgs.search.brave.com/MSHbWiK77YQSnv8fnG2eGWfo6SG0qLf_PvNZD5PXTPU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTU3/MTgyNDU5L3Bob3Rv/L2JpcnRoZGF5LWNh/a2UuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPUsyMTdkLWlk/QWdVa2ZKeFd2d2p0/X0h1OWI4U0l5QVNP/OGVHcTN6a1FQRlE9",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.4",
      ],
      category: "candle",
      price: 10,
      tags: ["decoration", "premium"],
      isActive: true,
    },
    {
      id: "addon4",
      name: "Confetti Set",
      description: "Colorful confetti for cake topping and decoration",
      images: [
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.3",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&h=500&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.7",
      ],
      category: "decoration",
      price: 8,
      tags: ["birthday", "decoration"],
      isActive: true,
    },
  ],

  addAddOn: (addOn) =>
    set((state) => ({
      addOns: [...state.addOns, addOn],
    })),

  updateAddOn: (id, updatedAddOn) =>
    set((state) => ({
      addOns: state.addOns.map((addOn) =>
        addOn.id === id ? { ...addOn, ...updatedAddOn, id } : addOn
      ),
    })),

  deleteAddOn: (id) =>
    set((state) => ({
      addOns: state.addOns.filter((addOn) => addOn.id !== id),
    })),

  toggleAddOnActive: (id) =>
    set((state) => ({
      addOns: state.addOns.map((addOn) =>
        addOn.id === id ? { ...addOn, isActive: !addOn.isActive } : addOn
      ),
    })),
}));
