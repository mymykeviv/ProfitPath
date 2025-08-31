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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchProductions } from '../../utils/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`production-tabpanel-${index}`}
      aria-labelledby={`production-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Production() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['productions', page, rowsPerPage, searchTerm],
    queryFn: () => fetchProductions({
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

  const handleMenuClick = (event, production) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduction(production);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduction(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNED':
        return 'default';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
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
        <Typography color="error">Error loading production data: {error.message}</Typography>
      </Box>
    );
  }

  const productions = data?.data || [];
  const totalCount = data?.pagination?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Production & BOM
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BuildIcon />}
            sx={{ borderRadius: 2 }}
          >
            Manage BOMs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            New Production
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="production tabs">
          <Tab label="Production Batches" />
          <Tab label="Bill of Materials" />
        </Tabs>
      </Paper>

      {/* Production Batches Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            placeholder="Search production batches..."
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

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Batch Number</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Planned Quantity</TableCell>
                  <TableCell>Produced Quantity</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productions.map((production) => (
                  <TableRow key={production.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {production.batchNumber}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {production.productName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {production.plannedQuantity} {production.unit}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={production.producedQuantity >= production.plannedQuantity ? 'success.main' : 'textPrimary'}
                        sx={{ fontWeight: 500 }}
                      >
                        {production.producedQuantity || 0} {production.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {production.startDate ? new Date(production.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {production.endDate ? new Date(production.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={production.status}
                        size="small"
                        color={getStatusColor(production.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, production)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {productions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No production batches found. Click "New Production" to get started.
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
      </TabPanel>

      {/* BOM Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Bill of Materials Management
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Define and manage bill of materials for your products. Set up raw material requirements, quantities, and costs.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create BOM
          </Button>
        </Paper>
      </TabPanel>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Production;