const { handler } = require("../../lib/binanceProxy");

module.exports = async function binanceKlines(req, res) {
  return handler(req, res, "klines");
};
