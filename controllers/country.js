const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const { validationResult } = require("express-validator");

const errorHandler = require("../middleware/error-handling");

const Country = require("../models/country");

exports.getNewCases = async (request, response, next) => {
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    response.render("countries/new-cases", {
      pageTitle: "New Cases",
      path: "/countries/new-cases",
      countryData: country,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postAddNewCases = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the page with the errors
  if (!errors.isEmpty())
    return response.status(422).render("countries/cases", {
      path: "/countries/cases",
      countryData: null,
      errorMessage: errors.array()[0].msg,
    });
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    country.cases.push({
      amount: request.body.newCases,
      day: Date.now().toString(),
    });
    await country.save();
    response.render("countries/cases", {
      path: "/countries/cases",
      countryData: country,
      errorMessage: null,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getNewDeaths = async (request, response, next) => {
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    response.render("countries/new-deaths", {
      pageTitle: "New Deaths",
      path: "/countries/new-deaths",
      countryData: country,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postAddNewDeaths = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the page with the errors
  if (!errors.isEmpty())
    return response.status(422).render("countries/deaths", {
      path: "/countries/deaths",
      countryData: null,
      errorMessage: errors.array()[0].msg,
    });
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    country.deaths.push({
      amount: request.body.newDeaths,
      day: Date.now().toString(),
    });
    country.population -= request.body.newDeaths;
    await country.save();
    response.render("countries/deaths", {
      path: "/countries/deaths",
      countryData: country,
      errorMessage: null,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getNewRecoveries = async (request, response, next) => {
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    response.render("countries/new-recoveries", {
      pageTitle: "New Recoveries",
      path: "/countries/new-recoveries",
      countryData: country,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postAddNewRecoveries = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the page with the errors
  if (!errors.isEmpty())
    return response.status(422).render("countries/recoveries", {
      path: "/countries/recoveries",
      countryData: null,
      errorMessage: errors.array()[0].msg,
    });
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    country.recoveries.push({
      amount: request.body.newRecoveries,
      day: Date.now().toString(),
    });
    await country.save();
    response.render("countries/recoveries", {
      path: "/countries/recoveries",
      countryData: country,
      errorMessage: null,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getNewTests = async (request, response, next) => {
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    response.render("countries/new-tests", {
      pageTitle: "New Tests",
      path: "/countries/new-tests",
      countryData: country,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postAddNewTests = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the page with the errors
  if (!errors.isEmpty())
    return response.status(422).render("countries/tests", {
      path: "/countries/tests",
      countryData: null,
      errorMessage: errors.array()[0].msg,
    });
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    country.tests.push({
      amount: request.body.newTests,
      day: Date.now().toString(),
    });
    await country.save();
    response.render("countries/tests", {
      path: "/countries/tests",
      countryData: country,
      errorMessage: null,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getCasesDocument = async (request, response, next) => {
  try {
    const country = await Country.findOne({
      _id: request.user.countryOwnership,
    });
    // Create a PDF document of the new cases
    const invoiceName = "invoice-" + request.params.countryId + ".pdf";
    const invoicePath = path.join("data", "invoices", invoiceName);
    const pdfDocument = new PDFDocument();
    pdfDocument.pipe(fs.createWriteStream(invoicePath));
    pdfDocument.pipe(response);
    pdfDocument.text(country.name);
    pdfDocument.text("Population: " + country.population);
    pdfDocument.text("New cases today: " + country.cases.at(-1).amount);
    pdfDocument.text("Total cases: " + country.calculateTotal("cases"));
    pdfDocument.text(
      "Cases per 1 million: " + country.calculatePer1Million("cases")
    );
    pdfDocument.text("Active cases: " + country.calculateActiveCases());
    pdfDocument.end();
  } catch (error) {
    errorHandler(error, next);
  }
};
