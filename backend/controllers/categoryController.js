const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class CategoryController {
  // Get all categories with optional tree structure
  static async getAllCategories(req, res) {
    try {
      const {
        tree = false,
        include_products = false,
        is_active = true,
        parent_id
      } = req.query;

      if (tree === 'true') {
        const categoryTree = await Category.getCategoryTree();
        return res.json({
          success: true,
          data: categoryTree
        });
      }

      const where = {};
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }
      if (parent_id !== undefined) {
        where.parent_id = parent_id === 'null' ? null : parent_id;
      }

      const include = [];
      if (include_products === 'true') {
        include.push({
          model: Product,
          as: 'products',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'sku', 'current_stock']
        });
      }

      const categories = await Category.findAll({
        where,
        include,
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get root categories (no parent)
  static async getRootCategories(req, res) {
    try {
      const categories = await Category.getRootCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching root categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch root categories',
        error: error.message
      });
    }
  }

  // Get category by ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const { include_products = false, include_children = false } = req.query;

      const include = [];
      
      if (include_products === 'true') {
        include.push({
          model: Product,
          as: 'products',
          where: { is_active: true },
          required: false
        });
      }

      if (include_children === 'true') {
        include.push({
          model: Category,
          as: 'children',
          where: { is_active: true },
          required: false
        });
      }

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name']
          },
          ...include
        ]
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Add computed fields
      const categoryData = category.toJSON();
      const enrichedCategory = {
        ...categoryData,
        full_path: await category.getFullPath(),
        product_count: categoryData.products ? categoryData.products.length : 0
      };

      res.json({
        success: true,
        data: enrichedCategory
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category',
        error: error.message
      });
    }
  }

  // Create new category
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const category = await Category.create(req.body);

      // Fetch the created category with parent info
      const createdCategory = await Category.findByPk(category.id, {
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: createdCategory
      });
    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error.message
      });
    }
  }

  // Update category
  static async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      await category.update(req.body);

      // Fetch updated category with parent info
      const updatedCategory = await Category.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
    } catch (error) {
      console.error('Error updating category:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  }

  // Delete category (soft delete)
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has products
      const productCount = await Product.count({
        where: {
          category_id: id,
          is_active: true
        }
      });

      if (productCount > 0 && force !== 'true') {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${productCount} active products. Use force=true to proceed.`,
          product_count: productCount
        });
      }

      // Check if category has children
      const childrenCount = await Category.count({
        where: {
          parent_id: id,
          is_active: true
        }
      });

      if (childrenCount > 0 && force !== 'true') {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${childrenCount} child categories. Use force=true to proceed.`,
          children_count: childrenCount
        });
      }

      if (force === 'true') {
        // Move products to null category
        await Product.update(
          { category_id: null },
          {
            where: {
              category_id: id,
              is_active: true
            }
          }
        );

        // Move child categories to parent or null
        await Category.update(
          { parent_id: category.parent_id },
          {
            where: {
              parent_id: id,
              is_active: true
            }
          }
        );
      }

      // Soft delete by setting is_active to false
      await category.update({ is_active: false });

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }

  // Get category by path
  static async getCategoryByPath(req, res) {
    try {
      const { path } = req.params;
      const category = await Category.getByPath(decodeURIComponent(path));

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error fetching category by path:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category',
        error: error.message
      });
    }
  }

  // Get category children
  static async getCategoryChildren(req, res) {
    try {
      const { id } = req.params;
      const { recursive = false } = req.query;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      let children;
      if (recursive === 'true') {
        children = await category.getAllChildren();
      } else {
        children = await Category.findAll({
          where: {
            parent_id: id,
            is_active: true
          },
          order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
      }

      res.json({
        success: true,
        data: children
      });
    } catch (error) {
      console.error('Error fetching category children:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category children',
        error: error.message
      });
    }
  }

  // Update category sort order
  static async updateSortOrder(req, res) {
    try {
      const { categories } = req.body;

      if (!Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: 'Categories array is required'
        });
      }

      // Update sort order for each category
      const updatePromises = categories.map((cat, index) => {
        return Category.update(
          { sort_order: index },
          { where: { id: cat.id } }
        );
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: 'Category sort order updated successfully'
      });
    } catch (error) {
      console.error('Error updating category sort order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category sort order',
        error: error.message
      });
    }
  }

  // Get category statistics
  static async getCategoryStats(req, res) {
    try {
      const totalCategories = await Category.count({ where: { is_active: true } });
      const rootCategories = await Category.count({
        where: {
          parent_id: null,
          is_active: true
        }
      });

      const categoriesWithProducts = await Category.findAll({
        attributes: [
          'id',
          'name',
          [sequelize.fn('COUNT', sequelize.col('products.id')), 'product_count']
        ],
        include: [
          {
            model: Product,
            as: 'products',
            where: { is_active: true },
            attributes: [],
            required: false
          }
        ],
        where: { is_active: true },
        group: ['Category.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('products.id')), 'DESC']]
      });

      res.json({
        success: true,
        data: {
          total_categories: totalCategories,
          root_categories: rootCategories,
          categories_with_products: categoriesWithProducts
        }
      });
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category statistics',
        error: error.message
      });
    }
  }
}

module.exports = CategoryController;