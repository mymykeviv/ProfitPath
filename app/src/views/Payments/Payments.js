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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as CashIcon,
  SwapHoriz as TransferIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchPayments, 
  recordPayment, 
  sendPaymentReminder, 
  generateAgingReport,
  fetchCustomers,
  fetchSuppliers,
  fetchInvoices
} from '../../utils/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payments-tabpanel-${index}`}
      aria-labelledby={`payments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Payments() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [agingReportOpen, setAgingReportOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Form states
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMode: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      transactionId: ''
    }
  });
  
  const [reminderForm, setReminderForm] = useState({
    paymentIds: [],
    message: '',
    sendVia: 'EMAIL',
    scheduleDate: new Date().toISOString().split('T')[0]
  });
  
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', page, rowsPerPage, searchTerm, tabValue],
    queryFn: () => fetchPayments({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      type: tabValue === 0 ? 'all' : tabValue === 1 ? 'receivable' : 'payable',
    }),
  });
  
  // Additional data queries
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });
  
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
  
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
  
  const { data: agingData } = useQuery({
    queryKey: ['aging-report'],
    queryFn: generateAgingReport,
    enabled: agingReportOpen,
  });
  
  // Mutations
  const recordPaymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      setPaymentDialogOpen(false);
      setPaymentForm({
        invoiceId: '',
        amount: '',
        paymentMode: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          transactionId: ''
        }
      });
    },
  });
  
  const sendReminderMutation = useMutation({
    mutationFn: sendPaymentReminder,
    onSuccess: () => {
      setReminderDialogOpen(false);
      setReminderForm({
        paymentIds: [],
        message: '',
        sendVia: 'EMAIL',
        scheduleDate: new Date().toISOString().split('T')[0]
      });
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, payment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'PARTIAL':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    return type === 'RECEIVABLE' ? 'success' : 'info';
  };
  
  // Event Handlers
  const handleRecordPayment = (payment = null) => {
    if (payment) {
      setPaymentForm({
        ...paymentForm,
        invoiceId: payment.invoiceId || payment.id,
        amount: (payment.totalAmount - (payment.paidAmount || 0)).toString()
      });
    }
    setPaymentDialogOpen(true);
    handleMenuClose();
  };
  
  const handlePaymentSubmit = () => {
    recordPaymentMutation.mutate(paymentForm);
  };
  
  const handleSendReminder = (payment = null) => {
    if (payment) {
      setReminderForm({
        ...reminderForm,
        paymentIds: [payment.id]
      });
    }
    setReminderDialogOpen(true);
    handleMenuClose();
  };
  
  const handleReminderSubmit = () => {
    sendReminderMutation.mutate(reminderForm);
  };
  
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
    handleMenuClose();
  };
  
  const handleAgingReport = () => {
    setAgingReportOpen(true);
  };
  
  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'CASH':
        return <CashIcon />;
      case 'CARD':
        return <CreditCardIcon />;
      case 'BANK_TRANSFER':
        return <TransferIcon />;
      case 'WALLET':
        return <WalletIcon />;
      default:
        return <PaymentIcon />;
    }
  };
  
  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString()}`;
  };
  
  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
        <Typography color="error">Error loading payment data: {error.message}</Typography>
      </Box>
    );
  }

  const payments = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Payment Tracking
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={handleAgingReport}
            sx={{ borderRadius: 2 }}
          >
            Aging Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => setReminderDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Send Reminders
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleRecordPayment()}
            sx={{ borderRadius: 2 }}
          >
            Record Payment
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Receivables"
            value={`₹${(stats.totalReceivables || 0).toLocaleString()}`}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Payables"
            value={`₹${(stats.totalPayables || 0).toLocaleString()}`}
            icon={<AccountBalanceIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Payments"
            value={stats.overdueCount || 0}
            icon={<PaymentIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month Collected"
            value={`₹${(stats.monthlyCollected || 0).toLocaleString()}`}
            icon={<ReceiptIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment tabs">
          <Tab label="All Payments" />
          <Tab label="Receivables" />
          <Tab label="Payables" />
        </Tabs>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search payments by invoice number, customer, or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '100%' }}
        />
      </Paper>

      {/* Payments Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice/Reference</TableCell>
                <TableCell>Party</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid Amount</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Days Overdue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => {
                const balance = (payment.totalAmount || 0) - (payment.paidAmount || 0);
                const daysOverdue = getDaysOverdue(payment.dueDate);
                const isOverdue = daysOverdue > 0 && payment.status !== 'PAID';
                
                return (
                  <TableRow key={payment.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {payment.invoiceNumber || payment.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {payment.partyName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {payment.partyType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.type}
                        size="small"
                        color={getTypeColor(payment.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(payment.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={payment.paidAmount >= payment.totalAmount ? 'success.main' : 'textPrimary'}
                        sx={{ fontWeight: 500 }}
                      >
                        {formatCurrency(payment.paidAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={balance > 0 ? 'error.main' : 'success.main'}
                        sx={{ fontWeight: 500 }}
                      >
                        {formatCurrency(balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={isOverdue ? 'error.main' : 'textPrimary'}
                      >
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isOverdue ? (
                        <Chip
                          icon={<WarningIcon />}
                          label={`${daysOverdue} days`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        size="small"
                        color={getStatusColor(payment.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {payment.status !== 'PAID' && (
                          <IconButton
                            onClick={() => handleRecordPayment(payment)}
                            size="small"
                            color="primary"
                            title="Record Payment"
                          >
                            <PaymentIcon />
                          </IconButton>
                        )}
                        {isOverdue && (
                          <IconButton
                            onClick={() => handleSendReminder(payment)}
                            size="small"
                            color="warning"
                            title="Send Reminder"
                          >
                            <NotificationsIcon />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={(e) => handleMenuClick(e, payment)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No payments found. Click "Record Payment" to get started.
                    </Typography>
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
        <MenuItem onClick={() => handleViewDetails(selectedPayment)}>
          <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {selectedPayment?.status !== 'PAID' && (
          <MenuItem onClick={() => handleRecordPayment(selectedPayment)}>
            <PaymentIcon sx={{ mr: 1 }} fontSize="small" />
            Record Payment
          </MenuItem>
        )}
        {selectedPayment && getDaysOverdue(selectedPayment.dueDate) > 0 && selectedPayment.status !== 'PAID' && (
          <MenuItem onClick={() => handleSendReminder(selectedPayment)}>
            <NotificationsIcon sx={{ mr: 1 }} fontSize="small" />
            Send Reminder
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <HistoryIcon sx={{ mr: 1 }} fontSize="small" />
          Payment History
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Print Statement
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={invoicesData?.data || []}
                getOptionLabel={(option) => `${option.invoiceNumber} - ${option.customerName}`}
                value={invoicesData?.data?.find(inv => inv.id === paymentForm.invoiceId) || null}
                onChange={(_, value) => setPaymentForm({ ...paymentForm, invoiceId: value?.id || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Select Invoice" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Payment Amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  label="Payment Mode"
                >
                  <MenuItem value="CASH">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CashIcon fontSize="small" />
                      Cash
                    </Box>
                  </MenuItem>
                  <MenuItem value="CARD">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon fontSize="small" />
                      Card
                    </Box>
                  </MenuItem>
                  <MenuItem value="BANK_TRANSFER">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TransferIcon fontSize="small" />
                      Bank Transfer
                    </Box>
                  </MenuItem>
                  <MenuItem value="WALLET">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WalletIcon fontSize="small" />
                      Digital Wallet
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reference Number"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                fullWidth
                placeholder="Transaction ID, Check Number, etc."
              />
            </Grid>
            {(paymentForm.paymentMode === 'BANK_TRANSFER' || paymentForm.paymentMode === 'CARD') && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bank Name"
                    value={paymentForm.bankDetails.bankName}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankDetails: { ...paymentForm.bankDetails, bankName: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Account Number"
                    value={paymentForm.bankDetails.accountNumber}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankDetails: { ...paymentForm.bankDetails, accountNumber: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes about this payment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePaymentSubmit} 
            variant="contained"
            disabled={!paymentForm.invoiceId || !paymentForm.amount}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Aging Report Dialog */}
      <Dialog open={agingReportOpen} onClose={() => setAgingReportOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            Aging Report
          </Box>
        </DialogTitle>
        <DialogContent>
          {agingData && (
            <Box>
              {/* Aging Summary */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(agingData.current || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Current (0-30 days)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="warning.main">
                        {formatCurrency(agingData.days30 || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        31-60 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(agingData.days60 || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        61-90 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="error.dark">
                        {formatCurrency(agingData.days90Plus || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        90+ days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Detailed Aging Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Current</TableCell>
                      <TableCell>31-60 Days</TableCell>
                      <TableCell>61-90 Days</TableCell>
                      <TableCell>90+ Days</TableCell>
                      <TableCell>Total Outstanding</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(agingData.details || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{formatCurrency(item.current)}</TableCell>
                        <TableCell>{formatCurrency(item.days30)}</TableCell>
                        <TableCell>{formatCurrency(item.days60)}</TableCell>
                        <TableCell>{formatCurrency(item.days90Plus)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<DownloadIcon />}>Export PDF</Button>
          <Button startIcon={<PrintIcon />}>Print</Button>
          <Button onClick={() => setAgingReportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Payment Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onClose={() => setReminderDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            Send Payment Reminder
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={payments.filter(p => p.status !== 'PAID')}
                getOptionLabel={(option) => `${option.invoiceNumber} - ${option.partyName} (${formatCurrency(option.totalAmount - (option.paidAmount || 0))})`}
                value={payments.filter(p => reminderForm.paymentIds.includes(p.id))}
                onChange={(_, value) => setReminderForm({ 
                  ...reminderForm, 
                  paymentIds: value.map(v => v.id) 
                })}
                renderInput={(params) => (
                  <TextField {...params} label="Select Payments" placeholder="Choose payments to remind" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Send Via</InputLabel>
                <Select
                  value={reminderForm.sendVia}
                  onChange={(e) => setReminderForm({ ...reminderForm, sendVia: e.target.value })}
                  label="Send Via"
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Schedule Date"
                type="date"
                value={reminderForm.scheduleDate}
                onChange={(e) => setReminderForm({ ...reminderForm, scheduleDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Custom Message"
                value={reminderForm.message}
                onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                fullWidth
                multiline
                rows={4}
                placeholder="Dear [Customer Name], This is a friendly reminder that your payment of [Amount] for invoice [Invoice Number] is due on [Due Date]. Please arrange for payment at your earliest convenience."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReminderSubmit} 
            variant="contained"
            startIcon={<SendIcon />}
            disabled={reminderForm.paymentIds.length === 0}
          >
            Send Reminder
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Payment Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 500, mb: 2 }}>
                  {selectedPayment.invoiceNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Party
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                  {selectedPayment.partyName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {formatCurrency(selectedPayment.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Paid Amount
                </Typography>
                <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                  {formatCurrency(selectedPayment.paidAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Balance
                </Typography>
                <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
                  {formatCurrency((selectedPayment.totalAmount || 0) - (selectedPayment.paidAmount || 0))}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Due Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(selectedPayment.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Payment History
                </Typography>
                <List>
                  {(selectedPayment.paymentHistory || []).map((payment, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getPaymentModeIcon(payment.mode)}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${formatCurrency(payment.amount)} via ${payment.mode}`}
                        secondary={`${new Date(payment.date).toLocaleDateString()} - ${payment.reference || 'No reference'}`}
                      />
                    </ListItem>
                  ))}
                  {(!selectedPayment.paymentHistory || selectedPayment.paymentHistory.length === 0) && (
                    <ListItem>
                      <ListItemText
                        primary="No payments recorded yet"
                        secondary="Use the 'Record Payment' button to add payments"
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedPayment?.status !== 'PAID' && (
            <Button 
              onClick={() => {
                setViewDialogOpen(false);
                handleRecordPayment(selectedPayment);
              }}
              variant="contained"
              startIcon={<PaymentIcon />}
            >
              Record Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;