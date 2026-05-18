const { handler } = require("../../../lib/binanceProxy");

module.exports = async function binanceTickerPrice(req, res) {
  return handler(req, res, "ticker/price");
};
