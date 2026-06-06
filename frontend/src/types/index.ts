export type Role = "LOCAL_FREE" | "LOCAL_PAID" | "INTL_FREE" | "INTL_PAID" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  role: Role;
}
