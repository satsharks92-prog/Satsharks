export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  region?: "LOCAL" | "INTERNATIONAL";
  subscription?: "FREE" | "PAID";
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
}
