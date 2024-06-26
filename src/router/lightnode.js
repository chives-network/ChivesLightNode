  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';
  import axios from 'axios';

  const router = express.Router();

  // Middleware function to restrict access to localhost only
  const allowLocalhostOnly = (req, res, next) => {
    const ip = req.ip;
    // Check if the request is coming from localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
      next(); // Allow the request to continue
    } else {
      res.status(403).send('Forbidden'); // Respond with Forbidden status if not from localhost
    }
  };

  // Apply the middleware to the specific route
  router.get('/lightnode/updateNodeAddress/:NodeAddress', allowLocalhostOnly, async (req, res) => {
    const { NodeAddress } = req.params;
    syncing.setChivesLightNodeAddress(NodeAddress);
    const ChivesLightNodeAddress = syncing.getChivesLightNodeAddress();
    try {
      res.status(200).send(ChivesLightNodeAddress).end(); 
    } catch(error) {
      res.status(200).send('').end(); 
    }
  });


  router.get('/lightnode/status', async (req, res) => {
    try{
      const { NodeApi, DataDir, arweave, db } = await syncing.initChivesLightNode()
      const chivesLightNodeStatusValue = await syncing.chivesLightNodeStatus();
      const ChivesLightNodeAddress = syncing.getChivesLightNodeAddress();
      let AddressBalance = 0
      if(NodeApi && ChivesLightNodeAddress && ChivesLightNodeAddress.length == 43) {
        AddressBalance = await axios.get(NodeApi + "/wallet/" + ChivesLightNodeAddress + "/balance", {}).then((res)=>{return res.data}).catch(() => {});
      }
      res.status(200).json({...chivesLightNodeStatusValue, NodeAddress: ChivesLightNodeAddress, NodeBalance: AddressBalance}).end(); 
    }
    catch(error) {
      console.log("error", error)
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
