const { SalesInvoiceItem, SalesInvoice, Product, Batch } = require('../models');
const { Op } = require('sequelize');

// Get all sales invoice items with filtering and pagination
const getAllSalesInvoiceItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sales_invoice_id,
      product_id,
      batch_id,
      sort_by = 'line_number',
      sort_order = 'ASC',
      include_invoice = false,
      include_product = false,
      include_batch = false
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const includeClause = [];

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { product_name: { [Op.like]: `%${search}%` } },
        { product_sku: { [Op.like]: `%${search}%` } },
        { product_description: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    if (sales_invoice_id) {
      whereClause.sales_invoice_id = sales_invoice_id;
    }

    if (product_id) {
      whereClause.product_id = product_id;
    }

    if (batch_id) {
      whereClause.batch_id = batch_id;
    }

    // Include related data if requested
    if (include_invoice === 'true') {
      includeClause.push({
        model: SalesInvoice,
        as: 'salesInvoice',
        attributes: ['id', 'invoice_number', 'invoice_date', 'status']
      });
    }

    if (include_product === 'true') {
      includeClause.push({
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'unit_of_measure', 'gst_rate']
      });
    }

    if (include_batch === 'true') {
      includeClause.push({
        model: Batch,
        as: 'batch',
        attributes: ['id', 'batch_number', 'expiry_date', 'manufacturing_date']
      });
    }

    const { count, rows } = await SalesInvoiceItem.findAndCountAll({
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
    console.error('Error fetching sales invoice items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales invoice items',
      error: error.message
    });
  }
};

// Get sales invoice item by ID
const getSalesInvoiceItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SalesInvoiceItem.findByPk(id, {
      include: [
        {
          model: SalesInvoice,
          as: 'salesInvoice',
          attributes: ['id', 'invoice_number', 'invoice_date', 'status']
        },
        {
          model: Product,
          as: 'product'
        },
        {
          model: Batch,
          as: 'batch'
        }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice item not found'
      });
    }

    // Add computed fields
    const itemData = item.toJSON();
    itemData.calculated_amounts = item.calculateAmounts();
    itemData.tax_breakdown = item.getTaxBreakdown();
    itemData.profit_margin = item.getProfitMargin();
    itemData.profit_amount = item.getProfitAmount();

    res.json({
      success: true,
      data: itemData
    });
  } catch (error) {
    console.error('Error fetching sales invoice item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales invoice item',
      error: error.message
    });
  }
};

// Create new sales invoice item
const createSalesInvoiceItem = async (req, res) => {
  try {
    const itemData = req.body;

    // Validate sales invoice exists
    const invoice = await SalesInvoice.findByPk(itemData.sales_invoice_id);
    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }

    // Check if invoice can be edited
    if (!invoice.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to invoice in current status'
      });
    }

    // Validate product exists
    const product = await Product.findByPk(itemData.product_id);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Set product details
    itemData.product_name = product.name;
    itemData.product_sku = product.sku;
    itemData.product_description = product.description;
    itemData.hsn_code = product.hsn_code;
    itemData.unit_of_measure = product.unit_of_measure;
    itemData.gst_rate = product.gst_rate;

    // Get next line number
    const maxLineNumber = await SalesInvoiceItem.max('line_number', {
      where: { sales_invoice_id: itemData.sales_invoice_id }
    });
    itemData.line_number = (maxLineNumber || 0) + 1;

    // Create the item
    const item = await SalesInvoiceItem.create(itemData);

    // Fetch the complete item with relations
    const completeItem = await SalesInvoiceItem.findByPk(item.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'batch_number']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sales invoice item created successfully',
      data: completeItem
    });
  } catch (error) {
    console.error('Error creating sales invoice item:', error);
    
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
      message: 'Failed to create sales invoice item',
      error: error.message
    });
  }
};

// Update sales invoice item
const updateSalesInvoiceItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SalesInvoiceItem.findByPk(id, {
      include: [{
        model: SalesInvoice,
        as: 'salesInvoice'
      }]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice item not found'
      });
    }

    // Check if invoice can be edited
    if (!item.salesInvoice.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit item - invoice is in non-editable status'
      });
    }

    await item.update(req.body);

    res.json({
      success: true,
      message: 'Sales invoice item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Error updating sales invoice item:', error);
    
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
      message: 'Failed to update sales invoice item',
      error: error.message
    });
  }
};

// Delete sales invoice item
const deleteSalesInvoiceItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SalesInvoiceItem.findByPk(id, {
      include: [{
        model: SalesInvoice,
        as: 'salesInvoice'
      }]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice item not found'
      });
    }

    // Check if invoice can be edited
    if (!item.salesInvoice.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item - invoice is in non-editable status'
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Sales invoice item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales invoice item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales invoice item',
      error: error.message
    });
  }
};

// Get items by sales invoice
const getItemsBySalesInvoice = async (req, res) => {
  try {
    const { sales_invoice_id } = req.params;

    const items = await SalesInvoiceItem.findAll({
      where: { sales_invoice_id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'batch_number', 'expiry_date']
        }
      ],
      order: [['line_number', 'ASC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items by sales invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items by sales invoice',
      error: error.message
    });
  }
};

// Get items by product
const getItemsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { start_date, end_date, limit = 50 } = req.query;

    const whereClause = { product_id };

    if (start_date && end_date) {
      whereClause['$salesInvoice.invoice_date$'] = {
        [Op.between]: [start_date, end_date]
      };
    }

    const items = await SalesInvoiceItem.findAll({
      where: whereClause,
      include: [
        {
          model: SalesInvoice,
          as: 'salesInvoice',
          attributes: ['id', 'invoice_number', 'invoice_date', 'status']
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['id', 'batch_number']
        }
      ],
      limit: parseInt(limit),
      order: [['salesInvoice', 'invoice_date', 'DESC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items by product',
      error: error.message
    });
  }
};

// Get sales analytics by product
const getSalesAnalyticsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const analytics = await SalesInvoiceItem.getSalesAnalyticsByProduct(product_id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching sales analytics by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics by product',
      error: error.message
    });
  }
};

// Get top selling products
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, start_date, end_date } = req.query;
    const products = await SalesInvoiceItem.getTopSellingProducts({
      limit: parseInt(limit),
      start_date,
      end_date
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling products',
      error: error.message
    });
  }
};

// Get profit analysis
const getProfitAnalysis = async (req, res) => {
  try {
    const { start_date, end_date, product_id, customer_id } = req.query;
    const analysis = await SalesInvoiceItem.getProfitAnalysis({
      start_date,
      end_date,
      product_id,
      customer_id
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching profit analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit analysis',
      error: error.message
    });
  }
};

module.exports = {
  getAllSalesInvoiceItems,
  getSalesInvoiceItemById,
  createSalesInvoiceItem,
  updateSalesInvoiceItem,
  deleteSalesInvoiceItem,
  getItemsBySalesInvoice,
  getItemsByProduct,
  getSalesAnalyticsByProduct,
  getTopSellingProducts,
  getProfitAnalysis
};