const vehicleRepository = require('../repository/vehicle-repository');

const normalizeVehicle = (vehicle) => {
  if (!vehicle) return null;
  const rawVehicle = vehicle.toObject ? vehicle.toObject() : vehicle;
  return {
    ...rawVehicle,
    license_plate: rawVehicle.license_plate || rawVehicle.lisence_plate || "",
  };
};

const listVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleRepository.findAll({}, { skip: 0, limit: 100 });
    return res.status(200).json({ success: true, message: 'Vehicles fetched', data: vehicles.map(normalizeVehicle) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { vehicle_type, total_seats, license_plate, seat_price } = req.body || {};
    if (!vehicle_type || !total_seats || !license_plate || seat_price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const vehicle = await vehicleRepository.create({
      vehicle_type: String(vehicle_type).trim(),
      total_seats: Number(total_seats),
      license_plate: String(license_plate).trim(),
      seat_price: Number(seat_price),
    });

    return res.status(201).json({ success: true, message: 'Vehicle created successfully', data: normalizeVehicle(vehicle) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { vehicle_type, total_seats, license_plate, seat_price } = req.body || {};
    const vehicle = await vehicleRepository.update(vehicleId, {
      ...(vehicle_type !== undefined ? { vehicle_type: String(vehicle_type).trim() } : {}),
      ...(total_seats !== undefined ? { total_seats: Number(total_seats) } : {}),
      ...(license_plate !== undefined ? { license_plate: String(license_plate).trim() } : {}),
      ...(seat_price !== undefined ? { seat_price: Number(seat_price) } : {}),
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: normalizeVehicle(vehicle) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await vehicleRepository.delete(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
