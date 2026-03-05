/**
 * Orders Data
 *
 * This is mock data for orders. Replace with API integration as needed.
 */

export type OrderType =
  | "basket_cakes"
  | "midume"
  | "small_cakes"
  | "large_cakes"
  | "custom";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderAddOn = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderItem = {
  id: string;
  orderId: string;
  addonId: string | null;
  sweetId: string | null;
  predesignedCakeId: string | null;
  featuredCakeId: string | null;
  customCake: string | null;
  quantity: number;
  size: string | null;
  flavor: string | null;
  price: number;
  selectedOptions: string | null;
  createdAt: string;
  updatedAt: string;
  data?: {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    [key: string]: unknown;
  };
};

export type Order = {
  id: string;
  referenceNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  type: OrderType;

  // Product details
  productName: string;
  productImage: string;

  // Cake specific
  size?: string;
  flavor?: string;
  textOnCake?: string;

  // Pricing
  basePrice: number;
  addOns?: OrderAddOn[];
  totalPrice: number;

  // Order items (from API)
  orderItems?: OrderItem[];
  addons?: OrderItem[];
  sweets?: OrderItem[];
  featuredCakes?: OrderItem[];
  predesignedCakes?: OrderItem[];
  customCakes?: OrderItem[];

  // Delivery
  deliveryLocation: string;
  region: string;
  deliverDay: string; // ISO date string
  deliveryLatitude?: number;
  deliveryLongitude?: number;

  // Order tracking
  orderedAt: string; // ISO date string
  status: OrderStatus;
  capacitySlots: number;

  // Bakery assignment
  assignedBakeryId?: string;
  assignedBakeryName?: string;
  assignedAt?: string; // ISO timestamp when assigned to bakery

  // Cancellation
  cancellationReason?: string;

  // Design File
  designFile?: string; // URL or file path to the design image

  // Quality Control (populated by bakery staff)
  qualityChecks?: Record<string, boolean>; // { addons: true, printing: false, ... }
  finalImage?: string; // Base64 or URL of final product photo
  finalImageUploadedAt?: string; // ISO timestamp when photo was taken

  // Additional notes
  specialRequests?: string;
  deliveryNote?: string;
  keepAnonymous?: boolean;

  // Card details (greeting card)
  cardMessage?: {
    to: string;
    from: string;
    message: string;
  };
  recipientData?: {
    name: string;
    email: string;
    phoneNumber: string;
  };
};

