  const NodeApi = "http://112.170.68.77:1985";
  import db from './db.js'
  import axios from 'axios'
  import fs from 'fs'
  import sharp from 'sharp'
  import { unbundleData } from 'arbundles'
  import Arweave from 'arweave'
  import { join } from 'path'
  import { exit } from 'process'
  //const imagemin = require('imagemin')
  //const optipng = require('imagemin-optipng')
  import pkg from '@pdftron/pdfnet-node';
  const { PDFNet } = pkg;

  const DataDir = "D:/GitHub/ChivesweaveDataDir";
  const BlackListTxs = [];
  const BlackListAddress = ["omBC7G49jVti_pbqLgl7Z7DouF6fgxY6NAnLgh3FdBo"];

  const arweave = Arweave.init({
    host: '112.170.68.77',
    port: 1987,
    protocol: 'http',
    timeout: 5000,
    logging: false
  })

  async function ownerToAddress(owner) {
    const pubJwk = {
        kty: 'RSA',
        e: 'AQAB',
        n: owner,
    }
    return await arweave.wallets.getAddress(pubJwk)
  }

  async function syncingTxParseBundle(TxCount = 30) {
    const getTxsNotSyncingList = await getTxsBundleNotSyncing(TxCount)
    console.log("syncingTxParseBundle Count: ", getTxsNotSyncingList.length)
    try {
      const result = [];
      for (const TxList of getTxsNotSyncingList) {
        const TxInfor = await syncingTxParseBundleById(TxList);
        console.log("syncingTxParseBundle TxInfor: ", TxList.id, TxList.block_height)
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
    const getTxsNotSyncingList = await getTxsNotSyncing(TxCount)
    console.log("syncingTx Count: ", getTxsNotSyncingList.length)
    try {
      const result = [];
      for (const TxList of getTxsNotSyncingList) {
        const TxInfor = await syncingTxById(TxList.id, TxList.block_height);
        console.log("syncingTx TxInfor: ", TxList.id, TxInfor.id)
        result.push(TxInfor)
      }
      return result;
    } 
    catch (error) {
      console.error("syncingTx error fetching Tx data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingTxPromiseAll(TxCount = 30) {
    try {
      const getTxsNotSyncingList = await getTxsNotSyncing(TxCount);
      console.log("syncingTxPromiseAll Count: ", getTxsNotSyncingList.length);
  
      const result = await Promise.all(
        getTxsNotSyncingList.map(async (TxList) => {
          try {
            const TxInfor = await syncingTxById(TxList.id, TxList.block_height);
            console.log("syncingTxPromiseAll TxInfor: ", TxList.id, TxInfor.id);
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
    return new Promise((resolve, reject) => {
      db.all("SELECT id, block_height from tx where from_address is null order by block_height asc limit " + TxCount + " offset 0", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getTxsBundleNotSyncing(TxCount) {
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
    const getTxsHaveChunksList = await getTxsHaveChunks(TxCount)
    console.log("syncingChunks Count: ", getTxsHaveChunksList.length)
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
    const updateDataRootStatus = db.prepare("update tx set data_root_status = ? where data_root_status = ?");
    updateDataRootStatus.run('', '404');
    updateDataRootStatus.finalize();
  }

  async function syncingChunksPromiseAll(TxCount = 5) {
    try {
      const getTxsHaveChunksList = await getTxsHaveChunks(TxCount);
      console.log("syncingChunks Count: ", getTxsHaveChunksList.length);
  
      const result = await Promise.all(
        getTxsHaveChunksList.map(async (TxList) => {
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
  
  async function syncingTxById(TxId, Height) {
    // @ts-ignore
    let TxInfor = null
    let writeFileStatus = false
    const TxJsonFilePath = DataDir + "/txs/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId + ".json";
    //console.log("TxInfor TxJsonFilePath",TxJsonFilePath)
    if(isFile(TxJsonFilePath)) {
      //Nothing to do
      const TxContent = getTxInforById(TxId);
      TxInfor = JSON.parse(TxContent)
      console.log("syncingTxById Read Tx From Json File",TxInfor.id)
      writeFileStatus = true
      console.log("TxInfor TagsMap",TxInfor.id)
      if(TxInfor==undefined || TxInfor.id==undefined) {
        try {
          fs.unlinkSync(TxJsonFilePath);
          console.log('File deleted successfully', TxJsonFilePath);
        } 
        catch (err) {
          console.error('Error deleting file:', TxJsonFilePath, err);
        }
        writeFileStatus = false
      }
    }
    else {
      const result = await axios.get(NodeApi + '/tx/' + TxId, {});
      TxInfor = result.data
      console.log("syncingTxById From Remote Node",TxId)
      //Write Tx File
      writeFileStatus = writeFile('txs/' + TxId.substring(0, 2).toLowerCase(), TxId + ".json", JSON.stringify(TxInfor), "syncingTxById")
    }

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
    
      //console.log("TxInfor TagsMap",TxInfor)
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
        //console.log("TxInfor TagsMap",TagsMap)
      }
      else {
        TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
          const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
          const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
          TagsMap[TagName] = TagValue;
          newTags.push({'name':TagName, 'value':TagValue})
        })
        //console.log("TxInfor TagsMap",TagsMap)
      }
      //console.log("TxInfor TagsMap",TxInfor)
      
      //Update Tx
      const updateTx = db.prepare('update tx set last_tx = ?, owner = ?, from_address = ?, target = ?, quantity = ?, signature = ?, reward = ?, data_size = ?, data_root = ?, item_name = ?, item_type = ?, item_parent = ?, content_type = ?, item_hash = ?, item_summary = ?, is_encrypt = ?, is_public = ?, entity_type = ?, app_name = ?, app_version = ?, app_instance = ?, tags = ? where id = ?');
      let from_address = '';
      //console.log("TxInfor TagsMap",TxInfor)
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
      else if(TagsMap['Entity-Type'] && TagsMap['Entity-Type'] != "") {
          entity_type = TagsMap['Entity-Type'];
      }
      else if(TxInfor.data_size > 0) {
          entity_type = "File";
      }
      else {
          entity_type = "Tx";
      }    
      updateTx.run(TxInfor.last_tx, TxInfor.owner, from_address, TxInfor.target, TxInfor.quantity, TxInfor.signature, TxInfor.reward, TxInfor.data_size, TxInfor.data_root, item_name, item_type, item_parent, content_type, item_hash, item_summary, is_encrypt, is_public, entity_type, app_name, app_version, app_instance, JSON.stringify(newTags), TxId);
      updateTx.finalize();

      console.log("TxInfor from_address: ", from_address)

      //Insert Address
      const BlockInfor = await getBlockInforByHeightFromDb(Height);
      const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insertAddress.run(from_address, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
      insertAddress.finalize();
      //Update Address
      let AddressBalance = 0
      AddressBalance = await getWalletAddressBalanceFromDb(from_address)
      //console.log("getWalletAddressBalanceFromDb", AddressBalance)
      if(AddressBalance == 0 || AddressBalance == undefined) {
        AddressBalance = await axios.get(NodeApi + "/wallet/" + from_address + "/balance", {}).then((res)=>{return res.data});
        //console.log("AddressBalanceNodeApi", AddressBalance)
      }
      //console.log("AddressBalance", AddressBalance)
      const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where id = ?');
      updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalance, from_address);
      updateAddress.finalize();
      if(TxInfor.target && TxInfor.target.length==43) {
        const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        insertAddress.run(TxInfor.target, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
        insertAddress.finalize();
        //Update Address
        let AddressBalance = 0
        AddressBalance = await getWalletAddressBalanceFromDb(TxInfor.target)
        //console.log("getWalletAddressBalanceFromDb", AddressBalance)
        if(AddressBalance == 0 || AddressBalance == undefined) {
          AddressBalance = await axios.get(NodeApi + "/wallet/" + TxInfor.target + "/balance", {}).then((res)=>{return res.data});
          //console.log("AddressBalanceNodeApi", AddressBalance)
        }
        //console.log("AddressBalance", AddressBalance)
        const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where id = ?');
        updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalance, TxInfor.target);
        updateAddress.finalize();
      }

      //Download Chunk
      const data_root = TxInfor.data_root
      if(data_root && data_root.length && data_root.length == 43) {
          console.log("TxInfor data_root: ______________________________________________________________", data_root)
          console.log("TxInfor entity_type: ______________________________________________________________", entity_type)
      }
    }
    else {
      //Write File Content Error
    }
  
    return TxInfor;
  }

  function isFile(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      return true;
    } 
    catch (err) {
      return false;
    }
  }

  async function syncingTxParseBundleById(TxInfor) {
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
        console.log("syncingTxParseBundleById unBundleItem id",BundlePath)
      }
      if( isFile(BundlePath) ) {
          console.log("syncingTxParseBundleById Exist", BundlePath)  
          try {
              //const TxInfor = await getTxInforByIdFromDb(TxId);
              //console.log("syncingTxParseBundleById TxInfor",TxInfor)
              const FileContent = fs.readFileSync(BundlePath);
              try {
                  const unbundleItems = unbundleData(FileContent);
                  //console.log("syncingTxParseBundleById unbundleItems",unbundleItems)
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
                        console.log("unbundleItems",Item)
                        console.log("unbundleItems id", Item.id, Item.tags)
                        //console.log("unBundleItem tags",Item.tags)
                        //console.log("unBundleItem owner",Item.owner)
                        //console.log("unBundleItem anchor",Item.anchor)
                        //console.log("unBundleItem target",Item.target)
                        //console.log("unBundleItem signature",Item.signature)
                        //console.log("unBundleItem signatureType",Item.signatureType)
                        //console.log("unBundleItem data",Item.data)
                        //Update Chunks Status IGNORE
                        const insertTxBundleItem = db.prepare('INSERT OR IGNORE INTO tx (id,block_indep_hash,last_tx,owner,from_address,target,quantity,signature,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action,tags, tx_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                        const id = Item.id
                        const block_indep_hash = TxInfor.block_indep_hash
                        const last_tx = Item.anchor
                        const owner = Item.owner
                        const from_address = await ownerToAddress(Item.owner);
                        const target = Item.target
                        const quantity = Item.quantity || 0
                        const signature = Item.signature
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

                        insertTxBundleItem.run(id,block_indep_hash,last_tx,owner,from_address,target,quantity,signature,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action,JSON.stringify(Item.tags), timestampToDate(timestamp));
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
                        //console.log("ItemJson", JSON.stringify(ItemJson))
                        writeFile('txs/' + Item.id.substring(0, 2).toLowerCase(), Item.id + '.json', JSON.stringify(ItemJson), "syncingTxParseBundleById")

                        //Update Tx Status
                        const EntityType    = TagsMap['Entity-Type'];
                        const EntityAction  = TagsMap['Entity-Action'];
                        const FileTxId      = TagsMap['File-TxId'];
                        const EntityTarget  = TagsMap['Entity-Target'];
                        const LastTxChange  = TagsMap['Last-Tx-Change'];
                        if(EntityType == "Action") {
                            console.log("Action TxInfor EntityAction: ______________________________________________________________", EntityAction)
                            switch(EntityAction) {
                                case 'Label':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleLabel = db.prepare('update tx set item_label = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleLabel.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleLabel.finalize();
                                    console.log("Action Label", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'Star':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleStar = db.prepare('update tx set item_star = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleStar.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleStar.finalize();
                                    console.log("Action Star", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'Folder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleFolder.finalize();
                                    console.log("Action Folder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'Public':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundlePublic = db.prepare('update tx set is_public = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundlePublic.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundlePublic.finalize();
                                    console.log("Action Public", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'RenameFolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleRenameFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleRenameFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleRenameFolder.finalize();
                                    console.log("Action RenameFolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'DeleteFolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleDeleteFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleDeleteFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleDeleteFolder.finalize();
                                    console.log("Action DeleteFolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'Restorefolder':
                                    //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                    const updateBundleRestorefolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                    updateBundleRestorefolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    updateBundleRestorefolder.finalize();
                                    console.log("Action Restorefolder", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                    break;
                                case 'Profile':
                                    //DataItemId, BlockTimestamp, BlockHeight, FromAddress, LastTxChange
                                    const updateBundleAddressProfile = db.prepare('update address set profile = ?, timestamp = ?, last_tx_action = ? where (last_tx_action is null and id = ?) or (id = ? and last_tx_action = ?)');
                                    updateBundleAddressProfile.run(Item.id, timestamp, block_height, from_address, from_address, LastTxChange==undefined?'':LastTxChange);
                                    updateBundleAddressProfile.finalize();
                                    //console.log("LastTxChange", LastTxChange)
                                    console.log("Action Profile", Item.id, timestamp, block_height, from_address, from_address, LastTxChange);
                                    break;
                                case 'Agent':
                                    //EntityTarget, FromAddress, BlockTimestamp
                                    const updateBundleAddressAgent = db.prepare("update address set Agent = ?, timestamp = ? where id = ? and Agent = '0'");
                                    updateBundleAddressAgent.run('1', timestamp, from_address);
                                    updateBundleAddressAgent.finalize();
                                    console.log("Action Agent", EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange==undefined?'':LastTxChange);
                                    break;
                                case 'Referee':
                                    //EntityTarget, FromAddress, BlockTimestamp
                                    const updateBundleAddressReferee = db.prepare("update address set referee = ? where id = ?");
                                    updateBundleAddressReferee.run(EntityTarget, from_address);
                                    updateBundleAddressReferee.finalize();
                                    console.log("Action Referee", EntityTarget, timestamp, block_height, from_address);
                                    break;
                            }
                        }
                        if(EntityType == "Folder") {
                          console.log("Folder TxInfor EntityAction: ______________________________________________________________", EntityAction)
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
          console.log("syncingTxParseBundleById Not Exist:", BundlePath)
      }
    }
  }

  async function syncingTxChunksById(TxId) {
    // @ts-ignore
    let data_root_status = 0;
    try {
        const arrayBuffer = await fetch(NodeApi + '/' + TxId).then(res => res.arrayBuffer()).catch(() => {})
        //Write Chunks File
        console.log("syncingTxChunksById arrayBuffer:", TxId, arrayBuffer)
        if(arrayBuffer && arrayBuffer.byteLength && arrayBuffer.byteLength > 0) {
            const FileBuffer = Buffer.from(arrayBuffer);
            data_root_status = 200
            const FileContentString = FileBuffer.toString('utf-8')
            if(arrayBuffer.byteLength<10000 && FileContentString.includes("This page cannot be found, yet.")) {
              console.log("arrayBuffer.byteLength--------------------------------------", arrayBuffer.byteLength)
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
            console.log("syncingTxChunksById Error:", data_root_status, TxId, TagsMap['Content-Type'], TagsMap['File-Name'])
        }
    } 
    catch (error) {
        console.log("syncingTxChunksById Error:", error)
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
    const getBlockHeightFromDbValue = await getBlockHeightFromDb()
    const BeginHeight = getBlockHeightFromDbValue + 1;
    console.log("getBlockHeightFromDbValue:", getBlockHeightFromDbValue);
    try {
      const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data);
      const MaxHeight = MinerNodeStatus.height;
      const GetBlockRange = (MaxHeight - BeginHeight) > EveryTimeDealBlockCount ? EveryTimeDealBlockCount : (MaxHeight - BeginHeight)
      const BlockHeightRange = Array.from({ length: GetBlockRange }, (_, index) => BeginHeight + index);
      console.log("BlockHeightRange:", BlockHeightRange);
      const result = [];
      for (const Height of BlockHeightRange) {
        const BlockInfor = await syncingBlockByHeight(Height);
        result.push(BlockInfor.height)
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
      //console.log("GetExistBlocks:", GetExistBlocks);
      const result = [];
      const BlockTimestamp = {}
      const updateBlockMinedTime = db.prepare('update block set mining_time = ? where id = ?');
      updateBlockMinedTime.run(60, 1);
      updateBlockMinedTime.finalize();
      for (const BlockInfor of GetExistBlocks) {
        //console.log("syncingBlockMinedTime BlockInfor:", BlockInfor);
        BlockTimestamp[Number(BlockInfor.id)] = BlockInfor.timestamp
        if(Number(BlockInfor.id) > 1 && BlockTimestamp[Number(BlockInfor.id)-1] == undefined) {
          const previousBlock = await getBlockInforByHeightFromDb(Number(BlockInfor.id)-1);
          BlockTimestamp[Number(BlockInfor.id)-1] = previousBlock.timestamp;
        }
        if(Number(BlockInfor.id) > 1 && BlockTimestamp[Number(BlockInfor.id)-1] ) {
          const MinedTime = BlockInfor.timestamp - BlockTimestamp[Number(BlockInfor.id)-1]
          console.log("MinedTime", BlockInfor.id, MinedTime)
          const updateBlockMinedTime = db.prepare('update block set mining_time = ? where id = ?');
          updateBlockMinedTime.run(MinedTime, BlockInfor.id);
          updateBlockMinedTime.finalize();
        }
        result.push(BlockInfor.id)
      }
      
      return result;
    } 
    catch (error) {
      console.error("syncingBlock error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingBlockMissing(Index = 0) {
    const BeginHeight = Index * 100000 + 1;
    const EndHeight = (Index + 1) * 100000;
    try {
      const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data);
      const MaxHeight = MinerNodeStatus.height;
      const EndHeightFinal = (MaxHeight - EndHeight) > 0 ? EndHeight : MaxHeight
      const BlockHeightRange = generateSequence(BeginHeight, EndHeightFinal);
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
      //console.log("GetExistBlocksIds:", GetExistBlocksIds);
      const getMissingBlockIds = arrayDifference(BlockHeightRange, GetExistBlocksIds)
      console.log("getMissingBlockIds:", getMissingBlockIds);
      const result = [];
      for (const Height of getMissingBlockIds) {
        console.log("Height:", Height);
        const BlockInfor = await syncingBlockByHeight(Height);
        result.push(BlockInfor.height)
      }
      
      return result;
    } 
    catch (error) {
      console.error("syncingBlock error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingBlockPromiseAll(EveryTimeDealBlockCount = 5) {
    try {
      const getBlockHeightFromDbValue = await getBlockHeightFromDb();
      const BeginHeight = getBlockHeightFromDbValue + 1;
      console.log("getBlockHeightFromDbValue:", getBlockHeightFromDbValue);
  
      const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data);
      const MaxHeight = MinerNodeStatus.height;
      const GetBlockRange = (MaxHeight - BeginHeight) > EveryTimeDealBlockCount ? EveryTimeDealBlockCount : (MaxHeight - BeginHeight + 1)
      const BlockHeightRange = Array.from({ length: GetBlockRange }, (_, index) => BeginHeight + index);
      console.log("BlockHeightRange:", BlockHeightRange);
      
      const result = await Promise.all(
        BlockHeightRange.map(async (Height) => {
          try {
            const BlockInfor = await syncingBlockByHeight(Height);
            return BlockInfor.height;
          } 
          catch (error) {
            console.error("syncingBlockPromiseAll error fetching block data:", error.message);
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

  function timestampToDate(timestamp) {
    const date = new Date(Number(timestamp) * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }
  
  async function syncingBlockByHeight(currentHeight) {
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
      const result = await axios.get(NodeApi + '/block/height/' + currentHeight, {
        headers: {},
        params: {}
      });
      BlockInfor = result.data
      console.log("syncingBlockByHeight Get Block From Remote Node",BlockInfor.reward_addr, currentHeight)
    }
    
    // Begin a transaction
    //db.exec('BEGIN TRANSACTION');
    try {
      //Insert Address
      const insertAddress = db.prepare('INSERT OR IGNORE INTO address (id, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insertAddress.run(BlockInfor.reward_addr, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
      insertAddress.finalize();
    
      //Update Address
      let AddressBalance = 0
      AddressBalance = await getWalletAddressBalanceFromDb(BlockInfor.reward_addr)
      //console.log("getWalletAddressBalanceFromDb", AddressBalance)
      if(AddressBalance == 0 || AddressBalance == undefined) {
        AddressBalance = await axios.get(NodeApi + "/wallet/" + BlockInfor.reward_addr + "/balance", {}).then((res)=>{return res.data});
        //console.log("AddressBalanceNodeApi", AddressBalance)
      }
      //console.log("AddressBalance", AddressBalance)
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
    catch (error) {
      // Rollback the transaction if an error occurs
      console.error('Error:', error.message);
      //db.exec('ROLLBACK');
    }
    return BlockInfor;
  }

  async function syncingBlockAndTxStat(block_date)  {
    const BlockStat = await new Promise((resolve, reject) => {
      db.get("SELECT SUM(block_size/1048576) AS block_size, SUM(mining_time) AS mining_time, SUM(reward/100000000000) AS reward, SUM(txs_length) AS txs_length, SUM(weave_size/1048576) AS weave_size, SUM(cumulative_diff/1024) AS cumulative_diff, SUM(reward_pool/100000000000) AS reward_pool FROM block where block_date='"+filterString(block_date)+"'", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
    console.log("BlockStat", BlockStat)
    if(BlockStat && BlockStat.reward) {

      const TxStat = await new Promise((resolve, reject) => {
        db.all("SELECT item_type, COUNT(id) AS item_type_count FROM tx where 1=1 group by item_type", (err, result) => {
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
      console.log("TxStat", TxStat)
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
      const insertStat = db.prepare('INSERT OR REPLACE INTO stat (block_date,block_size,mining_time,reward,txs_length,weave_size,cumulative_diff,reward_pool,txs_item,txs_image,txs_video,txs_audio,txs_pdf,txs_word,txs_excel,txs_ppt,txs_stl,txs_text,txs_exe,txs_zip,txs_action,txs_profile,txs_agent,txs_referee,txs_task_item,txs_task_reward) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      insertStat.run(block_date,BlockStat.block_size,BlockStat.mining_time,BlockStat.reward,BlockStat.txs_length,BlockStat.weave_size,BlockStat.cumulative_diff,BlockStat.reward_pool,txs_item,txs_image,txs_video,txs_audio,txs_pdf,txs_word,txs_excel,txs_ppt,txs_stl,txs_text,txs_exe,txs_zip,txs_action,txs_profile,txs_agent,txs_referee,txs_task_item,txs_task_reward);
      insertStat.finalize();
    }

  }

  async function getTxInforByIdFromDb(TxId) {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const getBlockCountValue = await getBlockCount();
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tx where from_address is not null and block_height ='"+ Number(height) +"' order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getTxPageJson(height, pageid, pagesize) {
    const heightFiler = Number(height) < 0 ? 1 : Number(height);
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const getTxCountValue = await getTxCount(heightFiler);
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
    return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) AS NUM FROM tx where from_address is not null", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result.NUM : 0);
        }
      });
    });
  }
  async function getAllTxPage(pageid, pagesize) {
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tx where from_address is not null order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getAllTxPageJson(pageid, pagesize) {
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const getTxCountValue = await getAllTxCount();
    const getTxPageValue = await getAllTxPage(pageidFiler, pagesizeFiler);
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tx where bundleid = '"+txid+"' and from_address is not null order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }
  async function getTxBundleItemPageJson(txid, pageid, pagesize) {
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
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
    const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(txid);
    await syncingTxParseBundleById(getTxInforByIdFromDbValue);
    const getTxBundleItemPageJsonValue = await getTxBundleItemPageJson(txid, pageid, pagesize);
    const txArray = TxRowToJsonFormat([getTxInforByIdFromDbValue]);
    getTxBundleItemPageJsonValue['tx'] = txArray[0];
    getTxBundleItemPageJsonValue['txs'] = getTxBundleItemPageJsonValue['data'];
    //console.log("getTxBundleItemPageJsonValue", getTxBundleItemPageJsonValue);
    return getTxBundleItemPageJsonValue;
  }

  async function getTxPending() {
    const TxPending = await axios.get(NodeApi + '/tx/pending', {}).then(res=>res.data);
    return TxPending;
  }

  async function getTxAnchor() {
    const TxAnchor = await axios.get(NodeApi + '/tx_anchor', {}).then(res=>res.data);
    return TxAnchor;
  }

  async function getPrice(datasize) {
    const Price = await axios.get(NodeApi + '/price/' + datasize, {}).then(res=>res.data);
    return String(Price);
  }

  async function postTx(Payload) {
    try {
      const response = await axios.post(NodeApi + '/tx', Payload);
      console.log('postTx:', response.data);
      postTxForwarding(Payload);
      return response.data;
    } 
    catch (error) {
      console.error('Error:', error.message);
      return 500;
    }
  }

  async function postTxForwarding(Payload) {
    try {
      db.all("SELECT * from peers where status = '1'", (err, result) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          if(result) {
            result.map((item)=>{
              axios.post("http://"+item.ip + '/tx', Payload).then(res =>{
                console.log('postTxForwarding postTx:', item.ip, res.data);              
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
    try {
      const response = await axios.post(NodeApi + '/chunk', Payload);
      console.log('postChunk:', response.data);
      postChunkForwarding(Payload)
      return response.data;
    } 
    catch (error) {
      console.error('Error:', error.message);
      return 500;
    }
  }

  async function postChunkForwarding(Payload) {
    try {
      db.all("SELECT * from peers where status = '1'", (err, result) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          if(result) {
            result.map((item)=>{
              axios.post("http://"+item.ip + '/chunk', Payload).then(res =>{
                console.log('postchunkForwarding postchunk:', item.ip, res.data);              
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
    const TxStatus = await axios.get(NodeApi + '/tx/'+TxId+'/status', {}).then(res=>res.data);
    return TxStatus;
  }

  async function getTxUnconfirmed(TxId) {
    const TxStatus = await axios.get(NodeApi + '/unconfirmed_tx/'+TxId, {}).then(res=>res.data);
    return TxStatus;
  }

  async function getAllAddressCount() {
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
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
    const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxId);
    console.log("getTxInforByIdFromDbValue", getTxInforByIdFromDbValue)
    return TxRowToJsonFormat([getTxInforByIdFromDbValue])[0];
  }

  async function getAllFileTypeAddressCount(FileType, Address) {
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const FileTypeFilter = filterString(FileType)
    const AddressFilter = filterString(Address)
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const FolderFilter = filterString(Folder)
    const AddressFilter = filterString(Address)
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const StarFilter = filterString(Star)
    const AddressFilter = filterString(Address)
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

  async function getAllFileLabelGroup(Address) {
    const AddressFilter = filterString(Address)
    return new Promise((resolve, reject) => {
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
    const AddressFilter = filterString(Address)
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const AddressFilter = filterString(Address)
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const AddressFilter = filterString(Address)
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const AddressFilter = filterString(Address)
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
    return new Promise((resolve, reject) => {
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
    const From = Number(pagesize) * Number(pageid)
    return new Promise((resolve, reject) => {
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
    const pageidFiler = Number(pageid) < 0 ? 0 : Number(pageid);
    const pagesizeFiler = Number(pagesize) < 5 ? 5 : Number(pagesize);
    const From = pageidFiler * pagesizeFiler
    const AddressFilter = filterString(Address)
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
    const getPeersInfoValue = await getPeersInfo();
    const RS = [];
    getPeersInfoValue.map((Peer)=>{
      RS.push(Peer.ip)
    })
    return RS;
  }

  async function checkPeer(url) {
    try {
      const response = await axios.head(url);
  
      if (response.status === 200 || response.status === 204) {
        //console.log(`URL ${url} is reachable.`);
        return 1;
      } else {
        //console.log(`URL ${url} returned an unexpected status code: ${response.status}`);
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
    try {
      const getPeersAvailableList = await getPeersInfo()
      getPeersAvailableList.map(async (Item)=>{
        const peerIsAvailable = await checkPeer("http://"+Item.ip)
        const updatePeerAvailable = db.prepare('update peers set status = ? where ip = ?');
        updatePeerAvailable.run(peerIsAvailable, Item.ip);
        updatePeerAvailable.finalize();
        if(peerIsAvailable == 1) {
          console.log("peerIsAvailable", Item.ip, peerIsAvailable)
          await getPeersAndInsertDb(Item.ip);
        }
      })
      const peersList = await axios.get(NodeApi + '/peers', {}).then(res=>res.data);
      const HaveIpLocationPeersList = await getPeers();
      if(peersList && peersList.length > 0) {
        peersList.map(async (PeerAndPort)=>{
          if(!HaveIpLocationPeersList.includes(PeerAndPort)) {
            const peerIsAvailable = await checkPeer("http://"+PeerAndPort)
            const PeerAndPortArray = PeerAndPort.split(':');
            const ip = PeerAndPortArray[0];
            const url = `https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data&ip=${ip}`;
            const IPJSON = await axios.get(url, {}).then(res=>res.data);  
            const insertTag = db.prepare('INSERT OR REPLACE INTO peers (ip, isp, country, region, city, location, area_code, country_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            insertTag.run(PeerAndPort, IPJSON.isp, IPJSON.country, IPJSON.region, IPJSON.city, IPJSON.location, IPJSON.area_code, IPJSON.country_code, peerIsAvailable);
            insertTag.finalize();
            //console.log("IPJSON", IPJSON)
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
    try {
      const peersList = await axios.get("http://" + PeerUrl + '/peers', {}).then(res=>res.data);
      const HaveIpLocationPeersList = await getPeers();
      //console.log("peersList", peersList)
      if(peersList && peersList.length > 0) {
        peersList.map(async (PeerAndPort)=>{
          if(!HaveIpLocationPeersList.includes(PeerAndPort)) {
            const peerIsAvailable = await checkPeer("http://" + PeerAndPort)
            const PeerAndPortArray = PeerAndPort.split(':');
            const ip = PeerAndPortArray[0];
            const url = `https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data&ip=${ip}`;
            const IPJSON = await axios.get(url, {}).then(res=>res.data);  
            const insertTag = db.prepare('INSERT OR REPLACE INTO peers (ip, isp, country, region, city, location, area_code, country_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            insertTag.run(PeerAndPort, IPJSON.isp, IPJSON.country, IPJSON.region, IPJSON.city, IPJSON.location, IPJSON.area_code, IPJSON.country_code, peerIsAvailable);
            insertTag.finalize();
            console.log("getPeersAndInsertDb", PeerAndPort)
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
    return new Promise((resolve, reject) => {
      db.all("SELECT * from peers where 1=1", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? result : null);
        }
      });
    });
  }

  async function getPeersAvailable() {  
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
      ItemJson.fee = {}
      ItemJson.fee.winston = Item.reward
      ItemJson.fee.xwe = String(Item.reward/1000000000000)
      ItemJson.quantity = {}
      ItemJson.quantity.winston = Item.quantity
      ItemJson.quantity.xwe = String(Item.quantity/1000000000000)
      ItemJson.recipient = Item.target
      //ItemJson.signature = Item.signature
      //ItemJson.signatureType = Item.signatureType
      ItemJson.bundleid = Item.bundleid
      RS.push(ItemJson)
    })
    return RS;
  }



  

  async function getWalletAddressBalanceFromDb(Address) {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
    const getBlockHeightFromDbValue = await getBlockHeightFromDb();
    const BlockInfor = await getBlockInforByHeightFromDb(getBlockHeightFromDbValue);
    //console.log("BlockInfor", BlockInfor)
    const LightNodeStatus = {}
    if(BlockInfor)  {
      const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data);
      LightNodeStatus['network'] = "chivesweave.mainnet";
      LightNodeStatus['version'] = 5;
      LightNodeStatus['release'] = 66;
      LightNodeStatus['height'] = MinerNodeStatus.height;
      LightNodeStatus['current'] = BlockInfor.indep_hash;
      LightNodeStatus['weave_size'] = BlockInfor.weave_size;
      LightNodeStatus['blocks'] = getBlockHeightFromDbValue;
      LightNodeStatus['peers'] = 1;
      LightNodeStatus['time'] = BlockInfor.timestamp;
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
    console.log("FileContent", FileContent)
    return {FileName, ContentType, FileContent};
  }

  async function getAddressBalance(Address) {
    const AddressFilter = filterString(Address)
    const addressBalance = await axios.get(NodeApi + '/wallet/' + AddressFilter + '/balance', {}).then(res=>res.data);
    return addressBalance;
  }

  async function getAddressBalanceMining(Address) {
    const AddressFilter = filterString(Address)
    const addressBalance = await axios.get(NodeApi + '/wallet/' + AddressFilter + '/reserved_rewards_total', {}).then(res=>res.data);
    return addressBalance;
  }
  
  function readFile(Dir, FileName, Mark, OpenFormat) {
    const filePath = DataDir + '/' + Dir + '/' + FileName;
    if(isFile(filePath)) {
      const data = fs.readFileSync(filePath, OpenFormat);
      return data;
    }
    else {
      console.error("[" + Mark + "] Error read file:", filePath);
      return null;
    }
  }

  function writeFile(Dir, FileName, FileContent, Mark) {
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

  function mkdirForData() {
    fs.mkdir(DataDir + '/blocks', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/txs', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/files', { recursive: true }, (err) => {});
    fs.mkdir(DataDir + '/thumbnail', { recursive: true }, (err) => {});
  }

  function filterString(input) {
    console.log("filterString input:", input)
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
      console.log('File copied successfully!');
      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  }

  async function convertPdfFirstPageToImage(inputFilePath, outputFilePath) {
    return await PDFNet.initialize('demo:1704219714023:7c982fff030000000045c09496df8439e7d5df23f3324ed470716e6ef6').then(async () => {
                  try {
                    const draw = await PDFNet.PDFDraw.create(); 
                    const doc = await PDFNet.PDFDoc.createFromFilePath(inputFilePath);
                    doc.initSecurityHandler();
                    draw.setDPI(92);
                    const firstPage = await (await doc.getPageIterator()).current();
                    // C) Rasterize the first page in the document and save the result as PNG.
                    await draw.export(firstPage, outputFilePath);
                    return true;
                  } catch (err) {
                    console.log(err);
                    return false;
                  }
                }).catch(error => {
                  console.error('Error initializing PDFNet:', error);
                  return false;
                });
  }

  async function convertOfficeToPdf(inputFilePath, outputFilePath) {
    return await PDFNet.initialize('demo:1704219714023:7c982fff030000000045c09496df8439e7d5df23f3324ed470716e6ef6').then(async () => {
                  try {
                    const pdfdoc = await PDFNet.PDFDoc.create();
                    await pdfdoc.initSecurityHandler();
                    await PDFNet.Convert.printerSetMode(PDFNet.Convert.PrinterMode.e_prefer_builtin_converter);
                    await PDFNet.Convert.toPdf(pdfdoc, inputFilePath);
                    await pdfdoc.save(outputFilePath, PDFNet.SDFDoc.SaveOptions.e_linearized);
                    console.log('Converted file: ' + inputFilePath + '\nto: ' + outputFilePath);
                    return true;
                  } 
                  catch (err) {
                    console.log('Unable to convert file ' + inputFilePath);
                    console.log(err);
                    return false;
                  }
                }).catch(error => {
                  console.error('Error initializing PDFNet:', error);
                  return false;
                });
  }

  async function getTxDataThumbnail(OriginalTxId) {
    mkdirForData();
    const TxContent = readFile("txs/" + OriginalTxId.substring(0, 2).toLowerCase(), OriginalTxId + '.json', "getTxDataThumbnail", 'utf-8');
    const TxInfor = JSON.parse(TxContent);
    //console.log("TxInfor", TxInfor);
    
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
    console.log("TxId OriginalTxId", TxId, OriginalTxId);
    
    const inputFilePath = DataDir + '/files/' + TxId.substring(0, 2).toLowerCase() + '/' + TxId;
    if(isFile(inputFilePath)) {
      //Thumbnail Exist
      const compressFilePath = DataDir + "/thumbnail/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId
      if(isFile(compressFilePath)) {
        console.log("compressFilePath", compressFilePath)
        const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId, "getTxDataThumbnail", null);
        return {FileName, ContentType, FileContent};
      }

      //Compress File
      const outputFilePath = DataDir + '/thumbnail/' + TxId.substring(0, 2).toLowerCase();
      enableDir(outputFilePath)
      const fileType = getContentTypeAbbreviation(ContentType);
      const fileTypeSuffix = String(fileType).toLowerCase();
      console.log("fileTypeSuffix", fileTypeSuffix)
      if(fileTypeSuffix == "jpg" || fileTypeSuffix == "jpeg") {
          sharp(inputFilePath).jpeg({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
              if (err) {
                console.log("getTxDataThumbnail sharp err:", TxId, err, info)
              } else {
                console.log("getTxDataThumbnail sharp info:", info);
              }
          });
      }
      else if(fileTypeSuffix == "png") {
        sharp(inputFilePath).png({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
          console.log("getTxDataThumbnail sharp:", TxId, err, info)
        });
      }
      else if(fileTypeSuffix == "gif") {
        sharp(inputFilePath).gif({ quality: 80 }).toFile(outputFilePath + '/' + TxId, (err, info) => {
          console.log("getTxDataThumbnail sharp:", TxId, err, info)
        });
      }
      else if(fileTypeSuffix == "pdf")    {
        if(isFile(outputFilePath + '/' + TxId + '.png')) {
          const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
          return {FileName, ContentType:"image/png", FileContent};
        }
        else {
          const convertPdfFirstPageToImageStatus = await convertPdfFirstPageToImage(inputFilePath, outputFilePath + '/' + TxId + '.png');
          if(convertPdfFirstPageToImageStatus) {
            const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
            return {FileName, ContentType:"image/png", FileContent};
          }
          console.log("convertPdfFirstPageToImageStatus", convertPdfFirstPageToImageStatus);
        }
        //printer(inputFilePath).then(console.log);
        console.log("outputFilePath", outputFilePath + '/' + TxId + '.png')
      }
      else if(fileTypeSuffix == "docx" || fileTypeSuffix == "doc" || fileTypeSuffix == "xls" || fileTypeSuffix == "xlsx" || fileTypeSuffix == "ppt" || fileTypeSuffix == "pptx")    {
        if(isFile(outputFilePath + '/' + TxId + '.png')) {
          const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
          return {FileName, ContentType:"image/png", FileContent};
        }
        else {
          const copyFileSyncStatus = copyFileSync(inputFilePath, inputFilePath + "." + fileTypeSuffix);
          if(copyFileSyncStatus)   {
            const convertOfficeToPdfStatus = await convertOfficeToPdf(inputFilePath + "." + fileTypeSuffix, outputFilePath + '/' + TxId + '.pdf');
            if(convertOfficeToPdfStatus) {
              const convertPdfFirstPageToImageStatus = await convertPdfFirstPageToImage(outputFilePath + '/' + TxId + '.pdf', outputFilePath + '/' + TxId + '.png');
              if(convertPdfFirstPageToImageStatus) {
                const FileContent = readFile("thumbnail/" + TxId.substring(0, 2).toLowerCase(), TxId + '.png', "getTxDataThumbnail", null);
                return {FileName, ContentType:"image/png", FileContent};
              }
            }
          }
          console.log("convertOfficeToPdfStatus", convertOfficeToPdfStatus);
        }
        //printer(inputFilePath).then(console.log);
        console.log("outputFilePath", outputFilePath + '/' + TxId + '.png')
      }

      //Thumbnail Exist
      const compressFilePath2 = DataDir + "/thumbnail/" + TxId.substring(0, 2).toLowerCase() + "/" + TxId
      if(isFile(compressFilePath2)) {
        console.log("compressFilePath2", compressFilePath2)
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
          console.log("inputFilePath Not Exist:", inputFilePath)
      }
      return {FileName, ContentType, FileContent};
    }

  }

  async function compressImage(TxId, ContentType) {
  }

  async function deleteBlackTxsAndAddress() {
    const DeleteAddress = db.prepare("delete from tx where from_address = ?");
    BlackListAddress.map((Address)=>{
      DeleteAddress.run(Address);
    })
    DeleteAddress.finalize();
    const DeleteTxs = db.prepare("delete from tx where id = ?");
    BlackListTxs.map((Address)=>{
      DeleteTxs.run(Address);
    })
    DeleteTxs.finalize();    
    const DeleteBlackListTxs = db.prepare("DELETE FROM tx WHERE id IN (SELECT id FROM blacklist)");
    DeleteBlackListTxs.run();
    DeleteBlackListTxs.finalize(); 
  }

  export default {
    syncingBlock,
    syncingBlockPromiseAll,
    syncingBlockMissing,
    syncingBlockMinedTime,
    syncingBlockByHeight,
    syncingBlockAndTxStat,
    syncingTx,
    syncingTxPromiseAll,
    syncingTxById,
    syncingChunks,
    syncingChunksPromiseAll,
    syncingTxParseBundle,
    syncingTxParseBundleById,
    syncingTxChunksById,
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
    getTxAnchor,
    getPrice,
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
    isFile,
    readFile,
    writeFile,
    filterString,
    compressImage,
    mkdirForData,
    deleteBlackTxsAndAddress
  };