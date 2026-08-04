module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  // App users (customers) get non-expiring refresh tokens for convenience
  appRefreshExpires: process.env.JWT_APP_REFRESH_EXPIRES || '100y', // 100 years = effectively non-expiring
  // Dashboard users (admin/cashier/operation) get expiring refresh tokens for security
  dashboardRefreshExpires: process.env.JWT_DASHBOARD_REFRESH_EXPIRES || '7d',
};

