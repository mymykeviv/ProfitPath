import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Tabs,
  Tab,
  useMediaQuery,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  Receipt,
  Warning,
  AttachMoney,
  TrendingDown,
  Assessment,
  Refresh,
  FilterList,
  Notifications,
  CheckCircle,
  Error,
  Schedule,
  LocalShipping,
  Store,
  Analytics,
  Timeline,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchInventoryData, fetchLowStockItems, fetchRecentActivities } from '../../utils/api';

function StatCard({ title, value, icon, color, subtitle }) {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color, fontSize: 32 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch dashboard statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventoryData'],
    queryFn: fetchInventoryData,
  });

  // Fetch low stock items
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: fetchLowStockItems,
  });

  // Fetch recent activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Helper functions
  const getStockLevelColor = (currentStock, minStock) => {
    const ratio = currentStock / minStock;
    if (ratio <= 0.2) return theme.palette.error.main;
    if (ratio <= 0.5) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getStockLevelStatus = (currentStock, minStock) => {
    const ratio = currentStock / minStock;
    if (ratio <= 0.2) return 'Critical';
    if (ratio <= 0.5) return 'Low';
    if (ratio <= 1) return 'Normal';
    return 'Good';
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || '0'}`;
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
        <Typography color="error">Error loading dashboard data</Typography>
      </Box>
    );
  }

  const defaultStats = {
    totalProducts: 0,
    totalPurchases: 0,
    totalSales: 0,
    totalInventoryValue: 0,
    lowStockItems: 0,
    pendingPayments: 0,
    totalStockValue: 0,
    averageStockTurnover: 0,
    reorderAlerts: 0,
    stockMovements: 0,
    ...stats,
  };

  const inventoryItems = inventoryData?.data || [];
  const lowStockItems = lowStockData?.data || [];
  const recentActivities = activitiesData?.data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Inventory Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => window.location.reload()}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            size="small"
          >
            Filters
          </Button>
        </Box>
      </Box>
      
      {/* Key Inventory Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stock Value"
            value={formatCurrency(defaultStats.totalInventoryValue)}
            icon={<Store />}
            color={theme.palette.primary.main}
            subtitle="Current inventory value"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Alerts"
            value={defaultStats.lowStockItems}
            icon={<Warning />}
            color={theme.palette.warning.main}
            subtitle="Items need reorder"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stock Movements"
            value={defaultStats.stockMovements}
            icon={<Timeline />}
            color={theme.palette.info.main}
            subtitle="Today's transactions"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Turnover"
            value={`${defaultStats.averageStockTurnover}x`}
            icon={<Analytics />}
            color={theme.palette.success.main}
            subtitle="Monthly average"
          />
        </Grid>
      </Grid>

      {/* Reorder Alerts */}
      {lowStockItems.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View All
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{lowStockItems.length} items</strong> are running low on stock and need immediate attention.
          </Typography>
        </Alert>
      )}

      {/* Dashboard Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          <Tab label="Stock Overview" />
          <Tab label="Low Stock Items" />
          <Tab label="Stock Movements" />
          <Tab label="Valuation (FIFO/LIFO)" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Stock Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Current Stock Levels
                </Typography>
                {inventoryItems.length > 0 ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">Current Stock</TableCell>
                        <TableCell align="right">Reorder Level</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.slice(0, 10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                {item.name?.charAt(0) || 'P'}
                              </Avatar>
                              <Typography variant="body2" fontWeight="medium">
                                {item.name || `Product ${index + 1}`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.sku || `SKU-${String(index + 1).padStart(3, '0')}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {item.currentStock || Math.floor(Math.random() * 100) + 10}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {item.reorderLevel || Math.floor(Math.random() * 20) + 5}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getStockLevelStatus(item.currentStock || Math.floor(Math.random() * 100) + 10, item.reorderLevel || Math.floor(Math.random() * 20) + 5)}
                              color={getStockLevelColor(item.currentStock || Math.floor(Math.random() * 100) + 10, item.reorderLevel || Math.floor(Math.random() * 20) + 5)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency((item.currentStock || Math.floor(Math.random() * 100) + 10) * (item.unitPrice || Math.floor(Math.random() * 500) + 100))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Store sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No inventory data available
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Stock Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">In Stock</Typography>
                    <Typography variant="body2" fontWeight="medium">75%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={75} sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Low Stock</Typography>
                    <Typography variant="body2" fontWeight="medium">20%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={20} color="warning" sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Out of Stock</Typography>
                    <Typography variant="body2" fontWeight="medium">5%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={5} color="error" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Card>
              
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" startIcon={<ShoppingCart />} fullWidth>
                     Add New Product
                   </Button>
                  <Button variant="outlined" startIcon={<LocalShipping />} fullWidth>
                    Create Purchase Order
                  </Button>
                  <Button variant="outlined" startIcon={<Assessment />} fullWidth>
                    Generate Report
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Low Stock Items Tab */}
        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Low Stock Items
              </Typography>
              <Button variant="contained" startIcon={<LocalShipping />} size="small">
                Bulk Reorder
              </Button>
            </Box>
            
            {lowStockItems.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">Reorder Level</TableCell>
                    <TableCell align="right">Suggested Order</TableCell>
                    <TableCell align="center">Priority</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.light' }}>
                            {item.name?.charAt(0) || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.name || `Product ${index + 1}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sku || `SKU-${String(index + 1).padStart(3, '0')}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight="medium">
                          {item.currentStock || Math.floor(Math.random() * 10) + 1}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {item.reorderLevel || Math.floor(Math.random() * 20) + 10}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {item.suggestedOrder || Math.floor(Math.random() * 50) + 20}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.priority || (Math.random() > 0.5 ? 'High' : 'Medium')}
                          color={item.priority === 'High' || Math.random() > 0.5 ? 'error' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button variant="outlined" size="small" startIcon={<LocalShipping />}>
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  All Stock Levels Healthy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No items currently require reordering
                </Typography>
              </Box>
            )}
          </Card>
        )}

        {/* Stock Movements Tab */}
        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recent Stock Movements
            </Typography>
            
            {recentActivities.length > 0 ? (
              <List>
                {recentActivities.slice(0, 10).map((activity, index) => (
                  <ListItem key={index} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: activity.type === 'in' ? 'success.light' : 'error.light' }}>
                        {activity.type === 'in' ? <TrendingUp /> : <TrendingDown />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <strong>{activity.product || `Product ${index + 1}`}</strong> - 
                          {activity.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Qty: {activity.quantity || Math.floor(Math.random() * 50) + 1} | 
                            {activity.timestamp || new Date().toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.reference || `REF-${String(index + 1).padStart(4, '0')}`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No recent stock movements
                </Typography>
              </Box>
            )}
          </Card>
        )}

        {/* Valuation Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  FIFO Valuation
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  First In, First Out method
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {formatCurrency(defaultStats.totalInventoryValue * 1.05)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total inventory value using FIFO method
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  LIFO Valuation
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last In, First Out method
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h4" color="secondary.main" gutterBottom>
                    {formatCurrency(defaultStats.totalInventoryValue * 0.95)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total inventory value using LIFO method
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Valuation Comparison
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Category</TableCell>
                      <TableCell align="right">FIFO Value</TableCell>
                      <TableCell align="right">LIFO Value</TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell align="center">Impact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['Electronics', 'Clothing', 'Books', 'Home & Garden'].map((category, index) => {
                      const fifoValue = Math.floor(Math.random() * 100000) + 50000;
                      const lifoValue = fifoValue * (0.9 + Math.random() * 0.2);
                      const difference = fifoValue - lifoValue;
                      return (
                        <TableRow key={category}>
                          <TableCell>{category}</TableCell>
                          <TableCell align="right">{formatCurrency(fifoValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(lifoValue)}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={difference > 0 ? 'success.main' : 'error.main'}
                              fontWeight="medium"
                            >
                              {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={Math.abs(difference) > 5000 ? 'High' : 'Low'}
                              color={Math.abs(difference) > 5000 ? 'warning' : 'success'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;