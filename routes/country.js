const { body } = require("express-validator");

const countryController = require("../controllers/country");

const express = require("express");

const router = express.Router();

router.get("/new-cases", countryController.getNewCases);

router.post(
  "/cases",
  [body("newCases").isInt({ min: 1 })],
  countryController.postAddNewCases
);

router.get("/new-deaths", countryController.getNewDeaths);

router.post(
  "/deaths",
  [body("newDeaths").isInt({ min: 1 })],
  countryController.postAddNewDeaths
);

router.get("/new-recoveries", countryController.getNewRecoveries);

router.post(
  "/recoveries",
  [body("newRecoveries").isInt({ min: 1 })],
  countryController.postAddNewRecoveries
);

router.get("/new-tests", countryController.getNewTests);

router.post(
  "/tests",
  [body("newTests").isInt({ min: 1 })],
  countryController.postAddNewTests
);

router.get("/cases/:countryId", countryController.getCasesDocument);

module.exports = router;
