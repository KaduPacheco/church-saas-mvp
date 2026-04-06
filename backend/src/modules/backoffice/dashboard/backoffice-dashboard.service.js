const db = require('../../../config/database');

async function getSummary() {
  const [
    totalChurchesResult,
    totalCongregationsResult,
    totalUsersResult,
    totalMembersResult,
    statusRows,
  ] = await Promise.all([
    db('churches').count('* as total').first(),
    db('congregations').count('* as total').first(),
    db('users').count('* as total').first(),
    db('members').count('* as total').first(),
    db('churches')
      .select('status')
      .count('* as total')
      .groupBy('status'),
  ]);

  const statusTotals = {
    active: 0,
    inactive: 0,
    suspended: 0,
  };

  for (const row of statusRows) {
    if (Object.prototype.hasOwnProperty.call(statusTotals, row.status)) {
      statusTotals[row.status] = parseCount(row.total);
    }
  }

  return {
    totals: {
      churches: parseCount(totalChurchesResult?.total),
      congregations: parseCount(totalCongregationsResult?.total),
      users: parseCount(totalUsersResult?.total),
      members: parseCount(totalMembersResult?.total),
    },
    tenantsByStatus: statusTotals,
  };
}

function parseCount(value) {
  return Number.parseInt(value, 10) || 0;
}

module.exports = {
  getSummary,
};
