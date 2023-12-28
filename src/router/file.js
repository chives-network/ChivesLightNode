  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();


  router.get('/file/:filetype/:pageid/:pagesize', async (req, res) => {
    const { filetype, pageid, pagesize } = req.params;
    const getAllFileTypePageJson = await syncing.getAllFileTypePageJson(filetype, pageid, pagesize);
    //console.log("getAllFileTypePageJson", getAllFileTypePageJson)
    res.status(200).json(getAllFileTypePageJson);  
  });
  
  router.get('/file/:filetype/:address/:pageid/:pagesize', async (req, res) => {
    const { filetype, address, pageid, pagesize } = req.params;
    const getAllFileTypeAddressPageJson = await syncing.getAllFileTypeAddressPageJson(filetype, address, pageid, pagesize);
    //console.log("getAllFileTypeAddressPageJson", getAllFileTypeAddressPageJson)
    res.status(200).json(getAllFileTypeAddressPageJson);  
  });

  export default router;
