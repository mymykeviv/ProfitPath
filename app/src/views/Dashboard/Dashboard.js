import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  Receipt,
  Warning,
  AttachMoney,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../../utils/api';

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
  
  // Fetch dashboard statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

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
    ...stats,
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Dashboard
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Products"
            value={defaultStats.totalProducts}
            icon={<Inventory />}
            color={theme.palette.primary.main}
            subtitle="Active products in catalog"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Purchases"
            value={`₹${defaultStats.totalPurchases?.toLocaleString() || '0'}`}
            icon={<ShoppingCart />}
            color={theme.palette.secondary.main}
            subtitle="This month"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Sales"
            value={`₹${defaultStats.totalSales?.toLocaleString() || '0'}`}
            icon={<Receipt />}
            color={theme.palette.success.main}
            subtitle="This month"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Inventory Value"
            value={`₹${defaultStats.totalInventoryValue?.toLocaleString() || '0'}`}
            icon={<TrendingUp />}
            color={theme.palette.info.main}
            subtitle="Current stock value"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Low Stock Items"
            value={defaultStats.lowStockItems}
            icon={<Warning />}
            color={theme.palette.warning.main}
            subtitle="Require reorder"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Payments"
            value={`₹${defaultStats.pendingPayments?.toLocaleString() || '0'}`}
            icon={<AttachMoney />}
            color={theme.palette.error.main}
            subtitle="Outstanding amount"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <Typography color="textSecondary">
                Activity feed will be displayed here
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                • Add new product to catalog
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Create purchase order
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Generate sales invoice
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Record payment
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Check inventory levels
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;