  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/wallet/:id/balance', async (req, res) => {
    const { id } = req.params;
    const AddressBalance = await syncing.getAddressBalance(id);
    //console.log("AddressBalance", id, AddressBalance)
    res.status(200).send(String(AddressBalance)).end();  
  });

  router.get('/wallet/:id/reserved_rewards_total', async (req, res) => {
    const { id } = req.params;
    const AddressBalance = await syncing.getAddressBalanceMining(id);
    //console.log("AddressBalance", id, AddressBalance)
    res.status(200).send(String(AddressBalance)).end();  
  });

  router.get('/wallet/:address/txsrecord/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsAllPageJson = await syncing.getWalletTxsAllPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsAllPageJson", getWalletTxsAllPageJson)
    try{
      res.status(200).json(getWalletTxsAllPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:txid/txrecord', async (req, res) => {
    const { txid, pageid, pagesize } = req.params;
    const getWalletTxJson = await syncing.getWalletTxJson(txid, pageid, pagesize);
    //console.log("getWalletTxJson", getWalletTxJson)
    //res.status(200).json(getWalletTxJson).end();  
    try{
      res.status(200).json(getWalletTxJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:address/sent/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsSentPageJson = await syncing.getWalletTxsSentPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsSentPageJson", getWalletTxsSentPageJson)
    try{
      res.status(200).json(getWalletTxsSentPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:address/send/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsSentPageJson = await syncing.getWalletTxsSentPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsSentPageJson", getWalletTxsSentPageJson)
    try{
      res.status(200).json(getWalletTxsSentPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:address/received/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsReceivedPageJson = await syncing.getWalletTxsReceivedPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsReceivedPageJson", getWalletTxsReceivedPageJson)
    try{
      res.status(200).json(getWalletTxsReceivedPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:address/deposits/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsReceivedPageJson = await syncing.getWalletTxsReceivedPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsReceivedPageJson", getWalletTxsReceivedPageJson)
    try{
      res.status(200).json(getWalletTxsReceivedPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/wallet/:address/datarecord/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getWalletTxsFilesPageJson = await syncing.getWalletTxsFilesPageJson(address, pageid, pagesize);
    //console.log("getWalletTxsFilesPageJson", getWalletTxsFilesPageJson)
    try{
      res.status(200).json(getWalletTxsFilesPageJson).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    } 
  });

  export default router;
