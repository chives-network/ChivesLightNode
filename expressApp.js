// expressApp.js
import express from 'express';
import syncing from './src/syncing.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import htmlRoutes from './src/router/html.js'
import blockRoutes from './src/router/block.js'
import txRoutes from './src/router/tx.js'
import walletRoutes from './src/router/wallet.js'
import fileRoutes from './src/router/file.js'
import peerRoutes from './src/router/peer.js'
import priceRoutes from './src/router/price.js'
import statRoutes from './src/router/stat.js'
import agentRoutes from './src/router/agent.js'
import lightNodeRoutes from './src/router/lightnode.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 1985;

const expressApp = express();

expressApp.use(cors());


expressApp.get('/syncing', async (req, res) => {
  //await syncing.deleteBlackTxsAndAddress();
  //await syncing.calculatePeers();
  syncing.syncingTxWaitDoingAction(10);
  //await syncing.syncingBlockAndTxStatAllDates(80);
  //await syncing.syncingBlockMissing();
  //35753 43355 
  //await syncing.syncingBlockPromiseAll(30);
  //await syncing.syncingBlock(2);
  //await syncing.syncingTx(5);
  //await syncing.syncingChunksPromiseAll(10);
  //await syncing.syncingTxParseBundle(1);
  //await syncing.syncingBlockMinedTime(1000);
  res.json({});
});



expressApp.use('/', lightNodeRoutes);
expressApp.use('/', agentRoutes);
expressApp.use('/', statRoutes);
expressApp.use('/', htmlRoutes);
expressApp.use('/', blockRoutes);
expressApp.use('/', walletRoutes);
expressApp.use('/', fileRoutes);
expressApp.use('/', peerRoutes);
expressApp.use('/', priceRoutes);

//PUT THE LAST LOCATION
expressApp.use('/', txRoutes);


/*
[<<"wallet">>, Addr, <<"last_tx">>]
[<<"tx_anchor">>]
sync_buckets
data_sync_record
chunk
chunk2
//<<"tx">>, EncodedID, <<"offset">>
//<<"POST">>, [<<"chunk">>]
[<<"inflation">>, EncodedHeight]
[<<"price">>, SizeInBytesBinary]
[<<"price2">>, SizeInBytesBinary]
[<<"optimistic_price">>, SizeInBytesBinary]
[<<"price">>, SizeInBytesBinary, EncodedAddr]
[<<"price2">>, SizeInBytesBinary, EncodedAddr]
[<<"optimistic_price">>, SizeInBytesBinary, EncodedAddr]
[<<"v2price">>, SizeInBytesBinary]
[<<"v2price">>, SizeInBytesBinary, EncodedAddr]
[<<"reward_history">>, EncodedBH]
[<<"block_time_history">>, EncodedBH]
[<<"hash_list">>]
[<<"block_index">>]
[<<"block_index2">>]

*/

// Middleware to conditionally serve static files based on the request's IP
const serveStaticLocally = (req, res, next) => {
  // Check if the request is coming from localhost (127.0.0.1 or ::1)
  const ipAddress = req.ip || req.connection.remoteAddress;
  if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
    // Serve static files only for requests from localhost
    express.static(join(__dirname, 'html'))(req, res, next);
  } else {
    // Proceed to the next middleware for requests from other IP addresses
    next();
  }
};
expressApp.use(serveStaticLocally);


expressApp.get('/', syncing.restrictToLocalhost, (req, res) => {
  res.sendFile(join(__dirname, 'html', 'index.html'));
});

expressApp.get('*', syncing.restrictToLocalhost, (req, res) => {
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
