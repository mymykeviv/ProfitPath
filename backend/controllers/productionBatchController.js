const { ProductionBatch, BOM, Product, ProductionConsumption, BOMItem } = require('../models');
const { Op } = require('sequelize');

// Get all production batches with filtering and pagination
const getAllProductionBatches = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      bom_id,
      finished_product_id,
      status,
      search,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (bom_id) {
      whereClause.bom_id = bom_id;
    }

    if (finished_product_id) {
      whereClause.finished_product_id = finished_product_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (date_from || date_to) {
      whereClause.planned_start_date = {};
      if (date_from) {
        whereClause.planned_start_date[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        whereClause.planned_start_date[Op.lte] = new Date(date_to);
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { batch_number: { [Op.like]: `%${search}%` } },
        { '$bom.bom_number$': { [Op.like]: `%${search}%` } },
        { '$finishedProduct.name$': { [Op.like]: `%${search}%` } },
        { '$finishedProduct.sku$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ProductionBatch.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status']
        },
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
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
    console.error('Error fetching production batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production batches',
      error: error.message
    });
  }
};

// Get production batch by ID
const getProductionBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status', 'quantity_produced'],
          include: [
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
        },
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        },
        {
          model: ProductionConsumption,
          as: 'consumptions',
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

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Error fetching production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production batch',
      error: error.message
    });
  }
};

// Create new production batch
const createProductionBatch = async (req, res) => {
  try {
    const {
      bom_id,
      finished_product_id,
      planned_quantity,
      unit_of_measure,
      planned_start_date,
      planned_end_date,
      material_cost,
      labor_cost,
      overhead_cost
    } = req.body;

    // Validate BOM exists
    const bom = await BOM.findByPk(bom_id);
    if (!bom) {
      return res.status(400).json({
        success: false,
        message: 'BOM not found'
      });
    }

    // Validate finished product exists
    const finishedProduct = await Product.findByPk(finished_product_id);
    if (!finishedProduct) {
      return res.status(400).json({
        success: false,
        message: 'Finished product not found'
      });
    }

    // Create production batch
    const batch = await ProductionBatch.create({
      bom_id,
      finished_product_id,
      planned_quantity,
      unit_of_measure,
      planned_start_date,
      planned_end_date,
      material_cost: material_cost || 0,
      labor_cost: labor_cost || 0,
      overhead_cost: overhead_cost || 0,
      status: 'planned'
    });

    // Fetch the created batch with associations
    const createdBatch = await ProductionBatch.findByPk(batch.id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status']
        },
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Production batch created successfully',
      data: createdBatch
    });
  } catch (error) {
    console.error('Error creating production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create production batch',
      error: error.message
    });
  }
};

// Update production batch
const updateProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Update batch
    await batch.update(updateData);

    // Fetch updated batch with associations
    const updatedBatch = await ProductionBatch.findByPk(id, {
      include: [
        {
          model: BOM,
          as: 'bom',
          attributes: ['id', 'bom_number', 'version', 'status']
        },
        {
          model: Product,
          as: 'finishedProduct',
          attributes: ['id', 'name', 'sku', 'unit_of_measure']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Production batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    console.error('Error updating production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update production batch',
      error: error.message
    });
  }
};

// Delete production batch (soft delete)
const deleteProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    await batch.destroy();

    res.json({
      success: true,
      message: 'Production batch deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete production batch',
      error: error.message
    });
  }
};

// Start production batch
const startProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    await batch.start();

    res.json({
      success: true,
      message: 'Production batch started successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error starting production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start production batch',
      error: error.message
    });
  }
};

// Complete production batch
const completeProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_quantity, scrap_quantity, quality_status } = req.body;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Update quantities if provided
    if (actual_quantity !== undefined) {
      batch.actual_quantity = actual_quantity;
    }
    if (scrap_quantity !== undefined) {
      batch.scrap_quantity = scrap_quantity;
    }
    if (quality_status !== undefined) {
      batch.quality_status = quality_status;
    }

    await batch.complete();

    res.json({
      success: true,
      message: 'Production batch completed successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error completing production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete production batch',
      error: error.message
    });
  }
};

// Cancel production batch
const cancelProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    await batch.cancel();

    res.json({
      success: true,
      message: 'Production batch cancelled successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error cancelling production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel production batch',
      error: error.message
    });
  }
};

// Hold production batch
const holdProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    await batch.hold();

    res.json({
      success: true,
      message: 'Production batch put on hold successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error holding production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to hold production batch',
      error: error.message
    });
  }
};

// Resume production batch
const resumeProductionBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    await batch.resume();

    res.json({
      success: true,
      message: 'Production batch resumed successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error resuming production batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume production batch',
      error: error.message
    });
  }
};

// Get active production batches
const getActiveProductionBatches = async (req, res) => {
  try {
    const batches = await ProductionBatch.getActiveBatches();

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching active production batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active production batches',
      error: error.message
    });
  }
};

// Get production batches by product
const getProductionBatchesByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const batches = await ProductionBatch.getBatchesByProduct(product_id);

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching production batches by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production batches',
      error: error.message
    });
  }
};

// Get production statistics
const getProductionStatistics = async (req, res) => {
  try {
    const { date_from, date_to, product_id } = req.query;

    const stats = await ProductionBatch.getProductionStatistics({
      dateFrom: date_from,
      dateTo: date_to,
      productId: product_id
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching production statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production statistics',
      error: error.message
    });
  }
};

// Get batch efficiency metrics
const getBatchEfficiencyMetrics = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await ProductionBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    const metrics = {
      batch_id: batch.id,
      batch_number: batch.batch_number,
      efficiency: batch.getEfficiency(),
      yield: batch.getYield(),
      duration_hours: batch.getDurationInHours(),
      cost_per_unit: batch.cost_per_unit,
      total_cost: batch.total_cost,
      planned_quantity: batch.planned_quantity,
      actual_quantity: batch.actual_quantity,
      scrap_quantity: batch.scrap_quantity,
      status: batch.status,
      quality_status: batch.quality_status
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching batch efficiency metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch efficiency metrics',
      error: error.message
    });
  }
};

module.exports = {
  getAllProductionBatches,
  getProductionBatchById,
  createProductionBatch,
  updateProductionBatch,
  deleteProductionBatch,
  startProductionBatch,
  completeProductionBatch,
  cancelProductionBatch,
  holdProductionBatch,
  resumeProductionBatch,
  getActiveProductionBatches,
  getProductionBatchesByProduct,
  getProductionStatistics,
  getBatchEfficiencyMetrics
};