  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/lightnode/status', async (req, res) => {
    const chivesLightNodeStatusValue = await syncing.chivesLightNodeStatus();
    try{
      res.status(200).json(chivesLightNodeStatusValue).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/lightnode/nodeurl/:address', async (req, res) => {
    const { address } = req.params;
    const chivesLightNodeUrlValue = await syncing.chivesLightNodeUrl(address);
    try{
      res.status(200).json(chivesLightNodeUrlValue).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/lightnode/heartbeat/:address/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getChivesLightNodeHeartBeatValue = await syncing.getChivesLightNodeHeartBeat(address, pageid, pagesize);
    try{
      res.status(200).json(getChivesLightNodeHeartBeatValue).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  router.get('/lightnode/reward/:address/:pageid/:pagesize', async (req, res) => {
    const { address, pageid, pagesize } = req.params;
    const getChivesLightNodeRewardValue = await syncing.getChivesLightNodeReward(address, pageid, pagesize);
    try{
      res.status(200).json(getChivesLightNodeRewardValue).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  //, syncing.restrictToLocalhost

  export default router;
