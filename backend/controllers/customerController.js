const { Customer, SalesInvoice } = require('../models');
const { Op } = require('sequelize');

// Get all customers with filtering and pagination
const getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      customer_group,
      territory,
      sales_person,
      sort_by = 'name',
      sort_order = 'ASC',
      include_invoices = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };
    const includeClause = [];

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { customer_code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (customer_group) {
      whereClause.customer_group = customer_group;
    }

    if (territory) {
      whereClause.territory = territory;
    }

    if (sales_person) {
      whereClause.sales_person = sales_person;
    }

    // Include sales invoices if requested
    if (include_invoices === 'true') {
      includeClause.push({
        model: SalesInvoice,
        as: 'sales_invoices',
        attributes: ['id', 'invoice_number', 'invoice_date', 'total_amount', 'balance_amount', 'status']
      });
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(count / limit),
        total_records: count
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_invoices = false } = req.query;

    const includeClause = [];

    if (include_invoices === 'true') {
      includeClause.push({
        model: SalesInvoice,
        as: 'sales_invoices',
        attributes: ['id', 'invoice_number', 'invoice_date', 'total_amount', 'balance_amount', 'status', 'due_date']
      });
    }

    const customer = await Customer.findByPk(id, {
      include: includeClause
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Add computed fields
    const customerData = customer.toJSON();
    customerData.credit_info = customer.getCreditInfo();
    customerData.contact_info = customer.getContactInfo();
    customerData.full_address = customer.getFullAddress();
    customerData.billing_address_formatted = customer.getBillingAddress();
    customerData.shipping_address_formatted = customer.getShippingAddress();
    customerData.is_over_credit_limit = customer.isOverCreditLimit();
    customerData.credit_utilization = customer.getCreditUtilization();

    res.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Customer with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.update(req.body);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Soft delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has any sales invoices
    const invoiceCount = await SalesInvoice.count({
      where: { customer_id: id }
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing sales invoices. Please deactivate instead.'
      });
    }

    await customer.update({ is_active: false });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

// Get active customers
const getActiveCustomers = async (req, res) => {
  try {
    const customers = await Customer.getActiveCustomers();

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching active customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active customers',
      error: error.message
    });
  }
};

// Get customers by type
const getCustomersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const customers = await Customer.getCustomersByType(type);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers by type',
      error: error.message
    });
  }
};

// Search customers
const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const customers = await Customer.searchCustomers(q);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search customers',
      error: error.message
    });
  }
};

// Get customers over credit limit
const getOverCreditLimitCustomers = async (req, res) => {
  try {
    const customers = await Customer.getOverCreditLimitCustomers();

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching over credit limit customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch over credit limit customers',
      error: error.message
    });
  }
};

// Get top customers by sales
const getTopCustomersBySales = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await Customer.getTopCustomersBySales(parseInt(limit));

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching top customers by sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top customers by sales',
      error: error.message
    });
  }
};

// Get customer statistics
const getCustomerStatistics = async (req, res) => {
  try {
    const [totalCustomers, activeCustomers, businessCustomers, individualCustomers, overCreditLimit] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { is_active: true, status: 'active' } }),
      Customer.count({ where: { type: 'business', is_active: true } }),
      Customer.count({ where: { type: 'individual', is_active: true } }),
      Customer.count({
        where: {
          outstanding_amount: { [Op.gt]: Customer.sequelize.col('credit_limit') },
          is_active: true
        }
      })
    ]);

    const totalSales = await Customer.sum('total_sales', {
      where: { is_active: true }
    });

    const totalOutstanding = await Customer.sum('outstanding_amount', {
      where: { is_active: true }
    });

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers || 0,
        active_customers: activeCustomers || 0,
        business_customers: businessCustomers || 0,
        individual_customers: individualCustomers || 0,
        over_credit_limit: overCreditLimit || 0,
        total_sales: totalSales || 0,
        total_outstanding: totalOutstanding || 0
      }
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
};

// Activate customer
const activateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.update({ 
      is_active: true,
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Customer activated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error activating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate customer',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getActiveCustomers,
  getCustomersByType,
  searchCustomers,
  getOverCreditLimitCustomers,
  getTopCustomersBySales,
  getCustomerStatistics,
  activateCustomer
};