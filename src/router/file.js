  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/folder/all/:address', async (req, res) => {
    const { address } = req.params;
    const getAllFileFolder = await syncing.getAllFileFolder(address);
    //console.log("getAllFileLabelGroup", getAllFileLabelGroup)
    res.status(200).json(getAllFileFolder).end();  
  });

  router.get('/file/group/label/:address', async (req, res) => {
    const { address } = req.params;
    const getAllFileLabelGroup = await syncing.getAllFileLabelGroup(address);
    //console.log("getAllFileLabelGroup", getAllFileLabelGroup)
    res.status(200).json(getAllFileLabelGroup).end();  
  });

  router.get('/file/:filetype/:pageid/:pagesize', async (req, res) => {
    const { filetype, pageid, pagesize } = req.params;
    const getAllFileTypePageJson = await syncing.getAllFileTypePageJson(filetype, pageid, pagesize);
    //console.log("getAllFileTypePageJson", getAllFileTypePageJson)
    res.status(200).json(getAllFileTypePageJson).end();  
  });
  
  router.get('/file/:filetype/:address/:pageid/:pagesize', async (req, res) => {
    const { filetype, address, pageid, pagesize } = req.params;
    const getAllFileTypeAddressPageJson = await syncing.getAllFileTypeAddressPageJson(filetype, address, pageid, pagesize);
    console.log("getAllFileTypeAddressPageJson", getAllFileTypeAddressPageJson)
    res.status(200).json(getAllFileTypeAddressPageJson).end();  
  });
  
  router.get('/file/folder/:Folder/:address/:pageid/:pagesize', async (req, res) => {
    const { Folder, address, pageid, pagesize } = req.params;
    const getAllFileFolderAddressPageJson = await syncing.getAllFileFolderAddressPageJson(Folder, address, pageid, pagesize);
    console.log("getAllFileFolderAddressPageJson", getAllFileFolderAddressPageJson)
    res.status(200).json(getAllFileFolderAddressPageJson).end();  
  });
  
  router.get('/file/star/:Folder/:address/:pageid/:pagesize', async (req, res) => {
    const { Folder, address, pageid, pagesize } = req.params;
    const getAllFileFolderAddressPageJson = await syncing.getAllFileFolderAddressPageJson(Folder, address, pageid, pagesize);
    console.log("getAllFileFolderAddressPageJson", getAllFileFolderAddressPageJson)
    res.status(200).json(getAllFileFolderAddressPageJson).end();  
  });
  
  router.get('/file/star/:Folder/:address/:pageid/:pagesize', async (req, res) => {
    const { Star, address, pageid, pagesize } = req.params;
    const getAllFileStarAddressPageJson = await syncing.getAllFileStarAddressPageJson(Star, address, pageid, pagesize);
    console.log("getAllFileStarAddressPageJson", getAllFileStarAddressPageJson)
    res.status(200).json(getAllFileStarAddressPageJson).end();  
  });

  export default router;
