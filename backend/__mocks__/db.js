// Manual Jest mock for the pg database pool.
// Tests control return values with db.query.mockResolvedValueOnce(...)
const query = jest.fn();
module.exports = { query };
