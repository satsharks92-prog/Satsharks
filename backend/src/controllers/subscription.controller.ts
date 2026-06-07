import { Request, Response } from "express";
import SubscriptionPlan from "../models/SubscriptionPlan";
import { env } from "../config/env";
import { phaseOneSubscriptionPlans } from "../data/phaseOne";

export const getPlans = async (req: Request, res: Response) => {
  try {
    if (!env.isDatabaseConfigured) {
      return res.status(200).json({ success: true, plans: phaseOneSubscriptionPlans });
    }

    const plans = await SubscriptionPlan.find();
    res.status(200).json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
