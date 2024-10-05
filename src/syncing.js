  import axios from 'axios'
  import fs from 'fs'
  import zlib from 'zlib'
  //import sharp from 'sharp'
  import { unbundleData } from 'arbundles'
  import Arweave from 'arweave'
  import { fileURLToPath } from 'url'
  import { dirname, join } from 'path'
  import { execSync } from 'child_process';
  import * as mammoth from 'mammoth';
  import xlsx from 'xlsx';
  import util from 'util';
  import puppeteer from 'puppeteer';
  import PDFServicesSdk  from '@adobe/pdfservices-node-sdk';
  import sqlite3 from 'sqlite3';
  const sqlite3Verbose = sqlite3.verbose();

  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  //Only for Dev

  //import isDev from 'electron-is-dev';
  const isDev = false;
  let ChivesLightNodeSetting = null
  let ChivesLightNodeAddress = null
  let db = null
  
  console.log("process.argv", process.argv)

  if(process.argv && process.argv[2] && process.argv[2].length == 43 && process.argv[3] && isDirectorySync(process.argv[3]))  {
    setChivesLightNodeAddress(process.argv[2])
    await initChivesLightNodeSetting({"NodeApi1":"http://218.237.82.150:1985","NodeApi2":"http://218.237.82.150:1990","NodeApi3":"http://218.237.82.150:1987","NodeStorageDirectory":process.argv[3]})
  }
  else {
    await initChivesLightNodeSetting({"NodeApi1":"http://218.237.82.150:1985","NodeApi2":"http://218.237.82.150:1990","NodeApi3":"http://218.237.82.150:1987","NodeStorageDirectory":"C:/ChivesWeaveData"});
  }
  
  await initChivesLightNodeSql();
  
  const BlackListAddress = ["omBC7G49jVti_pbqLgl7Z7DouF6fgxY6NAnLgh3FdBo"];

  async function initChivesLightNodeSetting(Data) {
    ChivesLightNodeSetting = Data
  }

  function getChivesLightNodeAddress() {
    return ChivesLightNodeAddress ?? ''
  }

  function setChivesLightNodeAddress(Address) {
    ChivesLightNodeAddress = Address
  }

  async function initChivesLightNode() {
    let NodeApi = null;
    if( ChivesLightNodeSetting && ChivesLightNodeSetting.NodeApi1 && await checkPeer(ChivesLightNodeSetting.NodeApi1) > 0) {
      NodeApi = ChivesLightNodeSetting.NodeApi1
    }
    else if( ChivesLightNodeSetting && ChivesLightNodeSetting.NodeApi2 && await checkPeer(ChivesLightNodeSetting.NodeApi2) > 0) {
      NodeApi = ChivesLightNodeSetting.NodeApi2
    }
    else if( ChivesLightNodeSetting && ChivesLightNodeSetting.NodeApi3 && await checkPeer(ChivesLightNodeSetting.NodeApi3) > 0) {
      NodeApi = ChivesLightNodeSetting.NodeApi3
    }
    else if( await checkPeer("http://218.237.82.150:1985") > 0 ) {
      NodeApi = "http://218.237.82.150:1985"
    }
    else if( await checkPeer("http://218.237.82.150:1987") > 0 ) {
      NodeApi = "http://218.237.82.150:1987"
    }
    else if( await checkPeer("http://14.35.225.221:1986") > 0 ) {
      NodeApi = "http://14.35.225.221:1986"
    }
    else if( await checkPeer("http://218.237.82.150:1990") > 0 ) {
      NodeApi = "http://218.237.82.150:1990"
    }
    else {
      NodeApi = "http://218.237.82.150:1985"
    }

    const DataDir = ChivesLightNodeSetting && ChivesLightNodeSetting.NodeStorageDirectory ? ChivesLightNodeSetting.NodeStorageDirectory : "D:\\";
    const parsedUrl = new URL(NodeApi);
    const arweave = Arweave.init({
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      protocol: 'http',
      timeout: 5000,
      logging: false
    })
    
    if(!isDirectorySync(DataDir)) {
      return {NodeApi, DataDir: null, arweave, db: null}
    }
    
    if(db == null) {
      db = new sqlite3Verbose.Database(DataDir + '/chiveslightnode.db');
    }
    
    return { NodeApi, DataDir, arweave, db }

  }

  async function initChivesLightNodeSql() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    if(DataDir)   {
      db.serialize(() => {
          db.run(`
              CREATE TABLE IF NOT EXISTS peers (
                  ip TEXT PRIMARY KEY,
                  isp TEXT not null,
                  country TEXT not null,
                  region TEXT not null,
                  city TEXT not null,
                  location TEXT not null,
                  area_code TEXT not null,
                  country_code TEXT not null,
                  status INTEGER DEFAULT 0
              );
          `);
          db.run(`
              CREATE TABLE IF NOT EXISTS address (
                  id TEXT PRIMARY KEY,
                  balance INTEGER,
                  txs INTEGER DEFAULT 0,
                  sent INTEGER DEFAULT 0,
                  received INTEGER DEFAULT 0,        
                  lastblock INTEGER,
                  timestamp INTEGER,
                  profile TEXT not null,
                  chivesDrive INTEGER DEFAULT 0,
                  chivesEmail INTEGER DEFAULT 0,            
                  chivesBlog INTEGER DEFAULT 0,
                  chivesMessage INTEGER DEFAULT 0,
                  chivesForum INTEGER DEFAULT 0,
                  chivesDb INTEGER DEFAULT 0,
                  chivesLightNodeUrl TEXT,
                  chivesLightNodeRegisterHeight INTEGER DEFAULT 0,
                  chivesLightNodeStatus INTEGER DEFAULT 0,
                  agent INTEGER DEFAULT 0,        
                  referee TEXT not null,
                  last_tx_action TEXT not null
              );
          `);
          db.run(`
              CREATE TABLE IF NOT EXISTS block (
                  id INTEGER PRIMARY KEY,
                  height INTEGER,
                  indep_hash TEXT,
                  block_size INTEGER default 0,
                  mining_time INTEGER default 0,
                  reward INTEGER default 0,
                  reward_addr TEXT,
                  txs_length INTEGER default 0,
                  weave_size INTEGER default 0,
                  timestamp INTEGER,
                  syncing_status INTEGER default 0,
                  cumulative_diff INTEGER default 0,
                  reward_pool INTEGER default 0,
                  block_date TEXT
              );
          `);
          db.run(`
              CREATE TABLE IF NOT EXISTS tx (
                  id TEXT PRIMARY KEY,
                  block_indep_hash TEXT,
                  last_tx TEXT,
                  owner TEXT,
                  from_address TEXT,
                  target TEXT,
                  quantity INTEGER,
                  signature TEXT,
                  reward INTEGER,
                  timestamp INTEGER,
                  block_height INTEGER,
                  data_size INTEGER,
                  data_root TEXT,
                  data_root_status INTEGER,
                  bundleid TEXT,
                  item_name TEXT,
                  item_type TEXT,
                  item_parent TEXT,
                  content_type TEXT,
                  item_hash TEXT,
                  item_summary TEXT,
                  item_star TEXT,
                  item_label TEXT,
                  item_download TEXT,
                  item_language TEXT,
                  item_pages TEXT,
                  is_encrypt TEXT,
                  is_public TEXT,
                  entity_type TEXT,
                  app_name TEXT,
                  app_version TEXT,
                  app_instance TEXT,
                  item_node_label TEXT,
                  item_node_group TEXT,
                  item_node_star TEXT,
                  item_node_hot TEXT,
                  item_node_delete TEXT,
                  last_tx_action TEXT,
                  bundleTxParse INTEGER,
                  tags TEXT,
                  tx_date TEXT
              );
          `);
          db.run(`
              CREATE TABLE IF NOT EXISTS tag (
                  height INTEGER,
                  tx_id TEXT,
                  name TEXT,
                  value TEXT
              );
          `);
          db.run(`
              CREATE TABLE IF NOT EXISTS blacklist (
                  id TEXT PRIMARY KEY,
                  reason TEXT,
                  timestamp TEXT
              );
          `);    
          db.run(`
              CREATE TABLE IF NOT EXISTS stat (
                  block_date PRIMARY KEY,
                  block_size INTEGER default 0,
                  block_count INTEGER default 0,
                  mining_time INTEGER default 0,
                  reward INTEGER default 0,
                  txs_length INTEGER default 0,
                  weave_size INTEGER default 0,
                  cumulative_diff INTEGER default 0,
                  reward_pool INTEGER default 0,
                  txs_item INTEGER default 0,
                  txs_image INTEGER default 0,
                  txs_video INTEGER default 0,
                  txs_audio INTEGER default 0,
                  txs_pdf INTEGER default 0,
                  txs_word INTEGER default 0,
                  txs_excel INTEGER default 0,
                  txs_ppt INTEGER default 0,
                  txs_stl INTEGER default 0,
                  txs_text INTEGER default 0,
                  txs_exe INTEGER default 0,
                  txs_zip INTEGER default 0,
                  txs_action INTEGER default 0,
                  txs_profile INTEGER default 0,
                  txs_agent INTEGER default 0,
                  txs_referee INTEGER default 0,
                  txs_task_item INTEGER default 0,
                  txs_task_reward INTEGER default 0
              );
          `);    
          db.run(`
              CREATE TABLE IF NOT EXISTS log (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  datetime TEXT,
                  content TEXT
              );
          `); 
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_id ON block (id);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_height ON block (height);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_indep_hash ON block (indep_hash);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_reward_addr ON block (reward_addr);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_syncing_status ON block (syncing_status);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_timestamp ON block (timestamp);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_block_block_date ON block (block_date);`);
          
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_block_indep_hash ON tx (block_indep_hash);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_from_address ON tx (from_address);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_target ON tx (target);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON tx (timestamp);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_block_height ON tx (block_height);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_bundleid ON tx (bundleid);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_data_root ON tx (data_root);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_data_root_status ON tx (data_root_status);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_name ON tx (item_name);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_type ON tx (item_type);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_parent ON tx (item_parent);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_content_type ON tx (content_type);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_hash ON tx (item_hash);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_is_encrypt ON tx (is_encrypt);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_is_public ON tx (is_public);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_entity_type ON tx (entity_type);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_app_name ON tx (app_name);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_app_version ON tx (app_version);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_app_instance ON tx (app_instance);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_tx_date ON tx (tx_date);`);
              
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_label ON tx (item_label);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_star ON tx (item_star);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_language ON tx (item_language);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_node_label ON tx (item_node_label);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_node_group ON tx (item_node_group);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_node_star ON tx (item_node_star);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_node_hot ON tx (item_node_hot);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_item_node_delete ON tx (item_node_delete);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_bundleTxParse ON tx (bundleTxParse);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tx_last_tx_action ON tx (last_tx_action);`);
              
          db.run(`CREATE INDEX IF NOT EXISTS idx_tag_height ON tag (height);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tag_tx_id ON tag (tx_id);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tag_name ON tag (name);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_tag_name_value ON tag (name, value);`);
              
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_lastblock ON address (lastblock);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_timestamp ON address (timestamp);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_profile ON address (profile);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesDrive ON address (chivesDrive);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesEmail ON address (chivesEmail);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesBlog ON address (chivesBlog);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesMessage ON address (chivesMessage);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesForum ON address (chivesForum);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesDb ON address (chivesDb);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesLightNodeUrl ON address (chivesLightNodeUrl);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_chivesLightNodeStatus ON address (chivesLightNodeStatus);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_agent ON address (agent);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_referee ON address (referee);`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_address_last_tx_action ON address (last_tx_action);`);

          db.run(`update tx set signature = null;`);

      });
    }
  }

  function getDataDir() {
    const DataDir = ChivesLightNodeSetting && ChivesLightNodeSetting.NodeStorageDirectory ? ChivesLightNodeSetting.NodeStorageDirectory : null;
    if(!isDirectorySync(DataDir)) {
      return null
    }
    else {
      return DataDir
    }
  }

  async function chivesLightNodeUrl(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT * from address where id='"+filterString(Address)+"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function chivesLightNodeStatus() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getBlockHeightFromDbValue = await getBlockHeightFromDb();
    const BlockInfor = await getBlockInforByHeightFromDb(getBlockHeightFromDbValue);
    const NotSyncingTxCount = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM from tx where from_address is null", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
    const NotSyncingChunksCount = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM from tx where data_root != '' and data_root is not null and data_root_status is null", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
    const NotSyncingBundleTxParseCount = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM from tx where entity_type = 'Bundle' and bundleTxParse is null", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
    const LightNodeStatus = {}
    const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
    LightNodeStatus['network'] = "chivesweave.mainnet";
    LightNodeStatus['height'] = MinerNodeStatus?.height;
    LightNodeStatus['blocks'] = getBlockHeightFromDbValue;
    LightNodeStatus['NotSyncingTxCount'] = NotSyncingTxCount;
    LightNodeStatus['NotSyncingChunksCount'] = NotSyncingChunksCount;
    LightNodeStatus['NotSyncingBundleTxParseCount'] = NotSyncingBundleTxParseCount;
    LightNodeStatus['NodeApi'] = NodeApi;
    LightNodeStatus['DataDir'] = DataDir;
    return LightNodeStatus;    
  }

  async function ownerToAddress(owner) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pubJwk = {
        kty: 'RSA',
        e: 'AQAB',
        n: owner,
    }
    return await arweave.wallets.getAddress(pubJwk)
  }

  async function syncingTxParseBundle(TxCount = 30) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getTxsNotSyncingList = await getTxsBundleNotSyncing(TxCount)
    log("syncingTxParseBundle getTxsNotSyncingList: ", getTxsNotSyncingList)
    try {
      const result = [];
      for (const TxList of getTxsNotSyncingList) {
        await syncingTxParseBundleById(TxList);
        log("syncingTxParseBundle TxInfor: ", TxList.id, TxList.block_height, "TxCount", TxCount)
        result.push(TxList.id)
      }
      return result;
    } 
    catch (error) {
      console.error("syncingTxParseBundle error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingTx(TxCount = 30) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getTxsNotSyncingList = await getTxsNotSyncing(TxCount)
    console.log("syncingTx Count: ", getTxsNotSyncingList.length)
    try {
      const result = [];
      for (const TxList of getTxsNotSyncingList) {
        const TxInfor = await syncingTxById(TxList.id, TxList.block_height, TxList.timestamp);
        console.log("syncingTx TxInfor: ", TxList.id, TxInfor?.id)
        if(TxInfor && TxInfor.id) {
          result.push(TxInfor)
        }
      }
      return result;
    } 
    catch (error) {
      console.error("syncingTx error fetching Tx data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingTxPromiseAll(TxCount = 30) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getTxsNotSyncingList = await getTxsNotSyncing(TxCount);
      log("syncingTxPromiseAll NodeApi: ", NodeApi);
      log("syncingTxPromiseAll DataDir: ", DataDir);
      log("syncingTxPromiseAll Count: ", getTxsNotSyncingList.length);
  
      const result = await Promise.all(
        getTxsNotSyncingList && getTxsNotSyncingList.map(async (TxList) => {
          try {
            const TxInfor = await syncingTxById(TxList.id, TxList.block_height, TxList.timestamp);
            log("syncingTxPromiseAll TxInfor: ", TxList.id, TxInfor?.id);
            return TxInfor;
          } 
          catch (error) {
            console.error("syncingTxPromiseAll error fetching tx data:", error.message, TxList.id, TxList.block_height);
            return { error: "Internal Server Error" };
          }
        })
      );
  
      return result;
    } catch (error) {
      console.error("syncingTx error fetching list:", error.message);
      return { error: "Internal Server Error" };
    }
  }
  
  async function getTxsNotSyncing(TxCount) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      db.all("SELECT id, block_height, timestamp from tx where from_address is null order by block_height asc limit " + TxCount + " offset 0", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getTxsBundleNotSyncing(TxCount) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      db.all("SELECT * from tx where entity_type ='Bundle' and data_root_status = '200' and (bundleTxParse is null or bundleTxParse = '') order by block_height asc limit " + TxCount + " offset 0", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function syncingChunks(TxCount = 5) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getTxsHaveChunksList = await getTxsHaveChunks(TxCount)
    log("syncingChunks Count: ", getTxsHaveChunksList?.length)
    try {
      const result = [];
      for (const TxList of getTxsHaveChunksList) {
        const TxInfor = await syncingTxChunksById(TxList.id);
        result.push(TxInfor)
      }
      return result;
    } 
    catch (error) {
      console.error("syncingChunks error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function resetTx404() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const updateDataRootTypeStatus = db.prepare("update tx set data_root_status = ? where data_root_status = ? and entity_type = ?");
      updateDataRootTypeStatus.run('200', '404', 'ChivesLightNodeHeartBeat');
      updateDataRootTypeStatus.finalize();
      const updateDataRootStatus = db.prepare("update tx set data_root_status = ? where data_root_status = ?");
      updateDataRootStatus.run('', '404');
      updateDataRootStatus.finalize();
    } 
    catch (error) {
      console.error("resetTx404", error.message);
    }
  }

  async function syncingChunksPromiseAll(TxCount = 5) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getTxsHaveChunksList = await getTxsHaveChunks(TxCount);
      log("syncingChunks Count: ", getTxsHaveChunksList?.length);
  
      const result = await Promise.all(
        getTxsHaveChunksList && getTxsHaveChunksList.map(async (TxList) => {
          try {
            const TxInfor = await syncingTxChunksById(TxList.id);
            return TxInfor;
          } catch (error) {
            console.error("syncingChunks error fetching block data:", error.message);
            return { error: "Internal Server Error" };
          }
        })
      );
  
      return result;
    } catch (error) {
      console.error("syncingChunks error fetching list:", error.message);
      return { error: "Internal Server Error" };
    }
  }
  
  async function getTxsHaveChunks(TxCount) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      db.all("SELECT id, data_root, data_root_status from tx where data_root is not null and data_root != '' and (data_root_status is null or data_root_status = '') limit " + TxCount + " offset 0", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  
  async function syncingTxById(TxId, Height, timestamp = 0) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    // @ts-ignore
    let TxInfor = null
    let writeFileStatus = false
    const TxJsonFilePath = DataDir + "/txs/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId + ".json";
    //log("TxInfor TxJsonFilePath",TxJsonFilePath)
    if(isFile(TxJsonFilePath)) {
      //Nothing to do
      const TxContent = getTxInforById(TxId);
      TxInfor = JSON.parse(TxContent)
      log("syncingTxById Read Tx From Json File",TxInfor.id)
      writeFileStatus = true
      log("TxInfor TagsMap",TxInfor.id)
      if(TxInfor==undefined || TxInfor.id==undefined) {
        try {
          fs.unlinkSync(TxJsonFilePath);
          log('File deleted successfully', TxJsonFilePath);
        } 
        catch (err) {
          console.error('Error deleting file:', TxJsonFilePath, err);
        }
        writeFileStatus = false
      }
    }
    else {
      const result = await axios.get(NodeApi + '/tx/' + TxId, {}).catch(() => {});
      if(result && result.data) {
        TxInfor = result.data
        log("syncingTxById From Remote Node",TxId)
        try {
          //Write Tx File
          writeFileStatus = writeFile('txs/' + TxId.substring(0, 2).toLowerCase(), TxId + ".json", JSON.stringify(TxInfor), "syncingTxById")

          //Write Tx File
          if(writeFileStatus)    {
            //Insert Tags
            TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
              const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
              const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
              const insertTag = db.prepare('INSERT OR IGNORE INTO tag (height, tx_id, name, value) VALUES (?, ?, ?, ?)');
              insertTag.run(Height, TxId, TagName, TagValue);
              insertTag.finalize();
            })
          
            //log("TxInfor TagsMap",TxInfor)
            //Tags Data
            const newTags = []
            const TagsMap = {}
            if(TxInfor.owner && TxInfor.owner.address) {
              TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
                TagsMap[Tag.name] = Tag.value;
                newTags.push({'name':Tag.name, 'value':Tag.value})
              })
              TxInfor.owner = TxInfor.owner.key
              TxInfor.quantity = TxInfor.quantity.winston
              //log("TxInfor TagsMap",TagsMap)
            }
            else {
              TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
                const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
                const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
                TagsMap[TagName] = TagValue;
                newTags.push({'name':TagName, 'value':TagValue})
              })
              //log("TxInfor TagsMap",TagsMap)
            }
            //log("TxInfor TagsMap",TxInfor)
            
            //Update Tx
            const updateTx = db.prepare('update tx set last_tx = ?, owner = ?, from_address = ?, target = ?, quantity = ?, reward = ?, data_size = ?, data_root = ?, item_name = ?, item_type = ?, item_parent = ?, content_type = ?, item_hash = ?, item_summary = ?, is_encrypt = ?, is_public = ?, entity_type = ?, app_name = ?, app_version = ?, app_instance = ?, tags = ? where id = ?');
            let from_address = '';
            //log("TxInfor TagsMap",TxInfor)
            if(TxInfor.owner && TxInfor.owner.address) {
              from_address = TxInfor.owner.address;
              TxInfor.owner = TxInfor.owner.key
              TxInfor.quantity = TxInfor.quantity.winston
            }
            else if(TxInfor.owner) {
              from_address = await ownerToAddress(TxInfor.owner);
            }
            else {
              from_address = "";
            }
            const item_name = TagsMap['File-Name'] || "";
            const item_type = contentTypeToFileType(TagsMap['Content-Type']);
            const item_parent = TagsMap['File-Parent'] || "Root";
            const content_type = TagsMap['Content-Type'] || "";
            const item_hash = TagsMap['File-Hash'] || "";
            const item_summary = TagsMap['File-Summary'] || "";
            const is_encrypt = TagsMap['Cipher-ALG'] || "";
            const is_public = TagsMap['File-Public'] || "";
            const app_name = TagsMap['App-Name'] || "";
            const app_version = TagsMap['App-Version'] || "";
            const app_instance = TagsMap['App-Instance'] || "";

            let entity_type = "";
            const BundleFormat = TagsMap['Bundle-Format'] || "";
            if(BundleFormat == "binary") {
                entity_type = "Bundle";
            }
            else if(TagsMap['Entity-Type'] && TagsMap['Entity-Type'] == "Action" && 
              (TagsMap['Entity-Action'] == "RegisterChivesLightNode" || TagsMap['Entity-Action'] == "HeartBeatChivesLightNode") 
              ) {
                entity_type = "WaitDoingAction";
            }
            else if(TagsMap['Entity-Type'] && TagsMap['Entity-Type'] != "") {
                entity_type = TagsMap['Entity-Type'];
            }
            else if(TxInfor.data_size > 0 && item_type !="" && item_name != "") {
                entity_type = "File";
            }
            else {
                entity_type = "Tx";
            }
            updateTx.run(TxInfor.last_tx, TxInfor.owner, from_address, TxInfor.target, TxInfor.quantity, TxInfor.reward, TxInfor.data_size, TxInfor.data_root, item_name, item_type, item_parent, content_type, item_hash, item_summary, is_encrypt, is_public, entity_type, app_name, app_version, app_instance, JSON.stringify(newTags), TxId);
            updateTx.finalize();

            log("TxInfor from_address: ", from_address)

            //Insert Address
            let BlockInfor = {}
            if(timestamp == 0) {
              BlockInfor = await getBlockInforByHeightFromDb(Height);
            }
            else {
              BlockInfor = {height: Height, timestamp: timestamp }
            }
            const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            insertAddress.run(from_address, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
            insertAddress.finalize();
            //Update Address
            const AddressBalance = await axios.get(NodeApi + "/wallet/" + from_address + "/balance", {}).then((res)=>{return res.data}).catch(() => {});
            const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where id = ?');
            updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalance, from_address);
            updateAddress.finalize();
            if(TxInfor.target && TxInfor.target.length==43) {
              const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
              insertAddress.run(TxInfor.target, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
              insertAddress.finalize();
              //Update Address
              const AddressBalanceTarget = await axios.get(NodeApi + "/wallet/" + TxInfor.target + "/balance", {}).then((res)=>{return res.data}).catch(() => {});
              log("TxInfor.target", TxInfor.target)
              log("AddressBalanceTarget", AddressBalanceTarget)
              const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where id = ?');
              updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalanceTarget, TxInfor.target);
              updateAddress.finalize();
            }

            //Download Chunk
            const data_root = TxInfor.data_root
            if(data_root && data_root.length && data_root.length == 43) {
                log("TxInfor data_root: ______________________________________________________________", data_root)
                log("TxInfor entity_type: ______________________________________________________________", entity_type)
            }
          }
          else {
            //Write File Content Error
          }

        } 
        catch (err) {
          console.error('syncingTxById Error writeFileStatus:', err);
        }
      }
    }

    return TxInfor;
  }

  function isFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile() && stats.size > 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  async function syncingTxParseBundleById(TxInfor) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    //syncingTxPromiseAll(10);
    //syncingChunksPromiseAll(50);
    //Write Tx File
    if(TxInfor && TxInfor.id) {
      const TxId = TxInfor.id;
      const BundlePath = DataDir + '/files/' + TxId.substring(0, 2).toLowerCase() + '/' + TxId;
      if( isFile(BundlePath) == true ) {
        //Check File Content Valid
        const FileContent = fs.readFileSync(BundlePath);
        const FileContentString = FileContent.toString('utf-8')
        if(FileContentString.includes("This page cannot be found, yet.")) {
          //Invalid FileContent
          fs.unlinkSync(BundlePath);
          //Update Tx Status
          const updateBundle = db.prepare('update tx set data_root_status = ? where id = ?');
          updateBundle.run('', TxId);
          updateBundle.finalize();
        }
      }
      if( isFile(BundlePath) == false ) {
        await syncingTxChunksById(TxId);
        log("syncingTxParseBundleById unBundleItem id",BundlePath)
      }
      if( isFile(BundlePath) ) {
          log("syncingTxParseBundleById Exist", BundlePath)  
          try {
              //const TxInfor = await getTxInforByIdFromDb(TxId);
              //log("syncingTxParseBundleById TxInfor",TxInfor)
              const FileContent = fs.readFileSync(BundlePath);
              try {
                  const unbundleItems = unbundleData(FileContent);
                  //log("syncingTxParseBundleById unbundleItems",unbundleItems)
                  unbundleItems.items.map(async (Item) => {
                      //Tags Data
                      const TagsMap = {}
                      Item && Item.tags && Item.tags.length > 0 && Item.tags.map( (Tag) => {
                          TagsMap[Tag.name] = Tag.value;
                      })
                      if('Content-Type' in TagsMap && TagsMap['Content-Type'] == "application/x.chivesweave-manifest+json")    {
                        //Not Need Parse File
                      }
                      else {
                        log("unbundleItems",Item)
                        log("unbundleItems id", Item.id, Item.tags)
                        //log("unBundleItem tags",Item.tags)
                        //log("unBundleItem owner",Item.owner)
                        //log("unBundleItem anchor",Item.anchor)
                        //log("unBundleItem target",Item.target)
                        //log("unBundleItem signature",Item.signature)
                        //log("unBundleItem signatureType",Item.signatureType)
                        //log("unBundleItem data",Item.data)
                        //Update Chunks Status IGNORE
                        const insertTxBundleItem = db.prepare('INSERT OR IGNORE INTO tx (id,block_indep_hash,last_tx,owner,from_address,target,quantity,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action,tags, tx_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                        const id = Item.id
                        const block_indep_hash = TxInfor.block_indep_hash
                        const last_tx = Item.anchor
                        const owner = Item.owner
                        const from_address = await ownerToAddress(Item.owner);
                        const target = Item.target
                        const quantity = Item.quantity || 0
                        const reward = 0
                        const timestamp = TxInfor.timestamp
                        const block_height = TxInfor.block_height
                        const data_size = Item.data.length
                        const bundleid = TxId;

                        const item_name = TagsMap['File-Name'] || "";
                        const item_type = contentTypeToFileType(TagsMap['Content-Type']);
                        const item_parent = TagsMap['File-Parent'] || "Root";
                        const content_type = TagsMap['Content-Type'] || "";
                        const item_hash = TagsMap['File-Hash'] || "";
                        const item_summary = TagsMap['File-Summary'] || "";
                        
                        const item_star = TagsMap['File-Summary'] || "";
                        const item_label = TagsMap['File-Summary'] || "";
                        const item_download = TagsMap['File-Summary'] || "";
                        const item_language = TagsMap['File-Summary'] || "";
                        const item_pages = TagsMap['File-Summary'] || "";
                        
                        const entity_type = TagsMap['Entity-Type'] || "File"
                        const bundleTxParse = ''
                        const data_root = ''
                        const data_root_status = 200

                        const is_encrypt = TagsMap['Cipher-ALG'] || "";
                        const is_public = TagsMap['File-Public'] || "";
                        const app_name = TagsMap['App-Name'] || "";
                        const app_version = TagsMap['App-Version'] || "";
                        const app_instance = TagsMap['App-Instance'] || "";
                        const last_tx_action = id

                        insertTxBundleItem.run(id,block_indep_hash,last_tx,owner,from_address,target,quantity,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action,JSON.stringify(Item.tags), timestampToDate(timestamp));
                        insertTxBundleItem.finalize();

                        //Write Item Data to File
                        writeFile('files/' + Item.id.substring(0, 2).toLowerCase(), Item.id, Buffer.from(Item.data, 'base64'), "syncingTxParseBundleById")

                        //Write Item Json to File
                        const ItemJson = {}
                        ItemJson.id = Item.id
                        ItemJson.owner = {}
                        ItemJson.owner.address = from_address
                        ItemJson.owner.key = Item.owner
                        ItemJson.anchor = Item.anchor
                        ItemJson.tags = Item.tags
                        ItemJson.block = {}
                        ItemJson.block.height = block_height
                        ItemJson.block.indep_hash = block_indep_hash
                        ItemJson.block.timestamp = timestamp
                        ItemJson.data = {}
                        ItemJson.data.size = data_size
                        ItemJson.data.type = contentTypeToFileType(content_type)
                        ItemJson.fee = {}
                        ItemJson.fee.winston = 0
                        ItemJson.fee.xwe = 0
                        ItemJson.quantity = {}
                        ItemJson.quantity.winston = quantity
                        ItemJson.quantity.xwe = String(quantity/1000000000000)
                        ItemJson.recipient = Item.target
                        ItemJson.signature = Item.signature
                        ItemJson.signatureType = Item.signatureType
                        ItemJson.bundleid = TxId
                        //log("ItemJson", JSON.stringify(ItemJson))
                        writeFile('txs/' + Item.id.substring(0, 2).toLowerCase(), Item.id + '.json', JSON.stringify(ItemJson), "syncingTxParseBundleById")

                        //Update Tx Status
                        const EntityType    = TagsMap['Entity-Type'];
                        const EntityAction  = TagsMap['Entity-Action'];
                        const FileTxId      = TagsMap['File-TxId'];
                        const EntityTarget  = TagsMap['Entity-Target'];
                        const LastTxChange  = TagsMap['Last-Tx-Change'];
                        if(EntityType == "Action") {
                            log("Action TxInfor EntityAction: ______________________________________________________________", EntityAction)
                            switch(EntityAction) {
                                case 'Label':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleLabel = db.prepare('update tx set item_label = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleLabel.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleLabel.finalize();
                                      log("Action Label", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'Star':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleStar = db.prepare('update tx set item_star = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleStar.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleStar.finalize();
                                      log("Action Star", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'Folder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleFolder.finalize();
                                      log("Action Folder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'Public':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundlePublic = db.prepare('update tx set is_public = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundlePublic.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundlePublic.finalize();
                                      log("Action Public", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'RenameFolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleRenameFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleRenameFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleRenameFolder.finalize();
                                      log("Action RenameFolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'DeleteFolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleDeleteFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleDeleteFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleDeleteFolder.finalize();
                                      log("Action DeleteFolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'Restorefolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    if(EntityTarget != undefined)  {
                                      const updateBundleRestorefolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                      updateBundleRestorefolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                      updateBundleRestorefolder.finalize();
                                      log("Action Restorefolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    }
                                    break;
                                case 'Profile':
                                    //DataItemId, BlockTimestamp, BlockHeight, FromAddress, LastTxChange
                                    const updateBundleAddressProfile = db.prepare('update address set profile = ?, timestamp = ?, last_tx_action = ? where (last_tx_action is null and id = ?) or (id = ? and last_tx_action = ?)');
                                    updateBundleAddressProfile.run(Item.id, timestamp, block_height, from_address, from_address, LastTxChange==undefined?'':LastTxChange);
                                    updateBundleAddressProfile.finalize();
                                    //log("LastTxChange", LastTxChange)
                                    log("Action Profile", Item.id, timestamp, block_height, from_address, from_address, LastTxChange);
                                    break;
                                case 'Agent':
                                    //EntityTarget, FromAddress, BlockTimestamp
                                    if(EntityTarget != undefined)  {
                                      const updateBundleAddressAgent = db.prepare("update address set Agent = ?, timestamp = ? where id = ? and Agent = '0'");
                                      updateBundleAddressAgent.run('1', timestamp, from_address);
                                      updateBundleAddressAgent.finalize();
                                      log("Action Agent", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange==undefined?'':LastTxChange);
                                    }
                                    break;
                                case 'Referee':
                                    //EntityTarget, FromAddress, BlockTimestamp
                                    if(EntityTarget != undefined)  {
                                      const updateBundleAddressReferee = db.prepare("update address set referee = ? where id = ?");
                                      updateBundleAddressReferee.run(EntityTarget, from_address);
                                      updateBundleAddressReferee.finalize();
                                      log("Action Referee", EntityTarget, timestamp, block_height, from_address);
                                    }
                                    break;
                            }
                        }
                        if(EntityType == "Folder") {
                          log("Folder TxInfor EntityAction: ______________________________________________________________", EntityAction)
                          switch(EntityAction) {
                            case 'CreateFolder':
                              const EntityActionSql = db.prepare("update tx set entity_type = ? where id = ?");
                              EntityActionSql.run(EntityType, Item.id);
                              EntityActionSql.finalize();
                              break;
                          }
                        }
                      }
                  })
                  const updateBundle = db.prepare('update tx set bundleTxParse = ? where id = ?');
                  updateBundle.run('1', TxId);
                  updateBundle.finalize();
              }
              catch (err) {
                  console.error('Error Arbundles.unbundleData ---------------------------------:', TxId);
                  const updateBundle = db.prepare('update tx set bundleTxParse = ? where id = ?');
                  updateBundle.run(-1, TxId);
                  updateBundle.finalize();
              }
          } 
          catch (err) {
              console.error('Error reading file:', err);
          }
          
      }
      else {
          log("syncingTxParseBundleById Not Exist:", BundlePath)
      }
    }
  }
  
  async function syncingTxWaitDoingAction(Index=10) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const GetTxWaitDoingAction = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM tx where entity_type = 'WaitDoingAction' order by block_height asc limit " + Number(Index), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
    GetTxWaitDoingAction && GetTxWaitDoingAction.map((Item)=>{
      //Tags Data
      const TagsMap = {}
      if(Item && Item.tags) {
        const tags = JSON.parse(Item.tags)
        tags && tags.length > 0 && tags.map( (Tag) => {
          TagsMap[Tag.name] = Tag.value;
        })
      }
      //console.log("TagsMap", TagsMap)
      
      const from_address = Item.from_address
      //Update Tx Status
      const EntityType    = TagsMap['Entity-Type'];
      const EntityAction  = TagsMap['Entity-Action'];
      if(EntityType == "Action") {
          switch(EntityAction) {            
            case 'RegisterChivesLightNode':
              //EntityTarget, FromAddress, BlockTimestamp
              const EntityAddress = TagsMap['Entity-Address'];
              const EntityNodeApi = TagsMap['Entity-NodeApi'];
              if(EntityNodeApi != undefined && EntityAddress == from_address)  {
                const updateBundleAddressReferee = db.prepare("update address set chivesLightNodeUrl = ?, chivesLightNodeRegisterHeight = ? where id = ? and chivesLightNodeUrl is null");
                updateBundleAddressReferee.run(EntityNodeApi, Item.block_height, EntityAddress, function(err) {
                  if (err) {
                      console.error('updateBundleAddressReferee SQL execution error:', err);
                  } 
                  else {
                      const changes = this.changes;              
                      if (changes > 0) {
                          const updateTxEntityTypeReferee = db.prepare("update tx set entity_type = ? where id = ?");
                          updateTxEntityTypeReferee.run("ChivesLightNodeHeartBeat", Item.id);
                          updateTxEntityTypeReferee.finalize();
                      } 
                      else {
                          const updateTxEntityTypeReferee = db.prepare("update tx set entity_type = ? where id = ?");
                          updateTxEntityTypeReferee.run("ChivesLightNodeHeartBeat", Item.id);
                          updateTxEntityTypeReferee.finalize();
                          //console.log('updateBundleAddressReferee SQL executed, but no rows were affected.');
                      }
                  }
                  updateBundleAddressReferee.finalize();
                });
                log("syncingTxWaitDoingAction RegisterChivesLightNode", EntityNodeApi, from_address);
              }
              break;
          case 'HeartBeatChivesLightNode':
              if(true)  {
                const updateBundleAddressReferee = db.prepare("update address set chivesLightNodeStatus = chivesLightNodeStatus + 1 where id = ?");
                updateBundleAddressReferee.run(from_address);
                updateBundleAddressReferee.run(from_address, function(err) {
                  if (err) {
                      console.error('updateBundleAddressReferee SQL execution error:', err);
                  } 
                  else {
                      const changes = this.changes;              
                      if (changes > 0) {
                          const updateTxEntityTypeReferee = db.prepare("update tx set entity_type = ? where id = ?");
                          updateTxEntityTypeReferee.run("ChivesLightNodeHeartBeat", Item.id);
                          updateTxEntityTypeReferee.finalize();
                      } 
                      else {
                          const updateTxEntityTypeReferee = db.prepare("update tx set entity_type = ? where id = ?");
                          updateTxEntityTypeReferee.run("ChivesLightNodeHeartBeat", Item.id);
                          updateTxEntityTypeReferee.finalize();
                          //console.log('updateBundleAddressReferee SQL executed, but no rows were affected.');
                      }
                  }
                  updateBundleAddressReferee.finalize();
                });
                log("syncingTxWaitDoingAction HeartBeatChivesLightNode", from_address);
              }
              break;
          }
        }

    })
  }

  async function syncingTxChunksById(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    // @ts-ignore
    let data_root_status = 0;
    try {
        const arrayBuffer = await fetch(NodeApi + '/' + TxId).then(res => res.arrayBuffer()).catch(() => {})
        //Write Chunks File
        //log("syncingTxChunksById arrayBuffer:", TxId, arrayBuffer)
        if(arrayBuffer && arrayBuffer.byteLength && arrayBuffer.byteLength > 0) {
            const FileBuffer = Buffer.from(arrayBuffer);
            data_root_status = 200
            const FileContentString = FileBuffer.toString('utf-8')
            if(arrayBuffer.byteLength<10000 && FileContentString.includes("This page cannot be found, yet.")) {
              //log("arrayBuffer.byteLength--------------------------------------", arrayBuffer.byteLength)
            }
            else {
              writeFile('files/' + TxId.substring(0, 2).toLowerCase(), TxId, FileBuffer, "syncingTxChunksById")
            }
        }
        else {
            data_root_status = 404
            const TxContent = getTxInforById(TxId)
            const TxInfor = JSON.parse(TxContent)
            const TagsMap = {}
            TagsMap['Content-Type'] = ''
            TagsMap['File-Name'] = ''
            TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
              const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
              const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
              TagsMap[TagName] = TagValue;
            })
            log("syncingTxChunksById Error:", data_root_status, TxId, TagsMap['Content-Type'], TagsMap['File-Name'])
        }
    } 
    catch (error) {
        log("syncingTxChunksById Error:", error)
        data_root_status = 404
    }
    //Update Chunks Status
    const updateAddress = db.prepare('update tx set data_root_status = ? where id = ?');
    updateAddress.run(data_root_status, TxId);
    updateAddress.finalize();
    return TxId;
  }

  function contentTypeToFileType(contentType) {
    const contentTypeMap = {
      "image/png": "image",
      "image/jpeg": "image",
      "image/jpg": "image",
      "image/gif": "image",
      "text/plain": "text",
      "application/x-msdownload": "exe",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.ms-word": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "model/stl": "stl",
      "application/stl": "stl",
      "application/sla": "stl",
      "video/mp4": "video",
      "video/webm": "video",
      "video/ogg": "video",
      "video/mpeg": "video",
      "video/quicktime": "video",
      "video/x-msvideo": "video",		
      "audio/mpeg": "audio",
      "audio/wav": "audio",
      "audio/midi": "audio",
      "audio/ogg": "audio",
      "audio/aac": "audio",
      "audio/x-ms-wma": "audio"
    };
    
    return contentTypeMap[contentType] || contentType; // 未知类型
  }
  
  function getContentTypeAbbreviation(contentType) {
    const contentTypeMap = {
      'text/plain': 'TEXT',
      'text/html': 'HTML',
      'application/json': 'JSON',
      'application/xml': 'XML',
      'application/zip': 'ZIP',
      'application/gzip': 'GZIP',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
      'application/msword': 'DOC',
      'application/vnd.ms-excel': 'XLS',
      'video/mp4': 'Video',
      'video/webm': 'WEBM',
      'video/ogg': 'OGG',
      'video/mpeg': 'Video',
      'video/quicktime': 'quicktime',
      'video/x-msvideo': 'x-msvideo',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'audio/mpeg': 'Audio',
      'audio/wav': 'Audio',
      'audio/midi': 'Audio',
      'audio/ogg': 'Audio',
      'audio/aac': 'Audio',
      'audio/x-ms-wma': 'Audio',
      'application/x.chivesweave-manifest+json': 'JSON',
      'application/x-msdownload': 'EXE',
      'text/csv':'CSV',
    };
    
    return contentTypeMap[contentType] || contentType; // 未知类型
  }
  
  async function syncingBlock(EveryTimeDealBlockCount = 5) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getBlockHeightFromDbValue = await getBlockHeightFromDb()
    const BeginHeight = getBlockHeightFromDbValue + 1;
    console.log("getBlockHeightFromDbValue:", getBlockHeightFromDbValue);
    try {
      let MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      const MaxHeight = MinerNodeStatus.height;
      const GetBlockRange = (MaxHeight - BeginHeight) > EveryTimeDealBlockCount ? EveryTimeDealBlockCount : (MaxHeight - BeginHeight)
      const BlockHeightRange = Array.from({ length: GetBlockRange }, (_, index) => BeginHeight + index);
      //console.log("BlockHeightRange:", BlockHeightRange);
      const result = [];
      for (const Height of BlockHeightRange) {
        const BlockInfor = await syncingBlockByHeight(Height);
        if(BlockInfor && BlockInfor.height) {
          result.push(BlockInfor.height)
        }
      }
      return result;
    } 
    catch (error) {
      console.error("syncingBlock error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  function generateSequence(m, n) {
    return Array.from({ length: n - m + 1 }, (_, index) => m + index);
  }

  function arrayDifference(arr1, arr2) {
    return arr1.filter(item => !arr2.includes(item));
  }

  async function syncingBlockMinedTime(Index = 100) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const GetExistBlocks = await new Promise((resolve, reject) => {
                                db.all("SELECT id, timestamp FROM block where mining_time = '0' order by id asc limit " + Number(Index), (err, result) => {
                                  if (err) {
                                    reject(err);
                                  } else {
                                    resolve(result ? result : null);
                                  }
                                });
                              });
      //console.log("syncingBlockMinedTime GetExistBlocks:", GetExistBlocks);
      const result = [];
      const BlockTimestamp = {}
      const updateBlockMinedTime = db.prepare('update block set mining_time = ? where id = ?');
      updateBlockMinedTime.run(60, 1);
      updateBlockMinedTime.finalize();
      for (const BlockInfor of GetExistBlocks) {
        if(BlockInfor && BlockInfor.id && BlockInfor.timestamp) {
          //log("syncingBlockMinedTime BlockInfor:", BlockInfor);
          BlockTimestamp[Number(BlockInfor.id)] = BlockInfor.timestamp
          if(Number(BlockInfor.id) > 1 && BlockTimestamp[Number(BlockInfor.id)-1] == undefined) {
            const previousBlock = await getBlockInforByHeightFromDb(Number(BlockInfor.id)-1);
            //log("syncingBlockMinedTime previousBlock", previousBlock)
            if(previousBlock && previousBlock.timestamp)   {
              BlockTimestamp[Number(BlockInfor.id)-1] = previousBlock.timestamp;
            }
          }
          if(Number(BlockInfor.id) > 1 && BlockTimestamp[Number(BlockInfor.id)-1] ) {
            const MinedTime = BlockInfor.timestamp - BlockTimestamp[Number(BlockInfor.id)-1]
            const MinedTimeValue = MinedTime > 0 ? MinedTime : 1
            const updateBlockMinedTime = db.prepare('update block set mining_time = ? where id = ?');
            updateBlockMinedTime.run(MinedTimeValue, BlockInfor.id);
            updateBlockMinedTime.finalize();
          }
          result.push(BlockInfor.id)
        }
      }
      console.log("syncingBlockMinedTime Deal Block Count", GetExistBlocks.length)
      
      return result;
    } 
    catch (error) {
      console.error("syncingBlockMinedTime error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingBlockMissing(Index = 0) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const BeginHeight = Index * 1000000 + 1;
    const EndHeight = (Index + 1) * 1000000;
    try {
      const getBlockHeightFromDbValue = await getBlockHeightFromDb();
      let MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      log("MinerNodeStatus 1261:", MinerNodeStatus, NodeApi);
      const MaxHeight = MinerNodeStatus.height;
      //Only do this operation when chain is synced
      if(MaxHeight < (getBlockHeightFromDbValue + 100))  {
        const EndHeightFinal = (MaxHeight - EndHeight) > 0 ? EndHeight : MaxHeight
        const BlockHeightRange = generateSequence(BeginHeight, EndHeightFinal);
        log("BlockHeightRange:", BlockHeightRange);
        const GetExistBlocks = await new Promise((resolve, reject) => {
                                  db.all("SELECT id FROM block where id in ("+BlockHeightRange.join(',')+")", (err, result) => {
                                    if (err) {
                                      reject(err);
                                    } else {
                                      resolve(result ? result : null);
                                    }
                                  });
                                });
        const GetExistBlocksIds = []
        if(GetExistBlocks) {
          GetExistBlocks.map((Item)=>{
            GetExistBlocksIds.push(Item.id)
          })
        }
        //log("GetExistBlocksIds:", GetExistBlocksIds);
        const getMissingBlockIds = arrayDifference(BlockHeightRange, GetExistBlocksIds)
        log("getMissingBlockIds:", getMissingBlockIds);
        const result = [];
        for (const Height of getMissingBlockIds) {
          log("syncingBlockMissing Height:", Height);
          try {
            const BlockInfor = await syncingBlockByHeight(Height);
            if(BlockInfor && BlockInfor.height) {
              result.push(BlockInfor.height)
            }
          }
          catch (error) {
            console.error("syncingBlockMissing error fetching block data 1292:", error.message, Height);
          }
        }
        return result;
      }
      else {
        return { error: "Not Finished Synced" };
      }
    } 
    catch (error) {
      console.error("syncingBlockMissing error fetching block data 1302:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingBlockPromiseAll(EveryTimeDealBlockCount = 5) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getBlockHeightFromDbValue = await getBlockHeightFromDb();
      const BeginHeight = getBlockHeightFromDbValue + 1;
      log("getBlockHeightFromDbValue:", getBlockHeightFromDbValue);
  
      let MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      const MaxHeight = MinerNodeStatus.height;
      const GetBlockRange = (MaxHeight - BeginHeight) > EveryTimeDealBlockCount ? EveryTimeDealBlockCount : (MaxHeight - BeginHeight + 1)
      const BlockHeightRange = Array.from({ length: GetBlockRange }, (_, index) => BeginHeight + index);
      log("BlockHeightRange:", BlockHeightRange);
      
      const result = await Promise.all(
        BlockHeightRange.map(async (Height) => {
          try {
            const BlockInfor = await syncingBlockByHeight(Height);
            if(BlockInfor && BlockInfor.height) {
              return BlockInfor.height;
            }
            else {
              return { error: "Internal Server Error" };
            }
          } 
          catch (error) {
            //console.error("syncingBlockPromiseAll error fetching block data:", error.message);
            return { error: "Internal Server Error" };
          }
        })
      );
  
      return result;
    } catch (error) {
      console.error("syncingBlock error fetching block height from DB:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  function enableBlockHeightDir(Height) {
    const DataDir = getDataDir()
    const BlockHeightDir = String(Math.floor(Height / 10000));
    const directoryPath = join(DataDir, 'blocks', BlockHeightDir);  
    try {
      fs.accessSync(directoryPath, fs.constants.F_OK);
    } 
    catch (err) {
      if (err && err.code === 'ENOENT') {
        try {
          fs.mkdirSync(directoryPath, { recursive: true });
        } 
        catch (mkdirErr) {
          console.error("Error creating directory:", mkdirErr);
        }
      } 
      else {
        console.error("Error checking directory existence:", err);
      }
    }
    return BlockHeightDir;
  }

  function enableDir(directoryPath) {
    try {
        fs.accessSync(directoryPath, fs.constants.F_OK);
    } 
    catch (err) {
        try {
            fs.mkdirSync(directoryPath, { recursive: true });
        } catch (err) {
            console.error(`Error creating directory ${directoryPath}: ${err.message}`);
            throw err;
        }
    }
  }

  function isDirectorySync(path) {
    try {
        const stats = fs.statSync(path);
        return stats.isDirectory();
    } catch (err) {
        console.error('isDirectorySync Error checking if path is a directory:', err);
        return false;
    }
  }
  
  function timestampToDate(timestamp) {
    const date = new Date(Number(timestamp) * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }
  
  async function syncingBlockByHeight(currentHeight) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    // @ts-ignore
    let BlockInfor = null;
    const BlockHeightDir = enableBlockHeightDir(currentHeight);
    const BlockJsonFilePath = DataDir + "/blocks/" + BlockHeightDir + "/" + currentHeight + ".json";
    if(isFile(BlockJsonFilePath)) {
      //Nothing to do
      const BlockContent = getBlockInforByHeight(currentHeight);
      BlockInfor = JSON.parse(BlockContent)
      console.log("syncingBlockByHeight Read Block From Json File",BlockInfor.reward_addr, currentHeight)
    }
    else {
      BlockInfor = await axios.get(NodeApi + '/block/height/' + currentHeight, {
        headers: {},
        params: {}
      }).then(res=>res.data).catch(() => {});
      if(BlockInfor?.reward_addr == undefined)  {
        BlockInfor = await axios.get(ChivesLightNodeSetting.NodeApi2 + '/block/height/' + currentHeight, {
          headers: {},
          params: {}
        }).then(res=>res.data).catch(() => {});
      }
      else if(BlockInfor?.reward_addr == undefined)  {
        BlockInfor = await axios.get(ChivesLightNodeSetting.NodeApi3 + '/block/height/' + currentHeight, {
          headers: {},
          params: {}
        }).then(res=>res.data).catch(() => {});
      }
      else if(BlockInfor?.reward_addr == undefined)  {
        BlockInfor = await axios.get('http://14.35.225.221:1986/block/height/' + currentHeight, {
          headers: {},
          params: {}
        }).then(res=>res.data).catch(() => {});
      }
      console.log("syncingBlockByHeight Get Block From Remote Node", BlockInfor?.reward_addr, currentHeight)
    }

    if(BlockInfor == null || BlockInfor == undefined) {
      return
    }
    
    // Begin a transaction
    //db.exec('BEGIN TRANSACTION');
    try {
      if(BlockInfor && BlockInfor.height && BlockInfor.reward_addr && BlockInfor.timestamp) {
        //Insert Address
        const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        insertAddress.run(BlockInfor.reward_addr, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
        insertAddress.finalize();
      
        //Update Address
        let AddressBalance = 0
        AddressBalance = await getWalletAddressBalanceFromDb(BlockInfor.reward_addr)
        //log("getWalletAddressBalanceFromDb", AddressBalance)
        if(AddressBalance == 0 || AddressBalance == undefined) {
          AddressBalance = await axios.get(NodeApi + "/wallet/" + BlockInfor.reward_addr + "/balance", {}).then((res)=>{return res.data}).catch(() => {});;
          //log("AddressBalanceNodeApi", AddressBalance)
        }
        //log("AddressBalance", AddressBalance)
        const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where id = ?');
        updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalance, BlockInfor.reward_addr);
        updateAddress.finalize();
        
        //Insert Tx
        const Txs = BlockInfor.txs;
        const insertTx = db.prepare('INSERT OR IGNORE INTO tx (id, block_indep_hash, block_height, timestamp, last_tx_action, tx_date) VALUES (?, ?, ?, ?, ?, ?)');
        Txs.map((Tx)=>{
          insertTx.run(Tx, BlockInfor.indep_hash, BlockInfor.height, BlockInfor.timestamp, Tx, timestampToDate(BlockInfor.timestamp));
        })
        insertTx.finalize();

        //Update Tx Detail
        await Promise.all(Txs.map(async (Tx) => {
          await syncingTxById(Tx, BlockInfor.height, BlockInfor.timestamp);
        }));

        //Write Block File
        writeFile("/blocks/" + enableBlockHeightDir(currentHeight), BlockInfor.height + ".json", JSON.stringify(BlockInfor), "syncingBlockByHeight")

        //Insert Block
        const insertStatement = db.prepare('INSERT OR REPLACE INTO block (id, height, indep_hash, block_size, mining_time, reward, reward_addr, txs_length, weave_size, timestamp, syncing_status, cumulative_diff, reward_pool, block_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        insertStatement.run(BlockInfor.height, BlockInfor.height, BlockInfor.indep_hash, BlockInfor.block_size, 0, BlockInfor.reward, BlockInfor.reward_addr, BlockInfor.txs.length, BlockInfor.weave_size, BlockInfor.timestamp, 0, BlockInfor.cumulative_diff, BlockInfor.reward_pool, timestampToDate(BlockInfor.timestamp) );
        insertStatement.finalize();

        if(BlockInfor.height % 100 == 0) {
          //Only calculate the previous day
          await syncingBlockAndTxStat(timestampToDate(BlockInfor.timestamp - 86400));
        }

        // Commit the transaction
        //db.exec('COMMIT');
      }
    } 
    catch (error) {
      // Rollback the transaction if an error occurs
      console.error('syncingBlockByHeight Error:', error.message);
      //db.exec('ROLLBACK');
    }

    return BlockInfor;
  }

  async function syncingBlockAndTxStatAllDates(AllDates=80)  {
    const today = new Date();
    const recent30Days = [];
    for (let i = AllDates; i > 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const block_date = day.toISOString().slice(0, 10);
      try {
        await syncingBlockAndTxStat(block_date);
      } 
      catch (error) {
        console.error("syncingBlockAndTxStatAllDates", error.message);
      }
      recent30Days.push(block_date)
    }
    log("recent30Days", recent30Days)
  }

  async function log(Action1, Action2='', Action3='', Action4='', Action5='', Action6='', Action7='', Action8='', Action9='', Action10='') {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const currentDate = new Date();
    const currentDateTime = currentDate.toLocaleString();
    if(db) {
      try{
        const content = Action1 +" "+ JSON.stringify(Action2) +" "+ JSON.stringify(Action3) +" "+ JSON.stringify(Action4) +" "+ JSON.stringify(Action5) +" "+ JSON.stringify(Action6) +" "+ JSON.stringify(Action7) +" "+ JSON.stringify(Action8) +" "+ JSON.stringify(Action9) +" "+ JSON.stringify(Action10);
        const insertStat = db.prepare('INSERT OR REPLACE INTO log (datetime,content) VALUES (?,?)');
        insertStat.run(currentDateTime, content);
        insertStat.finalize();
      }
      catch (error) {
      }
    }
    //console.log(Action1, Action2, Action3, Action4, Action5, Action6, Action7, Action8, Action9, Action10)
  }

  async function deleteLog() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const MaxId = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT MAX(id) AS NUM FROM log", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
    const DeleteId = MaxId - 1000;
    const DeleteLog = db.prepare("delete from log where id < ?");
    DeleteLog.run(DeleteId);
    DeleteLog.finalize();

    //Delete nodes not online 4 days
    const DeletePeers = db.prepare("delete from peers where status < ?");
    DeletePeers.run(-100);
    DeletePeers.finalize();
  }

  async function syncingBlockAndTxStat(block_date)  {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const BlockStat = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT SUM(block_size/1048576) AS block_size, SUM(mining_time) AS mining_time, SUM(reward/1000000000000) AS reward, SUM(txs_length) AS txs_length, MAX(weave_size/1048576) AS weave_size, MAX(cumulative_diff/1024) AS cumulative_diff, SUM(reward_pool/1000000000000) AS reward_pool, COUNT(*) AS block_count FROM block where block_date='"+filterString(block_date)+"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
    log("BlockStat", BlockStat)
    if(BlockStat && BlockStat.reward) {

      const TxStat = await new Promise((resolve, reject) => {
        db.all("SELECT item_type, COUNT(id) AS item_type_count FROM tx where tx_date='"+filterString(block_date)+"' group by item_type", (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result ? result : null);
          }
        });
      });
      let txs_item = 0;
      const txs_item_map = {}
      txs_item_map['application/gzip'] = 0;
      txs_item_map['application/zip'] = 0;
      txs_item_map['video'] = 0;
      txs_item_map['image'] = 0;
      txs_item_map['pdf'] = 0;
      txs_item_map['text'] = 0;
      txs_item_map['text/html'] = 0;
      txs_item_map['exe'] = 0;
      txs_item_map['doc'] = 0;
      txs_item_map['docx'] = 0;
      txs_item_map['xls'] = 0;
      txs_item_map['xlsx'] = 0;
      txs_item_map['ppt'] = 0;
      txs_item_map['pptx'] = 0;
      txs_item_map['audio'] = 0;
      txs_item_map['stl'] = 0;
      log("TxStat", TxStat)
      TxStat && TxStat.map((Item)=>{
        txs_item += Item.item_type_count
        txs_item_map[Item.item_type] = Item.item_type_count
      })
      const txs_image = txs_item_map['image']
      const txs_video = txs_item_map['video']
      const txs_audio = txs_item_map['audio']
      const txs_pdf = txs_item_map['pdf']
      const txs_word = txs_item_map['doc'] + txs_item_map['docx']
      const txs_excel = txs_item_map['xls'] + txs_item_map['xlsx']
      const txs_ppt = txs_item_map['ppt'] + txs_item_map['pptx']
      const txs_stl = txs_item_map['stl']
      const txs_text = txs_item_map['text']
      const txs_exe = txs_item_map['exe']
      const txs_zip = txs_item_map['application/zip'] + txs_item_map['application/gzip']
      const txs_action = 0
      const txs_profile = 0
      const txs_agent = 0
      const txs_referee = 0
      const txs_task_item = 0
      const txs_task_reward = 0
      //Insert Stat
      try {
        const insertStat = db.prepare('INSERT OR REPLACE INTO stat (block_date,block_size,mining_time,reward,txs_length,weave_size,cumulative_diff,reward_pool,block_count,txs_item,txs_image,txs_video,txs_audio,txs_pdf,txs_word,txs_excel,txs_ppt,txs_stl,txs_text,txs_exe,txs_zip,txs_action,txs_profile,txs_agent,txs_referee,txs_task_item,txs_task_reward) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        insertStat.run(block_date,BlockStat.block_size,BlockStat.mining_time,BlockStat.reward,BlockStat.txs_length,BlockStat.weave_size,BlockStat.cumulative_diff,BlockStat.reward_pool,BlockStat.block_count,txs_item,txs_image,txs_video,txs_audio,txs_pdf,txs_word,txs_excel,txs_ppt,txs_stl,txs_text,txs_exe,txs_zip,txs_action,txs_profile,txs_agent,txs_referee,txs_task_item,txs_task_reward);
        insertStat.finalize();
      } 
      catch (error) {
        console.error("syncingBlockAndTxStat", error.message);
      }
    }

  }

  async function getTxInforByIdFromDb(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    if(db == null) return
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT * FROM tx where id = '"+ TxId +"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getBlockInforByHeightFromDb(Height) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT * FROM block where height = '"+ Number(Height) +"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getBlockInforByHashFromDb(Hash) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT * FROM block where indep_hash = '"+ filterString(Hash) +"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getBlockCount() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM block", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }
  async function getBlockPage(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM block order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getBlockPageJson(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getBlockCountValue = await getBlockCount() ?? 0;
    const getBlockPageValue = await getBlockPage(pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getBlockCountValue/pagesizeFiler);
    RS['data'] = getBlockPageValue;
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getBlockCountValue;
    return RS;
  }

  async function getTxCount(Height) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where from_address is not null and block_height ='"+ Number(Height) +"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }
  async function getTxPage(height, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where block_height ='"+ Number(height) +"' and from_address is not null limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getTxPageJson(height, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const heightFiler = Number(height) < 0 ? 1 : Number(height);
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getTxCountValue = await getTxCount(heightFiler) ?? 0;
    const getTxPageValue = await getTxPage(heightFiler, pageidFiler, pagesizeFiler);
    const BlockInfor = await getBlockInforByHeightFromDb(heightFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getTxCountValue/pagesizeFiler);
    RS['txs'] = TxRowToJsonFormat(getTxPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getTxCountValue;
    RS['block'] = BlockInfor;
    return RS;
  }

  async function getAllTxCount() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }
  async function getAllTxPage(pageid, pagesize, getTxCountValue) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    //const From = getTxCountValue - Number(pagesize) * Number(pageid + 1)
    const From = Number(pagesize) * Number(pageid)
    //console.log("getAllTxPage", pagesize, pageid);
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getAllTxPageJson(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getTxCountValue = await getAllTxCount() ?? 0;
    const getTxPageValue = await getAllTxPage(pageidFiler, pagesizeFiler, getTxCountValue);
    const RS = {};
    RS['allpages'] = Math.ceil(getTxCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getTxPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getTxCountValue;
    return RS;
  }

  async function getTxBundleItemCount(txid) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where bundleid = '"+txid+"' and from_address is not null", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getTxBundleItemPage(txid, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where bundleid = '"+txid+"' and from_address is not null limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getTxBundleItemPageJson(txid, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getTxCountValue = await getTxBundleItemCount(txid);
    const getTxPageValue = await getTxBundleItemPage(txid, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getTxCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getTxPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getTxCountValue;
    return RS;
  }

  async function getTxBundleItemsInUnbundle(txid, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(txid);
      await syncingTxParseBundleById(getTxInforByIdFromDbValue);
      const getTxBundleItemPageJsonValue = await getTxBundleItemPageJson(txid, pageid, pagesize);
      const txArray = TxRowToJsonFormat([getTxInforByIdFromDbValue]);
      getTxBundleItemPageJsonValue['tx'] = txArray[0];
      getTxBundleItemPageJsonValue['txs'] = getTxBundleItemPageJsonValue['data'];
      //log("getTxBundleItemPageJsonValue", getTxBundleItemPageJsonValue);
      return getTxBundleItemPageJsonValue;
    }
    catch(Error) {
      //console.log("getTxBundleItemsInUnbundle Error:", Error)
    }
  }

  async function getTxPending() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const TxPending = await axios.get(NodeApi + '/tx/pending', {}).then(res=>res.data).catch(() => {});
    return TxPending ? TxPending : [];
  }

  async function getTxPendingRecord() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const TxPending = await axios.get(NodeApi + '/tx/pending/record', {}).then(res=>res.data).catch(() => {});
    return TxPending ? TxPending : [];
  }
  
  async function getTxAnchor() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const TxAnchor = await axios.get(NodeApi + '/tx_anchor', {}).then(res=>res.data).catch(() => {});
    return TxAnchor ? String(TxAnchor) : '';
  }

  async function getPrice(datasize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const Price = await axios.get(NodeApi + '/price/' + datasize, {}).then(res=>res.data).catch(() => {});
    return Price ? String(Price) : '0';
  }

  async function getPriceAddress(datasize, Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const Price = await axios.get(NodeApi + '/price/' + datasize + '/' + Address, {}).then(res=>res.data).catch(() => {});
    return Price ? String(Price) : '0';
  }

  async function postTx(Payload) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      let response = await axios.post(NodeApi + '/tx', Payload).catch(() => {});
      log('postTx:', response.data);
      if(response && response.data != "OK") {
        response = await axios.post(NodeApi + '/tx', Payload).catch(() => {});
      }
      postTxForwarding(Payload);
      if(response && response.data) {
        return response.data;
      }
      else {
        return 'ERROR';
      }
    }
    catch (error) {
      console.error('Error:', error.message);
      return 500;
    }
  }

  async function postTxForwarding(Payload) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      db.all("SELECT * from peers where status = '1'", (err, result) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          if(result) {
            result.map((item)=>{
              axios.post("http://"+item.ip + '/tx', Payload).then(res =>{
                  if(res && res.data) {
                    log('postTxForwarding postTx:', item.ip, res.data);              
                  }
                })
                .catch(error => {
                  console.error('postchunkForwarding Error:', item.ip, "Failed ******");
                });
            })
          }
        }
      });      
    } 
    catch (error) {
      console.error('postTxForwarding Error:', error.message);
      return 500;
    }
  }

  async function postChunk(Payload) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const response = await axios.post(NodeApi + '/chunk', Payload);
      log('postChunk:', response.data);
      if(response && response.data != "OK") {
        await axios.post(NodeApi + '/chunk', Payload).catch(() => {});
      }
      postChunkForwarding(Payload)
      if(response && response.data) {
        return response.data;
      }
      else {
        return 'ERROR';
      }
    } 
    catch (error) {
      console.error('Error:', error.message);
      return 500;
    }
  }

  async function postChunkForwarding(Payload) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      db.all("SELECT * from peers where status = '1'", (err, result) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          if(result) {
            result.map((item)=>{
              axios.post("http://"+item.ip + '/chunk', Payload).then(res =>{
                  if(res && res.data) {
                    log('postchunkForwarding postchunk:', item.ip, res.data);              
                  }          
                })
                .catch(error => {
                  console.error('postchunkForwarding Error:', item.ip, "Failed ******");
                });
            })
          }
        }
      });      
    } 
    catch (error) {
      console.error('postTxForwarding Error:', error.message);
      return 500;
    }
  }
  
  async function getTxStatusById(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const TxStatus = await axios.get(NodeApi + '/tx/'+TxId+'/status', {}).then(res=>res.data).catch(() => {});
    return TxStatus;
  }

  async function getTxUnconfirmed(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const TxStatus = await axios.get(NodeApi + '/unconfirmed_tx/'+TxId, {}).then(res=>res.data).catch(() => {});
    return TxStatus;
  }

  async function getAllAddressCount() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM address", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllAddressPage(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM address order by balance desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllAddressPageJson(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getAddressCountValue = await getAllAddressCount();
    const getAddressPageValue = await getAllAddressPage(pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = getAddressPageValue;
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getAllFileTypeCount(FileType) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      let ItemTypeSql = "item_type = '"+FileType+"'";
      if(FileType == "word") {
        ItemTypeSql = "item_type in ('doc', 'docx')";
      }
      else if(FileType == "excel") {
        ItemTypeSql = "item_type in ('xls', 'xlsx')";
      }
      else if(FileType == "pptx") {
        ItemTypeSql = "item_type in ('ppt', 'pptx')";
      }
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where "+ ItemTypeSql +" and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllFileTypePage(FileType, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      let ItemTypeSql = "item_type = '"+FileType+"'";
      if(FileType == "word") {
        ItemTypeSql = "item_type in ('doc', 'docx')";
      }
      else if(FileType == "excel") {
        ItemTypeSql = "item_type in ('xls', 'xlsx')";
      }
      else if(FileType == "pptx") {
        ItemTypeSql = "item_type in ('ppt', 'pptx')";
      }
      db.all("SELECT * FROM tx where "+ ItemTypeSql +" and is_encrypt = '' and (entity_type = 'File' or entity_type = 'Folder') order by entity_type desc, block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileTypePageJson(FileType, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const getAddressCountValue = await getAllFileTypeCount(FileType);
    const getAddressPageValue = await getAllFileTypePage(FileType, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getWalletTxJson(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxId);
      log("getTxInforByIdFromDbValue", getTxInforByIdFromDbValue)
      return TxRowToJsonFormat([getTxInforByIdFromDbValue])[0];
    }
    catch(Error) {
      //console.log("getWalletTxJson Error:", Error)
    }
  }

  async function getAllFileTypeAddressCount(FileType, Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where item_type = '"+FileType+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllFileTypeAddressPage(FileType, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where item_type = '"+FileType+"' and from_address = '"+Address+"' and is_encrypt = '' and (entity_type = 'File' or entity_type = 'Folder') order by entity_type desc, block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileTypeAddressPageJson(FileType, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const FileTypeFilter = filterString(FileType);
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getAllFileTypeAddressCount(FileTypeFilter, AddressFilter);
    const getAddressPageValue = await getAllFileTypeAddressPage(FileTypeFilter, AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }
  

  async function getAllFileFolderAddressCount(Folder, Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where item_parent = '"+Folder+"' and from_address = '"+Address+"' and is_encrypt = '' and (entity_type = 'File' or entity_type = 'Folder') ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllFileFolderAddressPage(Folder, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where item_parent = '"+Folder+"' and from_address = '"+Address+"' and is_encrypt = '' and (entity_type = 'File' or entity_type = 'Folder') order by entity_type desc, block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileFolderAddressPageJson(Folder, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const FolderFilter = filterString(Folder)
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getAllFileFolderAddressCount(FolderFilter, AddressFilter);
    const getAddressPageValue = await getAllFileFolderAddressPage(FolderFilter, AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getAllFileStarAddressCount(Star, Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where item_star = '"+Star+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllFileStarAddressPage(Star, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where item_star = '"+Star+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileStarAddressPageJson(Star, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const StarFilter = filterString(Star)
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getAllFileStarAddressCount(StarFilter, AddressFilter);
    const getAddressPageValue = await getAllFileStarAddressPage(StarFilter, AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getAllFileLabelAddressCount(Label, Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where item_label = '"+Label+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getAllFileLabelAddressPage(Label, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where item_label = '"+Label+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileLabelAddressPageJson(Label, Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const LabelFilter = filterString(Label);
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getAllFileLabelAddressCount(LabelFilter, AddressFilter);
    const getAddressPageValue = await getAllFileLabelAddressPage(LabelFilter, AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getAllFileLabelGroup(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const AddressFilter = filterString(Address);
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT item_label, COUNT(*) AS NUM FROM tx where is_encrypt = '' and entity_type = 'File' and from_address = '"+AddressFilter+"' group by item_label", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getAllFileFolder(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const AddressFilter = filterString(Address);
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where is_encrypt = '' and entity_type = 'Folder' and from_address = '"+AddressFilter+"' order by block_height desc", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  
  async function getWalletTxsAllCount(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where from_address = '"+Address+"' and is_encrypt = '' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getWalletTxsAllPage(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where from_address = '"+Address+"' and is_encrypt = '' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getWalletTxsAllPageJson(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getWalletTxsAllCount(AddressFilter);
    const getAddressPageValue = await getWalletTxsAllPage(AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getWalletTxsSentCount(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'Tx' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }
  
  async function getWalletTxsSentPage(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where from_address = '"+Address+"' and is_encrypt = '' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getWalletTxsSentPageJson(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getWalletTxsSentCount(AddressFilter);
    const getAddressPageValue = await getWalletTxsSentPage(AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getWalletTxsReceivedCount(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where target = '"+Address+"' and is_encrypt = '' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getWalletTxsReceivedPage(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where target = '"+Address+"' and is_encrypt = '' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getWalletTxsReceivedPageJson(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getWalletTxsReceivedCount(AddressFilter);
    const getAddressPageValue = await getWalletTxsReceivedPage(AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getWalletTxsFilesCount(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(0);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM FROM tx where from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }

  async function getWalletTxsFilesPage(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.all("SELECT * FROM tx where from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getWalletTxsFilesPageJson(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AddressFilter = filterString(Address);
    const getAddressCountValue = await getWalletTxsFilesCount(AddressFilter);
    const getAddressPageValue = await getWalletTxsFilesPage(AddressFilter, pageidFiler, pagesizeFiler);
    const RS = {};
    RS['allpages'] = Math.ceil(getAddressCountValue/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(getAddressPageValue);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = getAddressCountValue;
    return RS;
  }

  async function getPeers() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getPeersInfoValue = await getPeersInfo();
    const RS = [];
    getPeersInfoValue && getPeersInfoValue.map((Peer)=>{
      RS.push(Peer.ip)
    })
    return RS;
  }

  async function checkPeer(url) {
    try {
      const response = await axios.get(url).catch(() => {});  
      if (response && response.status === 200) {
        //log(`URL ${url} is reachable.`);
        if(response.data && response.data.type && response.data.type == "lightnode") {
          return 2;
        }
        else {
          return 1;
        }
      } else {
        //log(`URL ${url} returned an unexpected status code: ${response.status}`);
        return -1;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        //console.error(`Connection refused to URL ${url}. Make sure the server is running and accessible.`);
        return -1;
      } else {
        //console.error(`Error checking URL ${url}: ${error.message}`);
        return -1;
      }
    }
  }

  async function calculatePeers() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const getPeersAvailableList = await getPeersInfo()
      getPeersAvailableList.map(async (Item)=>{
        const peerIsAvailable = await checkPeer("http://"+Item.ip+"/info")
        
        log("peerIsAvailable", Item.ip, peerIsAvailable)
        if(peerIsAvailable == -1) {
          const updatePeerAvailable = db.prepare('update peers set status = status - 1 where ip = ?');
          updatePeerAvailable.run(Item.ip);
          updatePeerAvailable.finalize();
          await getPeersAndInsertDb(Item.ip);
        }
        else if(peerIsAvailable == 1) {
          const updatePeerAvailable = db.prepare('update peers set status = ? where ip = ?');
          updatePeerAvailable.run(peerIsAvailable, Item.ip);
          updatePeerAvailable.finalize();
          await getPeersAndInsertDb(Item.ip);
        }        
        else if(peerIsAvailable == 2) {
          const updatePeerAvailable = db.prepare('update peers set status = ? where ip = ?');
          updatePeerAvailable.run(peerIsAvailable, Item.ip);
          updatePeerAvailable.finalize();
        }
      })
      const peersList = await axios.get(NodeApi + '/peers', {}).then(res=>res.data).catch(() => {});
      const HaveIpLocationPeersList = await getPeers();
      if(peersList && peersList.length > 0) {
        peersList.map(async (PeerAndPort)=>{
          if(!HaveIpLocationPeersList.includes(PeerAndPort)) {
            const peerIsAvailable = await checkPeer("http://"+PeerAndPort+"/info")
            const PeerAndPortArray = PeerAndPort.split(':');
            const ip = PeerAndPortArray[0];
            const url = `https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data&ip=${ip}`;
            const IPJSON = await axios.get(url, {}).then(res=>res.data).catch(() => {});  
            if(IPJSON && IPJSON.isp) {
              const insertPeers = db.prepare('INSERT OR REPLACE INTO peers (ip, isp, country, region, city, location, area_code, country_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
              insertPeers.run(PeerAndPort, IPJSON.isp, IPJSON.country, IPJSON.region, IPJSON.city, IPJSON.location, IPJSON.area_code, IPJSON.country_code, 0);
              insertPeers.finalize();
            }
            if(peerIsAvailable == -1)  {
              const updatePeersStatus = db.prepare("update peers set status = status - 1 where ip = ? ");
              updatePeersStatus.run(PeerAndPort);
              updatePeersStatus.finalize();
            }

            //log("IPJSON", IPJSON)
          }  
        })
      }
      return peersList;
    } 
    catch (error) {
      console.error("calculatePeers-------------------------------:", "calculatePeers");
      return [];
    }
  }

  async function getPeersAndInsertDb(PeerUrl) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      const peersList = await axios.get("http://" + PeerUrl + '/peers', {}).then(res=>res.data).catch(() => {});
      const HaveIpLocationPeersList = await getPeers();
      //log("peersList", peersList)
      if(peersList && peersList.length > 0) {
        peersList.map(async (PeerAndPort)=>{
          if(!HaveIpLocationPeersList.includes(PeerAndPort)) {
            const peerIsAvailable = await checkPeer("http://" + PeerAndPort+"/info")
            const PeerAndPortArray = PeerAndPort.split(':');
            const ip = PeerAndPortArray[0];
            const url = `https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data&ip=${ip}`;
            const IPJSON = await axios.get(url, {}).then(res=>res.data).catch(() => {});  
            if(IPJSON && IPJSON.isp)  {
              const insertPeers = db.prepare('INSERT OR REPLACE INTO peers (ip, isp, country, region, city, location, area_code, country_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
              insertPeers.run(PeerAndPort, IPJSON.isp, IPJSON.country, IPJSON.region, IPJSON.city, IPJSON.location, IPJSON.area_code, IPJSON.country_code);
              insertPeers.finalize();
              log("getPeersAndInsertDb", PeerAndPort)
            }
            if(peerIsAvailable == -1)  {
              const updatePeersStatus = db.prepare("update peers set status = status - 1 where ip = ?");
              updatePeersStatus.run(PeerAndPort);
              updatePeersStatus.finalize();
            }
          }  
        })
      }
      return peersList;
    } 
    catch (error) {
      console.error("getPeersAndInsertDb: error", PeerUrl);
      return [];
    }
  }

  async function getPeersInfo() {  
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      db.all("SELECT * from peers where 1=1 order by status desc", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getPeersAvailable() {  
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      db.all("SELECT * from peers where status = '1'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getStatisticsBlock(AllDates=30) {  
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const BlockStat = await new Promise((resolve, reject) => {
                        db.all("SELECT * from stat order by block_date desc limit "+Number(AllDates), (err, result) => {
                          if (err) {
                            reject(err);
                          } else {
                            resolve(result ? result : null);
                          }
                        });
                      });
    const block_date = []
    const block_size = []
    const block_count = []
    const mining_time = []
    const reward = []
    const txs_length = []
    const weave_size = []
    const cumulative_diff = []
    const reward_pool = []
    const txs_item = []
    const txs_image = []
    const txs_video = []
    const txs_audio = []
    const txs_pdf = []
    const txs_word = []
    const txs_excel = []
    const txs_ppt = []
    const txs_stl = []
    const txs_text = []
    const txs_exe = []
    const txs_zip = []
    BlockStat && BlockStat.map((Item)=>{
      block_date.push(Item.block_date.substring(5, 10))
      block_size.push(Item.block_size)
      block_count.push(Item.block_count)
      mining_time.push(Item.mining_time)
      reward.push(Item.reward)
      txs_length.push(Item.txs_length)
      weave_size.push(Item.weave_size)
      cumulative_diff.push(Item.cumulative_diff)
      reward_pool.push(Item.reward_pool)
      txs_item.push(Item.txs_item)
      txs_image.push(Item.txs_image)
      txs_video.push(Item.txs_video)
      txs_audio.push(Item.txs_audio)
      txs_pdf.push(Item.txs_pdf)
      txs_word.push(Item.txs_word)
      txs_excel.push(Item.txs_excel)
      txs_ppt.push(Item.txs_ppt)
      txs_stl.push(Item.txs_stl)
      txs_text.push(Item.txs_text)
      txs_exe.push(Item.txs_exe)
      txs_zip.push(Item.txs_zip)
    })
    const StatInfor = {}
    StatInfor['block_date'] = block_date.reverse()
    StatInfor['block_size'] = block_size.reverse()
    StatInfor['block_count'] = block_count.reverse()
    StatInfor['mining_time'] = mining_time.reverse()
    StatInfor['reward'] = reward.reverse()
    StatInfor['txs_length'] = txs_length.reverse()
    StatInfor['weave_size'] = weave_size.reverse()
    StatInfor['cumulative_diff'] = cumulative_diff.reverse()
    StatInfor['reward_pool'] = reward_pool.reverse()
    StatInfor['txs_item'] = txs_item.reverse()
    StatInfor['txs_image'] = txs_image.reverse()
    StatInfor['txs_video'] = txs_video.reverse()
    StatInfor['txs_audio'] = txs_audio.reverse()
    StatInfor['txs_pdf'] = txs_pdf.reverse()
    StatInfor['txs_word'] = txs_word.reverse()
    StatInfor['txs_excel'] = txs_excel.reverse()
    StatInfor['txs_ppt'] = txs_ppt.reverse()
    StatInfor['txs_stl'] = txs_stl.reverse()
    StatInfor['txs_text'] = txs_text.reverse()
    StatInfor['txs_exe'] = txs_exe.reverse()
    StatInfor['txs_zip'] = txs_zip.reverse()
    return StatInfor
  }

  async function getWalletAddressProfile(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const AddressInfor = await new Promise((resolve, reject) => {
                            if(db == null) {
                              return null;
                            }
                            db.get("SELECT * from address where id='"+filterString(Address)+"'", (err, result) => {
                              if (err) {
                                reject(err);
                              } else {
                                resolve(result ? result : null);
                              }
                            });
                          });
    const RS = {}
    if(AddressInfor) {
      const ProfileTxId = AddressInfor.profile;
      const TxIdFilter = filterString(ProfileTxId)
      if(TxIdFilter && TxIdFilter!=undefined) {
        const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxIdFilter);
        const {FileName, ContentType, FileContent} = await getTxData(TxIdFilter);
        const FileContentJson = FileContent.toString('utf-8');
        RS['id'] = Address
        RS['Profile'] = FileContentJson ? JSON.parse(FileContentJson) : {}
        RS['Address'] = Address
        RS['TxId'] = ProfileTxId
        RS['BundleId'] = getTxInforByIdFromDbValue.bundleid
        RS['Block'] = {height: getTxInforByIdFromDbValue.block_height, indep_hash:getTxInforByIdFromDbValue.block_indep_hash, timestamp:getTxInforByIdFromDbValue.timestamp}
        RS['AgentLevel'] = AddressInfor.agent
        RS['Balance'] = AddressInfor.balance
        RS['Referee'] = AddressInfor.referee
        RS['LastTxAction'] = AddressInfor.last_tx_action
      }
    }
    return RS
  }

  async function getAgentList(pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AgentTotal = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM from address where agent>'0'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
    const AgentAll = await new Promise((resolve, reject) => {
                            db.all("SELECT * from address where agent>'0' order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
                              if (err) {
                                reject(err);
                              } else {
                                resolve(result ? result : null);
                              }
                            });
                          });
    let RSDATA = []
    if(AgentAll != undefined) {
      RSDATA = await Promise.all(
          AgentAll.map(async (AddressInfor)=>{
            const ProfileTxId = AddressInfor.profile;
            const TxIdFilter = filterString(ProfileTxId)
            const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxIdFilter);
            const {FileName, ContentType, FileContent} = await getTxData(TxIdFilter);
            const FileContentJson = FileContent.toString('utf-8');
            const RSItem = {}
            RSItem['id'] = AddressInfor.id
            RSItem['Profile'] = FileContentJson ? JSON.parse(FileContentJson) : {}
            RSItem['Address'] = AddressInfor.id
            RSItem['TxId'] = ProfileTxId
            RSItem['BundleId'] = getTxInforByIdFromDbValue.bundleid
            RSItem['Block'] = {height: getTxInforByIdFromDbValue.block_height, indep_hash:getTxInforByIdFromDbValue.block_indep_hash, timestamp:getTxInforByIdFromDbValue.timestamp}
            RSItem['AgentLevel'] = AddressInfor.agent
            RSItem['Balance'] = AddressInfor.balance
            RSItem['Referee'] = AddressInfor.referee
            RSItem['LastTxAction'] = AddressInfor.last_tx_action
            return RSItem
          })
      );
      log("RSDATA", RSDATA)
    }
    const RS = {};
    RS['allpages'] = Math.ceil(AgentTotal/pagesizeFiler);
    RS['data'] = RSDATA;
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = AgentTotal;
    return RS;
  }

  async function getAddressReferee(Address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const AgentTotal = await new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT COUNT(*) AS NUM from address where referee='"+Address+"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
    const AgentAll = await new Promise((resolve, reject) => {
                            db.all("SELECT * from address where referee='"+Address+"' order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
                              if (err) {
                                reject(err);
                              } else {
                                resolve(result ? result : null);
                              }
                            });
                          });
    let RSDATA = []
    if(AgentAll != undefined) {
      RSDATA = await Promise.all(
          AgentAll.map(async (AddressInfor)=>{
            const ProfileTxId = AddressInfor.profile;
            if(ProfileTxId && ProfileTxId.length == 43) {
              const TxIdFilter = filterString(ProfileTxId)
              const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxIdFilter);
              const {FileName, ContentType, FileContent} = await getTxData(TxIdFilter);
              const FileContentJson = FileContent.toString('utf-8');
              const RSItem = {}
              RSItem['id'] = AddressInfor.id
              RSItem['Profile'] = FileContentJson ? JSON.parse(FileContentJson) : {}
              RSItem['Address'] = AddressInfor.id
              RSItem['TxId'] = ProfileTxId
              RSItem['BundleId'] = getTxInforByIdFromDbValue.bundleid
              RSItem['Block'] = getTxInforByIdFromDbValue.block_height
              RSItem['AgentLevel'] = AddressInfor.agent
              RSItem['Balance'] = AddressInfor.balance
              RSItem['Referee'] = AddressInfor.referee
              RSItem['LastTxAction'] = AddressInfor.last_tx_action
              return RSItem
            }
          })
      );
      
      log("RSDATA", RSDATA)
    }
    const RS = {};
    RS['allpages'] = Math.ceil(AgentTotal/pagesizeFiler);
    RS['data'] = RSDATA.filter(element => element !== null && element !== undefined && element !== '');
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = AgentTotal;
    return RS;
  }

  async function getChivesLightNodeHeartBeat(from_address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const ChivesLightNodeHeartBeatTotal = await new Promise((resolve, reject) => {
                                            if(db == null) {
                                              return null;
                                            }
                                            db.get("SELECT COUNT(*) AS NUM from tx where entity_type='ChivesLightNodeHeartBeat' and from_address='"+from_address+"'", (err, result) => {
                                              if (err) {
                                                reject(err);
                                              } else {
                                                resolve(result ? result.NUM : null);
                                              }
                                            });
                                          });
    const ChivesLightNodeHeartBeatAll = await new Promise((resolve, reject) => {
                                          if(db == null) {
                                            return null;
                                          }
                                          db.all("SELECT * from tx where entity_type='ChivesLightNodeHeartBeat' and from_address='"+from_address+"' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
                                            if (err) {
                                              reject(err);
                                            } else {
                                              resolve(result ? result : null);
                                            }
                                          });
                                        });
    const RS = {};
    RS['allpages'] = Math.ceil(ChivesLightNodeHeartBeatTotal/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(ChivesLightNodeHeartBeatAll);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = ChivesLightNodeHeartBeatTotal;
    return RS;
  }

  async function getChivesLightNodeReward(from_address, pageid, pagesize) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler;
    const ChivesLightNodeHeartBeatTotal = await new Promise((resolve, reject) => {
                                            if(db == null) {
                                              return null;
                                            }
                                            db.get("SELECT COUNT(*) AS NUM from tx where entity_type='ChivesLightNodeReward' and from_address='"+from_address+"'", (err, result) => {
                                              if (err) {
                                                reject(err);
                                              } else {
                                                resolve(result ? result.NUM : null);
                                              }
                                            });
                                          });
    const ChivesLightNodeHeartBeatAll = await new Promise((resolve, reject) => {
                                          if(db == null) {
                                            return null;
                                          }
                                          db.all("SELECT * from tx where entity_type='ChivesLightNodeReward' and from_address='"+from_address+"' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
                                            if (err) {
                                              reject(err);
                                            } else {
                                              resolve(result ? result : null);
                                            }
                                          });
                                        });
    const RS = {};
    RS['allpages'] = Math.ceil(ChivesLightNodeHeartBeatTotal/pagesizeFiler);
    RS['data'] = TxRowToJsonFormat(ChivesLightNodeHeartBeatAll);
    RS['from'] = From;
    RS['pageid'] = pageidFiler;
    RS['pagesize'] = pagesizeFiler;
    RS['total'] = ChivesLightNodeHeartBeatTotal;
    return RS;
  }

  function TxRowToJsonFormat(getTxPageValue) {
    const RS = []
    getTxPageValue.map((Item) =>{
      if(Item == undefined) {
        return []
      }
      const ItemJson = {}
      ItemJson.id = Item.id
      ItemJson.owner = {}
      ItemJson.owner.key = Item.owner
      ItemJson.owner.address = Item.from_address
      //ItemJson.owner.key = Item.owner
      ItemJson.anchor = Item.anchor
      ItemJson.tags = Item.tags ? JSON.parse(Item.tags) : []
      ItemJson.block = {}
      ItemJson.block.height = Item.block_height
      ItemJson.block.indep_hash = Item.block_indep_hash
      ItemJson.block.timestamp = Item.timestamp
      ItemJson.data = {}
      ItemJson.data.size = Item.data_size
      ItemJson.data.type = contentTypeToFileType(Item.content_type)
      ItemJson.data.content = ""
      /*
      if(ItemJson.data.type == "" && ItemJson.data.size > 0 && Item.id && Item.id.length == 43) {        
        const FileContentBuffer = readFile("files/" + Item.id.substring(0, 2).toLowerCase(), Item.id, "getTxData", null);
        if(FileContentBuffer) {
          ItemJson.data.content = FileContentBuffer.toString('utf-8');
        }
      }
      */   
      ItemJson.fee = {}
      ItemJson.fee.winston = Item.reward
      ItemJson.fee.xwe = String(Item.reward/1000000000000)
      ItemJson.quantity = {}
      ItemJson.quantity.winston = Item.quantity
      ItemJson.quantity.xwe = String(Item.quantity/1000000000000)
      ItemJson.recipient = Item.target
      ItemJson.table = Item
      //ItemJson.signature = Item.signature
      //ItemJson.signatureType = Item.signatureType
      ItemJson.bundleid = Item.bundleid
      RS.push(ItemJson)
    })
    return RS;
  }

  function TxRowToJsonFormatData(getTxPageValue) {
    const RS = []
    getTxPageValue.map((Item) =>{
      if(Item == undefined) {
        return []
      }
      const ItemJson = {}
      ItemJson.id = Item.id
      ItemJson.owner = {}
      ItemJson.owner.key = Item.owner
      ItemJson.owner.address = Item.from_address
      //ItemJson.owner.key = Item.owner
      ItemJson.anchor = Item.anchor
      ItemJson.tags = Item.tags ? JSON.parse(Item.tags) : []
      ItemJson.block = {}
      ItemJson.block.height = Item.block_height
      ItemJson.block.indep_hash = Item.block_indep_hash
      ItemJson.block.timestamp = Item.timestamp
      ItemJson.data = {}
      ItemJson.data.size = Item.data_size
      ItemJson.data.type = contentTypeToFileType(Item.content_type)
      ItemJson.data.content = ""
      if(ItemJson.data.type == "" && ItemJson.data.size > 0 && Item.id && Item.id.length == 43) {        
        const FileContentBuffer = readFile("files/" + Item.id.substring(0, 2).toLowerCase(), Item.id, "getTxData", null);
        if(FileContentBuffer) {
          ItemJson.data.content = FileContentBuffer.toString('utf-8');
        }
      } 
      ItemJson.fee = {}
      ItemJson.fee.winston = Item.reward
      ItemJson.fee.xwe = String(Item.reward/1000000000000)
      ItemJson.quantity = {}
      ItemJson.quantity.winston = Item.quantity
      ItemJson.quantity.xwe = String(Item.quantity/1000000000000)
      ItemJson.recipient = Item.target
      ItemJson.table = Item
      //ItemJson.signature = Item.signature
      //ItemJson.signatureType = Item.signatureType
      ItemJson.bundleid = Item.bundleid
      RS.push(ItemJson)
    })
    return RS;
  }


  async function getWalletAddressBalanceFromDb(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT balance FROM address where id = '"+ Address +"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.balance : null);
        }
      });
    });
  }
  
  async function getBlockHeightFromDb() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    return new Promise((resolve, reject) => {
      if(db == null) {
        resolve(null);
        return;
      }
      db.get("SELECT MAX(height) AS NUM FROM block", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : null);
        }
      });
    });
  }

  async function getLightNodeStatus() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const getBlockHeightFromDbValue = await getBlockHeightFromDb();
    const BlockInfor = await getBlockInforByHeightFromDb(getBlockHeightFromDbValue);
    //log("BlockInfor", BlockInfor)
    const LightNodeStatus = {}
    if(BlockInfor)  {
      const getPeersList = await getPeers();
      let MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      if(MinerNodeStatus == undefined)  {
        MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data).catch(() => {});
      }
      if(MinerNodeStatus && MinerNodeStatus.height)  {
        LightNodeStatus['network'] = "chivesweave.mainnet";
        LightNodeStatus['version'] = 5;
        LightNodeStatus['release'] = 67;
        LightNodeStatus['height'] = MinerNodeStatus.height;
        LightNodeStatus['current'] = MinerNodeStatus.current;
        LightNodeStatus['weave_size'] = BlockInfor.weave_size;
        LightNodeStatus['diff'] = MinerNodeStatus.diff;
        LightNodeStatus['blocks'] = getBlockHeightFromDbValue;
        LightNodeStatus['peers'] = getPeersList.length || 1;
        LightNodeStatus['time'] = BlockInfor.timestamp;
        LightNodeStatus['type'] = "lightnode";
      }
      else {
        LightNodeStatus['network'] = "chivesweave.mainnet";
        LightNodeStatus['version'] = 5;
        LightNodeStatus['release'] = 67;
        LightNodeStatus['height'] = 0;
        LightNodeStatus['current'] = '';
        LightNodeStatus['diff'] = '';
        LightNodeStatus['weave_size'] = 0;
        LightNodeStatus['blocks'] = 0;
        LightNodeStatus['peers'] = 1;
        LightNodeStatus['time'] = 0;
        LightNodeStatus['type'] = "lightnode";
      }
    }
    else {
      LightNodeStatus['network'] = "chivesweave.mainnet";
      LightNodeStatus['version'] = 5;
      LightNodeStatus['release'] = 67;
      LightNodeStatus['height'] = 0;
      LightNodeStatus['current'] = '';
      LightNodeStatus['diff'] = '';
      LightNodeStatus['weave_size'] = 0;
      LightNodeStatus['blocks'] = 0;
      LightNodeStatus['peers'] = 1;
      LightNodeStatus['time'] = 0;
      LightNodeStatus['type'] = "lightnode";
    }
    return LightNodeStatus;
  }

  function getBlockInforByHeight(Height) {
    const HeightFilter = Number(Height)
    const BlockContent = readFile("/blocks/" + enableBlockHeightDir(Height), HeightFilter + '.json', "getBlockInforByHeight", 'utf-8');
    return BlockContent;
  }

  function getTxInforById(TxId) {
    const TxIdFilter = filterString(TxId)
    const TxContent = readFile("txs/" + TxIdFilter.substring(0, 2).toLowerCase(), TxIdFilter + '.json', "getTxInforById", 'utf-8');
    return TxContent;
  }

  async function getTxData(TxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    switch(TxId) {
      case 'recent_hash_list_diff':
        return {FileName: null, ContentType: null, FileContent: ''}
      case 'sync_buckets':
        return {FileName: null, ContentType: null, FileContent: ''}
    }
    try {
      const TxIdFilter = filterString(TxId)
      const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxIdFilter);
      let FileContent = readFile("files/" + TxIdFilter.substring(0, 2).toLowerCase(), TxIdFilter, "getTxData", null);
      if(FileContent == null) {
          const TxContent = readFile("txs/" + TxIdFilter.substring(0, 2).toLowerCase(), TxIdFilter + '.json', "getTxData", 'utf-8');
          const TxContentJson = JSON.parse(TxContent);
          if(TxContentJson && TxContentJson.data && TxContentJson.data_root == '') {
              FileContent = Buffer.from(TxContentJson.data, 'base64');
          }
          else {
              FileContent = '';
          }
      }
      const FileName = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['item_name'] ? getTxInforByIdFromDbValue['item_name'] : TxId;
      const ContentType = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['content_type'] ? getTxInforByIdFromDbValue['content_type'] : "";
      console.log("FileContent Length", FileContent.length)
      return {FileName, ContentType, FileContent};
    }
    catch(Error) {
      //console.log("getWalletTxJson Error:", Error)
    }
  }

  async function getAddressBalance(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const AddressFilter = filterString(Address);
    const addressBalance = await axios.get(NodeApi + '/wallet/' + AddressFilter + '/balance', {}).then(res=>res.data).catch(() => {});
    return addressBalance;
  }

  async function getAddressBalanceMining(Address) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const AddressFilter = filterString(Address);
    const addressBalance = await axios.get(NodeApi + '/wallet/' + AddressFilter + '/reserved_rewards_total', {}).then(res=>res.data).catch(() => {});
    return addressBalance;
  }

  function readFileStream(filePath) {
    return fs.createReadStream(filePath);
  }
  
  function readFile(Dir, FileName, Mark, OpenFormat) {
    const DataDir = getDataDir()
    const filePath = DataDir + '/' + Dir + '/' + FileName;
    if(isFile(filePath)) {
      //log("filePath", filePath)
      const data = fs.readFileSync(filePath, OpenFormat);
      return data;
    }
    else {
      //console.error("[" + Mark + "] Error read file:", filePath);
      return null;
    }
  }

  function writeFile(Dir, FileName, FileContent, Mark) {
    const DataDir = getDataDir()
    const directoryPath = DataDir + '/' + Dir;
    enableDir(directoryPath)
    const TxFilePath = directoryPath + "/" + FileName
    try {
      fs.writeFileSync(TxFilePath, FileContent);
      return true;
    } 
    catch (err) {
      console.error("[" + Mark + "] Error writing to file:", err);
      return false;
    }
  }

  function compressToFile(inputFile, outputFile) {
    const gzip = zlib.createGzip();
    const inputStream = fs.createReadStream(inputFile);
    const outputStream = fs.createWriteStream(outputFile + '.gz');
    inputStream.pipe(gzip).pipe(outputStream);
    //console.log('File compressed successfully.');
  }

  function deompressToJson(inputFile, outputFile) {
    const gunzip = zlib.createGunzip();
    const inputStream = fs.createReadStream(inputFile);
    const outputStream = fs.createWriteStream(outputFile);
    inputStream.pipe(gunzip).pipe(outputStream);
    //console.log('File decompressed successfully.');
  }

  function mkdirForData() {
    const DataDir = getDataDir()
    fs.mkdir(DataDir + '/blocks', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/txs', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/files', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/thumbnail', { recursive: true }, (err) => {});
  }

  function filterString(input) {
    if(input) {
      const sanitizedInput = input?.replace(/[^a-zA-Z0-9_\-@. ]/g, '');
      return sanitizedInput;
    }
    else {
      return input;
    }
  }

  function copyFileSync(source, destination) {
    try {
      const content = fs.readFileSync(source);
      fs.writeFileSync(destination, content);
      log('File copied successfully!');
      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  }

  async function convertPdfFirstPageToImage(inputFilePath, outputFilePath) {
    let command = `${__dirname}/../../app.asar.unpacked/lib/poppler-23.11.0/Library/bin/pdfimages.exe -png -f 0 ${inputFilePath} ${outputFilePath}`;
    if(isDev==true) {
      command = `${__dirname}/../lib/poppler-23.11.0/Library/bin/pdfimages.exe -png -f 0 ${inputFilePath} ${outputFilePath}`;
    }
    try {
      log('convertPdfFirstPageToImage try execSync ****** ', outputFilePath, command);
      const output = execSync(command);
      if(output.toString() == "") {
        try {
          fs.renameSync(outputFilePath+"-000.png", outputFilePath+".png");
          fs.unlinkSync(outputFilePath+"-001.png");
          fs.unlinkSync(outputFilePath+"-002.png");
          fs.unlinkSync(outputFilePath+"-003.png");
          log('convertPdfFirstPageToImage File Generated Successfully', outputFilePath, command);
          return true;
        } 
        catch (err) {
          console.error('convertPdfFirstPageToImage Error Deleting File:', outputFilePath, err, command);
          return false;
        }
      }
      else {
        console.error('convertPdfFirstPageToImage Error Output:', output, command);
        return false;
      }
    } catch (error) {
      console.error('执行命令时发生错误:', error.message, command);
      return false;
    }
  }

  async function convertVideoFirstScreenToImage(inputFilePath, outputFilePath) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    let command = `${__dirname}/../../app.asar.unpacked/lib/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe -y -i ${inputFilePath} -vframes 1 -q:v 2 ${outputFilePath}`;
    if(isDev==true) {
      command = `${__dirname}/../lib/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe -y -i ${inputFilePath} -vframes 1 -q:v 2 ${outputFilePath}`;
    }
    try {
      log('convertVideoFirstScreenToImage try execSync ****** ', outputFilePath, command);
      execSync(command);
      log('convertVideoFirstScreenToImage File Generated Successfully', outputFilePath, command);
      return true;
    } catch (error) {
      console.error('执行命令时发生错误:', error.message, command);
      return false;
    }
  }

  async function htmlToImage(html, outputPath) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const browser = await puppeteer.launch({headless: 'new',});
    const page = await browser.newPage();
    await page.setContent(html);
    await page.screenshot({ path: outputPath });
    await browser.close();
  }

  async function convertDocxToImage(inputFilePath, outputFilePath) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    mammoth.convertToHtml({ path: inputFilePath })
      .then((result) => {
        const html = result.value;
        if(html) {
          htmlToImage(html, outputFilePath + '.png')
        }
      })
      .catch((err) => {
        console.error('Error extracting text:', err);
        return false;
      });
  }

  async function convertXlsxToImage(inputFilePath, outputFilePath) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const workbook = xlsx.readFile(inputFilePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const html = xlsx.utils.sheet_to_html(worksheet);
    await htmlToImage(html, outputFilePath + '.png')
  }

  async function convertPptxToPdf(inputFilePath, outputFilePath, fileTypeSuffix) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    copyFileSync(inputFilePath, inputFilePath+"."+fileTypeSuffix);
    try {
        // Initial setup, create credentials instance.
        // ORGANIZATION ID: 224C1261659736570A495C04@AdobeOrg
        const credentials =  PDFServicesSdk.Credentials
            .servicePrincipalCredentialsBuilder()
            .withClientId("0c5ed96b68c8468d8fd741297a12377e")
            .withClientSecret("p8e-_tcS0A068_r3vV2ohzD4spfzdEFi-O0D")
            .build();
    
        // Create an ExecutionContext using credentials and create a new operation instance.
        const executionContext = PDFServicesSdk.ExecutionContext.create(credentials),
            createPdfOperation = PDFServicesSdk.CreatePDF.Operation.createNew();
    
        // Set operation input from a source file.
        const input = PDFServicesSdk.FileRef.createFromLocalFile(inputFilePath+"."+fileTypeSuffix);
        createPdfOperation.setInput(input);
    
        // Execute the operation and Save the result to the specified location.
        createPdfOperation.execute(executionContext)
            .then(result => result.saveAsFile(outputFilePath+".pdf"))
            .catch(err => {
                if(err instanceof PDFServicesSdk.Error.ServiceApiError
                    || err instanceof PDFServicesSdk.Error.ServiceUsageError) {
                    log('Exception encountered while executing operation', err);
                } else {
                    log('Exception encountered while executing operation', err);
                }
            });
    
    } catch (err) {
        log('Exception encountered while executing operation', err);
    }
  }
  
  async function getTxDataThumbnail(OriginalTxId) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    try {
      mkdirForData();
      const TxContent = readFile("txs/" + OriginalTxId.substring(0, 2).toLowerCase(), OriginalTxId + '.json', "getTxDataThumbnail", 'utf-8');
      if(TxContent == null) {
        return null
      }
      const TxInfor = JSON.parse(TxContent);
      //log("TxInfor", TxInfor);
      
      const TagsMap = {}
      TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
        //For Bundle ITem
        TagsMap[Tag.name] = Tag.value;
        //For Tx Item
        const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
        const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
        TagsMap[TagName] = TagValue;
      })
      const FileName = TagsMap['File-Name'] || "Unknown"
      const ContentType = TagsMap['Content-Type']
      const TxId = TagsMap['File-TxId'] ? TagsMap['File-TxId'] : OriginalTxId
      log("TxId OriginalTxId", TxId, OriginalTxId);
      
      const inputFilePath = DataDir + '/files/' + TxId.substring(0, 2).toLowerCase() + '/' + TxId;
      log("inputFilePath", inputFilePath)
      if(isFile(inputFilePath)) {
        //Thumbnail Exist
        const compressFilePath = DataDir + "/thumbnail/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId
        if(isFile(compressFilePath)) {
          log("compressFilePath", compressFilePath)
          const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId, "getTxDataThumbnail", null);
          if(FileContent == null) {
            return null
          }
          else {
            return {FileName, ContentType, FileContent};
          }
        }

        //Compress File
        const outputFilePath = DataDir + '/thumbnail/' + TxId.substring(0, 2).toLowerCase();
        enableDir(outputFilePath)
        const fileType = getContentTypeAbbreviation(ContentType);
        const fileTypeSuffix = String(fileType).toLowerCase();
        log("fileTypeSuffix", fileTypeSuffix)
        if((fileTypeSuffix == "jpg" || fileTypeSuffix == "jpeg") && false) {
            sharp(inputFilePath).jpeg({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
                if (err) {
                  log("getTxDataThumbnail sharp err:", TxId, err, info)
                } else {
                  log("getTxDataThumbnail sharp info:", info);
                }
            });
        }
        else if(fileTypeSuffix == "png" && false) {
          sharp(inputFilePath).png({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
            log("getTxDataThumbnail sharp:", TxId, err, info)
          });
        }
        else if(fileTypeSuffix == "gif" && false) {
          sharp(inputFilePath).gif({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
            log("getTxDataThumbnail sharp:", TxId, err, info)
          });
        }
        else if(fileTypeSuffix == "pdf")    {
          if(isFile(outputFilePath + '/' + TxId + '.png')) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else {
            const convertPdfFirstPageToImageStatus = await convertPdfFirstPageToImage(inputFilePath, outputFilePath + '/' + TxId);
            if(convertPdfFirstPageToImageStatus) {
              const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
              return {FileName, ContentType:"image/png", FileContent};
            }
            log("convertPdfFirstPageToImageStatus", convertPdfFirstPageToImageStatus);
          }
          //printer(inputFilePath).then(log);
          log("outputFilePath", outputFilePath + '/' + TxId + '.png')
        }
        else if(fileTypeSuffix == "video")    {
          if(isFile(outputFilePath + '/' + TxId + '.png')) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else {
            const convertVideoFirstScreenToImageValue = await convertVideoFirstScreenToImage(inputFilePath, outputFilePath + '/' + TxId + '.png');
            if(convertVideoFirstScreenToImageValue) {
              const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
              return {FileName, ContentType:"image/png", FileContent};
            }
            log("convertVideoFirstScreenToImageValue", convertVideoFirstScreenToImageValue);
          }
          //printer(inputFilePath).then(log);
          log("outputFilePath", outputFilePath + '/' + TxId + '.png')
        }
        else if(fileTypeSuffix == "docx" || fileTypeSuffix == "doc")    {
          if(isFile(outputFilePath + '/' + TxId + '.png')) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else {
            convertDocxToImage(inputFilePath, outputFilePath + '/' + TxId);
            const sleep = util.promisify(setTimeout);
            await sleep(2000);
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
        }
        else if(fileTypeSuffix == "xls" || fileTypeSuffix == "xlsx")    {
          if(isFile(outputFilePath + '/' + TxId + '.png')) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else {
            await convertXlsxToImage(inputFilePath, outputFilePath + '/' + TxId);
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
        }
        else if(fileTypeSuffix == "ppt" || fileTypeSuffix == "pptx")    {
          if(isFile(outputFilePath + '/' + TxId + '.png')) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else if(!isFile(outputFilePath + '/' + TxId + '.pdf')) {
            await convertPptxToPdf(inputFilePath, outputFilePath + '/' + TxId, fileTypeSuffix);
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          else if(isFile(outputFilePath + '/' + TxId + '.pdf')) {
            const convertPdfFirstPageToImageStatus = await convertPdfFirstPageToImage(outputFilePath + '/' + TxId + '.pdf', outputFilePath + '/' + TxId);
            if(convertPdfFirstPageToImageStatus) {
              const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
              return {FileName, ContentType:"image/png", FileContent};
            }
            log("convertPdfFirstPageToImageStatus", convertPdfFirstPageToImageStatus);
          }
        }
        
        //Thumbnail Exist
        const compressFilePath2 = DataDir + "/thumbnail/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId
        if(isFile(compressFilePath2)) {
          log("compressFilePath2", compressFilePath2)
          const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId, "getTxDataThumbnail", null);
          return {FileName, ContentType, FileContent};
        }

        //Out Original File Content
        const FileContent = readFile("files/" + TxId.substring(0, 2).toLowerCase(), TxId, "getTxDataThumbnail", null);
        return {FileName, ContentType, FileContent};
      }
      else {
        let FileContent = ''
        if(TxInfor && TxInfor.data && TxInfor.data_root == '') {
            FileContent = Buffer.from(TxInfor.data, 'base64');
        }
        else {
            log("inputFilePath Not Exist:", inputFilePath)
        }
        return {FileName, ContentType, FileContent};
      }
    }
    catch(Error) {
      //console.log("getWalletTxJson Error:", Error)
    }
  }

  async function compressImage(TxId, ContentType) {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
  }

  async function deleteBlackTxsAndAddress() {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    const DeleteAddress = db.prepare("delete from tx where from_address = ?");
    BlackListAddress.map((Address)=>{
      DeleteAddress.run(Address);
    })
    DeleteAddress.finalize();

    const BlackListTxs = await axios.get('https://faucet.chivesweave.org/xwe_tx_blacklist.php', {}).then(res=>res.data).catch(() => {});
    if(BlackListTxs && BlackListTxs.length>0) {
      const DeleteTxs = db.prepare("delete from tx where id = ?");
      BlackListTxs.map((Address)=>{
        DeleteTxs.run(Address);
      })
      DeleteTxs.finalize(); 
    }   

    const DeleteBlackListTxs = db.prepare("DELETE FROM tx WHERE id IN (SELECT id FROM blacklist)");
    DeleteBlackListTxs.run();
    DeleteBlackListTxs.finalize(); 
  }

  const restrictToLocalhost = (req, res, next) => {
    // Check if the request is coming from localhost (127.0.0.1 or ::1)
    const ipAddress = req.ip || req.connection.remoteAddress;
    if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
      // Allow the request to proceed
      next();
    } else {
      // Respond with a 403 Forbidden status for requests from other IP addresses
      res.status(403).send('Forbidden: Access allowed only from localhost.');
    }
  };

  async function closeDb () {
    const { NodeApi, DataDir, arweave, db } = await initChivesLightNode()
    if(db) {
      db.close()
    }
  };

  export default {
    initChivesLightNode,
    initChivesLightNodeSql,
    initChivesLightNodeSetting,
    getChivesLightNodeAddress,
    setChivesLightNodeAddress,
    chivesLightNodeStatus,
    chivesLightNodeUrl,
    syncingBlock,
    syncingBlockPromiseAll,
    syncingBlockMissing,
    syncingBlockMinedTime,
    syncingBlockByHeight,
    syncingBlockAndTxStat,
    syncingBlockAndTxStatAllDates,
    syncingTx,
    syncingTxPromiseAll,
    syncingTxById,
    syncingChunks,
    syncingChunksPromiseAll,
    syncingTxParseBundle,
    syncingTxParseBundleById,
    syncingTxChunksById,
    syncingTxWaitDoingAction,
    resetTx404,
    getTxsNotSyncing,
    getTxsHaveChunks,
    contentTypeToFileType,
    getContentTypeAbbreviation,
    getWalletAddressBalanceFromDb,
    getBlockHeightFromDb,
    getLightNodeStatus,
    getBlockInforByHeight,
    getBlockInforByHashFromDb,
    getBlockPage,
    getBlockPageJson,
    getTxPage,
    getTxPageJson,
    getAllTxPageJson,
    getTxInforById,
    getTxInforByIdFromDb,
    getTxData,
    getTxDataThumbnail,
    getTxBundleItemPageJson,
    getTxBundleItemsInUnbundle,
    getTxPending,
    getTxPendingRecord,
    getTxAnchor,
    getPrice,
    getPriceAddress,
    postTx,
    postChunk,
    getTxStatusById,
    getTxUnconfirmed,
    getAddressBalance,
    getAddressBalanceMining,
    getAllAddressPageJson,
    getAllFileTypePageJson,
    getAllFileTypeAddressPageJson,
    getAllFileFolderAddressPageJson,
    getAllFileStarAddressPageJson,
    getAllFileLabelAddressPageJson,
    getAllFileLabelGroup,
    getAllFileFolder,
    getWalletTxJson,
    getWalletTxsAllPageJson,
    getWalletTxsSentPageJson,
    getWalletTxsReceivedPageJson,
    getWalletTxsFilesPageJson,
    getPeers,
    getPeersInfo,
    calculatePeers,
    getStatisticsBlock,
    getWalletAddressProfile,
    getAgentList,
    getAddressReferee,
    getChivesLightNodeHeartBeat,
    getChivesLightNodeReward,
    deleteLog,
    getDataDir,
    isFile,
    readFileStream,
    readFile,
    writeFile,
    isDirectorySync,
    filterString,
    compressImage,
    mkdirForData,
    deleteBlackTxsAndAddress,
    restrictToLocalhost,
    closeDb
  };