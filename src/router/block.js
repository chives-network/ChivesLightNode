  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/block/height/:id', async (req, res) => {
    const { id } = req.params;
    const BlockInfor = syncing.getBlockInforByHeight(id);
    //console.log("/block/height/:id:", id);
    res.json(JSON.parse(BlockInfor)).end();
  });
  
  router.get('/block/hash/:id', async (req, res) => {
    const { id } = req.params;
    const BlockRow = await syncing.getBlockInforByHashFromDb(id);
    if(BlockRow && BlockRow.height) {
      const BlockInfor = syncing.getBlockInforByHeight(BlockRow.height);
      //console.log("/block/hash/:id:", BlockRow.height);
      res.json(JSON.parse(BlockInfor)).end();
    }
    else {
      //res.status(404).send('Not Found');
      res.send("Not Found").end();
    }
  });

  router.get('/blockpage/:pageid/:pagesize', async (req, res) => {
    const { pageid, pagesize } = req.params;
    const getBlockPageJson = await syncing.getBlockPageJson(pageid, pagesize);
    //console.log("getBlockPageJson", getBlockPageJson)
    res.status(200).json(getBlockPageJson).end();  
  });

  router.get('/block/txsrecord/:height/:pageid/:pagesize', async (req, res) => {
    const { height, pageid, pagesize } = req.params;
    const getTxPageJson = await syncing.getTxPageJson(height, pageid, pagesize);
    //console.log("getTxPageJson", getTxPageJson.txs)
    res.status(200).json(getTxPageJson).end();  
  });

  router.get('/address/:pageid/:pagesize', async (req, res) => {
    const { pageid, pagesize } = req.params;
    const getAllAddressPageJson = await syncing.getAllAddressPageJson(pageid, pagesize);
    //console.log("getAllAddressPageJson", getAllAddressPageJson)
    res.status(200).json(getAllAddressPageJson).end();  
  });

  export default router;
