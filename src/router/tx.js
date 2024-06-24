  // blockRoutes.js

  import express from 'express'
  import syncing from '../syncing.js'
  import bodyParser from 'body-parser'

  const router = express.Router();

  router.use(bodyParser.json({ limit: '2gb' }));

  router.post('/chunk', async (req, res) => {
    const payload = req.body;
    const postChunk = await syncing.postChunk(payload);
    //console.log("/chunk", postChunk);
    res.send(postChunk).end();
  });

  router.post('/tx', async (req, res) => {
    const payload = req.body;
    const postTx = await syncing.postTx(payload);
    //console.log("/tx", postTx);
    res.send(postTx).end();
  });
  
  router.get('/tx/pending', async (req, res) => {
    const getTxPending = await syncing.getTxPending();
    //console.log("/tx/pending:", getTxPending);
    try{
      res.status(200).json(getTxPending).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });
  
  router.get('/tx/pending/record', async (req, res) => {
    const getTxPendingRecord = await syncing.getTxPendingRecord();
    //console.log("/tx/pending:", getTxPending);
    try{
      res.status(200).json(getTxPendingRecord).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/tx_anchor', async (req, res) => {
    const getTxAnchor = await syncing.getTxAnchor();
    //console.log("/tx_anchor:", getTxAnchor);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=3600');
    res.send(getTxAnchor).end();
  });

  router.get('/tx/:id/status', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxStatusById(id);
    try{
      res.status(200).json(TxInfor).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/unconfirmed_tx/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxUnconfirmed(id);
    try{
      res.status(200).json(TxInfor).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  //Binary Format
  router.get('/unconfirmed_tx2/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = await syncing.getTxUnconfirmed(id);
    try{
      res.status(200).json(TxInfor).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/tx/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = syncing.getTxInforById(id);
    //console.log("/tx/:id:", id);
    try{
      res.status(200).json(JSON.parse(TxInfor)).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  //Binary Format
  router.get('/tx2/:id', async (req, res) => {
    const { id } = req.params;
    const TxInfor = syncing.getTxInforById(id);
    //console.log("/tx/:id:", id);
    try{
      res.status(200).json(JSON.parse(TxInfor)).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    if(FileName != undefined) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`)
    }
    if(ContentType != undefined) {
      res.setHeader('Content-Type', ContentType);
    }
    res.status(200).send(FileContent).end();  
  });

  router.get('/:id/thumbnail', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    if(FileName != undefined) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`)
    }
    if(ContentType != undefined) {
      res.setHeader('Content-Type', ContentType);
    }
    res.status(200).send(FileContent).end(); 
  });

  router.get('/tx/:id/data', async (req, res) => {
    const { id } = req.params;
    const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    //res.setHeader('Content-Disposition', `attachment; filename="${FileName}"`);
    if(FileName != undefined) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`)
    }
    if(ContentType != undefined) {
      res.setHeader('Content-Type', ContentType);
    }
    res.status(200).send(FileContent).end();  
  });

  router.get('/tx/:txid/unbundle/:pageid/:pagesize', async (req, res) => {
    const { txid, pageid, pagesize } = req.params;
    const getTxBundleItemsInUnbundle = await syncing.getTxBundleItemsInUnbundle(txid, pageid, pagesize);
    //console.log("getTxBundleItemsInUnbundle", getTxBundleItemsInUnbundle)
    try{
      res.status(200).json(getTxBundleItemsInUnbundle).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });
  
  router.get('/transaction/:pageid/:pagesize', async (req, res) => {
    const { pageid, pagesize } = req.params;
    const getAllTxPageJson = await syncing.getAllTxPageJson(pageid, pagesize);
    //console.log("getAllTxPageJson", getAllTxPageJson)
    try{
      res.status(200).json(getAllTxPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  export default router;
