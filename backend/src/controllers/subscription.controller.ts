import { Request, Response } from "express";
import SubscriptionPlan from "../models/SubscriptionPlan";

export const getPlans = async (req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      // Return mock plans
      const mockPlans = [
        {
          name: "Local Free",
          price: "$0",
          period: "forever",
          description: "Basic access for local students",
          features: ["Access to free diagnostic test", "Basic study resources", "Community forum access", "1 college prep webinar/month"],
          roleRequired: "LOCAL_FREE"
        },
        {
          name: "Local Paid",
          price: "$199",
          period: "per month",
          description: "Premium prep for local students",
          features: ["Everything in Local Free", "Full proprietary curriculum", "4 expert mentoring sessions/month", "Unlimited essay reviews", "Personalized study plan"],
          roleRequired: "LOCAL_PAID"
        },
        {
          name: "International Free",
          price: "$0",
          period: "forever",
          description: "Basic access for international students",
          features: ["Access to free diagnostic test", "Basic study resources", "International admissions guide", "Visa basics webinar"],
          roleRequired: "INTL_FREE"
        },
        {
          name: "International Paid",
          price: "$299",
          period: "per month",
          description: "Complete international prep",
          features: ["Everything in International Free", "Full proprietary curriculum", "4 expert mentoring sessions/month", "Unlimited essay reviews", "Comprehensive visa & admissions counseling"],
          roleRequired: "INTL_PAID"
        },
      ];
      return res.status(200).json({ success: true, plans: mockPlans });
    }

    const plans = await SubscriptionPlan.find();
    res.status(200).json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
