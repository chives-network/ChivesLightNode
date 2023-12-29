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

const expressApp = express();
expressApp.use(cors());
const PORT = process.env.PORT || 3030;

expressApp.get('/syncing', async (req, res) => {
  await syncing.deleteBlackTxsAndAddress();
  await syncing.calculatePeers();
  //await syncing.resetTx404();
  await syncing.syncingBlock(10);
  await syncing.syncingTx(6);
  //await syncing.syncingChunks(30);
  //await syncing.syncingTxParseBundle(10);
  res.json({});
});

expressApp.get('/info', async (req, res) => {
    const getLightNodeStatusValue = await syncing.getLightNodeStatus();
    res.json(getLightNodeStatusValue);
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
