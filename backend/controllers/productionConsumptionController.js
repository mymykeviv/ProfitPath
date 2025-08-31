const { ProductionConsumption, ProductionBatch, BOMItem, Product, BOM } = require('../models');
const { Op } = require('sequelize');

// Get all production consumptions with filtering and pagination
const getAllProductionConsumptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      production_batch_id,
      raw_material_id,
      bom_item_id,
      operator,
      work_center,
      date_from,
      date_to,
      search,
      sort_by = 'consumption_date',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (production_batch_id) {
      whereClause.production_batch_id = production_batch_id;
    }

    if (raw_material_id) {
      whereClause.raw_material_id = raw_material_id;
    }

    if (bom_item_id) {
      whereClause.bom_item_id = bom_item_id;
    }

    if (operator) {
      whereClause.operator = { [Op.like]: `%${operator}%` };
    }

    if (work_center) {
      whereClause.work_center = { [Op.like]: `%${work_center}%` };
    }

    if (date_from || date_to) {
      whereClause.consumption_date = {};
      if (date_from) {
        whereClause.consumption_date[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        whereClause.consumption_date[Op.lte] = new Date(date_to);
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { '$productionBatch.batch_number$': { [Op.like]: `%${search}%` } },
        { '$rawMaterial.name$': { [Op.like]: `%${search}%` } },
        { '$rawMaterial.sku$': { [Op.like]: `%${search}%` } },
        { operator: { [Op.like]: `%${search}%` } },
        { work_center: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ProductionConsumption.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProductionBatch,
          as: 'productionBatch',
          attributes: ['id', 'batch_number', 'status'],
          include: [
            {
              model: Product,
              as: 'finishedProduct',
              attributes: ['id', 'name', 'sku']
            }
          ]
        },
        {
          model: BOMItem,
          as: 'bomItem',
          attributes: ['id', 'quantity_required', 'wastage_percentage'],
          include: [
            {
              model: BOM,
              as: 'bom',
              attributes: ['id', 'bom_number', 'version']
            }
          ]
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'cost_price']
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
    console.error('Error fetching production consumptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production consumptions',
      error: error.message
    });
  }
};

// Get production consumption by ID
const getProductionConsumptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const consumption = await ProductionConsumption.findByPk(id, {
      include: [
        {
          model: ProductionBatch,
          as: 'productionBatch',
          attributes: ['id', 'batch_number', 'status', 'planned_quantity', 'actual_quantity'],
          include: [
            {
              model: Product,
              as: 'finishedProduct',
              attributes: ['id', 'name', 'sku', 'unit_of_measure']
            },
            {
              model: BOM,
              as: 'bom',
              attributes: ['id', 'bom_number', 'version']
            }
          ]
        },
        {
          model: BOMItem,
          as: 'bomItem',
          attributes: ['id', 'quantity_required', 'wastage_percentage', 'unit_of_measure']
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'cost_price', 'current_stock']
        }
      ]
    });

    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: 'Production consumption not found'
      });
    }

    res.json({
      success: true,
      data: consumption
    });
  } catch (error) {
    console.error('Error fetching production consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production consumption',
      error: error.message
    });
  }
};

// Create new production consumption
const createProductionConsumption = async (req, res) => {
  try {
    const {
      production_batch_id,
      bom_item_id,
      raw_material_id,
      planned_quantity,
      actual_quantity,
      wastage_quantity,
      unit_of_measure,
      unit_cost,
      consumption_date,
      operator,
      work_center,
      notes
    } = req.body;

    // Validate production batch exists
    const productionBatch = await ProductionBatch.findByPk(production_batch_id);
    if (!productionBatch) {
      return res.status(400).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Validate BOM item exists
    const bomItem = await BOMItem.findByPk(bom_item_id);
    if (!bomItem) {
      return res.status(400).json({
        success: false,
        message: 'BOM item not found'
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

    // Create production consumption
    const consumption = await ProductionConsumption.create({
      production_batch_id,
      bom_item_id,
      raw_material_id,
      planned_quantity,
      actual_quantity,
      wastage_quantity: wastage_quantity || 0,
      unit_of_measure,
      unit_cost,
      consumption_date: consumption_date || new Date(),
      operator,
      work_center,
      notes
    });

    // Fetch the created consumption with associations
    const createdConsumption = await ProductionConsumption.findByPk(consumption.id, {
      include: [
        {
          model: ProductionBatch,
          as: 'productionBatch',
          attributes: ['id', 'batch_number', 'status']
        },
        {
          model: BOMItem,
          as: 'bomItem',
          attributes: ['id', 'quantity_required', 'wastage_percentage']
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'cost_price']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Production consumption created successfully',
      data: createdConsumption
    });
  } catch (error) {
    console.error('Error creating production consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create production consumption',
      error: error.message
    });
  }
};

// Update production consumption
const updateProductionConsumption = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const consumption = await ProductionConsumption.findByPk(id);
    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: 'Production consumption not found'
      });
    }

    // Update consumption
    await consumption.update(updateData);

    // Fetch updated consumption with associations
    const updatedConsumption = await ProductionConsumption.findByPk(id, {
      include: [
        {
          model: ProductionBatch,
          as: 'productionBatch',
          attributes: ['id', 'batch_number', 'status']
        },
        {
          model: BOMItem,
          as: 'bomItem',
          attributes: ['id', 'quantity_required', 'wastage_percentage']
        },
        {
          model: Product,
          as: 'rawMaterial',
          attributes: ['id', 'name', 'sku', 'unit_of_measure', 'unit_cost']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Production consumption updated successfully',
      data: updatedConsumption
    });
  } catch (error) {
    console.error('Error updating production consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update production consumption',
      error: error.message
    });
  }
};

