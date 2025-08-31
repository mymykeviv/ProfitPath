import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Button from '../Button/Button';
import Input from '../Input/Input';
import Form, { FormField, FormSectionComponent, useFormValidation } from '../Form/Form';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    minWidth: '600px',
    maxWidth: '800px',
  },
}));

const validationRules = {
  name: {
    required: true,
    minLength: 2,
    requiredMessage: 'Product name is required',
    minLengthMessage: 'Product name must be at least 2 characters',
  },
  sku: {
    required: true,
    pattern: /^[A-Z0-9-_]+$/,
    requiredMessage: 'SKU is required',
    patternMessage: 'SKU must contain only uppercase letters, numbers, hyphens, and underscores',
  },
  category: {
    required: true,
    requiredMessage: 'Category is required',
  },
  unit: {
    required: true,
    requiredMessage: 'Unit of measurement is required',
  },
  costPrice: {
    required: true,
    custom: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return 'Cost price must be a valid positive number';
      }
      return '';
    },
  },
  sellingPrice: {
    required: true,
    custom: (value, values) => {
      const num = parseFloat(value);
      const costPrice = parseFloat(values.costPrice);
      if (isNaN(num) || num < 0) {
        return 'Selling price must be a valid positive number';
      }
      if (!isNaN(costPrice) && num < costPrice) {
        return 'Selling price should not be less than cost price';
      }
      return '';
    },
  },
  minStockLevel: {
    custom: (value) => {
      if (value && (isNaN(value) || parseFloat(value) < 0)) {
        return 'Minimum stock level must be a valid positive number';
      }
      return '';
    },
  },
  maxStockLevel: {
    custom: (value, values) => {
      const minStock = parseFloat(values.minStockLevel);
      if (value && (isNaN(value) || parseFloat(value) < 0)) {
        return 'Maximum stock level must be a valid positive number';
      }
      if (value && !isNaN(minStock) && parseFloat(value) < minStock) {
        return 'Maximum stock level should be greater than minimum stock level';
      }
      return '';
    },
  },
};

const categories = [
  'Raw Materials',
  'Finished Goods',
  'Work in Progress',
  'Consumables',
  'Spare Parts',
  'Packaging Materials',
  'Trading Goods',
];

const units = [
  'Pieces (Pcs)',
  'Kilograms (Kg)',
  'Grams (g)',
  'Liters (L)',
  'Milliliters (ml)',
  'Meters (m)',
  'Centimeters (cm)',
  'Square Meters (sqm)',
  'Cubic Meters (cbm)',
  'Boxes',
  'Cartons',
  'Dozens',
];

const taxRates = [
  { value: 0, label: '0% (Exempt)' },
  { value: 5, label: '5% GST' },
  { value: 12, label: '12% GST' },
  { value: 18, label: '18% GST' },
  { value: 28, label: '28% GST' },
];

