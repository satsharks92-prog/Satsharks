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
  _id?: string;
  id?: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  roleRequired: "LOCAL_FREE" | "LOCAL_PAID" | "INTL_FREE" | "INTL_PAID";
  highlight?: boolean;
}
