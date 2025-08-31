import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '../../utils/api';

function ReportCard({ title, description, icon, category, onGenerate, isLoading = false }) {
  const getCategoryColor = (cat) => {
    const colors = {
      'Financial': 'success',
      'Inventory': 'info',
      'Sales': 'primary',
      'Purchase': 'warning',
      'Tax': 'error',
    };
    return colors[cat] || 'default';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: 'primary.main', mr: 2 }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Chip
              label={category}
              size="small"
              color={getCategoryColor(category)}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onGenerate}
          disabled={isLoading}
          sx={{ borderRadius: 2 }}
        >
          Generate
        </Button>
      </CardActions>
    </Card>
  );
}

function Reports() {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', dateRange, startDate, endDate],
    queryFn: () => fetchReports({
      dateRange,
      startDate,
      endDate,
    }),
  });

  const handleGenerateReport = (reportType) => {
    console.log('Generating report:', reportType, {
      dateRange,
      startDate,
      endDate,
    });
    // Implement report generation logic
  };

  const reports = [
    {
      id: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Comprehensive P&L statement showing revenue, expenses, and net profit for the selected period.',
      category: 'Financial',
      icon: <TrendingUpIcon />,
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Statement of financial position showing assets, liabilities, and equity.',
      category: 'Financial',
      icon: <AccountBalanceIcon />,
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Track cash inflows and outflows from operating, investing, and financing activities.',
      category: 'Financial',
      icon: <PaymentIcon />,
    },
    {
      id: 'inventory-valuation',
      title: 'Inventory Valuation Report',
      description: 'Current inventory value using FIFO/LIFO methods with aging analysis.',
      category: 'Inventory',
      icon: <InventoryIcon />,
    },
    {
      id: 'stock-movement',
      title: 'Stock Movement Report',
      description: 'Detailed tracking of inventory movements including purchases, sales, and adjustments.',
      category: 'Inventory',
      icon: <BarChartIcon />,
    },
    {
      id: 'sales-analysis',
      title: 'Sales Analysis Report',
      description: 'Sales performance analysis by product, customer, and time period.',
      category: 'Sales',
      icon: <AssessmentIcon />,
    },
    {
      id: 'customer-aging',
      title: 'Customer Aging Report',
      description: 'Outstanding receivables categorized by aging buckets (30, 60, 90+ days).',
      category: 'Sales',
      icon: <ReceiptIcon />,
    },
    {
      id: 'supplier-aging',
      title: 'Supplier Aging Report',
      description: 'Outstanding payables to suppliers with aging analysis.',
      category: 'Purchase',
      icon: <PaymentIcon />,
    },
    {
      id: 'purchase-analysis',
      title: 'Purchase Analysis Report',
      description: 'Purchase trends and supplier performance analysis.',
      category: 'Purchase',
      icon: <PieChartIcon />,
    },
    {
      id: 'gst-summary',
      title: 'GST Summary Report',
      description: 'GST collected and paid summary for tax filing compliance.',
      category: 'Tax',
      icon: <AssessmentIcon />,
    },
    {
      id: 'gstr1',
      title: 'GSTR-1 Report',
      description: 'Outward supplies report for GST return filing.',
      category: 'Tax',
      icon: <ReceiptIcon />,
    },
    {
      id: 'gstr3b',
      title: 'GSTR-3B Report',
      description: 'Monthly GST return summary with tax liability and input tax credit.',
      category: 'Tax',
      icon: <AccountBalanceIcon />,
    },
  ];

  const filteredReports = categoryFilter === 'all' 
    ? reports 
    : reports.filter(report => report.category === categoryFilter);

  const categories = ['all', ...new Set(reports.map(report => report.category))];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading reports: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DateRangeIcon />}
          sx={{ borderRadius: 2 }}
        >
          Schedule Reports
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Parameters
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="thisWeek">This Week</MenuItem>
                <MenuItem value="thisMonth">This Month</MenuItem>
                <MenuItem value="thisQuarter">This Quarter</MenuItem>
                <MenuItem value="thisYear">This Year</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
                <MenuItem value="lastQuarter">Last Quarter</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {dateRange === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Grid */}
      <Grid container spacing={3}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <ReportCard
              title={report.title}
              description={report.description}
              icon={report.icon}
              category={report.category}
              onGenerate={() => handleGenerateReport(report.id)}
              isLoading={isLoading}
            />
          </Grid>
        ))}
      </Grid>

      {filteredReports.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your category filter to see more reports.
          </Typography>
        </Paper>
      )}

      {/* Quick Stats */}
      {data?.quickStats && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Statistics
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  ₹{(data.quickStats.totalRevenue || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Revenue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                  ₹{(data.quickStats.totalExpenses || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Expenses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  ₹{(data.quickStats.netProfit || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Net Profit
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {(data.quickStats.profitMargin || 0).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Profit Margin
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default Reports;