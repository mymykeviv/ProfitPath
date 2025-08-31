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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
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
  Build as BuildIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Assignment as BomIcon,
  Factory as ProductionIcon,
  Inventory as MaterialIcon,
  Timeline as ProcessIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchProductions, fetchBOMs, fetchProducts, fetchMaterials } from '../../utils/api';

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
  
  // BOM Management State
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);
  const [bomFormData, setBomFormData] = useState({
    name: '',
    productId: '',
    version: '1.0',
    description: '',
    materials: []
  });
  
  // Production Batch State
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [productionFormData, setProductionFormData] = useState({
    batchNumber: '',
    productId: '',
    bomId: '',
    plannedQuantity: '',
    startDate: '',
    endDate: '',
    status: 'planned'
  });
  
  // Consumption Recording State
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [consumptionData, setConsumptionData] = useState({
    productionBatchId: '',
    materials: []
  });
  
  // View Details State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  
  // Stepper State for Production Process
  const [activeStep, setActiveStep] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['productions', page, rowsPerPage, searchTerm],
    queryFn: () => fetchProductions({ page: page + 1, limit: rowsPerPage, search: searchTerm }),
  });
  
  const { data: bomsData, isLoading: bomsLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => fetchBOMs(),
  });
  
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
  });
  
  const { data: materialsData } = useQuery({
     queryKey: ['materials'],
     queryFn: () => fetchMaterials(),
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
  
  // BOM Management Handlers
  const handleCreateBom = () => {
    setBomFormData({
      name: '',
      productId: '',
      version: '1.0',
      description: '',
      materials: []
    });
    setSelectedBom(null);
    setBomDialogOpen(true);
  };
  
  const handleEditBom = (bom) => {
    setBomFormData(bom);
    setSelectedBom(bom);
    setBomDialogOpen(true);
  };
  
  const handleBomSubmit = () => {
    // TODO: Implement BOM creation/update API call
    console.log('BOM Data:', bomFormData);
    setBomDialogOpen(false);
  };
  
  const addMaterialToBom = () => {
    setBomFormData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        materialId: '',
        quantity: '',
        unit: '',
        cost: '',
        notes: ''
      }]
    }));
  };
  
  const removeMaterialFromBom = (index) => {
    setBomFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };
  
  // Production Batch Handlers
  const handleCreateProduction = () => {
    setProductionFormData({
      batchNumber: `BATCH-${Date.now()}`,
      productId: '',
      bomId: '',
      plannedQuantity: '',
      startDate: '',
      endDate: '',
      status: 'planned'
    });
    setProductionDialogOpen(true);
  };
  
  const handleProductionSubmit = () => {
    // TODO: Implement production batch creation API call
    console.log('Production Data:', productionFormData);
    setProductionDialogOpen(false);
  };
  
  const handleStartProduction = (production) => {
    // TODO: Implement start production API call
    console.log('Starting production:', production);
  };
  
  const handleStopProduction = (production) => {
    // TODO: Implement stop production API call
    console.log('Stopping production:', production);
  };
  
  // Consumption Recording Handlers
  const handleRecordConsumption = (production) => {
    setConsumptionData({
      productionBatchId: production.id,
      materials: []
    });
    setConsumptionDialogOpen(true);
  };
  
  const handleConsumptionSubmit = () => {
    // TODO: Implement consumption recording API call
    console.log('Consumption Data:', consumptionData);
    setConsumptionDialogOpen(false);
  };
  
  // View Details Handler
  const handleViewDetails = (item, type) => {
    setViewData({ ...item, type });
    setViewDialogOpen(true);
  };
  
  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };
  
  const calculateBomCost = (materials) => {
    return materials.reduce((total, material) => {
      return total + (parseFloat(material.quantity || 0) * parseFloat(material.cost || 0));
    }, 0);
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
            startIcon={<BomIcon />}
            onClick={handleCreateBom}
            sx={{ borderRadius: 2 }}
          >
            Create BOM
          </Button>
          <Button
            variant="contained"
            startIcon={<ProductionIcon />}
            onClick={handleCreateProduction}
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewDetails(production, 'production')}
                          size="small"
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        {production.status === 'planned' && (
                          <IconButton
                            onClick={() => handleStartProduction(production)}
                            size="small"
                            color="success"
                            title="Start Production"
                          >
                            <StartIcon />
                          </IconButton>
                        )}
                        {production.status === 'in_progress' && (
                          <>
                            <IconButton
                              onClick={() => handleRecordConsumption(production)}
                              size="small"
                              color="primary"
                              title="Record Consumption"
                            >
                              <MaterialIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleStopProduction(production)}
                              size="small"
                              color="error"
                              title="Stop Production"
                            >
                              <StopIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          onClick={(e) => handleMenuClick(e, production)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
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
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Bill of Materials
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBom}
              sx={{ borderRadius: 2 }}
            >
              Create BOM
            </Button>
          </Box>
          <TextField
            placeholder="Search BOMs..."
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

        {bomsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <div className="spinner" />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {(bomsData?.data || []).map((bom) => (
              <Grid item xs={12} md={6} lg={4} key={bom.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        {bom.name}
                      </Typography>
                      <Chip
                        label={`v${bom.version}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Product: {bom.productName}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {bom.description || 'No description provided'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Materials: {bom.materials?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(calculateBomCost(bom.materials || []))}
                      </Typography>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={bom.materials?.length > 0 ? 100 : 0}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {bom.materials?.length > 0 ? 'Complete' : 'Incomplete'}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDetails(bom, 'bom')}
                    >
                      View
                    </Button>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditBom(bom)}
                        title="Edit BOM"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Delete BOM"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            {(!bomsData?.data || bomsData.data.length === 0) && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <BomIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No BOMs Found
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Create your first Bill of Materials to define product recipes and material requirements.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBom}
                  >
                    Create First BOM
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
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

      {/* BOM Creation/Edit Dialog */}
      <Dialog
        open={bomDialogOpen}
        onClose={() => setBomDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BomIcon />
            {selectedBom ? 'Edit Bill of Materials' : 'Create Bill of Materials'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="BOM Name"
                value={bomFormData.name}
                onChange={(e) => setBomFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={bomFormData.productId}
                  onChange={(e) => setBomFormData(prev => ({ ...prev, productId: e.target.value }))}
                  label="Product"
                >
                  {(productsData?.data || []).map((product) => (
                    <SelectMenuItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Version"
                value={bomFormData.version}
                onChange={(e) => setBomFormData(prev => ({ ...prev, version: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Total Cost: {formatCurrency(calculateBomCost(bomFormData.materials))}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={bomFormData.description}
                onChange={(e) => setBomFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Materials</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addMaterialToBom}
              size="small"
            >
              Add Material
            </Button>
          </Box>

          {bomFormData.materials.map((material, index) => (
            <Card key={index} sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Material</InputLabel>
                    <Select
                      value={material.materialId}
                      onChange={(e) => {
                        const newMaterials = [...bomFormData.materials];
                        newMaterials[index].materialId = e.target.value;
                        setBomFormData(prev => ({ ...prev, materials: newMaterials }));
                      }}
                      label="Material"
                    >
                      {(materialsData?.data || []).map((mat) => (
                        <SelectMenuItem key={mat.id} value={mat.id}>
                          {mat.name}
                        </SelectMenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={material.quantity}
                    onChange={(e) => {
                      const newMaterials = [...bomFormData.materials];
                      newMaterials[index].quantity = e.target.value;
                      setBomFormData(prev => ({ ...prev, materials: newMaterials }));
                    }}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Unit"
                    value={material.unit}
                    onChange={(e) => {
                      const newMaterials = [...bomFormData.materials];
                      newMaterials[index].unit = e.target.value;
                      setBomFormData(prev => ({ ...prev, materials: newMaterials }));
                    }}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Cost per Unit"
                    type="number"
                    value={material.cost}
                    onChange={(e) => {
                      const newMaterials = [...bomFormData.materials];
                      newMaterials[index].cost = e.target.value;
                      setBomFormData(prev => ({ ...prev, materials: newMaterials }));
                    }}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Notes"
                    value={material.notes}
                    onChange={(e) => {
                      const newMaterials = [...bomFormData.materials];
                      newMaterials[index].notes = e.target.value;
                      setBomFormData(prev => ({ ...prev, materials: newMaterials }));
                    }}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton
                    onClick={() => removeMaterialFromBom(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}

          {bomFormData.materials.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <MaterialIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No materials added yet. Click "Add Material" to get started.
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBomDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBomSubmit}
            variant="contained"
            disabled={!bomFormData.name || !bomFormData.productId || bomFormData.materials.length === 0}
          >
            {selectedBom ? 'Update BOM' : 'Create BOM'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Production Batch Creation Dialog */}
      <Dialog
        open={productionDialogOpen}
        onClose={() => setProductionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProductionIcon />
            Create Production Batch
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Batch Number"
                value={productionFormData.batchNumber}
                onChange={(e) => setProductionFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={productionFormData.productId}
                  onChange={(e) => setProductionFormData(prev => ({ ...prev, productId: e.target.value }))}
                  label="Product"
                >
                  {(productsData?.data || []).map((product) => (
                    <SelectMenuItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>BOM</InputLabel>
                <Select
                  value={productionFormData.bomId}
                  onChange={(e) => setProductionFormData(prev => ({ ...prev, bomId: e.target.value }))}
                  label="BOM"
                >
                  {(bomsData?.data || []).filter(bom => 
                    !productionFormData.productId || bom.productId === productionFormData.productId
                  ).map((bom) => (
                    <SelectMenuItem key={bom.id} value={bom.id}>
                      {bom.name} (v{bom.version})
                    </SelectMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Planned Quantity"
                type="number"
                value={productionFormData.plannedQuantity}
                onChange={(e) => setProductionFormData(prev => ({ ...prev, plannedQuantity: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                value={productionFormData.startDate}
                onChange={(e) => setProductionFormData(prev => ({ ...prev, startDate: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                value={productionFormData.endDate}
                onChange={(e) => setProductionFormData(prev => ({ ...prev, endDate: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleProductionSubmit}
            variant="contained"
            disabled={!productionFormData.batchNumber || !productionFormData.productId || !productionFormData.bomId || !productionFormData.plannedQuantity}
          >
            Create Production Batch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Consumption Recording Dialog */}
      <Dialog
        open={consumptionDialogOpen}
        onClose={() => setConsumptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MaterialIcon />
            Record Material Consumption
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Record the actual materials consumed during production. This will update inventory levels.
          </Alert>
          
          {/* Material consumption form would go here */}
          <Typography variant="body2" color="textSecondary">
            Production Batch: {selectedProduction?.batchNumber}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsumptionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConsumptionSubmit} variant="contained">
            Record Consumption
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewData?.type === 'bom' ? <BomIcon /> : <ProductionIcon />}
            {viewData?.type === 'bom' ? 'BOM Details' : 'Production Batch Details'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewData && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewData.name || viewData.batchNumber}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {viewData.description || `Product: ${viewData.productName}`}
                </Typography>
              </Grid>
              
              {viewData.type === 'bom' && viewData.materials && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Materials</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Material</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewData.materials.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.materialName}</TableCell>
                            <TableCell>{material.quantity}</TableCell>
                            <TableCell>{material.unit}</TableCell>
                            <TableCell>{formatCurrency(material.cost)}</TableCell>
                            <TableCell>{formatCurrency(material.quantity * material.cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              
              {viewData.type === 'production' && (
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Planned Quantity</Typography>
                      <Typography variant="body1">{viewData.plannedQuantity}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Produced Quantity</Typography>
                      <Typography variant="body1">{viewData.producedQuantity || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Start Date</Typography>
                      <Typography variant="body1">
                        {viewData.startDate ? new Date(viewData.startDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">End Date</Typography>
                      <Typography variant="body1">
                        {viewData.endDate ? new Date(viewData.endDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Production;