// expressApp.js
const express = require('express');
const path = require('path');
const axios = require('axios');
const db = require('./db'); 
const syncing = require('./syncing'); 

const expressApp = express();
const PORT = process.env.PORT || 3030;

expressApp.get('/syncing', async (req, res) => {
  //const result = await syncing.syncingBlock(100);
  //const result = await syncing.syncingTx(6);
  await syncing.syncingChunks(300);
  const result = await syncing.syncingTxParseBundle(50);
  res.json(result);
});

expressApp.get('/info', async (req, res) => {
    const getLightNodeStatusValue = await syncing.getLightNodeStatus();
    res.json(getLightNodeStatusValue);
});

expressApp.get('/block/height/:id', async (req, res) => {
  const { id } = req.params;
  const BlockInfor = await syncing.getBlockInforByHeight(id);
  console.log("/block/height/:id:", id);
  res.json(JSON.parse(BlockInfor));
});

expressApp.get('/block/hash/:id', async (req, res) => {
  const { id } = req.params;
  const BlockRow = await syncing.getBlockInforByHashFromDb(id);
  if(BlockRow && BlockRow.height) {
    const BlockInfor = await syncing.getBlockInforByHeight(BlockRow.height);
    console.log("/block/hash/:id:", BlockRow.height);
    res.json(JSON.parse(BlockInfor));
  }
  else {
    //res.status(404).send('Not Found');
    res.send("Not Found");
  }
});

expressApp.get('/tx/:id', async (req, res) => {
  const { id } = req.params;
  const TxInfor = await syncing.getTxInforById(id);
  if(TxInfor && TxInfor.data && TxInfor.data_root == "") {

  }
  console.log("/tx/:id:", id);
  res.json(JSON.parse(TxInfor));
});

expressApp.get('/:id', async (req, res) => {
  const { id } = req.params;
  const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  res.setHeader('Content-Disposition', `inline; filename="${FileName}"`);
  res.setHeader('Content-Type', ContentType);
  res.status(200).send(FileContent);  
});

expressApp.get('/:id/thumbnail', async (req, res) => {
  const { id } = req.params;
  const {FileName, ContentType, FileContent} = await syncing.getTxDataThumbnail(id);
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  res.setHeader('Content-Disposition', `inline; filename="${FileName}"`);
  res.setHeader('Content-Type', ContentType);
  res.status(200).send(FileContent);  
});

expressApp.get('/tx/:id/data', async (req, res) => {
  const { id } = req.params;
  const {FileName, ContentType, FileContent} = await syncing.getTxData(id);
  res.setHeader('Cache-Control', 'public, max-age=3600'); 
  //res.setHeader('Content-Disposition', `attachment; filename="${FileName}"`);
  res.setHeader('Content-Disposition', `inline; filename="${FileName}"`);
  res.setHeader('Content-Type', ContentType);
  res.status(200).send(FileContent);  
});

expressApp.get('/wallet/:id/balance', async (req, res) => {
  const { id } = req.params;
  const AddressBalance = await syncing.getAddressBalance(id);
  console.log("AddressBalance", id, AddressBalance)
  res.status(200).send(String(AddressBalance));  
});


expressApp.get('/wallet/:id/reserved_rewards_total', async (req, res) => {
  const { id } = req.params;
  const AddressBalance = await syncing.getAddressBalanceMining(id);
  console.log("AddressBalance", id, AddressBalance)
  res.status(200).send(String(AddressBalance));  
});











expressApp.use(express.static(path.join(__dirname, 'html')));

//expressApp.get('*', (req, res) => {
//  res.sendFile(path.join(__dirname, 'html', 'index.html'));
//});

const startServer = (port) => {
  return expressApp.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
  });
};

if (require.main === module) {
  startServer(PORT);
}

module.exports = { expressApp, startServer, PORT };
