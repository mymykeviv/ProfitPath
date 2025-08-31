const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    }
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  color_code: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'categories',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['level']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    }
  ],
  hooks: {
    beforeSave: async (category) => {
      // Calculate level based on parent
      if (category.parent_id) {
        const parent = await Category.findByPk(category.parent_id);
        if (parent) {
          category.level = parent.level + 1;
          
          // Prevent circular references
          if (category.id === category.parent_id) {
            throw new Error('Category cannot be its own parent');
          }
          
          // Check for circular reference in hierarchy
          let currentParent = parent;
          while (currentParent && currentParent.parent_id) {
            if (currentParent.parent_id === category.id) {
              throw new Error('Circular reference detected in category hierarchy');
            }
            currentParent = await Category.findByPk(currentParent.parent_id);
          }
        }
      } else {
        category.level = 1;
      }
      
      // Validate maximum depth
      if (category.level > 5) {
        throw new Error('Category hierarchy cannot exceed 5 levels');
      }
    }
  }
});

// Define associations
Category.hasMany(Category, {
  as: 'children',
  foreignKey: 'parent_id'
});

Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parent_id'
});

// Instance methods
Category.prototype.getFullPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parent_id) {
    current = await Category.findByPk(current.parent_id);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' > ');
};

Category.prototype.getAllChildren = async function() {
  const children = await Category.findAll({
    where: { parent_id: this.id },
    include: [{
      model: Category,
      as: 'children',
      required: false
    }]
  });
  
  let allChildren = [...children];
  
  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = allChildren.concat(grandChildren);
  }
  
  return allChildren;
};

// Class methods
Category.getRootCategories = async function() {
  return await this.findAll({
    where: {
      parent_id: null,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

Category.getCategoryTree = async function() {
  const buildTree = async (parentId = null, level = 1) => {
    const categories = await Category.findAll({
      where: {
        parent_id: parentId,
        is_active: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    
    const tree = [];
    for (const category of categories) {
      const node = {
        ...category.toJSON(),
        children: await buildTree(category.id, level + 1)
      };
      tree.push(node);
    }
    
    return tree;
  };
  
  return await buildTree();
};

Category.getByPath = async function(path) {
  const pathArray = path.split(' > ').map(p => p.trim());
  let currentCategory = null;
  
  for (const categoryName of pathArray) {
    const where = {
      name: categoryName,
      is_active: true
    };
    
    if (currentCategory) {
      where.parent_id = currentCategory.id;
    } else {
      where.parent_id = null;
    }
    
    currentCategory = await Category.findOne({ where });
    
    if (!currentCategory) {
      return null;
    }
  }
  
  return currentCategory;
};

module.exports = Category;