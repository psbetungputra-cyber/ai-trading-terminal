module.exports = function health(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    service: "AiSignalFx PRO API",
    time: new Date().toISOString()
  });
};
