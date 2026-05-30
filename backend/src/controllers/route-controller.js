const routeRepository = require("../repository/route-repository");

const getPointSuggestions = async (req, res) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const points = await routeRepository.findPointSuggestions(query);

    return res.status(200).json({
      success: true,
      message: "Route points fetched successfully",
      data: points,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getDestinationsForOrigin = async (req, res) => {
  try {
    const origin = typeof req.query.origin === "string" ? req.query.origin.trim() : "";
    if (!origin) {
      return res.status(400).json({ success: false, message: "Missing origin parameter" });
    }

    const destinations = await routeRepository.findDestinationsByOrigin(origin);

    return res.status(200).json({ success: true, message: "Destinations fetched", data: destinations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

module.exports = {
  getPointSuggestions,
  getDestinationsForOrigin,
};
