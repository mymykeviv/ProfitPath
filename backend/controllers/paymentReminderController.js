const { PaymentReminder, Customer, Supplier, SalesInvoice, PurchaseOrder } = require('../models');
const { Op } = require('sequelize');

// Get all payment reminders with filtering and pagination
const getAllPaymentReminders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      reminder_type,
      status,
      priority,
      customer_id,
      supplier_id,
      reference_type,
      overdue_days_min,
      overdue_days_max,
      start_date,
      end_date,
      sort_by = 'overdue_days',
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
        { message: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    if (reminder_type) {
      whereClause.reminder_type = reminder_type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
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

    if (overdue_days_min !== undefined) {
      whereClause.overdue_days = {
        ...whereClause.overdue_days,
        [Op.gte]: parseInt(overdue_days_min)
      };
    }

    if (overdue_days_max !== undefined) {
      whereClause.overdue_days = {
        ...whereClause.overdue_days,
        [Op.lte]: parseInt(overdue_days_max)
      };
    }

    if (start_date && end_date) {
      whereClause.reminder_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.reminder_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.reminder_date = {
        [Op.lte]: end_date
      };
    }

    // Include related data if requested
    if (include_customer === 'true') {
      includeClause.push({
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'customer_code', 'email', 'phone', 'contact_person']
      });
    }

    if (include_supplier === 'true') {
      includeClause.push({
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'supplier_code', 'email', 'phone', 'contact_person']
      });
    }

    const { count, rows } = await PaymentReminder.findAndCountAll({
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
    console.error('Error fetching payment reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment reminders',
      error: error.message
    });
  }
};

// Get payment reminder by ID
const getPaymentReminderById = async (req, res) => {
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

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true },
      include: includeClause
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error fetching payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment reminder',
      error: error.message
    });
  }
};

// Create new payment reminder
const createPaymentReminder = async (req, res) => {
  try {
    const reminderData = req.body;

    // Validate customer or supplier is provided
    if (!reminderData.customer_id && !reminderData.supplier_id) {
      return res.status(400).json({
        success: false,
        message: 'Either customer_id or supplier_id must be provided'
      });
    }

    // Validate reference exists
    if (reminderData.reference_id && reminderData.reference_type) {
      let referenceExists = false;
      
      if (reminderData.reference_type === 'sales_invoice') {
        const invoice = await SalesInvoice.findByPk(reminderData.reference_id);
        referenceExists = !!invoice;
      } else if (reminderData.reference_type === 'purchase_order') {
        const order = await PurchaseOrder.findByPk(reminderData.reference_id);
        referenceExists = !!order;
      }

      if (!referenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Referenced document not found'
        });
      }
    }

    const reminder = await PaymentReminder.create(reminderData);

    res.status(201).json({
      success: true,
      message: 'Payment reminder created successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error creating payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment reminder',
      error: error.message
    });
  }
};

// Update payment reminder
const updatePaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.update(updateData);

    res.json({
      success: true,
      message: 'Payment reminder updated successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error updating payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment reminder',
      error: error.message
    });
  }
};

// Delete payment reminder (soft delete)
const deletePaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.update({ is_active: false });

    res.json({
      success: true,
      message: 'Payment reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment reminder',
      error: error.message
    });
  }
};

// Get pending reminders
const getPendingReminders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      priority,
      sort_by = 'priority',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'pending',
      is_active: true
    };

    if (priority) {
      whereClause.priority = priority;
    }

    const { count, rows } = await PaymentReminder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'customer_code', 'email', 'phone']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'supplier_code', 'email', 'phone']
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
    console.error('Error fetching pending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reminders',
      error: error.message
    });
  }
};

// Get overdue reminders
const getOverdueReminders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      min_days = 1,
      sort_by = 'overdue_days',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      overdue_days: {
        [Op.gte]: parseInt(min_days)
      },
      status: {
        [Op.in]: ['pending', 'sent']
      },
      is_active: true
    };

    const { count, rows } = await PaymentReminder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'customer_code', 'email', 'phone']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'supplier_code', 'email', 'phone']
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
    console.error('Error fetching overdue reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue reminders',
      error: error.message
    });
  }
};

// Get aging report
const getAgingReport = async (req, res) => {
  try {
    const {
      customer_ids,
      supplier_ids,
      as_of_date,
      reference_type
    } = req.query;

    const options = {};

    if (customer_ids) {
      options.customerIds = customer_ids.split(',');
    }

    if (supplier_ids) {
      options.supplierIds = supplier_ids.split(',');
    }

    if (as_of_date) {
      options.asOfDate = new Date(as_of_date);
    }

    if (reference_type) {
      options.referenceType = reference_type;
    }

    const agingReport = await PaymentReminder.getAgingReport(options);

    res.json({
      success: true,
      data: agingReport
    });
  } catch (error) {
    console.error('Error generating aging report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate aging report',
      error: error.message
    });
  }
};

// Get reminders due today
const getRemindersDueToday = async (req, res) => {
  try {
    const reminders = await PaymentReminder.getDueToday();

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders due today:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders due today',
      error: error.message
    });
  }
};

// Mark reminder as sent
const markReminderAsSent = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.markAsSent();
    
    if (notes) {
      await reminder.update({ notes });
    }

    res.json({
      success: true,
      message: 'Reminder marked as sent successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark reminder as sent',
      error: error.message
    });
  }
};

// Mark reminder as acknowledged
const markReminderAsAcknowledged = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.markAsAcknowledged();
    
    if (notes) {
      await reminder.update({ notes });
    }

    res.json({
      success: true,
      message: 'Reminder marked as acknowledged successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error marking reminder as acknowledged:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark reminder as acknowledged',
      error: error.message
    });
  }
};

// Mark reminder as resolved
const markReminderAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.markAsResolved();
    
    if (notes) {
      await reminder.update({ notes });
    }

    res.json({
      success: true,
      message: 'Reminder marked as resolved successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error marking reminder as resolved:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark reminder as resolved',
      error: error.message
    });
  }
};

// Escalate reminder
const escalateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const reminder = await PaymentReminder.findOne({
      where: { id, is_active: true }
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }

    await reminder.escalate();
    
    if (notes) {
      await reminder.update({ notes });
    }

    res.json({
      success: true,
      message: 'Reminder escalated successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error escalating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate reminder',
      error: error.message
    });
  }
};

// Update overdue days for all active reminders
const updateOverdueDays = async (req, res) => {
  try {
    await PaymentReminder.updateOverdueDays();

    res.json({
      success: true,
      message: 'Overdue days updated successfully'
    });
  } catch (error) {
    console.error('Error updating overdue days:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update overdue days',
      error: error.message
    });
  }
};

module.exports = {
  getAllPaymentReminders,
  getPaymentReminderById,
  createPaymentReminder,
  updatePaymentReminder,
  deletePaymentReminder,
  getPendingReminders,
  getOverdueReminders,
  getAgingReport,
  getRemindersDueToday,
  markReminderAsSent,
  markReminderAsAcknowledged,
  markReminderAsResolved,
  escalateReminder,
  updateOverdueDays
};