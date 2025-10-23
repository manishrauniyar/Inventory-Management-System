// Inventory Management System - JavaScript

class InventoryManager {
    constructor() {
        this.products = this.loadFromStorage();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderInventoryTable();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Product Form
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleAddProduct(e));

        // Edit Form
        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEditProduct(e));

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.closeModal());

        // Filters
        document.getElementById('category-filter').addEventListener('change', () => this.renderInventoryTable());
        document.getElementById('stock-filter').addEventListener('change', () => this.renderInventoryTable());

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e));

        // Settings
        document.getElementById('export-btn').addEventListener('click', () => this.exportCSV());
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importCSV(e));
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAllData());
    }

    handleNavigation(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Update active section
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            inventory: 'Inventory Management',
            'add-product': 'Add New Product',
            reports: 'Reports',
            settings: 'Settings'
        };
        document.getElementById('page-title').textContent = titles[section];

        // Update category filter options
        if (section === 'inventory') {
            this.updateCategoryFilter();
        }

        // Update reports
        if (section === 'reports') {
            this.updateReports();
        }
    }

    handleAddProduct(e) {
        e.preventDefault();

        const product = {
            id: Date.now(),
            name: document.getElementById('product-name').value,
            sku: document.getElementById('product-sku').value,
            category: document.getElementById('product-category').value,
            quantity: parseInt(document.getElementById('product-quantity').value),
            price: parseFloat(document.getElementById('product-price').value),
            minStock: parseInt(document.getElementById('product-min-stock').value),
            description: document.getElementById('product-description').value,
            createdAt: new Date().toISOString()
        };

        this.products.push(product);
        this.saveToStorage();
        this.showToast('Product added successfully!', 'success');
        document.getElementById('product-form').reset();
        this.updateDashboard();
        this.renderInventoryTable();
    }

    handleEditProduct(e) {
        e.preventDefault();

        const product = this.products.find(p => p.id === this.currentEditId);
        if (product) {
            product.name = document.getElementById('edit-product-name').value;
            product.sku = document.getElementById('edit-product-sku').value;
            product.category = document.getElementById('edit-product-category').value;
            product.quantity = parseInt(document.getElementById('edit-product-quantity').value);
            product.price = parseFloat(document.getElementById('edit-product-price').value);
            product.minStock = parseInt(document.getElementById('edit-product-min-stock').value);

            this.saveToStorage();
            this.showToast('Product updated successfully!', 'success');
            this.closeModal();
            this.updateDashboard();
            this.renderInventoryTable();
        }
    }

    openEditModal(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.currentEditId = id;
            document.getElementById('edit-product-name').value = product.name;
            document.getElementById('edit-product-sku').value = product.sku;
            document.getElementById('edit-product-category').value = product.category;
            document.getElementById('edit-product-quantity').value = product.quantity;
            document.getElementById('edit-product-price').value = product.price;
            document.getElementById('edit-product-min-stock').value = product.minStock;
            document.getElementById('edit-modal').classList.add('active');
        }
    }

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
        this.currentEditId = null;
    }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveToStorage();
            this.showToast('Product deleted successfully!', 'success');
            this.updateDashboard();
            this.renderInventoryTable();
        }
    }

    updateDashboard() {
        const totalProducts = this.products.length;
        const lowStock = this.products.filter(p => p.quantity <= p.minStock).length;
        const totalValue = this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        const categories = new Set(this.products.map(p => p.category)).size;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('low-stock').textContent = lowStock;
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('total-categories').textContent = categories;

        this.updateRecentProducts();
        this.updateStockStatus();
    }

    updateRecentProducts() {
        const recent = this.products.slice(-5).reverse();
        const container = document.getElementById('recent-products');
        
        if (recent.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No products yet</p>';
            return;
        }

        container.innerHTML = recent.map(p => `
            <div class="product-item">
                <div>
                    <div class="product-item-name">${p.name}</div>
                    <div class="product-item-qty">${p.sku}</div>
                </div>
                <div class="product-item-qty">${p.quantity} units</div>
            </div>
        `).join('');
    }

    updateStockStatus() {
        const categories = [...new Set(this.products.map(p => p.category))].slice(0, 5);
        const container = document.getElementById('stock-status');

        if (categories.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No data available</p>';
            return;
        }

        const maxQty = Math.max(...this.products.map(p => p.quantity), 1);

        container.innerHTML = categories.map(cat => {
            const catProducts = this.products.filter(p => p.category === cat);
            const totalQty = catProducts.reduce((sum, p) => sum + p.quantity, 0);
            const percentage = (totalQty / maxQty) * 100;

            return `
                <div class="stock-bar">
                    <div class="stock-bar-label">${cat}</div>
                    <div class="stock-bar-container">
                        <div class="stock-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stock-bar-value">${totalQty}</div>
                </div>
            `;
        }).join('');
    }

    renderInventoryTable() {
        const categoryFilter = document.getElementById('category-filter').value;
        const stockFilter = document.getElementById('stock-filter').value;

        let filtered = this.products;

        if (categoryFilter) {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        if (stockFilter === 'low') {
            filtered = filtered.filter(p => p.quantity <= p.minStock);
        } else if (stockFilter === 'medium') {
            filtered = filtered.filter(p => p.quantity > p.minStock && p.quantity <= p.minStock * 2);
        } else if (stockFilter === 'high') {
            filtered = filtered.filter(p => p.quantity > p.minStock * 2);
        }

        const tbody = document.getElementById('inventory-table-body');
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const status = p.quantity <= p.minStock ? 'low' : p.quantity <= p.minStock * 2 ? 'medium' : 'high';
            const statusText = status === 'low' ? 'Low Stock' : status === 'medium' ? 'Medium Stock' : 'In Stock';
            const totalValue = (p.quantity * p.price).toFixed(2);

            return `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.sku}</td>
                    <td>${p.category}</td>
                    <td>${p.quantity}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>$${totalValue}</td>
                    <td><span class="status-badge status-${status}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="manager.openEditModal(${p.id})">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="manager.deleteProduct(${p.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateCategoryFilter() {
        const categories = [...new Set(this.products.map(p => p.category))];
        const select = document.getElementById('category-filter');
        const currentValue = select.value;

        select.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
        select.value = currentValue;
    }

    updateReports() {
        this.updateLowStockReport();
        this.updateTopProductsReport();
        this.updateCategoryReport();
        this.updateSummaryReport();
    }

    updateLowStockReport() {
        const lowStock = this.products.filter(p => p.quantity <= p.minStock);
        const container = document.getElementById('low-stock-report');

        if (lowStock.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">All products have sufficient stock</p>';
            return;
        }

        container.innerHTML = lowStock.map(p => `
            <div class="report-item">
                <div>
                    <div class="report-item-label">${p.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${p.sku}</div>
                </div>
                <div class="report-item-value">${p.quantity} / ${p.minStock}</div>
            </div>
        `).join('');
    }

    updateTopProductsReport() {
        const topProducts = this.products
            .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
            .slice(0, 5);
        const container = document.getElementById('top-products-report');

        if (topProducts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No products</p>';
            return;
        }

        container.innerHTML = topProducts.map(p => `
            <div class="report-item">
                <div class="report-item-label">${p.name}</div>
                <div class="report-item-value">$${(p.quantity * p.price).toFixed(2)}</div>
            </div>
        `).join('');
    }

    updateCategoryReport() {
        const categories = [...new Set(this.products.map(p => p.category))];
        const container = document.getElementById('category-report');

        if (categories.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No categories</p>';
            return;
        }

        container.innerHTML = categories.map(cat => {
            const count = this.products.filter(p => p.category === cat).length;
            return `
                <div class="report-item">
                    <div class="report-item-label">${cat}</div>
                    <div class="report-item-value">${count} products</div>
                </div>
            `;
        }).join('');
    }

    updateSummaryReport() {
        const totalProducts = this.products.length;
        const totalQuantity = this.products.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        const avgPrice = totalProducts > 0 ? totalValue / totalQuantity : 0;

        const container = document.getElementById('summary-report');
        container.innerHTML = `
            <div class="report-item">
                <div class="report-item-label">Total Products</div>
                <div class="report-item-value">${totalProducts}</div>
            </div>
            <div class="report-item">
                <div class="report-item-label">Total Quantity</div>
                <div class="report-item-value">${totalQuantity}</div>
            </div>
            <div class="report-item">
                <div class="report-item-label">Total Inventory Value</div>
                <div class="report-item-value">$${totalValue.toFixed(2)}</div>
            </div>
            <div class="report-item">
                <div class="report-item-label">Average Unit Price</div>
                <div class="report-item-value">$${avgPrice.toFixed(2)}</div>
            </div>
        `;
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase();
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );

        const tbody = document.getElementById('inventory-table-body');
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const status = p.quantity <= p.minStock ? 'low' : p.quantity <= p.minStock * 2 ? 'medium' : 'high';
            const statusText = status === 'low' ? 'Low Stock' : status === 'medium' ? 'Medium Stock' : 'In Stock';
            const totalValue = (p.quantity * p.price).toFixed(2);

            return `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.sku}</td>
                    <td>${p.category}</td>
                    <td>${p.quantity}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>$${totalValue}</td>
                    <td><span class="status-badge status-${status}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="manager.openEditModal(${p.id})">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="manager.deleteProduct(${p.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    exportCSV() {
        if (this.products.length === 0) {
            this.showToast('No products to export', 'warning');
            return;
        }

        const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Min Stock', 'Description'];
        const rows = this.products.map(p => [
            p.id,
            p.name,
            p.sku,
            p.category,
            p.quantity,
            p.price,
            p.minStock,
            p.description
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showToast('Data exported successfully!', 'success');
    }

    importCSV(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const product = {
                        id: Date.now() + i,
                        name: values[1] || '',
                        sku: values[2] || '',
                        category: values[3] || '',
                        quantity: parseInt(values[4]) || 0,
                        price: parseFloat(values[5]) || 0,
                        minStock: parseInt(values[6]) || 0,
                        description: values[7] || '',
                        createdAt: new Date().toISOString()
                    };

                    if (product.name && product.sku) {
                        this.products.push(product);
                    }
                }

                this.saveToStorage();
                this.showToast('Data imported successfully!', 'success');
                this.updateDashboard();
                this.renderInventoryTable();
            } catch (error) {
                this.showToast('Error importing file', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete all products? This cannot be undone.')) {
            this.products = [];
            this.saveToStorage();
            this.showToast('All data cleared', 'success');
            this.updateDashboard();
            this.renderInventoryTable();
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    saveToStorage() {
        localStorage.setItem('inventory_products', JSON.stringify(this.products));
    }

    loadFromStorage() {
        const data = localStorage.getItem('inventory_products');
        return data ? JSON.parse(data) : [];
    }
}

// Initialize the application
const manager = new InventoryManager();