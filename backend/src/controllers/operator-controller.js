const operatorRepository = require('../repository/operator-repository');

const listOperators = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const operators = await operatorRepository.findAll(filter, { skip: 0, limit: 200 });
    return res.status(200).json({ success: true, message: 'Operators fetched', data: operators });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  listOperators,
};
