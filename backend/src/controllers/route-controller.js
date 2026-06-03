const routeRepository = require("../repository/route-repository");

const normalizeRoute = (route) => {
  if (!route) return null;
  return route.toObject ? route.toObject() : route;
};

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

const listRoutes = async (req, res) => {
  try {
    const { skip = 0, limit = 100 } = req.query;
    const routes = await routeRepository.findAll({}, { skip: Number(skip), limit: Number(limit) });

    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully",
      data: Array.isArray(routes) ? routes.map(normalizeRoute) : [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const createRoute = async (req, res) => {
  try {
    const { origin, destination, travel_time } = req.body || {};
    if (!origin || !destination || !travel_time) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const route = await routeRepository.create({
      origin: String(origin).trim(),
      destination: String(destination).trim(),
      travel_time: Number(travel_time),
    });

    return res.status(201).json({ success: true, message: "Route created successfully", data: normalizeRoute(route) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const updateRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { origin, destination, travel_time } = req.body || {};
    const route = await routeRepository.update(routeId, {
      ...(origin !== undefined ? { origin: String(origin).trim() } : {}),
      ...(destination !== undefined ? { destination: String(destination).trim() } : {}),
      ...(travel_time !== undefined ? { travel_time: Number(travel_time) } : {}),
    });

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    return res.status(200).json({ success: true, message: "Route updated successfully", data: normalizeRoute(route) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await routeRepository.delete(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    return res.status(200).json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

module.exports = {
  getPointSuggestions,
  getDestinationsForOrigin,
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
};
