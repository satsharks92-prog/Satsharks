import { body } from "express-validator";

export const registerValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
  body("region").isIn(["LOCAL", "INTERNATIONAL"]).withMessage("Valid region is required"),
  body("subscription").isIn(["FREE", "PAID"]).withMessage("Valid subscription tier is required"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const resetPasswordValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
];
