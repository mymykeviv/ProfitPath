const { Payment, Customer, Supplier, SalesInvoice, PurchaseOrder } = require('../models');
const { Op } = require('sequelize');

// Get all payments with filtering and pagination
const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      payment_type,
      payment_method,
      status,
      customer_id,
      supplier_id,
      reference_type,
      start_date,
      end_date,
      sort_by = 'payment_date',
      sort_order = 'DESC',
      include_customer = false,
      include_supplier = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };
    const includeClause = [];

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { payment_number: { [Op.like]: `%${search}%` } },
        { transaction_id: { [Op.like]: `%${search}%` } },
        { cheque_number: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    if (payment_type) {
      whereClause.payment_type = payment_type;
    }

    if (payment_method) {
      whereClause.payment_method = payment_method;
    }

    if (status) {
      whereClause.status = status;
    }

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (supplier_id) {
      whereClause.supplier_id = supplier_id;
    }

    if (reference_type) {
      whereClause.reference_type = reference_type;
    }

    if (start_date && end_date) {
      whereClause.payment_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.payment_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.payment_date = {
        [Op.lte]: end_date
      };
    }

    // Include related data if requested
    if (include_customer === 'true') {
      includeClause.push({
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'customer_code', 'email', 'phone']
      });
    }

    if (include_supplier === 'true') {
      includeClause.push({
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'supplier_code', 'email', 'phone']
      });
    }

    const { count, rows } = await Payment.findAndCountAll({
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
        total_items: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_customer = false, include_supplier = false } = req.query;

    const includeClause = [];

    if (include_customer === 'true') {
      includeClause.push({
        model: Customer,
        as: 'customer'
      });
    }

    if (include_supplier === 'true') {
      includeClause.push({
        model: Supplier,
        as: 'supplier'
      });
    }

    const payment = await Payment.findOne({
      where: { id, is_active: true },
      include: includeClause
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;

    // Validate customer or supplier is provided
    if (!paymentData.customer_id && !paymentData.supplier_id) {
      return res.status(400).json({
        success: false,
        message: 'Either customer_id or supplier_id must be provided'
      });
    }

    // Validate reference exists if provided
    if (paymentData.reference_id && paymentData.reference_type) {
      let referenceExists = false;
      
      if (paymentData.reference_type === 'sales_invoice') {
        const invoice = await SalesInvoice.findByPk(paymentData.reference_id);
        referenceExists = !!invoice;
      } else if (paymentData.reference_type === 'purchase_order') {
        const order = await PurchaseOrder.findByPk(paymentData.reference_id);
        referenceExists = !!order;
      }

      if (!referenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Referenced document not found'
        });
      }
    }

    const payment = await Payment.create(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payment = await Payment.findOne({
      where: { id, is_active: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.update(updateData);

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

// Delete payment (soft delete)
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({
      where: { id, is_active: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.update({ is_active: false });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

// Get payments by customer
const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      status,
      payment_type,
      sort_by = 'payment_date',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      customer_id,
      is_active: true
    };

    if (start_date && end_date) {
      whereClause.payment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (payment_type) {
      whereClause.payment_type = payment_type;
    }

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'customer_code']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payments',
      error: error.message
    });
  }
};

// Get payments by supplier
const getPaymentsBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      status,
      payment_type,
      sort_by = 'payment_date',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      supplier_id,
      is_active: true
    };

    if (start_date && end_date) {
      whereClause.payment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (payment_type) {
      whereClause.payment_type = payment_type;
    }

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'supplier_code']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier payments',
      error: error.message
    });
  }
};

// Get pending payments
const getPendingPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      payment_type,
      sort_by = 'payment_date',
      sort_order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'pending',
      is_active: true
    };

    if (payment_type) {
      whereClause.payment_type = payment_type;
    }

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'customer_code']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'supplier_code']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
      error: error.message
    });
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    const statistics = await Payment.getPaymentStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const payment = await Payment.findOne({
      where: { id, is_active: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await payment.update(updateData);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByCustomer,
  getPaymentsBySupplier,
  getPendingPayments,
  getPaymentStatistics,
  updatePaymentStatus
};