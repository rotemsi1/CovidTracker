const mongoose = require("mongoose");

const CASES = "cases";
const DEATHS = "deaths";
const RECOVERIES = "recoveries";
const TESTS = "tests";

const Schema = mongoose.Schema;

const countrySchema = new Schema({
  name: { type: String, required: true },
  population: { type: Number, required: true },
  cases: [{ amount: Number, day: String }],
  deaths: [{ amount: Number, day: String }],
  recoveries: [{ amount: Number, day: String }],
  tests: [{ amount: Number, day: String }],
  adminUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
});

countrySchema.methods.getDataType = function (data) {
  if (data === CASES) return this.cases;
  if (data === DEATHS) return this.deaths;
  if (data === RECOVERIES) return this.recoveries;
  if (data === TESTS) return this.tests;
};

countrySchema.methods.calculateTotal = function (dataString) {
  const dataType = this.getDataType(dataString);
  return dataType.map((i) => i.amount).reduce((sum, current) => sum + current);
};

countrySchema.methods.calculatePer1Million = function (dataString) {
  return Math.trunc(this.population / this.calculateTotal(dataString));
};

countrySchema.methods.calculateActiveCases = function () {
  return (
    this.calculateTotal(CASES) -
    this.calculateTotal(DEATHS) -
    this.calculateTotal(RECOVERIES)
  );
};

countrySchema.methods.calculateMovingAverage = function (
  dataString,
  numberOfDays
) {
  const dataType = this.getDataType(dataString);
  const range =
    dataType.length >= numberOfDays
      ? dataType.slice(dataType.length - numberOfDays)
      : dataType;
  return Math.trunc(
    range.map((x) => x.amount).reduce((a, b) => a + b, 0) / range.length
  );
};

module.exports = mongoose.model("Country", countrySchema);
