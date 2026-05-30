const mongoose = require("mongoose");
const Route = require("../models/route-model");

class RouteRepository {
  async create(routeData) {
    return Route.create(routeData);
  }

  async findById(id) {
    return Route.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Route.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByOriginDestination(origin, destination) {
    return Route.find({
      origin: { $regex: new RegExp(`^${origin}$`, "i") },
      destination: { $regex: new RegExp(`^${destination}$`, "i") },
    }).select("_id");
  }

  async findByOrigin(origin) {
    return Route.find({
      origin: { $regex: new RegExp(`^${origin}$`, "i") },
    });
  }

  async findByDestination(destination) {
    return Route.find({
      destination: { $regex: new RegExp(`^${destination}$`, "i") },
    });
  }

  async findPointSuggestions(query = "") {
    const trimmedQuery = query.trim();
    const filter = trimmedQuery
      ? {
          $or: [
            { origin: { $regex: trimmedQuery, $options: "i" } },
            { destination: { $regex: trimmedQuery, $options: "i" } },
          ],
        }
      : {};

    const [origins, destinations] = await Promise.all([
      Route.distinct("origin", filter),
      Route.distinct("destination", filter),
    ]);

    const normalize = (value) => String(value || "").trim();
    const uniqueValues = Array.from(
      new Set([...origins, ...destinations].map(normalize).filter(Boolean))
    );

    return uniqueValues.sort((left, right) => left.localeCompare(right, "vi"));
  }

  async findDestinationsByOrigin(origin) {
    if (!origin || !String(origin).trim()) return [];

    return Route.distinct("destination", {
      origin: { $regex: new RegExp(`^${String(origin).trim()}$`, "i") },
    }).then((arr) => (Array.isArray(arr) ? arr.map((v) => String(v || "").trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")) : []));
  }

  async update(id, updateData) {
    return Route.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return Route.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Route.countDocuments(filter);
  }

  async save(route) {
    return route.save();
  }
}

module.exports = new RouteRepository();
