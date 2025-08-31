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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Divider,
  Alert,
  Tooltip,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPurchases, createPurchase, updatePurchase, deletePurchase, fetchSuppliers } from '../../utils/api';

function Purchases() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  // Filter and tab state
  const [currentTab, setCurrentTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Dialog state
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  
  // Form state
  const [purchaseForm, setPurchaseForm] = useState({
    poNumber: '',
    supplierId: '',
    supplierName: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    paymentTerms: '30',
    status: 'DRAFT',
    items: [{
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      gstRate: 18,
      amount: 0
    }],
    subtotal: 0,
    gstAmount: 0,
    totalAmount: 0,
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchases', page, rowsPerPage, searchTerm, statusFilter, supplierFilter, dateRange],
    queryFn: () => fetchPurchases({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      supplier: supplierFilter || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
    }),
  });
  
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
  
  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      setPurchaseFormOpen(false);
      resetForm();
    },
  });
  
  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }) => updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      setPurchaseFormOpen(false);
      setEditingPurchase(null);
      resetForm();
    },
  });
  
  const deletePurchaseMutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      setDeleteDialogOpen(false);
      setSelectedPurchase(null);
    },
  });

  // Handler functions
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    const statuses = ['ALL', 'DRAFT', 'CONFIRMED', 'RECEIVED', 'BILLED', 'PAID'];
    setStatusFilter(statuses[newValue]);
    setPage(0);
  };

  const handleMenuClick = (event, purchase) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchase(purchase);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchase(null);
  };

  const handleAddPurchase = () => {
    setEditingPurchase(null);
    resetForm();
    setPurchaseFormOpen(true);
  };

  const handleEditPurchase = () => {
    if (selectedPurchase) {
      setEditingPurchase(selectedPurchase);
      setPurchaseForm({
        ...selectedPurchase,
        poDate: selectedPurchase.poDate?.split('T')[0] || '',
        expectedDeliveryDate: selectedPurchase.expectedDeliveryDate?.split('T')[0] || '',
        items: selectedPurchase.items || [{
          productId: '',
          productName: '',
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
          amount: 0
        }]
      });
      setPurchaseFormOpen(true);
    }
    handleMenuClose();
  };

  const handleViewPurchase = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleDeletePurchase = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (selectedPurchase) {
      deletePurchaseMutation.mutate(selectedPurchase.id);
    }
  };

  const resetForm = () => {
    setPurchaseForm({
      poNumber: '',
      supplierId: '',
      supplierName: '',
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      paymentTerms: '30',
      status: 'DRAFT',
      items: [{
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        amount: 0
      }],
      subtotal: 0,
      gstAmount: 0,
      totalAmount: 0,
      notes: ''
    });
    setFormErrors({});
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      const formData = {
        ...purchaseForm,
        items: purchaseForm.items.filter(item => item.productName && item.quantity > 0)
      };
      
      if (editingPurchase) {
        updatePurchaseMutation.mutate({ id: editingPurchase.id, data: formData });
      } else {
        createPurchaseMutation.mutate(formData);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!purchaseForm.supplierName) errors.supplierName = 'Supplier is required';
    if (!purchaseForm.poDate) errors.poDate = 'PO Date is required';
    if (purchaseForm.items.length === 0 || !purchaseForm.items.some(item => item.productName)) {
      errors.items = 'At least one item is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = items.reduce((sum, item) => {
      const itemAmount = item.quantity * item.unitPrice;
      return sum + (itemAmount * item.gstRate / 100);
    }, 0);
    const totalAmount = subtotal + gstAmount;
    
    return { subtotal, gstAmount, totalAmount };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...purchaseForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    const totals = calculateTotals(newItems);
    setPurchaseForm({
      ...purchaseForm,
      items: newItems,
      ...totals
    });
  };

  const addItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        amount: 0
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = purchaseForm.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems);
    setPurchaseForm({
      ...purchaseForm,
      items: newItems,
      ...totals
    });
  };

  // Helper functions and data
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'CONFIRMED':
        return 'info';
      case 'RECEIVED':
        return 'success';
      case 'BILLED':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT':
        return <EditIcon />;
      case 'CONFIRMED':
        return <CheckCircleIcon />;
      case 'RECEIVED':
        return <ShippingIcon />;
      case 'BILLED':
        return <ReceiptIcon />;
      case 'PAID':
        return <PaymentIcon />;
      case 'CANCELLED':
        return <CancelIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const paymentTermsOptions = [
    { value: '0', label: 'Immediate' },
    { value: '15', label: '15 Days' },
    { value: '30', label: '30 Days' },
    { value: '45', label: '45 Days' },
    { value: '60', label: '60 Days' },
    { value: '90', label: '90 Days' }
  ];

  const gstRates = [0, 5, 12, 18, 28];
  
  const suppliers = suppliersData?.data || [];
  const purchases = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  
  // Calculate summary statistics
  const summaryStats = {
    total: purchases.length,
    draft: purchases.filter(p => p.status === 'DRAFT').length,
    confirmed: purchases.filter(p => p.status === 'CONFIRMED').length,
    received: purchases.filter(p => p.status === 'RECEIVED').length,
    totalValue: purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    pendingValue: purchases.filter(p => ['DRAFT', 'CONFIRMED'].includes(p.status))
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0)
  };

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
        <Alert severity="error">Error loading purchases: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Purchase Orders
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Import POs">
            <IconButton>
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export POs">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPurchase}
            sx={{ borderRadius: 2 }}
          >
            {isMobile ? 'Add PO' : 'Create Purchase Order'}
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total POs
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summaryStats.total}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Draft
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summaryStats.draft}
                  </Typography>
                </Box>
                <EditIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Confirmed
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summaryStats.confirmed}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Value
                  </Typography>
                  <Typography variant="h4" component="div">
                    ₹{summaryStats.totalValue.toLocaleString()}
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search purchase orders..."
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
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={suppliers}
              getOptionLabel={(option) => option.name || ''}
              value={suppliers.find(s => s.id === supplierFilter) || null}
              onChange={(event, newValue) => {
                setSupplierFilter(newValue?.id || '');
                setPage(0);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Supplier" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Tooltip title="Clear Filters">
              <IconButton
                onClick={() => {
                  setSearchTerm('');
                  setSupplierFilter('');
                  setDateRange({ start: '', end: '' });
                  setPage(0);
                }}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
        >
          <Tab label="All" />
          <Tab label="Draft" />
          <Tab label="Confirmed" />
          <Tab label="Received" />
          <Tab label="Billed" />
          <Tab label="Paid" />
        </Tabs>
      </Paper>

      {/* Purchase Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>GST Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Terms</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {purchase.poNumber}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {purchase.supplierName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.poDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {purchase.expectedDeliveryDate 
                      ? new Date(purchase.expectedDeliveryDate).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ₹{purchase.totalAmount?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      ₹{purchase.gstAmount?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(purchase.status)}
                      label={purchase.status}
                      size="small"
                      color={getStatusColor(purchase.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {purchase.paymentTerms ? `${purchase.paymentTerms} Days` : 'Immediate'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, purchase)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography color="textSecondary" variant="h6">
                        No purchase orders found
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Click "Create Purchase Order" to get started
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewPurchase}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditPurchase}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeletePurchase} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add purchase order"
          onClick={handleAddPurchase}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Purchase Order Form Dialog */}
      <Dialog
        open={purchaseFormOpen}
        onClose={() => setPurchaseFormOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="PO Number"
                value={purchaseForm.poNumber}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, poNumber: e.target.value })}
                fullWidth
                error={!!formErrors.poNumber}
                helperText={formErrors.poNumber}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name || ''}
                value={suppliers.find(s => s.id === purchaseForm.supplierId) || null}
                onChange={(event, newValue) => {
                  setPurchaseForm({
                    ...purchaseForm,
                    supplierId: newValue?.id || '',
                    supplierName: newValue?.name || ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supplier"
                    error={!!formErrors.supplierName}
                    helperText={formErrors.supplierName}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="PO Date"
                type="date"
                value={purchaseForm.poDate}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, poDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!formErrors.poDate}
                helperText={formErrors.poDate}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Expected Delivery Date"
                type="date"
                value={purchaseForm.expectedDeliveryDate}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, expectedDeliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={purchaseForm.paymentTerms}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentTerms: e.target.value })}
                  label="Payment Terms"
                >
                  {paymentTermsOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Items */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Items
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outlined"
                  size="small"
                >
                  Add Item
                </Button>
              </Box>
              {formErrors.items && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.items}
                </Alert>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>GST Rate</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseForm.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            placeholder="Product name"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={item.gstRate}
                              onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                            >
                              {gstRates.map((rate) => (
                                <MenuItem key={rate} value={rate}>
                                  {rate}%
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          ₹{item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => removeItem(index)}
                            size="small"
                            color="error"
                            disabled={purchaseForm.items.length === 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Totals */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal: ₹{purchaseForm.subtotal.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      GST Amount: ₹{purchaseForm.gstAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" color="primary">
                      Total: ₹{purchaseForm.totalAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseFormOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={createPurchaseMutation.isLoading || updatePurchaseMutation.isLoading}
          >
            {editingPurchase ? 'Update' : 'Create'} Purchase Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Purchase Order Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Purchase Order Details
        </DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  PO Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                  {selectedPurchase.poNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="body1">
                  {selectedPurchase.supplierName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  PO Date
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedPurchase.poDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedPurchase.status)}
                  label={selectedPurchase.status}
                  size="small"
                  color={getStatusColor(selectedPurchase.status)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{selectedPurchase.totalAmount?.toLocaleString() || '0'}
                </Typography>
              </Grid>
              {selectedPurchase.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedPurchase.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Purchase Order
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this purchase order? This action cannot be undone.
          </Typography>
          {selectedPurchase && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                PO Number: {selectedPurchase.poNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supplier: {selectedPurchase.supplierName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: ₹{selectedPurchase.totalAmount?.toLocaleString() || '0'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deletePurchaseMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Purchases;