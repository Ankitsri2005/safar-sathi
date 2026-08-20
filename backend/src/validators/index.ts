import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";

export const registerValidator = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("id_type").isIn(["aadhaar", "passport", "other"]).withMessage("Invalid ID type"),
  body("id_number").notEmpty().withMessage("ID number is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("emergency_contact_name").notEmpty().withMessage("Emergency contact name is required"),
  body("emergency_contact_phone").notEmpty().withMessage("Emergency contact phone is required"),
  body("trip_start").isISO8601().withMessage("Trip start date required"),
  body("trip_end").isISO8601().withMessage("Trip end date required"),
  body("itinerary").isArray().withMessage("Itinerary must be an array"),
  validate,
];

export const loginValidator = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

export const createAlertValidator = [
  body("tourist_id").isUUID().withMessage("Valid tourist ID required"),
  body("alert_type").isIn(["panic", "restricted_zone_entry", "high_risk_zone_entry", "no_location_update", "route_deviation", "prolonged_stop", "manual"]).withMessage("Invalid alert type"),
  body("location_lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
  body("location_lng").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
  validate,
];

export const createZoneValidator = [
  body("name").notEmpty().withMessage("Zone name is required"),
  body("risk_level").isIn(["low", "medium", "high", "restricted"]).withMessage("Invalid risk level"),
  body("polygon_geojson").notEmpty().withMessage("Polygon GeoJSON is required"),
  validate,
];

export const createUserValidator = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("role").isIn(["police", "tourism_dept", "admin"]).withMessage("Invalid role"),
  body("jurisdiction").notEmpty().withMessage("Jurisdiction is required"),
  validate,
];
