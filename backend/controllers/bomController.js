const { BOM, BOMItem, Product } = require('../models');
const { Op } = require('sequelize');

// Get all BOMs with filtering and pagination
const getAllBOMs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      finished_product_id,
      status,
      version,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (finished_product_id) {
      whereClause.finished_product_id = finished_product_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (version) {
      whereClause.version = version;
    }

    if (search) {
      whereClause[Op.or] = [
        { bom_number: { [Op.like]: `%${search}%` } },
        { '$finishedProduct.name$': { [Op.like]: `%${search}%` } },
        { '$finishedProduct.sku$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await BOM.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: BOMItem,
          as: 'bomItems',
          include: [
            {
              model: Product,
              as: 'rawMaterial',
              attributes: ['id', 'name', 'sku', 'unit_of_measure']
            }
          ]
        }
      ],
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
    console.error('Error fetching BOMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOMs',
      error: error.message
    });
  }
};

// Get BOM by ID
const getBOMById = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await BOM.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: BOMItem,
          as: 'bomItems',
          include: [
            {
              model: Product,
              as: 'rawMaterial',
              attributes: ['id', 'name', 'sku', 'unit_of_measure', 'current_stock']
            }
          ]
        }
      ]
    });

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    res.json({
      success: true,
      data: bom
    });
  } catch (error) {
    console.error('Error fetching BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM',
      error: error.message
    });
  }
};

// Create new BOM
const createBOM = async (req, res) => {
  try {
    const {
      finished_product_id,
      version,
      quantity_produced,
      unit_of_measure,
      effective_date,
      expiry_date,
      bom_items
    } = req.body;

    // Validate finished product exists
    const finishedProduct = await Product.findByPk(finished_product_id);
    if (!finishedProduct) {
      return res.status(400).json({
        success: false,
        message: 'Finished product not found'
      });
    }

    // Create BOM
    const bom = await BOM.create({
      finished_product_id,
      version,
      quantity_produced,
      unit_of_measure,
      effective_date,
      expiry_date,
      status: 'draft'
    });

    // Create BOM items if provided
    if (bom_items && bom_items.length > 0) {
      const bomItemsData = bom_items.map(item => ({
        bom_id: bom.id,
        raw_material_id: item.raw_material_id,
        quantity_required: item.quantity_required,
        unit_of_measure: item.unit_of_measure,
        wastage_percentage: item.wastage_percentage || 0
      }));

      await BOMItem.bulkCreate(bomItemsData);
    }

    // Fetch the created BOM with associations
    const createdBOM = await BOM.findByPk(bom.id, {
      include: [
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: BOMItem,
          as: 'bomItems',
          include: [
            {
              model: Product,
              as: 'rawMaterial',
              attributes: ['id', 'name', 'sku', 'unit_of_measure']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'BOM created successfully',
      data: createdBOM
    });
  } catch (error) {
    console.error('Error creating BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create BOM',
      error: error.message
    });
  }
};

// Update BOM
const updateBOM = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bom = await BOM.findByPk(id);
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    // Update BOM
    await bom.update(updateData);

    // Fetch updated BOM with associations
    const updatedBOM = await BOM.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: BOMItem,
          as: 'bomItems',
          include: [
            {
              model: Product,
              as: 'rawMaterial',
              attributes: ['id', 'name', 'sku', 'unit_of_measure']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'BOM updated successfully',
      data: updatedBOM
    });
  } catch (error) {
    console.error('Error updating BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update BOM',
      error: error.message
    });
  }
};

// Delete BOM (soft delete)
const deleteBOM = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await BOM.findByPk(id);
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    await bom.destroy();

    res.json({
      success: true,
      message: 'BOM deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete BOM',
      error: error.message
    });
  }
};

// Get active BOMs for a product
const getActiveBOMsForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const boms = await BOM.getActiveBOMForProduct(product_id);

    res.json({
      success: true,
      data: boms
    });
  } catch (error) {
    console.error('Error fetching active BOMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active BOMs',
      error: error.message
    });
  }
};

// Activate BOM
const activateBOM = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await BOM.findByPk(id);
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    await bom.activate();

    res.json({
      success: true,
      message: 'BOM activated successfully',
      data: bom
    });
  } catch (error) {
    console.error('Error activating BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate BOM',
      error: error.message
    });
  }
};

// Deactivate BOM
const deactivateBOM = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await BOM.findByPk(id);
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    await bom.deactivate();

    res.json({
      success: true,
      message: 'BOM deactivated successfully',
      data: bom
    });
  } catch (error) {
    console.error('Error deactivating BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate BOM',
      error: error.message
    });
  }
};

// Archive BOM
const archiveBOM = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await BOM.findByPk(id);
    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found'
      });
    }

    await bom.archive();

    res.json({
      success: true,
      message: 'BOM archived successfully',
      data: bom
    });
  } catch (error) {
    console.error('Error archiving BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive BOM',
      error: error.message
    });
  }
};

module.exports = {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getActiveBOMsForProduct,
  activateBOM,
  deactivateBOM,
  archiveBOM
};