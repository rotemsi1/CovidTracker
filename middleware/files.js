module.exports = (request, file, callback) => {
  file.mimetype === "image/png" ||
  file.mimetype === "image/jpg" ||
  file.mimetype === "image/jpeg"
    ? callback(null, true)
    : callback(null, false);
};
