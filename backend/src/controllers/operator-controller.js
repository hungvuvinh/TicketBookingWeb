const operatorRepository = require('../repository/operator-repository');

const normalizeOperator = (operator) => (operator && operator.toObject ? operator.toObject() : operator);

const listOperators = async (req, res) => {
  try {
    const { role } = req.query;
    if (role && !['driver', 'assistant'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const operators = role
      ? await operatorRepository.findByRole(role)
      : await operatorRepository.findAll({}, { skip: 0, limit: 200 });

    return res.status(200).json({ success: true, message: 'Operators fetched', data: Array.isArray(operators) ? operators.map(normalizeOperator) : [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const createOperator = async (req, res) => {
  try {
    const { name, phone_number, email, role, license } = req.body || {};
    if (!name || !phone_number || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const operator = await operatorRepository.create({
      name: String(name).trim(),
      phone_number: String(phone_number).trim(),
      email: email ? String(email).trim() : undefined,
      role: String(role).trim(),
      ...(license !== undefined ? { license: String(license).trim() } : {}),
    });

    return res.status(201).json({ success: true, message: 'Operator created successfully', data: normalizeOperator(operator) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const updateOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { name, phone_number, email, role, license } = req.body || {};

    const operator = await operatorRepository.update(operatorId, {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(phone_number !== undefined ? { phone_number: String(phone_number).trim() } : {}),
      ...(email !== undefined ? { email: String(email).trim() } : {}),
      ...(role !== undefined ? { role: String(role).trim() } : {}),
      ...(license !== undefined ? { license: String(license).trim() } : {}),
    });

    if (!operator) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    return res.status(200).json({ success: true, message: 'Operator updated successfully', data: normalizeOperator(operator) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const operator = await operatorRepository.delete(operatorId);
    if (!operator) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    return res.status(200).json({ success: true, message: 'Operator deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  listOperators,
  createOperator,
  updateOperator,
  deleteOperator,
};
