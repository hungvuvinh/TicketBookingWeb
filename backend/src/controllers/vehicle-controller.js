const vehicleRepository = require('../repository/vehicle-repository');

const listVehicles = async (req, res) => {
  try {
    const vehicles = await vehicleRepository.findAll({}, { skip: 0, limit: 100 });
    return res.status(200).json({ success: true, message: 'Vehicles fetched', data: vehicles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  listVehicles,
};
