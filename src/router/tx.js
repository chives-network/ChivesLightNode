  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/tx/pending', async (req, res) => {
    const getTxPending = await syncing.getTxPending();
    //console.log("/tx/pending:", getTxPending);
    res.json(getTxPending).end();
  });

  router.get('/tx/:id/status', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxStatusById(id);
    res.json(TxInfor).end();
  });

  router.get('/unconfirmed_tx/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxUnconfirmed(id);
    res.json(TxInfor).end();
  });

  //Binary Format
  router.get('/unconfirmed_tx2/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxUnconfirmed(id);
    res.json(TxInfor).end();
  });

  router.get('/tx/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = syncing.getTxInforById(id);
    //console.log("/tx/:id:", id);
    res.json(JSON.parse(TxInfor)).end();
  });

  //Binary Format
  router.get('/tx2/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = syncing.getTxInforById(id);
    //console.log("/tx/:id:", id);
    res.json(JSON.parse(TxInfor)).end();
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    if(FileName != undefined) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`)
    }
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent).end();  
  });

  router.get('/:id/thumbnail', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxDataThumbnail(id);
    console.log("FileName", FileName)
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    FileName ? res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`) : null;
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent).end();  
  });

  router.get('/tx/:id/data', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    //res.setHeader('Content-Disposition', `attachment; filename="${FileName}"`);
    FileName ? res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`) : null;
    ContentType ? res.setHeader('Content-Type', ContentType) : null;
    res.status(200).send(FileContent).end();  
  });

  router.get('/tx/:txid/unbundle/:pageid/:pagesize', async (req, res) => {
    const { txid, pageid, pagesize } = req.params;
    const getTxBundleItemsInUnbundle = await syncing.getTxBundleItemsInUnbundle(txid, pageid, pagesize);
    console.log("getTxBundleItemsInUnbundle", getTxBundleItemsInUnbundle)
    res.status(200).json(getTxBundleItemsInUnbundle).end();  
  });
  
  router.get('/transaction/:pageid/:pagesize', async (req, res) => {
    const { pageid, pagesize } = req.params;
    const getAllTxPageJson = await syncing.getAllTxPageJson(pageid, pagesize);
    //console.log("getAllTxPageJson", getAllTxPageJson)
    res.status(200).json(getAllTxPageJson).end();  
  });

  export default router;
