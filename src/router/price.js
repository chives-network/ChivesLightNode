  // blockRoutes.js

  import express from 'express';
  import syncing from '../syncing.js';

  const router = express.Router();

  router.get('/price/:datasize', async (req, res) => {
    const { datasize } = req.params;
    const getPrice = await syncing.getPrice(datasize);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    //console.log("getPrice", getPrice)
    res.status(200).send(getPrice).end();  
  });

  export default router;
