const { BOMItem, BOM, Product } = require('../models');
const { Op } = require('sequelize');

// Get all BOM items with filtering and pagination
const getAllBOMItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      bom_id,
      raw_material_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (bom_id) {
      whereClause.bom_id = bom_id;
    }

    if (raw_material_id) {
      whereClause.raw_material_id = raw_material_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { '$bom.bom_number$': { [Op.like]: `%${search}%` } },
        { '$rawMaterial.name$': { [Op.like]: `%${search}%` } },
        { '$rawMaterial.sku$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await BOMItem.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status'],
          include: [
            {
              model: Product,
              as: 'finishedProduct',
              attributes: ['id', 'name', 'sku']
            }
          ]
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'current_stock', 'cost_price']
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
    console.error('Error fetching BOM items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM items',
      error: error.message
    });
  }
};

// Get BOM item by ID
const getBOMItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const bomItem = await BOMItem.findByPk(id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status', 'quantity_produced'],
          include: [
            {
              model: Product,
              as: 'finishedProduct',
              attributes: ['id', 'name', 'sku']
            }
          ]
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'current_stock', 'cost_price']
        }
      ]
    });

    if (!bomItem) {
      return res.status(404).json({
        success: false,
        message: 'BOM item not found'
      });
    }

    res.json({
      success: true,
      data: bomItem
    });
  } catch (error) {
    console.error('Error fetching BOM item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM item',
      error: error.message
    });
  }
};

// Create new BOM item
const createBOMItem = async (req, res) => {
  try {
    const {
      bom_id,
      raw_material_id,
      quantity_required,
      unit_of_measure,
      wastage_percentage
    } = req.body;

    // Validate BOM exists
    const bom = await BOM.findByPk(bom_id);
    if (!bom) {
      return res.status(400).json({
        success: false,
        message: 'BOM not found'
      });
    }

    // Validate raw material exists
    const rawMaterial = await Product.findByPk(raw_material_id);
    if (!rawMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    // Check if BOM item already exists for this BOM and raw material
    const existingBOMItem = await BOMItem.findOne({
      where: {
        bom_id,
        raw_material_id
      }
    });

    if (existingBOMItem) {
      return res.status(400).json({
        success: false,
        message: 'BOM item already exists for this raw material in this BOM'
      });
    }

    // Create BOM item
    const bomItem = await BOMItem.create({
      bom_id,
      raw_material_id,
      quantity_required,
      unit_of_measure,
      wastage_percentage: wastage_percentage || 0
    });

    // Fetch the created BOM item with associations
    const createdBOMItem = await BOMItem.findByPk(bomItem.id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status']
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'current_stock', 'unit_cost']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'BOM item created successfully',
      data: createdBOMItem
    });
  } catch (error) {
    console.error('Error creating BOM item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create BOM item',
      error: error.message
    });
  }
};

// Update BOM item
const updateBOMItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bomItem = await BOMItem.findByPk(id);
    if (!bomItem) {
      return res.status(404).json({
        success: false,
        message: 'BOM item not found'
      });
    }

    // Update BOM item
    await bomItem.update(updateData);

    // Fetch updated BOM item with associations
    const updatedBOMItem = await BOMItem.findByPk(id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status']
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'current_stock', 'unit_cost']
        }
      ]
    });

    res.json({
      success: true,
      message: 'BOM item updated successfully',
      data: updatedBOMItem
    });
  } catch (error) {
    console.error('Error updating BOM item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update BOM item',
      error: error.message
    });
  }
};

// Delete BOM item
const deleteBOMItem = async (req, res) => {
  try {
    const { id } = req.params;

    const bomItem = await BOMItem.findByPk(id);
    if (!bomItem) {
      return res.status(404).json({
        success: false,
        message: 'BOM item not found'
      });
    }

    await bomItem.destroy();

    res.json({
      success: true,
      message: 'BOM item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BOM item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete BOM item',
      error: error.message
    });
  }
};

// Get BOM items by BOM ID
const getBOMItemsByBOMId = async (req, res) => {
  try {
    const { bom_id } = req.params;

    const bomItems = await BOMItem.getItemsByBOM(bom_id);

    res.json({
      success: true,
      data: bomItems
    });
  } catch (error) {
    console.error('Error fetching BOM items by BOM ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BOM items',
      error: error.message
    });
  }
};

// Validate material availability for BOM
const validateMaterialAvailability = async (req, res) => {
  try {
    const { bom_id } = req.params;
    const { production_quantity = 1 } = req.query;

    const validation = await BOMItem.validateMaterialAvailability(bom_id, production_quantity);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating material availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate material availability',
      error: error.message
    });
  }
};

// Calculate total cost for BOM
const calculateBOMCost = async (req, res) => {
  try {
    const { bom_id } = req.params;
    const { production_quantity = 1 } = req.query;

    const bomItems = await BOMItem.findAll({
      where: { bom_id },
      include: [
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_cost']
        }
      ]
    });

    let totalCost = 0;
    const costBreakdown = [];

    for (const item of bomItems) {
      const effectiveQuantity = item.getEffectiveQuantity();
      const itemTotalCost = item.getTotalCost();
      const scaledCost = itemTotalCost * production_quantity;
      
      totalCost += scaledCost;
      
      costBreakdown.push({
        raw_material_id: item.raw_material_id,
        raw_material_name: item.rawMaterial.name,
        raw_material_sku: item.rawMaterial.sku,
        quantity_required: item.quantity_required,
        wastage_percentage: item.wastage_percentage,
        effective_quantity: effectiveQuantity,
        unit_cost: item.rawMaterial.cost_price,
        total_cost_per_unit: itemTotalCost,
        total_cost_for_production: scaledCost
      });
    }

    res.json({
      success: true,
      data: {
        bom_id,
        production_quantity,
        total_material_cost: totalCost,
        cost_per_unit: totalCost / production_quantity,
        cost_breakdown: costBreakdown
      }
    });
  } catch (error) {
    console.error('Error calculating BOM cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate BOM cost',
      error: error.message
    });
  }
};

module.exports = {
  getAllBOMItems,
  getBOMItemById,
  createBOMItem,
  updateBOMItem,
  deleteBOMItem,
  getBOMItemsByBOMId,
  validateMaterialAvailability,
  calculateBOMCost
};