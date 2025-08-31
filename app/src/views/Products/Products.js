import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Checkbox,
  Toolbar,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../utils/api';
import ProductForm from '../../components/ProductForm/ProductForm';
import CustomCard from '../../components/Card/Card';

function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch products with pagination and search
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, rowsPerPage, searchTerm, categoryFilter, statusFilter, tabValue],
    queryFn: () => fetchProducts({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      tab: tabValue, // 0: all, 1: low stock, 2: out of stock
    }),
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setProductFormOpen(false);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setProductFormOpen(false);
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
    handleMenuClose();
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleProductSubmit = async (productData) => {
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      await createProductMutation.mutateAsync(productData);
    }
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await deleteProductMutation.mutateAsync(productToDelete.id);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = (event) => {
    if (event.target.checked) {
      setSelectedProducts(products.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'DISCONTINUED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return 'Out of Stock';
    if (product.currentStock <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const categories = ['Raw Materials', 'Finished Goods', 'Work in Progress', 'Consumables', 'Spare Parts', 'Packaging Materials', 'Trading Goods'];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading products: {error.message}</Alert>
      </Box>
    );
  }

  const products = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const summary = data?.summary || { total: 0, active: 0, lowStock: 0, outOfStock: 0 };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Product Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your product catalog, inventory, and pricing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Import Products">
            <IconButton>
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Products">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <CustomCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1, color: 'white' }}>
                <InventoryIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {summary.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Products
                </Typography>
              </Box>
            </Box>
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CustomCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, bgcolor: 'success.main', borderRadius: 1, color: 'white' }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {summary.active}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Products
                </Typography>
              </Box>
            </Box>
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CustomCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, bgcolor: 'warning.main', borderRadius: 1, color: 'white' }}>
                <WarningIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {summary.lowStock}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Low Stock
                </Typography>
              </Box>
            </Box>
          </CustomCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CustomCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, bgcolor: 'error.main', borderRadius: 1, color: 'white' }}>
                <WarningIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {summary.outOfStock}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Out of Stock
                </Typography>
              </Box>
            </Box>
          </CustomCard>
        </Grid>
      </Grid>

      {/* Filters and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Table View">
                <IconButton
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                >
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Grid View">
                <IconButton
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filters">
                <IconButton>
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Products" />
          <Tab label={`Low Stock (${summary.lowStock})`} />
          <Tab label={`Out of Stock (${summary.outOfStock})`} />
        </Tabs>
      </Paper>

      {/* Products Display */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={handleSelectAllProducts}
                  />
                </TableCell>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Cost Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {product.description}
                      </Typography>
                      {product.tags && product.tags.length > 0 && (
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {product.tags.slice(0, 2).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" />
                          ))}
                          {product.tags.length > 2 && (
                            <Chip label={`+${product.tags.length - 2}`} size="small" variant="outlined" />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {product.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₹{product.costPrice?.toLocaleString()}</TableCell>
                  <TableCell>₹{product.sellingPrice?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {product.currentStock} {product.unit}
                      </Typography>
                      <Chip
                        label={getStockStatus(product)}
                        color={getStatusColor(getStockStatus(product))}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.active ? 'Active' : 'Inactive'}
                      color={product.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, product)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {product.name}
                      </Typography>
                      <IconButton
                         size="small"
                         onClick={(e) => handleMenuOpen(e, product)}
                       >
                         <MoreVertIcon />
                       </IconButton>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      SKU: {product.sku}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {product.category}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Cost:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{product.costPrice?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Selling:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{product.sellingPrice?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={getStockStatus(product)}
                        color={getStatusColor(getStockStatus(product))}
                        size="small"
                      />
                      <Typography variant="body2">
                        {product.currentStock} {product.unit}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[8, 16, 24, 32]}
            />
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditProduct(selectedProduct)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteProduct(selectedProduct)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Product Form Dialog */}
      <ProductForm
        open={productFormOpen}
        onClose={() => {
          setProductFormOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSubmit={handleProductSubmit}
        loading={createProductMutation.isLoading || updateProductMutation.isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteProductMutation.isLoading}
          >
            {deleteProductMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add product"
        onClick={handleAddProduct}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default Products;