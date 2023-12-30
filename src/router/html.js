  // blockRoutes.js

  import express from 'express';
  import { dirname, join } from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const router = express.Router();

  
  // Some load balancers use 'HEAD' requests to check if a node is alive
  router.head('/', (req, res) => {
    res.status(200).end();
  });
  
  // Return permissive CORS headers for 'OPTIONS' requests
  router.options('/chunk', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });
  
  router.options('/block', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });
  
  router.options('/tx', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });
  
  router.options('/peer', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });
  
  router.options('/arql', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
  });
  
  // For any other 'OPTIONS' requests, set 'Access-Control-Allow-Methods' to 'GET'
  router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET');
    res.status(200).end();
  });

  router.get('/addresses', (req, res) => { res.sendFile(join(__dirname, '../../html/addresses', 'index.html')); });
  router.get('/addressfiles', (req, res) => { res.sendFile(join(__dirname, '../../html/addressfiles', 'index.html')); });
  router.get('/agent', (req, res) => { res.sendFile(join(__dirname, '../../html/agent', 'index.html')); });
  router.get('/blocks', (req, res) => { res.sendFile(join(__dirname, '../../html/blocks', 'index.html')); });
  router.get('/drive', (req, res) => { res.sendFile(join(__dirname, '../../html/drive', 'index.html')); });
  router.get('/files', (req, res) => { res.sendFile(join(__dirname, '../../html/files', 'index.html')); });
  router.get('/images', (req, res) => { res.sendFile(join(__dirname, '../../html/images', 'index.html')); });
  router.get('/locales', (req, res) => { res.sendFile(join(__dirname, '../../html/locales', 'index.html')); });
  router.get('/mywallets', (req, res) => { res.sendFile(join(__dirname, '../../html/mywallets', 'index.html')); });
  router.get('/nodes', (req, res) => { res.sendFile(join(__dirname, '../../html/nodes', 'index.html')); });
  router.get('/overview', (req, res) => { res.sendFile(join(__dirname, '../../html/overview', 'index.html')); });
  router.get('/profile', (req, res) => { res.sendFile(join(__dirname, '../../html/profile', 'index.html')); });
  router.get('/task', (req, res) => { res.sendFile(join(__dirname, '../../html/task', 'index.html')); });
  router.get('/txs', (req, res) => { res.sendFile(join(__dirname, '../../html/txs', 'index.html')); });
  router.get('/user', (req, res) => { res.sendFile(join(__dirname, '../../html/user', 'index.html')); });
  router.get('/wallet', (req, res) => { res.sendFile(join(__dirname, '../../html/wallet', 'index.html')); });


  

  export default router;
