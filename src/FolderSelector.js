// FolderSelector.js

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from '@mui/material';

const FolderSelector = () => {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [node1, setNode1] = useState('');
  const [node2, setNode2] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving:', { selectedFolder, nodeName, node1, node2 });
    handleCloseDialog();
  };

  return (
    <div>
      <Button variant="contained" onClick={handleOpenDialog}>
        Open Folder Dialog
      </Button>
      <Typography variant="h6" style={{ marginTop: '20px' }}>
        Selected Folder: {selectedFolder}
      </Typography>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Select Folder and Enter Node Details</DialogTitle>
        <DialogContent>
          <TextField
            label="Node Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
          />
          <TextField
            label="Node 1"
            fullWidth
            margin="normal"
            variant="outlined"
            value={node1}
            onChange={(e) => setNode1(e.target.value)}
          />
          <TextField
            label="Node 2"
            fullWidth
            margin="normal"
            variant="outlined"
            value={node2}
            onChange={(e) => setNode2(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FolderSelector;
