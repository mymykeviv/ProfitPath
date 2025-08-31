import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Products API
export const fetchProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const fetchProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// Purchases API
export const fetchPurchases = async (params = {}) => {
  const response = await api.get('/purchases', { params });
  return response.data;
};

export const fetchPurchase = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchase = async (purchaseData) => {
  const response = await api.post('/purchases', purchaseData);
  return response.data;
};

export const updatePurchase = async (id, purchaseData) => {
  const response = await api.put(`/purchases/${id}`, purchaseData);
  return response.data;
};

export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data;
};

// Sales API
export const fetchSales = async (params = {}) => {
  const response = await api.get('/sales', { params });
  return response.data;
};

export const fetchSale = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const updateSale = async (id, saleData) => {
  const response = await api.put(`/sales/${id}`, saleData);
  return response.data;
};

export const deleteSale = async (id) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data;
};

// Inventory API
export const fetchInventory = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data;
};

export const fetchInventoryItem = async (id) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
};

export const updateInventory = async (id, inventoryData) => {
  const response = await api.put(`/inventory/${id}`, inventoryData);
  return response.data;
};

// Production API
export const fetchProductions = async (params = {}) => {
  const response = await api.get('/production', { params });
  return response.data;
};

export const fetchProduction = async (id) => {
  const response = await api.get(`/production/${id}`);
  return response.data;
};

export const createProduction = async (productionData) => {
  const response = await api.post('/production', productionData);
  return response.data;
};

export const updateProduction = async (id, productionData) => {
  const response = await api.put(`/production/${id}`, productionData);
  return response.data;
};

export const deleteProduction = async (id) => {
  const response = await api.delete(`/production/${id}`);
  return response.data;
};

// Payments API
export const fetchPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const fetchPayment = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const createPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

export const updatePayment = async (id, paymentData) => {
  const response = await api.put(`/payments/${id}`, paymentData);
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};

// Expenses API
export const fetchExpenses = async (params = {}) => {
  const response = await api.get('/expenses', { params });
  return response.data;
};

export const fetchExpense = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

export const updateExpense = async (id, expenseData) => {
  const response = await api.put(`/expenses/${id}`, expenseData);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// Reports API
export const fetchReports = async (type, params = {}) => {
  const response = await api.get(`/reports/${type}`, { params });
  return response.data;
};

// Suppliers API
export const fetchSuppliers = async (params = {}) => {
  const response = await api.get('/suppliers', { params });
  return response.data;
};

// Customers API
export const fetchCustomers = async (params = {}) => {
  const response = await api.get('/customers', { params });
  return response.data;
};

// Categories API
export const fetchCategories = async (params = {}) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

export default api;