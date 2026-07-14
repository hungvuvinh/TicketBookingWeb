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
    const trimmedOrigin = String(origin || "").trim();
    const trimmedDestination = String(destination || "").trim();
    if (!trimmedOrigin || !trimmedDestination) {
      return [];
    }

    return Route.find({
      $or: [
        {
          origin: { $regex: new RegExp(`^${trimmedOrigin}$`, "i") },
          destination: { $regex: new RegExp(`^${trimmedDestination}$`, "i") },
        },
        {
          origin: { $regex: new RegExp(`^${trimmedDestination}$`, "i") },
          destination: { $regex: new RegExp(`^${trimmedOrigin}$`, "i") },
        },
      ],
    }).select("_id");
  }

  async findByOrigin(origin) {
    return Route.find({
      $or: [
        {
          origin: { $regex: new RegExp(`^${origin}$`, "i") },
        },
        {
          destination: { $regex: new RegExp(`^${origin}$`, "i") },
        },
      ],
    });
  }

  async findByDestination(destination) {
    return Route.find({
      $or: [
        {
          destination: { $regex: new RegExp(`^${destination}$`, "i") },
        },
        {
          origin: { $regex: new RegExp(`^${destination}$`, "i") },
        },
      ],
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
    const trimmedOrigin = String(origin || "").trim();
    if (!trimmedOrigin) return [];

    const exactMatch = new RegExp(`^${trimmedOrigin}$`, "i");

    const [directDestinations, reverseOrigins] = await Promise.all([
      Route.distinct("destination", { origin: { $regex: exactMatch } }),
      Route.distinct("origin", { destination: { $regex: exactMatch } }),
    ]);

    const values = [
      ...(Array.isArray(directDestinations) ? directDestinations : []),
      ...(Array.isArray(reverseOrigins) ? reverseOrigins : []),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "vi"));
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
