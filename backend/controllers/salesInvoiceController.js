const { SalesInvoice, SalesInvoiceItem, Customer, Product, Batch } = require('../models');
const { Op } = require('sequelize');

// Get all sales invoices with filtering and pagination
const getAllSalesInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      customer_id,
      priority,
      start_date,
      end_date,
      sales_person,
      sort_by = 'invoice_date',
      sort_order = 'DESC',
      include_items = false,
      include_customer = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const includeClause = [];

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { reference_number: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (sales_person) {
      whereClause.sales_person = sales_person;
    }

    if (start_date && end_date) {
      whereClause.invoice_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.invoice_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.invoice_date = {
        [Op.lte]: end_date
      };
    }

    // Include related data if requested
    if (include_items === 'true') {
      includeClause.push({
        model: SalesInvoiceItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        }]
      });
    }

    if (include_customer === 'true') {
      includeClause.push({
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'customer_code', 'email', 'phone', 'type']
      });
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
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
    console.error('Error fetching sales invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales invoices',
      error: error.message
    });
  }
};

// Get sales invoice by ID
const getSalesInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: SalesInvoiceItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'unit_of_measure', 'gst_rate']
          }, {
            model: Batch,
            as: 'batch',
            attributes: ['id', 'batch_number', 'expiry_date', 'manufacturing_date']
          }]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    // Add computed fields
    const invoiceData = invoice.toJSON();
    invoiceData.calculated_totals = invoice.calculateTotals();
    invoiceData.can_edit = invoice.canEdit();
    invoiceData.can_cancel = invoice.canCancel();
    invoiceData.can_send = invoice.canSend();
    invoiceData.is_overdue = invoice.isOverdue();
    invoiceData.days_overdue = invoice.getDaysOverdue();
    invoiceData.days_until_due = invoice.getDaysUntilDue();
    invoiceData.payment_status = invoice.getPaymentStatus();
    invoiceData.tax_breakdown = invoice.getTaxBreakdown();

    res.json({
      success: true,
      data: invoiceData
    });
  } catch (error) {
    console.error('Error fetching sales invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales invoice',
      error: error.message
    });
  }
};

// Create new sales invoice
const createSalesInvoice = async (req, res) => {
  const transaction = await SalesInvoice.sequelize.transaction();
  
  try {
    const { items, ...invoiceData } = req.body;

    // Validate customer exists and is active
    const customer = await Customer.findByPk(invoiceData.customer_id);
    if (!customer) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (!customer.is_active || customer.status !== 'active') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customer is not active'
      });
    }

    // Create the sales invoice
    const invoice = await SalesInvoice.create(invoiceData, { transaction });

    // Create invoice items if provided
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const itemData = {
          ...items[i],
          sales_invoice_id: invoice.id,
          line_number: i + 1
        };

        // Validate product exists
        const product = await Product.findByPk(itemData.product_id);
        if (!product) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Product not found for item ${i + 1}`
          });
        }

        // Set product details
        itemData.product_name = product.name;
        itemData.product_sku = product.sku;
        itemData.product_description = product.description;
        itemData.hsn_code = product.hsn_code;
        itemData.unit_of_measure = product.unit_of_measure;
        itemData.gst_rate = product.gst_rate;

        // Set GST rates based on invoice location
        if (invoice.place_of_supply && customer.address && 
            customer.address.state && invoice.place_of_supply.includes(customer.address.state)) {
          // Same state - CGST + SGST
          itemData.cgst_rate = product.gst_rate / 2;
          itemData.sgst_rate = product.gst_rate / 2;
          itemData.igst_rate = 0;
        } else {
          // Different state - IGST
          itemData.cgst_rate = 0;
          itemData.sgst_rate = 0;
          itemData.igst_rate = product.gst_rate;
        }

        await SalesInvoiceItem.create(itemData, { transaction });
      }

      // Recalculate invoice totals
      const invoiceItems = await SalesInvoiceItem.findAll({
        where: { sales_invoice_id: invoice.id },
        transaction
      });

      const subtotal = invoiceItems.reduce((sum, item) => sum + parseFloat(item.gross_amount), 0);
      const totalDiscountAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.discount_amount), 0);
      const totalTaxAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.total_tax_amount), 0);
      const cgstAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.cgst_amount), 0);
      const sgstAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.sgst_amount), 0);
      const igstAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.igst_amount), 0);
      const cessAmount = invoiceItems.reduce((sum, item) => sum + parseFloat(item.cess_amount), 0);

      await invoice.update({
        subtotal,
        discount_amount: totalDiscountAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        cess_amount: cessAmount
      }, { transaction });
    }

    await transaction.commit();

    // Fetch the complete invoice with items
    const completeInvoice = await SalesInvoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: SalesInvoiceItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sales invoice created successfully',
      data: completeInvoice
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating sales invoice:', error);
    
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
      message: 'Failed to create sales invoice',
      error: error.message
    });
  }
};

// Update sales invoice
const updateSalesInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    // Check if invoice can be edited
    if (!invoice.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be edited in current status'
      });
    }

    await invoice.update(req.body);

    res.json({
      success: true,
      message: 'Sales invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error updating sales invoice:', error);
    
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
      message: 'Failed to update sales invoice',
      error: error.message
    });
  }
};

// Cancel sales invoice
const cancelSalesInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    // Check if invoice can be cancelled
    if (!invoice.canCancel()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be cancelled in current status'
      });
    }

    await invoice.update({
      status: 'cancelled',
      cancellation_reason,
      cancelled_date: new Date()
    });

    res.json({
      success: true,
      message: 'Sales invoice cancelled successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error cancelling sales invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sales invoice',
      error: error.message
    });
  }
};

// Send sales invoice
const sendSalesInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    // Check if invoice can be sent
    if (!invoice.canSend()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be sent in current status'
      });
    }

    await invoice.update({
      status: 'sent',
      sent_date: new Date()
    });

    res.json({
      success: true,
      message: 'Sales invoice sent successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error sending sales invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send sales invoice',
      error: error.message
    });
  }
};

// Record payment for sales invoice
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, payment_date, notes } = req.body;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (invoice.paid_amount + amount > invoice.total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds outstanding balance'
      });
    }

    const newPaidAmount = invoice.paid_amount + amount;
    const updateData = {
      paid_amount: newPaidAmount,
      payment_method,
      notes: notes ? `${invoice.notes || ''}\nPayment: ${notes}` : invoice.notes
    };

    if (payment_date) {
      updateData.paid_date = payment_date;
    }

    await invoice.update(updateData);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// Get pending invoices
const getPendingInvoices = async (req, res) => {
  try {
    const invoices = await SalesInvoice.getPendingInvoices();

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching pending invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending invoices',
      error: error.message
    });
  }
};

// Get overdue invoices
const getOverdueInvoices = async (req, res) => {
  try {
    const invoices = await SalesInvoice.getOverdueInvoices();

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue invoices',
      error: error.message
    });
  }
};

// Get invoices by customer
const getInvoicesByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const invoices = await SalesInvoice.getInvoicesByCustomer(customer_id);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices by customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices by customer',
      error: error.message
    });
  }
};

// Get sales statistics
const getSalesStatistics = async (req, res) => {
  try {
    const statistics = await SalesInvoice.getSalesStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllSalesInvoices,
  getSalesInvoiceById,
  createSalesInvoice,
  updateSalesInvoice,
  cancelSalesInvoice,
  sendSalesInvoice,
  recordPayment,
  getPendingInvoices,
  getOverdueInvoices,
  getInvoicesByCustomer,
  getSalesStatistics
};