// expressApp.js
import express from 'express';
import syncing from './src/syncing.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import blockRoutes from './src/router/block.js'
import txRoutes from './src/router/tx.js'
import walletRoutes from './src/router/wallet.js'
import fileRoutes from './src/router/file.js'
import peerRoutes from './src/router/peer.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3030;

const expressApp = express();

expressApp.use(cors());

// Some load balancers use 'HEAD' requests to check if a node is alive
expressApp.head('/', (req, res) => {
  res.status(200).end();
});

// Return permissive CORS headers for 'OPTIONS' requests
expressApp.options('/chunk', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

expressApp.options('/block', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

expressApp.options('/tx', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

expressApp.options('/peer', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

expressApp.options('/arql', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// For any other 'OPTIONS' requests, set 'Access-Control-Allow-Methods' to 'GET'
expressApp.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET');
  res.status(200).end();
});

expressApp.get('/syncing', async (req, res) => {
  await syncing.deleteBlackTxsAndAddress();
  //await syncing.calculatePeers();
  //await syncing.resetTx404();
  //await syncing.syncingBlock(2);
  await syncing.syncingTx(20);
  //await syncing.syncingChunksPromiseAll(400);
  //await syncing.syncingTxParseBundle(10);
  res.json({});
});

expressApp.get('/info', async (req, res) => {
    const getLightNodeStatusValue = await syncing.getLightNodeStatus();
    res.json(getLightNodeStatusValue);
});
expressApp.get('/queue', async (req, res) => {
  res.json([]);
});

expressApp.use('/', blockRoutes);
expressApp.use('/', walletRoutes);
expressApp.use('/', fileRoutes);
expressApp.use('/', peerRoutes);
//PUT THE LAST LOCATION
expressApp.use('/', txRoutes);





expressApp.use(express.static(join(__dirname, 'html')));

expressApp.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'html', 'index.html'));
});

const startServer = (port) => {
  return expressApp.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
  });
};

const getPort = () => {
  return PORT;
};

const server = startServer(PORT);

export { expressApp, server, getPort };