export const ORDERS_DATA: Order[] = [
  {
    id: "A7K2M9P1",
    customerName: "Sarah Ahmed",
    customerPhone: "+20 123 456 7890",
    customerEmail: "sarah.ahmed@example.com",
    type: "large_cakes",
    productName: "Chocolate Fudge Cake",
    productImage:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
    size: "Medium (8 inch)",
    flavor: "Chocolate",
    textOnCake: "Happy Birthday Sarah!",
    basePrice: 450,
    addOns: [
      { id: "addon2", name: "Helium Balloons", price: 15, quantity: 1 },
      { id: "addon3", name: "Scented Candles", price: 10, quantity: 2 },
    ],
    totalPrice: 485,
    deliveryLocation: "123 Tahrir Street, Downtown",
    region: "Cairo",
    deliverDay: "2025-12-25",
    orderedAt: "2025-12-20T10:30:00Z",
    status: "pending",
    capacitySlots: 2,
    designFile:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
    specialRequests: "Please add extra chocolate drizzle",
  },
  {
    id: "B5X8N3Q6",
    customerName: "Mohamed Hassan",
    customerPhone: "+20 100 111 2222",
    type: "midume",
    productName: "Birthday Macarons Box",
    productImage:
      "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&h=500&fit=crop",
    basePrice: 180,
    addOns: [{ id: "addon1", name: "Birthday Card", price: 5, quantity: 1 }],
    totalPrice: 185,
    deliveryLocation: "456 Corniche Road",
    region: "Alexandria",
    deliverDay: "2025-12-24",
    orderedAt: "2025-12-19T14:20:00Z",
    status: "pending",
    capacitySlots: 1,
  },
  {
    id: "C9R4L7W2",
    customerName: "Fatima Ibrahim",
    customerEmail: "fatima.i@example.com",
    type: "custom",
    productName: "Custom Wedding Cake",
    productImage:
      "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=500&h=500&fit=crop",
    size: "Large (12 inch, 3 tiers)",
    flavor: "Vanilla & Strawberry",
    textOnCake: "Ahmed & Fatima",
    basePrice: 1200,
    addOns: [
      { id: "addon2", name: "Helium Balloons", price: 15, quantity: 2 },
      { id: "addon3", name: "Scented Candles", price: 10, quantity: 5 },
      { id: "addon4", name: "Confetti Set", price: 8, quantity: 3 },
    ],
    totalPrice: 1294,
    deliveryLocation: "Al Ahram Hotel, Pyramids Street",
    region: "Giza",
    deliverDay: "2025-12-28",
    orderedAt: "2025-11-15T09:00:00Z",
    status: "pending",
    capacitySlots: 3,
    designFile:
      "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=500&h=500&fit=crop",
    specialRequests:
      "Wedding cake - needs to be perfect! Fresh flowers on top.",
  },
  {
    id: "D2K6F9H5",
    customerName: "Ali Mahmoud",
    customerPhone: "+20 122 333 4444",
    type: "large_cakes",
    productName: "Anniversary Cake",
    productImage:
      "https://images.unsplash.com/photo-1588195538326-c5b1e5b80c23?w=500&h=500&fit=crop",
    size: "Small (6 inch)",
    flavor: "Red Velvet",
    textOnCake: "Happy Anniversary",
    basePrice: 320,
    addOns: [{ id: "addon3", name: "Scented Candles", price: 10, quantity: 1 }],
    totalPrice: 330,
    deliveryLocation: "Nile Towers, Apartment 504",
    region: "Aswan",
    deliverDay: "2025-12-29",
    orderedAt: "2025-12-22T16:45:00Z",
    status: "pending",
    capacitySlots: 2,
  },
  {
    id: "E8P1V4T7",
    customerName: "Laila Samir",
    customerPhone: "+20 101 555 8888",
    type: "small_cakes",
    productName: "Lemon Drizzle Cake",
    productImage:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&fit=crop",
    size: "Medium (8 inch)",
    flavor: "Lemon",
    textOnCake: "Congrats!",
    basePrice: 400,
    addOns: [{ id: "addon2", name: "Helium Balloons", price: 15, quantity: 2 }],
    totalPrice: 430,
    deliveryLocation: "12 El-Maadi St, Cairo",
    region: "Cairo",
    deliverDay: "2025-12-30",
    orderedAt: "2025-12-25T11:00:00Z",
    status: "pending",
    capacitySlots: 2,
  },
  {
    id: "F3J7M2S8",
    customerName: "Omar Khaled",
    customerPhone: "+20 102 222 3333",
    type: "midume",
    productName: "Baklava Box",
    productImage:
      "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500&h=500&fit=crop",
    basePrice: 150,
    addOns: [
      { id: "addon1", name: "Birthday Card", price: 5, quantity: 1 },
      { id: "addon4", name: "Confetti Set", price: 8, quantity: 1 },
    ],
    totalPrice: 163,
    deliveryLocation: "23 El-Gomhoria St, Cairo",
    region: "Cairo",
    deliverDay: "2025-12-31",
    orderedAt: "2025-12-27T13:00:00Z",
    status: "pending",
    capacitySlots: 1,
  },
  {
    id: "G6Y9B1K3",
    customerName: "Nour El-Din",
    customerPhone: "+20 103 444 5555",
    type: "large_cakes",
    productName: "Carrot Cake",
    productImage:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=500&h=500&fit=crop",
    size: "Large (12 inch)",
    flavor: "Carrot",
    textOnCake: "Happy Graduation!",
    basePrice: 500,
    addOns: [{ id: "addon3", name: "Scented Candles", price: 10, quantity: 3 }],
    totalPrice: 530,
    deliveryLocation: "45 Sporting Club, Alexandria",
    region: "Alexandria",
    deliverDay: "2026-01-02",
    orderedAt: "2025-12-28T15:00:00Z",
    status: "pending",
    capacitySlots: 3,
  },
  {
    id: "H4Z2D8R5",
    customerName: "Hana Youssef",
    customerPhone: "+20 104 666 7777",
    type: "large_cakes",
    productName: "Holiday Cookies",
    productImage:
      "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500&h=500&fit=crop",
    basePrice: 120,
    addOns: [],
    totalPrice: 120,
    deliveryLocation: "78 Nile Corniche, Aswan",
    region: "Aswan",
    deliverDay: "2026-01-03",
    orderedAt: "2025-12-29T10:00:00Z",
    status: "pending",
    capacitySlots: 1,
  },
  {
    id: "J1W5C9L6",
    customerName: "Yasmin Fathy",
    customerPhone: "+20 105 888 9999",
    type: "custom",
    productName: "Custom Engagement Cake",
    productImage:
      "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500&h=500&fit=crop",
    size: "Large (14 inch, 2 tiers)",
    flavor: "Chocolate & Hazelnut",
    textOnCake: "Yasmin & Ahmed",
    basePrice: 950,
    addOns: [
      { id: "addon2", name: "Helium Balloons", price: 15, quantity: 3 },
      { id: "addon4", name: "Confetti Set", price: 8, quantity: 2 },
    ],
    totalPrice: 996,
    deliveryLocation: "12 El-Maadi St, Cairo",
    region: "Cairo",
    deliverDay: "2026-01-04",
    orderedAt: "2025-12-30T12:00:00Z",
    status: "pending",
    capacitySlots: 2,
    specialRequests: "Nut-free, please!",
  },
  {
    id: "K7X3N8M4",
    customerName: "Karim Adel",
    customerPhone: "+20 106 111 2222",
    type: "large_cakes",
    productName: "Red Velvet Cake",
    productImage:
      "https://images.unsplash.com/photo-1588195538326-c5b1e5b80c23?w=500&h=500&fit=crop",
    size: "Medium (8 inch)",
    flavor: "Red Velvet",
    textOnCake: "Congrats!",
    basePrice: 420,
    addOns: [{ id: "addon3", name: "Scented Candles", price: 10, quantity: 2 }],
    totalPrice: 440,
    deliveryLocation: "23 El-Gomhoria St, Giza",
    region: "Giza",
    deliverDay: "2026-01-05",
    orderedAt: "2025-12-31T14:00:00Z",
    status: "pending",
    capacitySlots: 2,
  },
  {
    id: "L9T6P2V8",
    customerName: "Mona Nabil",
    customerPhone: "+20 107 333 4444",
    type: "midume",
    productName: "Tiramisu Box",
    productImage:
      "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500&h=500&fit=crop",
    basePrice: 200,
    addOns: [{ id: "addon1", name: "Birthday Card", price: 5, quantity: 1 }],
    totalPrice: 205,
    deliveryLocation: "45 Sporting Club, Alexandria",
    region: "Alexandria",
    deliverDay: "2026-01-06",
    orderedAt: "2026-01-01T09:00:00Z",
    status: "pending",
    capacitySlots: 1,
  },
  {
    id: "M5Q1H7K9",
    customerName: "Iman Gamal",
    customerPhone: "+20 126 111 2222",
    type: "small_cakes",
    productName: "Mango Mousse Cake",
    productImage:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
    size: "Medium (8 inch)",
    flavor: "Mango",
    textOnCake: "Congrats!",
    basePrice: 440,
    addOns: [{ id: "addon1", name: "Birthday Card", price: 5, quantity: 1 }],
    totalPrice: 445,
    deliveryLocation: "23 El-Gomhoria St, Giza",
    region: "Giza",
    deliverDay: "2026-01-25",
    orderedAt: "2026-01-20T12:00:00Z",
    status: "pending",
    capacitySlots: 2,
  },
];