function ProductForm({ open, onClose, product = null, onSubmit, loading = false }) {
  const isEdit = Boolean(product);
  
  const initialValues = {
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    category: product?.category || '',
    unit: product?.unit || '',
    costPrice: product?.costPrice || '',
    sellingPrice: product?.sellingPrice || '',
    taxRate: product?.taxRate || 18,
    minStockLevel: product?.minStockLevel || '',
    maxStockLevel: product?.maxStockLevel || '',
    reorderPoint: product?.reorderPoint || '',
    batchTracking: product?.batchTracking || false,
    serialTracking: product?.serialTracking || false,
    expiryTracking: product?.expiryTracking || false,
    active: product?.active !== undefined ? product.active : true,
    tags: product?.tags || [],
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
  } = useFormValidation(initialValues, validationRules);

  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open && !isEdit) {
      reset();
      setTagInput('');
      setSubmitError('');
    }
  }, [open, isEdit, reset]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    handleChange(field, value);
  };

  const handleInputBlur = (field) => () => {
    handleBlur(field);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !values.tags.includes(tagInput.trim())) {
      handleChange('tags', [...values.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    handleChange('tags', values.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'An error occurred while saving the product');
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(values.costPrice);
    const selling = parseFloat(values.sellingPrice);
    if (!isNaN(cost) && !isNaN(selling) && cost > 0) {
      return (((selling - cost) / cost) * 100).toFixed(2);
    }
    return '0.00';
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isEdit ? 'Update product information' : 'Create a new product in your catalog'}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} showActions={false}>
          <FormSectionComponent title="Basic Information">
            <FormField xs={12} md={8}>
              <Input
                label="Product Name"
                name="name"
                value={values.name}
                onChange={handleInputChange('name')}
                onBlur={handleInputBlur('name')}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
                required
                placeholder="Enter product name"
              />
            </FormField>
            
            <FormField xs={12} md={4}>
              <Input
                label="SKU"
                name="sku"
                value={values.sku}
                onChange={handleInputChange('sku')}
                onBlur={handleInputBlur('sku')}
                error={touched.sku && Boolean(errors.sku)}
                helperText={touched.sku && errors.sku}
                required
                placeholder="e.g., PROD-001"
              />
            </FormField>
            
            <FormField xs={12}>
              <Input
                label="Description"
                name="description"
                value={values.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
                placeholder="Enter product description"
              />
            </FormField>
            
            <FormField xs={12} md={6}>
              <Input
                label="Category"
                name="category"
                select
                value={values.category}
                onChange={handleInputChange('category')}
                onBlur={handleInputBlur('category')}
                error={touched.category && Boolean(errors.category)}
                helperText={touched.category && errors.category}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Input>
            </FormField>
            
            <FormField xs={12} md={6}>
              <Input
                label="Unit of Measurement"
                name="unit"
                select
                value={values.unit}
                onChange={handleInputChange('unit')}
                onBlur={handleInputBlur('unit')}
                error={touched.unit && Boolean(errors.unit)}
                helperText={touched.unit && errors.unit}
                required
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Input>
            </FormField>
          </FormSectionComponent>
          
          <FormSectionComponent title="Pricing & Tax">
            <FormField xs={12} md={4}>
              <Input
                label="Cost Price"
                name="costPrice"
                type="number"
                value={values.costPrice}
                onChange={handleInputChange('costPrice')}
                onBlur={handleInputBlur('costPrice')}
                error={touched.costPrice && Boolean(errors.costPrice)}
                helperText={touched.costPrice && errors.costPrice}
                required
                placeholder="0.00"
                startAdornment="₹"
              />
            </FormField>
            
            <FormField xs={12} md={4}>
              <Input
                label="Selling Price"
                name="sellingPrice"
                type="number"
                value={values.sellingPrice}
                onChange={handleInputChange('sellingPrice')}
                onBlur={handleInputBlur('sellingPrice')}
                error={touched.sellingPrice && Boolean(errors.sellingPrice)}
                helperText={touched.sellingPrice && errors.sellingPrice}
                required
                placeholder="0.00"
                startAdornment="₹"
              />
            </FormField>
            
            <FormField xs={12} md={4}>
              <Input
                label="Profit Margin"
                value={`${calculateMargin()}%`}
                disabled
                helperText="Calculated automatically"
              />
            </FormField>
            
            <FormField xs={12} md={6}>
              <Input
                label="Tax Rate"
                name="taxRate"
                select
                value={values.taxRate}
                onChange={handleInputChange('taxRate')}
              >
                {taxRates.map((rate) => (
                  <MenuItem key={rate.value} value={rate.value}>
                    {rate.label}
                  </MenuItem>
                ))}
              </Input>
            </FormField>
          </FormSectionComponent>
          
          <FormSectionComponent title="Inventory Management">
            <FormField xs={12} md={4}>
              <Input
                label="Minimum Stock Level"
                name="minStockLevel"
                type="number"
                value={values.minStockLevel}
                onChange={handleInputChange('minStockLevel')}
                onBlur={handleInputBlur('minStockLevel')}
                error={touched.minStockLevel && Boolean(errors.minStockLevel)}
                helperText={touched.minStockLevel && errors.minStockLevel}
                placeholder="0"
              />
            </FormField>
            
            <FormField xs={12} md={4}>
              <Input
                label="Maximum Stock Level"
                name="maxStockLevel"
                type="number"
                value={values.maxStockLevel}
                onChange={handleInputChange('maxStockLevel')}
                onBlur={handleInputBlur('maxStockLevel')}
                error={touched.maxStockLevel && Boolean(errors.maxStockLevel)}
                helperText={touched.maxStockLevel && errors.maxStockLevel}
                placeholder="0"
              />
            </FormField>
            
            <FormField xs={12} md={4}>
              <Input
                label="Reorder Point"
                name="reorderPoint"
                type="number"
                value={values.reorderPoint}
                onChange={handleInputChange('reorderPoint')}
                placeholder="0"
                helperText="Stock level to trigger reorder"
              />
            </FormField>
          </FormSectionComponent>
          
          <FormSectionComponent title="Tracking Options">
            <FormField xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.batchTracking}
                    onChange={handleInputChange('batchTracking')}
                    name="batchTracking"
                  />
                }
                label="Batch Tracking"
              />
              <Typography variant="caption" color="textSecondary">
                Track products by batch numbers
              </Typography>
            </FormField>
            
            <FormField xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.serialTracking}
                    onChange={handleInputChange('serialTracking')}
                    name="serialTracking"
                  />
                }
                label="Serial Tracking"
              />
              <Typography variant="caption" color="textSecondary">
                Track individual serial numbers
              </Typography>
            </FormField>
            
            <FormField xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.expiryTracking}
                    onChange={handleInputChange('expiryTracking')}
                    name="expiryTracking"
                  />
                }
                label="Expiry Tracking"
              />
              <Typography variant="caption" color="textSecondary">
                Track expiry dates
              </Typography>
            </FormField>
          </FormSectionComponent>
          
          <FormSectionComponent title="Tags & Status">
            <FormField xs={12}>
              <Input
                label="Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add tags (press Enter to add)"
                helperText="Add tags to categorize and search products easily"
                endAdornment={
                  <Button
                    size="small"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                }
              />
              {values.tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {values.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </FormField>
            
            <FormField xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.active}
                    onChange={handleInputChange('active')}
                    name="active"
                  />
                }
                label="Active Product"
              />
              <Typography variant="caption" color="textSecondary">
                Inactive products won't appear in sales transactions
              </Typography>
            </FormField>
          </FormSectionComponent>
        </Form>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
        >
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default ProductForm;