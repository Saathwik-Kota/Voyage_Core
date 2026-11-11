import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Chip } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const TransactionMethods = () => {
  const [methods, setMethods] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMethod, setCurrentMethod] = useState({ name: '', type: 'stripe', isActive: true, config: {} });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payment-methods`);
      setMethods(response.data);
    } catch (error) {
      toast.error('Failed to fetch payment methods');
    }
  };

  const handleOpen = (method = null) => {
    if (method) {
      setCurrentMethod({ ...method, isActive: method.is_active });
      setEditMode(true);
    } else {
      setCurrentMethod({ name: '', type: 'stripe', isActive: true, config: {} });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentMethod({ name: '', type: 'stripe', isActive: true, config: {} });
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_URL}/api/payment-methods/${currentMethod.id}`, currentMethod);
        toast.success('Payment method updated successfully');
      } else {
        await axios.post(`${API_URL}/api/payment-methods`, currentMethod);
        toast.success('Payment method created successfully');
      }
      fetchMethods();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await axios.delete(`${API_URL}/api/payment-methods/${id}`);
        toast.success('Payment method deleted successfully');
        fetchMethods();
      } catch (error) {
        toast.error('Failed to delete payment method');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Transaction & Settlement Methods</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Payment Method
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell>{method.name}</TableCell>
                <TableCell>{method.type.toUpperCase()}</TableCell>
                <TableCell>
                  <Chip
                    label={method.is_active ? 'Active' : 'Inactive'}
                    color={method.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(method)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(method.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={currentMethod.name}
            onChange={(e) => setCurrentMethod({ ...currentMethod, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={currentMethod.type}
              onChange={(e) => setCurrentMethod({ ...currentMethod, type: e.target.value })}
            >
              <MenuItem value="stripe">Stripe</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={currentMethod.isActive}
              onChange={(e) => setCurrentMethod({ ...currentMethod, isActive: e.target.value })}
            >
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionMethods;