// Delete production consumption
const deleteProductionConsumption = async (req, res) => {
  try {
    const { id } = req.params;

    const consumption = await ProductionConsumption.findByPk(id);
    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: 'Production consumption not found'
      });
    }

    await consumption.destroy();

    res.json({
      success: true,
      message: 'Production consumption deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete production consumption',
      error: error.message
    });
  }
};

// Get consumption by production batch
const getConsumptionByBatch = async (req, res) => {
  try {
    const { batch_id } = req.params;

    const consumptions = await ProductionConsumption.getConsumptionByBatch(batch_id);

    res.json({
      success: true,
      data: consumptions
    });
  } catch (error) {
    console.error('Error fetching consumption by batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consumption by batch',
      error: error.message
    });
  }
};

// Get consumption by material
const getConsumptionByMaterial = async (req, res) => {
  try {
    const { material_id } = req.params;
    const { date_from, date_to } = req.query;

    const consumptions = await ProductionConsumption.getConsumptionByMaterial(
      material_id,
      date_from ? new Date(date_from) : null,
      date_to ? new Date(date_to) : null
    );

    res.json({
      success: true,
      data: consumptions
    });
  } catch (error) {
    console.error('Error fetching consumption by material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consumption by material',
      error: error.message
    });
  }
};

// Get consumption statistics
const getConsumptionStatistics = async (req, res) => {
  try {
    const { date_from, date_to, material_id, batch_id } = req.query;

    const stats = await ProductionConsumption.getConsumptionStatistics({
      dateFrom: date_from ? new Date(date_from) : null,
      dateTo: date_to ? new Date(date_to) : null,
      materialId: material_id,
      batchId: batch_id
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching consumption statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consumption statistics',
      error: error.message
    });
  }
};

// Generate material usage report
const generateMaterialUsageReport = async (req, res) => {
  try {
    const { date_from, date_to, material_id } = req.query;

    const report = await ProductionConsumption.generateMaterialUsageReport({
      dateFrom: date_from ? new Date(date_from) : null,
      dateTo: date_to ? new Date(date_to) : null,
      materialId: material_id
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating material usage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate material usage report',
      error: error.message
    });
  }
};

// Validate consumption against BOM
const validateConsumptionAgainstBOM = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { production_quantity } = req.query;

    const validation = await ProductionConsumption.validateConsumptionAgainstBOM(
      batch_id,
      production_quantity ? parseFloat(production_quantity) : null
    );

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating consumption against BOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate consumption against BOM',
      error: error.message
    });
  }
};

// Get consumption variance analysis
const getConsumptionVarianceAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const consumption = await ProductionConsumption.findByPk(id);
    if (!consumption) {
      return res.status(404).json({
        success: false,
        message: 'Production consumption not found'
      });
    }

    const analysis = {
      consumption_id: consumption.id,
      planned_quantity: consumption.planned_quantity,
      actual_quantity: consumption.actual_quantity,
      wastage_quantity: consumption.wastage_quantity,
      variance: consumption.getVariance(),
      wastage_percentage: consumption.getWastagePercentage(),
      efficiency: consumption.getEfficiency(),
      total_cost: consumption.total_cost,
      unit_cost: consumption.unit_cost
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting consumption variance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get consumption variance analysis',
      error: error.message
    });
  }
};

module.exports = {
  getAllProductionConsumptions,
  getProductionConsumptionById,
  createProductionConsumption,
  updateProductionConsumption,
  deleteProductionConsumption,
  getConsumptionByBatch,
  getConsumptionByMaterial,
  getConsumptionStatistics,
  generateMaterialUsageReport,
  validateConsumptionAgainstBOM,
  getConsumptionVarianceAnalysis
};