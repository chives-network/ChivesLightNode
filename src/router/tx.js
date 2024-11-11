  // blockRoutes.js

  import express from 'express'
  import syncing from '../syncing.js'
  import bodyParser from 'body-parser'

  const router = express.Router();

  async function getTxDataSupportLargeFile(req, res) {
    const { id } = req.params;
    switch(id) {
      case 'recent_hash_list_diff':
        res.status(404).send('File not found');
        return;
      case 'sync_buckets':
        res.status(404).send('File not found');
        return;
    }
    const TxIdFilter = syncing.filterString(id)
    const DataDir = syncing.getDataDir()
    const FilePath = DataDir + '/' + "files/" + TxIdFilter.substring(0, 2).toLowerCase() + '/' + TxIdFilter;
    console.log("FilePath",FilePath)
    if (syncing.isFile(FilePath)) {
      //Large File
      const getTxInforByIdFromDbValue = await syncing.getTxInforByIdFromDb(TxIdFilter);
      const FileName = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['item_name'] ? getTxInforByIdFromDbValue['item_name'] : TxIdFilter;
      const ContentType = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['content_type'] ? getTxInforByIdFromDbValue['content_type'] : "";
      res.setHeader('Cache-Control', 'public, max-age=3600');
      if (FileName) {
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`);
      }
      if (ContentType) {
          res.setHeader('Content-Type', ContentType);
      }
      const fileStream = syncing.readFileStream(FilePath);
      fileStream.pipe(res).on('error', (err) => {
          res.status(500).send('Error reading file ' + TxIdFilter);
      }).on('finish', () => {
        console.log('File sent successfully ' + TxIdFilter);
      });
    }
    else {
      //Small File
      const TxContent = syncing.readFile("txs/" + TxIdFilter.substring(0, 2).toLowerCase(), TxIdFilter + '.json', "getTxData", 'utf-8');
      const TxContentJson = JSON.parse(TxContent);
      if(TxContentJson && TxContentJson.data && TxContentJson.data_root == '') {
        const getTxInforByIdFromDbValue = await syncing.getTxInforByIdFromDb(TxIdFilter);
        const FileName = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['item_name'] ? getTxInforByIdFromDbValue['item_name'] : TxIdFilter;
        const ContentType = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['content_type'] ? getTxInforByIdFromDbValue['content_type'] : "";
        res.setHeader('Cache-Control', 'public, max-age=3600');
        if (FileName) {
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(FileName)}"`);
        }
        if (ContentType) {
            res.setHeader('Content-Type', ContentType);
        }
        const FileContent = Buffer.from(TxContentJson.data, 'base64');
        res.status(200).send(FileContent).end(); 
      }
      else {
        res.status(404).send('File not found');
      }
    }
  }

  async function getTxDataThumbnailFile(req, res) {
    const { id } = req.params;
    switch(id) {
      case 'recent_hash_list_diff':
        res.status(404).send('File not found');
        return;
      case 'sync_buckets':
        res.status(404).send('File not found');
        return;
    }
    const getTxDataThumbnailData = await syncing.getTxDataThumbnail(id)
    //res.setHeader('Cache-Control', 'public, max-age=3600');
    if(getTxDataThumbnailData)   {
      if (getTxDataThumbnailData.FileName) {
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(getTxDataThumbnailData.FileName)}"`)
          console.log("FileName--------------", getTxDataThumbnailData.FileName)
      }
      if (getTxDataThumbnailData.ContentType) {
          res.setHeader('Content-Type', getTxDataThumbnailData.ContentType)
          console.log("ContentType-----------", getTxDataThumbnailData.ContentType)
      }
      if (getTxDataThumbnailData.FileContent) {
        res.status(200).send(getTxDataThumbnailData.FileContent)
      }
      res.end()
    }    
    else {
      return;
    }
  }

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
  
  router.get('/tx/pending/myrecord/:id', async (req, res) => {
    const { id } = req.params;
    const getTxPendingMyRecord = await syncing.getTxPendingMyRecord(id);
    //console.log("/tx/pending:", getTxPending);
    try{
      res.status(200).json(getTxPendingMyRecord).end(); 
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
    await getTxDataSupportLargeFile(req, res);
  });

  router.get('/:id/thumbnail', async (req, res) => {
    await getTxDataThumbnailFile(req, res);
  });

  router.get('/tx/:id/data', async (req, res) => {
    await getTxDataSupportLargeFile(req, res);
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
