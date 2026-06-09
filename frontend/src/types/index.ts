export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  country: string;
  region: "LOCAL" | "INTERNATIONAL";
  subscription: "FREE" | "PAID";
  status: "ACTIVE" | "SUSPENDED";
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
}
