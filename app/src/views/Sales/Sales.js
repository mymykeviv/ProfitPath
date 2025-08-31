import React, { useState, useEffect } from 'react';
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
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Draft as DraftIcon,
  LocalShipping as DeliveredIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSales, 
  createSalesInvoice, 
  updateSalesInvoice, 
  deleteSalesInvoice,
  fetchCustomers,
  fetchProducts
} from '../../utils/api';

function Sales() {
  // Theme and responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog state
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    customerId: '',
    customerName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: 'NET_30',
    items: [{
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      gstRate: 18,
      discount: 0,
      amount: 0
    }],
    subtotal: 0,
    totalDiscount: 0,
    gstAmount: 0,
    totalAmount: 0,
    notes: '',
    status: 'DRAFT'
  });

  const [formErrors, setFormErrors] = useState({});

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales', page, rowsPerPage, searchTerm, statusFilter, paymentStatusFilter, customerFilter, dateFromFilter, dateToFilter],
    queryFn: () => fetchSales({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
      customerId: customerFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      setInvoiceFormOpen(false);
      resetForm();
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateSalesInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      setInvoiceFormOpen(false);
      setEditingInvoice(null);
      resetForm();
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: deleteSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      setDeleteDialogOpen(false);
      setSelectedSale(null);
    },
  });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'CONFIRMED':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'PAID':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  // Handler functions
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const statusMap = ['all', 'DRAFT', 'CONFIRMED', 'DELIVERED', 'PAID', 'CANCELLED'];
    setStatusFilter(statusMap[newValue]);
    setPage(0);
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    resetForm();
    setInvoiceFormOpen(true);
  };

  const handleEditInvoice = () => {
    if (selectedSale) {
      setEditingInvoice(selectedSale);
      setInvoiceForm({
        ...selectedSale,
        invoiceDate: selectedSale.invoiceDate?.split('T')[0] || '',
        dueDate: selectedSale.dueDate?.split('T')[0] || '',
        items: selectedSale.items || [{
          productId: '',
          productName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
          discount: 0,
          amount: 0
        }]
      });
      setInvoiceFormOpen(true);
    }
    handleMenuClose();
  };

  const handleViewInvoice = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteInvoice = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (selectedSale) {
      deleteInvoiceMutation.mutate(selectedSale.id);
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'NET_30',
      items: [{
        productId: '',
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        discount: 0,
        amount: 0
      }],
      subtotal: 0,
      totalDiscount: 0,
      gstAmount: 0,
      totalAmount: 0,
      notes: '',
      status: 'DRAFT'
    });
    setFormErrors({});
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      const formData = {
        ...invoiceForm,
        items: invoiceForm.items.filter(item => item.productName && item.quantity > 0)
      };
      
      if (editingInvoice) {
        updateInvoiceMutation.mutate({ id: editingInvoice.id, ...formData });
      } else {
        createInvoiceMutation.mutate(formData);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!invoiceForm.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    if (!invoiceForm.customerId) {
      errors.customerName = 'Customer is required';
    }
    if (!invoiceForm.invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }
    if (invoiceForm.items.filter(item => item.productName && item.quantity > 0).length === 0) {
      errors.items = 'At least one item is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => {
      const itemAmount = (item.quantity * item.unitPrice) - item.discount;
      return sum + itemAmount;
    }, 0);
    
    const totalDiscount = invoiceForm.items.reduce((sum, item) => sum + item.discount, 0);
    
    const gstAmount = invoiceForm.items.reduce((sum, item) => {
      const itemAmount = (item.quantity * item.unitPrice) - item.discount;
      return sum + (itemAmount * item.gstRate / 100);
    }, 0);
    
    const totalAmount = subtotal + gstAmount;
    
    setInvoiceForm(prev => ({
      ...prev,
      subtotal,
      totalDiscount,
      gstAmount,
      totalAmount
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate item amount
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = updatedItems[index];
      item.amount = (item.quantity * item.unitPrice) - item.discount;
    }
    
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, {
        productId: '',
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        discount: 0,
        amount: 0
      }]
    });
  };

  const removeItem = (index) => {
    const updatedItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [invoiceForm.items]);

  // Helper functions
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return <DraftIcon fontSize="small" />;
      case 'CONFIRMED':
        return <CheckCircleIcon fontSize="small" />;
      case 'DELIVERED':
        return <DeliveredIcon fontSize="small" />;
      case 'PAID':
        return <PaymentIcon fontSize="small" />;
      case 'CANCELLED':
        return <CancelIcon fontSize="small" />;
      default:
        return <DraftIcon fontSize="small" />;
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <CheckCircleIcon fontSize="small" />;
      case 'PARTIAL':
        return <PaymentIcon fontSize="small" />;
      case 'PENDING':
      default:
        return <MoneyIcon fontSize="small" />;
    }
  };

  // Data arrays
  const paymentTermsOptions = [
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_45', label: 'Net 45 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'ADVANCE', label: 'Advance Payment' },
  ];

  const gstRates = [0, 5, 12, 18, 28];

  // Summary statistics
  const salesData = data?.data || [];
  const totalInvoices = salesData.length;
  const draftInvoices = salesData.filter(s => s.status === 'DRAFT').length;
  const confirmedInvoices = salesData.filter(s => s.status === 'CONFIRMED').length;
  const totalRevenue = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const pendingPayments = salesData.filter(s => s.paymentStatus !== 'PAID').reduce((sum, s) => sum + (s.totalAmount || 0), 0);

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
        <Alert severity="error">
          Error loading sales: {error.message}
        </Alert>
      </Box>
    );
  }

  const sales = data?.data || [];
  const totalCount = data?.pagination?.total || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Invoice Management
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Invoices
                  </Typography>
                  <Typography variant="h4">
                    {totalInvoices}
                  </Typography>
                </Box>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Draft
                  </Typography>
                  <Typography variant="h4">
                    {draftInvoices}
                  </Typography>
                </Box>
                <DraftIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Confirmed
                  </Typography>
                  <Typography variant="h4">
                    {confirmedInvoices}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ₹{totalRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={customers || []}
                getOptionLabel={(option) => option.name || ''}
                value={customers.find(c => c.id === customerFilter) || null}
                onChange={(_, value) => setCustomerFilter(value?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Customer"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Invoices" />
          <Tab label="Draft" />
          <Tab label="Confirmed" />
          <Tab label="Delivered" />
          <Tab label="Paid" />
          <Tab label="Cancelled" />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddInvoice}
          sx={{ borderRadius: 2 }}
        >
          Create Invoice
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>GST Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {sale.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {sale.customerName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(sale.invoiceDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ₹{sale.totalAmount?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ₹{sale.gstAmount?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(sale.status)}
                      label={sale.status}
                      size="small"
                      color={getStatusColor(sale.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getPaymentStatusIcon(sale.paymentStatus)}
                      label={sale.paymentStatus || 'PENDING'}
                      size="small"
                      color={sale.paymentStatus === 'PAID' ? 'success' : sale.paymentStatus === 'PARTIAL' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, sale)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No sales invoices found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Create your first invoice to get started
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
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewInvoice}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditInvoice}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Print Invoice
        </MenuItem>
        <MenuItem onClick={handleDeleteInvoice} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Invoice Dialog */}
      <Dialog
        open={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Invoice Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number *"
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                error={!!formErrors.invoiceNumber}
                helperText={formErrors.invoiceNumber}
              />
            </Grid>

            {/* Customer Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={customers || []}
                getOptionLabel={(option) => option.name || ''}
                value={customers.find(c => c.id === invoiceForm.customerId) || null}
                onChange={(_, value) => {
                  setInvoiceForm(prev => ({ 
                    ...prev, 
                    customerId: value?.id || '',
                    customerName: value?.name || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer *"
                    error={!!formErrors.customerName}
                    helperText={formErrors.customerName}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                )}
              />
            </Grid>

            {/* Invoice Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Invoice Date *"
                value={invoiceForm.invoiceDate}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceDate: e.target.value }))}
                error={!!formErrors.invoiceDate}
                helperText={formErrors.invoiceDate}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Payment Terms */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Payment Terms"
                value={invoiceForm.paymentTerms}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
              >
                {paymentTermsOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={invoiceForm.status}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </Grid>

            {/* Invoice Items */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              {invoiceForm.items.map((item, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Autocomplete
                        options={products || []}
                        getOptionLabel={(option) => `${option.name} (${option.sku})` || ''}
                        value={products.find(p => p.id === item.productId) || null}
                        onChange={(_, value) => {
                          handleItemChange(index, 'productId', value?.id || '');
                          handleItemChange(index, 'productName', value?.name || '');
                          handleItemChange(index, 'unitPrice', value?.sellingPrice || 0);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Product *"
                            size="small"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity *"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price *"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        select
                        label="GST %"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))}
                        size="small"
                      >
                        {gstRates.map((rate) => (
                          <MenuItem key={rate} value={rate}>
                            {rate}%
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={4} md={2}>
                      <TextField
                        fullWidth
                        label="Amount"
                        value={`₹${item.amount.toLocaleString()}`}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={2} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={invoiceForm.items.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
              
              {formErrors.items && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {formErrors.items}
                </Alert>
              )}
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or terms..."
              />
            </Grid>

            {/* Totals Summary */}
            <Grid item xs={12}>
              <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Subtotal
                    </Typography>
                    <Typography variant="h6">
                      ₹{invoiceForm.subtotal.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      GST Amount
                    </Typography>
                    <Typography variant="h6">
                      ₹{invoiceForm.gstAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Discount
                    </Typography>
                    <Typography variant="h6">
                      ₹{invoiceForm.totalDiscount.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      ₹{invoiceForm.totalAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceFormOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={createInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
          >
            {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details - {selectedSale?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Customer
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body1">
                    {selectedSale.customerName}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Invoice Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedSale.invoiceDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedSale.status)}
                  label={selectedSale.status}
                  color={getStatusColor(selectedSale.status)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Payment Status
                </Typography>
                <Chip
                  icon={getPaymentStatusIcon(selectedSale.paymentStatus)}
                  label={selectedSale.paymentStatus || 'PENDING'}
                  color={selectedSale.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Amount Details
                </Typography>
                <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6">
                        ₹{selectedSale.totalAmount?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        GST Amount
                      </Typography>
                      <Typography variant="h6">
                        ₹{selectedSale.gstAmount?.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              {selectedSale.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {selectedSale.notes}
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
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setViewDialogOpen(false);
              handleEditInvoice();
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice {selectedSale?.invoiceNumber}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteInvoiceMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={handleAddInvoice}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}

export default Sales;