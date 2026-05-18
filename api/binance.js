const { handler } = require("../lib/binanceProxy");

module.exports = async function binanceRoot(req, res) {
  return handler(req, res);
};
