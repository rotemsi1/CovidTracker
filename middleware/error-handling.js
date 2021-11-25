module.exports = (error, next) => {
  const errorObject = new Error(error);
  errorObject.httpStatusCode = 500;
  return next(errorObject);
};
