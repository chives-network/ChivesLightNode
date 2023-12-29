  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/peers', async (req, res) => {
    const getPeers = await syncing.getPeers();
    console.log("getPeers", getPeers)
    res.status(200).json(getPeers);  
  });
  
  router.get('/peersinfo', async (req, res) => {
    const getPeersInfo = await syncing.getPeersInfo();
    //console.log("getPeersInfo", getPeersInfo)
    res.status(200).json(getPeersInfo);  
  });

  export default router;
