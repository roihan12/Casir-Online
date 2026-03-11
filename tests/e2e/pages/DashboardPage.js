import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard Page Object Model
 *
 * Main dashboard after user login
 */
export class DashboardPage extends BasePage {
  // Navigation
  ;
  ;
  ;

  // User info
  ;
  ;
  ;
  ;

  // Quick actions
  ;
  ;
  ;

  // Stats cards
  ;
  ;
  ;
  ;

  // Recent activity
  ;
  ;

  // Date filter
  ;
  ;
  ;
  ;

  constructor(page) {
    super(page, '/dashboard');

    // Navigation
    this.sidebar = page.locator('[data-testid="sidebar"], .sidebar');
    this.navigationMenu = page.locator('[data-testid="nav-menu"], .nav-menu');
    this.logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout")');

    // User menu
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.userName = page.locator('[data-testid="user-name"], .user-name');
    this.userRole = page.locator('[data-testid="user-role"], .user-role');
    this.userAvatar = page.locator('[data-testid="user-avatar"], .user-avatar');

    // Quick actions
    this.quickActions = page.locator('[data-testid="quick-actions"], .quick-actions');
    this.newTransaksiButton = page.locator('[data-testid="new-transaksi-button"], button:has-text("Transaksi Baru")');
    this.newPelangganButton = page.locator('[data-testid="new-pelanggan-button"], button:has-text("Pelanggan Baru")');

    // Stats
    this.statsCards = page.locator('[data-testid="stats-card"], .stat-card');
    this.totalTransaksiCard = page.locator('[data-testid="stat-transaksi"], .stat-transaksi');
    this.totalPendapatanCard = page.locator('[data-testid="stat-pendapatan"], .stat-pendapatan');
    this.totalPelangganCard = page.locator('[data-testid="stat-pelanggan"], .stat-pelanggan');

    // Recent activity
    this.recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity');
    this.viewAllActivityButton = page.locator('[data-testid="view-all-activity"], button:has-text("Lihat Semua")');

    // Date filters
    this.dateRangeFilter = page.locator('[data-testid="date-filter"], .date-filter');
    this.todayButton = page.locator('button:has-text("Hari Ini")');
    this.thisWeekButton = page.locator('button:has-text("Minggu Ini")');
    this.thisMonthButton = page.locator('button:has-text("Bulan Ini")');
  }

  /**
   * Verify dashboard is loaded
   */
  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.statsCards.first()).toBeVisible({ timeout: 10000 });
    await expect(this.quickActions).toBeVisible();
  }

  /**
   * Get total transactions count
   */
  async getTotalTransactions() {
    const card = this.totalTransaksiCard.first();
    const valueText = await card.locator('[data-testid="stat-value"], .stat-value').textContent();
    return parseInt(valueText?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Get total revenue amount
   */
  async getTotalRevenue() {
    const card = this.totalPendapatanCard.first();
    const valueText = await card.locator('[data-testid="stat-value"], .stat-value').textContent();
    return parseInt(valueText?.replace(/[^0-9]/g, '') || '0', 10);
  }

  /**
   * Get total customers count
   */
  async getTotalCustomers() {
    const card = this.totalPelangganCard.first();
    const valueText = await card.locator('[data-testid="stat-value"], .stat-value').textContent();
    return parseInt(valueText?.replace(/,/g, '') || '0', 10);
  }

  /**
   * Click "New Transaction" button
   */
  async clickNewTransaction() {
    await this.newTransaksiButton.click();
    // Should navigate to transaction page
    await expect(this.page).toHaveURL(/\/transaksi|\/kasir|\/pos/);
  }

  /**
   * Click "New Customer" button
   */
  async clickNewCustomer() {
    await this.newPelangganButton.click();
    // Should navigate to customer page or open modal
    await expect(this.page).toHaveURL(/\/pelanggan|\/customer/);
  }

  /**
   * Logout from the application
   */
  async logout() {
    // Click user menu to expand it
    await this.userMenu.click();

    // Then click logout button
    await this.logoutButton.click();

    // Should redirect to login page
    await expect(this.page).toHaveURL(/\/login/);
  }

  /**
   * Navigate to a menu item
   * @param menuItem - Menu item name (e.g., 'Products', 'Transactions')
   */
  async navigateToMenu(menuItem) {
    const menuLink = this.navigationMenu.getByRole('link', { name: menuItem });
    await menuLink.click();
    await this.waitForLoad();
  }

  /**
   * Filter dashboard by date range
   * @param range - 'today', 'thisWeek', or 'thisMonth'
   */
  async filterByDateRange(range) {
    if (range === 'today') {
      await this.todayButton.click();
    } else if (range === 'thisWeek') {
      await this.thisWeekButton.click();
    } else if (range === 'thisMonth') {
      await this.thisMonthButton.click();
    }

    await this.waitForLoad();
    await this.assertPageLoaded();
  }

  /**
   * Get current user information
   */
  async getUserInfo() {
    const name = await this.userName.textContent() || '';
    const role = await this.userRole.textContent() || '';
    return { name: name.trim(), role: role.trim() };
  }

  /**
   * Check if sidebar is open
   */
  async isSidebarOpen() {
    const sidebarClass = await this.sidebar.getAttribute('class') || '';
    return sidebarClass.includes('open') || !sidebarClass.includes('closed');
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar() {
    const toggleButton = this.page.locator('[data-testid="sidebar-toggle"], .sidebar-toggle');
    await toggleButton.click();
  }

  /**
   * Search for a specific item in recent activity
   * @param searchTerm - Search term
   */
  async searchActivity(searchTerm) {
    const searchInput = this.page.locator('[data-testid="activity-search"], input[placeholder*="search"]');
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /**
   * View all recent activity
   */
  async viewAllActivity() {
    await this.viewAllActivityButton.click();
    // Should navigate to activity list or show modal
    await expect(this.page).toHaveURL(/\/activity|\/transactions/);
  }
}

export default DashboardPage;
