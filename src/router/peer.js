  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/peers', async (req, res) => {
    const getPeers = await syncing.getPeers();
    console.log("getPeers", getPeers)
    try{
      res.status(200).json(getPeers).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });
  
  router.get('/peersinfo', async (req, res) => {
    const getPeersInfo = await syncing.getPeersInfo();
    //console.log("getPeersInfo", getPeersInfo)
    try{
      res.status(200).json(getPeersInfo).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/info', async (req, res) => {
    const getLightNodeStatusValue = await syncing.getLightNodeStatus();
    try{
      res.status(200).json(getLightNodeStatusValue).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/queue', async (req, res) => {
    res.json([]).end();
  });

  export default router;
