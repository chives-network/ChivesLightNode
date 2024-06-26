  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/statistics_block', async (req, res) => {
    const getStatisticsBlock = await syncing.getStatisticsBlock(15);
    //console.log("getStatisticsBlock getStatisticsBlock", getStatisticsBlock)
    try{
      res.status(200).json(getStatisticsBlock).end(); 
    }
    catch(error) {
      res.status(200).json([]).end(); 
    }
  });

  export default router;
