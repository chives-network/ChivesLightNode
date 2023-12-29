  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/tx/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = syncing.getTxInforById(id);
    if(TxInfor && TxInfor.data && TxInfor.data_root == "") {

    }
    //console.log("/tx/:id:", id);
    res.json(JSON.parse(TxInfor));
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    FileName ? res.setHeader('Content-Disposition', `inline; filename="${FileName}"`) : null;
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent);  
  });

  router.get('/:id/thumbnail', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxDataThumbnail(id);
    console.log("FileName", FileName)
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    FileName ? res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`) : null;
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent);  
  });

  router.get('/tx/:id/data', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    //res.setHeader('Content-Disposition', `attachment; filename="${FileName}"`);
    FileName ? res.setHeader('Content-Disposition', `inline; filename="${FileName}"`) : null;
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent);  
  });

  router.get('/tx/:txid/unbundle/:pageid/:pagesize', async (req, res) => {
    const { txid, pageid, pagesize } = req.params;
    const getTxBundleItemsInUnbundle = await syncing.getTxBundleItemsInUnbundle(txid, pageid, pagesize);
    console.log("getTxBundleItemsInUnbundle", getTxBundleItemsInUnbundle)
    res.status(200).json(getTxBundleItemsInUnbundle);  
  });
  
  router.get('/transaction/:pageid/:pagesize', async (req, res) => {
    const { pageid, pagesize } = req.params;
    const getAllTxPageJson = await syncing.getAllTxPageJson(pageid, pagesize);
    //console.log("getAllTxPageJson", getAllTxPageJson)
    res.status(200).json(getAllTxPageJson);  
  });

  export default router;
