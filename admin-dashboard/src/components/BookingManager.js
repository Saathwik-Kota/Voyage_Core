import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, IconButton } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const BookingManager = () => {
  const [travels, setTravels] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTravel, setCurrentTravel] = useState({
    title: '', description: '', price: '', durationDays: '', startDate: '', endDate: '', maxParticipants: '', status: 'active'
  });

  useEffect(() => {
    fetchTravels();
  }, []);

  const fetchTravels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/travels`);
      setTravels(response.data.travels);
    } catch (error) {
      toast.error('Failed to fetch travels');
    }
  };

  const handleOpen = (travel = null) => {
    if (travel) {
      setCurrentTravel({
        ...travel,
        durationDays: travel.duration_days,
        startDate: travel.start_date,
        endDate: travel.end_date,
        maxParticipants: travel.max_participants
      });
      setEditMode(true);
    } else {
      setCurrentTravel({ title: '', description: '', price: '', durationDays: '', startDate: '', endDate: '', maxParticipants: '', status: 'active' });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTravel({ title: '', description: '', price: '', durationDays: '', startDate: '', endDate: '', maxParticipants: '', status: 'active' });
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_URL}/api/travels/${currentTravel.id}`, currentTravel);
        toast.success('Travel updated successfully');
      } else {
        await axios.post(`${API_URL}/api/travels`, currentTravel);
        toast.success('Travel created successfully');
      }
      fetchTravels();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this travel?')) {
      try {
        await axios.delete(`${API_URL}/api/travels/${id}`);
        toast.success('Travel deleted successfully');
        fetchTravels();
      } catch (error) {
        toast.error('Failed to delete travel');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Booking & Itinerary Engine</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Travel
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Duration (Days)</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {travels.map((travel) => (
              <TableRow key={travel.id}>
                <TableCell>{travel.title}</TableCell>
                <TableCell>${travel.price}</TableCell>
                <TableCell>{travel.duration_days}</TableCell>
                <TableCell>{new Date(travel.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{travel.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(travel)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(travel.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Travel' : 'Add Travel'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={currentTravel.title}
            onChange={(e) => setCurrentTravel({ ...currentTravel, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={currentTravel.description}
            onChange={(e) => setCurrentTravel({ ...currentTravel, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={currentTravel.price}
            onChange={(e) => setCurrentTravel({ ...currentTravel, price: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Duration (Days)"
            type="number"
            value={currentTravel.durationDays}
            onChange={(e) => setCurrentTravel({ ...currentTravel, durationDays: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={currentTravel.startDate}
            onChange={(e) => setCurrentTravel({ ...currentTravel, startDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={currentTravel.endDate}
            onChange={(e) => setCurrentTravel({ ...currentTravel, endDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Max Participants"
            type="number"
            value={currentTravel.maxParticipants}
            onChange={(e) => setCurrentTravel({ ...currentTravel, maxParticipants: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={currentTravel.status}
              onChange={(e) => setCurrentTravel({ ...currentTravel, status: e.target.value })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
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

export default BookingManager;
