import React, { useState } from 'react';
import {
  Box,
  Typography,
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
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchInventory } from '../../utils/api';

function Inventory() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', page, rowsPerPage, searchTerm],
    queryFn: () => fetchInventory({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
    }),
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    if (currentStock <= 0) return { label: 'OUT OF STOCK', color: 'error' };
    if (currentStock <= reorderLevel) return { label: 'LOW STOCK', color: 'warning' };
    return { label: 'IN STOCK', color: 'success' };
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
        <Typography color="error">Error loading inventory: {error.message}</Typography>
      </Box>
    );
  }

  const inventory = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);
  const outOfStockItems = inventory.filter(item => item.currentStock <= 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Inventory Management
      </Typography>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          {lowStockItems.length} items are running low on stock and need reordering.
        </Alert>
      )}

      {outOfStockItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {outOfStockItems.length} items are out of stock!
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Items
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {inventory.length}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {lowStockItems.length}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {outOfStockItems.length}
                  </Typography>
                </Box>
                <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
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
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    ₹{inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost || 0), 0).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search inventory..."
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

      {/* Inventory Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Reorder Level</TableCell>
                <TableCell>Unit Cost</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => {
                const status = getStockStatus(item.currentStock, item.reorderLevel);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.productName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={item.currentStock <= item.reorderLevel ? 'error' : 'textPrimary'}
                        sx={{ fontWeight: 500 }}
                      >
                        {item.currentStock} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.reorderLevel} {item.unit}</TableCell>
                    <TableCell>₹{item.unitCost?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      ₹{((item.currentStock || 0) * (item.unitCost || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No inventory items found.
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
    </Box>
  );
}

export default Inventory;