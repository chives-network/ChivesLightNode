  const NodeApi = "http://112.170.68.77:1987";
  import db from './db.js'
  import axios from 'axios'
  import fs from 'fs'
  import base64url from 'base64url'
  import sharp from 'sharp'
  import { unbundleData } from 'arbundles'
  import Arweave from 'arweave'

  import imagemin from 'imagemin';
  import imageminPngquant from 'imagemin-pngquant';
  import { join, extname } from 'path';
  //const imagemin = require('imagemin');
  //const optipng = require('imagemin-optipng');

  const DataDir = "D:/GitHub/ChivesweaveDataDir";

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
        console.log("syncingTx TxInfor: ", TxList.id, TxInfor.reward)
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
            console.log("syncingTxPromiseAll TxInfor: ", TxList.id, TxInfor.reward);
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
      db.all("SELECT * from tx where entity_type ='Bundle' and data_root_status = '200' and (bundleTxParse is null or bundleTxParse = '') limit " + TxCount + " offset 0", (err, result) => {
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
        const TxInfor = await syncingTxChunksById(TxList.id, TxList.block_height);
        result.push(TxInfor)
      }
      return result;
    } 
    catch (error) {
      console.error("syncingChunks error fetching block data:", error.message);
      return { error: "Internal Server Error" };
    }
  }

  async function syncingChunksPromiseAll(TxCount = 5) {
    try {
      const getTxsHaveChunksList = await getTxsHaveChunks(TxCount);
      console.log("syncingChunks Count: ", getTxsHaveChunksList.length);
  
      const result = await Promise.all(
        getTxsHaveChunksList.map(async (TxList) => {
          try {
            const TxInfor = await syncingTxChunksById(TxList.id, TxList.block_height);
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
    const TxJsonFilePath = DataDir + "/txs/" + TxId.substring(0, 2) + "/" + TxId + ".json";
    //console.log("TxInfor TxJsonFilePath",TxJsonFilePath)
    if(isFile(TxJsonFilePath)) {
      //Nothing to do
      const TxContent = getTxInforById(TxId);
      TxInfor = JSON.parse(TxContent)
      console.log("syncingTxById Read Tx From Json File",TxId)
    }
    else {
      const result = await axios.get(NodeApi + '/tx/' + TxId, {});
      TxInfor = result.data
      console.log("syncingTxById From Remote Node",TxId)
    }

    //Write Tx File
    const writeFileStatus = writeFile('txs/' + TxId.substring(0, 2), TxId + ".json", JSON.stringify(TxInfor), "syncingTxById")
    //console.log("TxInfor Tags",TxInfor.tags)
    if(writeFileStatus)    {
      //Insert Tags
      TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
        const TagName = Buffer.from(Tag.name, 'base64').toString('utf-8');
        const TagValue = Buffer.from(Tag.value, 'base64').toString('utf-8');
        const insertTag = db.prepare('INSERT OR IGNORE INTO tag (height, tx_id, name, value) VALUES (?, ?, ?, ?)');
        insertTag.run(Height, TxId, TagName, TagValue);
        insertTag.finalize();
      })
    
      //Tags Data
      const newTags = []
      const TagsMap = {}
      if(TxInfor.owner && TxInfor.owner.address) {
        TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
          TagsMap[Tag.name] = Tag.value;
          newTags.push({'name':Tag.name, 'value':Tag.value})
        })
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
      
      //Update Tx
      const updateAddress = db.prepare('update tx set last_tx = ?, owner = ?, from_address = ?, target = ?, quantity = ?, signature = ?, reward = ?, data_size = ?, data_root = ?, bundleid = ?, item_name = ?, item_type = ?, item_parent = ?, content_type = ?, item_hash = ?, item_summary = ?, is_encrypt = ?, is_public = ?, entity_type = ?, app_name = ?, app_version = ?, app_instance = ?, tags = ? where id = ?');
      let from_address = '';
      if(TxInfor.owner && TxInfor.owner.address) {
        from_address = TxInfor.owner.address;
      }
      else {
        from_address = await ownerToAddress(TxInfor.owner);
      }
      const bundleid = "";
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
      updateAddress.run(TxInfor.last_tx, TxInfor.owner, from_address, TxInfor.target, TxInfor.quantity, TxInfor.signature, TxInfor.reward, TxInfor.data_size, TxInfor.data_root, bundleid, item_name, item_type, item_parent, content_type, item_hash, item_summary, is_encrypt, is_public, entity_type, app_name, app_version, app_instance, JSON.stringify(newTags), TxId);
      updateAddress.finalize();

      console.log("TxInfor from_address: ", from_address)

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
    const TxId = TxInfor.id;
    const BundlePath = DataDir + '/files/' + TxId;
    console.log("syncingTxParseBundleById unBundleItem id",BundlePath)
    if( isFile(BundlePath) ) {
        console.log("syncingTxParseBundleById Exist", BundlePath)  
        try {
            //const TxInfor = await getTxInforByIdFromDb(TxId);
            //console.log("TxInfor TxInfor",TxInfor)
            const FileContent = fs.readFileSync(BundlePath);
            try {
                const unbundleItems = unbundleData(FileContent);
                unbundleItems.items.map(async (Item) => {
                    //console.log("unbundleItems",Item)
                    console.log("unbundleItems id", Item.id, Item.tags)
                    //console.log("unBundleItem tags",Item.tags)
                    //console.log("unBundleItem owner",Item.owner)
                    //console.log("unBundleItem anchor",Item.anchor)
                    //console.log("unBundleItem target",Item.target)
                    //console.log("unBundleItem signature",Item.signature)
                    //console.log("unBundleItem signatureType",Item.signatureType)
                    //console.log("unBundleItem data",Item.data)
                    //Update Chunks Status IGNORE
                    const insertTxBundleItem = db.prepare('INSERT OR IGNORE INTO tx (id,block_indep_hash,last_tx,owner,from_address,target,quantity,signature,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
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
                    //Tags Data
                    const TagsMap = {}
                    Item && Item.tags && Item.tags.length > 0 && Item.tags.map( (Tag) => {
                        TagsMap[Tag.name] = Tag.value;
                    })
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
                    
                    const entity_type = "File"
                    const bundleTxParse = 1
                    const data_root = ''
                    const data_root_status = 200

                    const is_encrypt = TagsMap['Cipher-ALG'] || "";
                    const is_public = TagsMap['File-Public'] || "";
                    const app_name = TagsMap['App-Name'] || "";
                    const app_version = TagsMap['App-Version'] || "";
                    const app_instance = TagsMap['App-Instance'] || "";
                    const last_tx_action = id

                    insertTxBundleItem.run(id,block_indep_hash,last_tx,owner,from_address,target,quantity,signature,reward,timestamp,block_height,data_size,bundleid,item_name,item_type,item_parent,content_type,item_hash,item_summary,item_star,item_label,item_download,item_language,item_pages,is_encrypt,is_public,entity_type,app_name,app_version,app_instance,bundleTxParse,data_root,data_root_status,last_tx_action);
                    insertTxBundleItem.finalize();

                    //Write Item Data to File
                    writeFile('files' + Item.id.substring(0, 2), Item.id, Buffer.from(Item.data, 'base64'), "syncingTxParseBundleById")

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
                    ItemJson.data.type = content_type
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
                    writeFile('txs/' + Item.id.substring(0, 2), Item.id + '.json', JSON.stringify(ItemJson), "syncingTxParseBundleById")

                    //Update Tx Status
                    const EntityType    = TagsMap['Entity-Type'];
                    const EntityAction  = TagsMap['Entity-Action'];
                    const FileTxId      = TagsMap['FileTxId'];
                    const EntityTarget  = TagsMap['Entity-Target'];
                    const LastTxChange  = TagsMap['Last-Tx-Change'];
                    if(EntityType == "Action") {
                        console.log("TxInfor EntityAction: ______________________________________________________________", EntityAction)
                        switch(EntityAction) {
                            case 'Label':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleLabel = db.prepare('update tx set item_label = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleLabel.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleLabel.finalize();
                                break;
                            case 'Star':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleStar = db.prepare('update tx set item_star = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleStar.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleStar.finalize();
                                break;
                            case 'Folder':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleFolder.finalize();
                                break;
                            case 'Public':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundlePublic = db.prepare('update tx set is_public = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundlePublic.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundlePublic.finalize();
                                break;
                            case 'RenameFolder':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleRenameFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleRenameFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleRenameFolder.finalize();
                                break;
                            case 'DeleteFolder':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleDeleteFolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleDeleteFolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleDeleteFolder.finalize();
                                break;
                            case 'Restorefolder':
                                //EntityTarget, BlockTimestamp, BlockHeight, FileTxId, LastTxChange
                                const updateBundleRestorefolder = db.prepare('update tx set item_parent = ?, timestamp = ?, last_tx_action = ? where (id = last_tx_action and id = ?) or (id != last_tx_action and id = ? and last_tx_action = ?)');
                                updateBundleRestorefolder.run(EntityTarget, timestamp, block_height, FileTxId, FileTxId, LastTxChange);
                                updateBundleRestorefolder.finalize();
                                break;
                            case 'Profile':
                                //DataItemId, BlockTimestamp, BlockHeight, FromAddress, LastTxChange
                                const updateBundleAddressProfile = db.prepare('update address set profile = ?, timestamp = ?, last_tx_action = ? where (last_tx_action is null and address = ?) or (address = ? and last_tx_action = ?)');
                                updateBundleAddressProfile.run(Item.id, timestamp, block_height, from_address, from_address, LastTxChange);
                                updateBundleAddressProfile.finalize();
                                break;
                            case 'Agent':
                                //EntityTarget, FromAddress, BlockTimestamp
                                const updateBundleAddressAgent = db.prepare("update address set Agent = ?, timestamp = ? where address = ? and Agent = '0'");
                                updateBundleAddressAgent.run('1', timestamp, from_address);
                                updateBundleAddressAgent.finalize();
                                break;
                            case 'Referee':
                                //EntityTarget, FromAddress, BlockTimestamp
                                const updateBundleAddressReferee = db.prepare("update address set referee = ? where address = ? and referee is null");
                                updateBundleAddressReferee.run(EntityTarget, from_address);
                                updateBundleAddressReferee.finalize();
                                break;
                        }
                    }


                })
                const updateBundle = db.prepare('update tx set bundleTxParse = ? where id = ?');
                updateBundle.run('1', TxId);
                updateBundle.finalize();
            }
            catch (err) {
                console.error('Error Arbundles.unbundleData:', TxId);
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

  async function syncingTxChunksById(TxId) {
    // @ts-ignore
    let data_root_status = 0;
    try {
        const arrayBuffer = await fetch(NodeApi + '/' + TxId).then(res => res.arrayBuffer()).catch(() => {})
        const FileBuffer = Buffer.from(arrayBuffer);
        //Write Chunks File
        if(FileBuffer.length > 0) {
            data_root_status = 200
            writeFile('files' + TxId.substring(0, 2), TxId, FileBuffer, "syncingTxChunksById")
        }
        else {
            data_root_status = 404
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
      const BlockHeightRange = Array.from({ length: EveryTimeDealBlockCount }, (_, index) => BeginHeight + index);
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

  async function syncingBlockPromiseAll(EveryTimeDealBlockCount = 5) {
    try {
      const getBlockHeightFromDbValue = await getBlockHeightFromDb();
      const BeginHeight = getBlockHeightFromDbValue + 1;
      console.log("getBlockHeightFromDbValue:", getBlockHeightFromDbValue);
  
      const BlockHeightRange = Array.from({ length: EveryTimeDealBlockCount }, (_, index) => BeginHeight + index);
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
  
  async function syncingBlockByHeight(currentHeight) {
    // @ts-ignore
    let BlockInfor = null;
    const BlockHeightDir = enableBlockHeightDir(currentHeight);
    const BlockJsonFilePath = DataDir + "/blocks/" + BlockHeightDir + "/" + currentHeight + ".json";
    if(isFile(BlockJsonFilePath)) {
      //Nothing to do
      BlockContent = getBlockInforByHeight(currentHeight);
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
    

    //Insert Address
    const insertAddress = db.prepare('INSERT OR IGNORE INTO address (address, lastblock, timestamp, balance, txs, profile, referee, last_tx_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertAddress.run(BlockInfor.reward_addr, BlockInfor.height, BlockInfor.timestamp, 0, 0, "", "", "");
    insertAddress.finalize();
  
    //Update Address
    let AddressBalance = 0
    AddressBalance = await getWalletAddressBalanceFromDb(BlockInfor.reward_addr)
    //console.log("getWalletAddressBalanceFromDb", AddressBalance)
    if(AddressBalance == 0) {
      AddressBalance = await axios.get(NodeApi + "/wallet/" + BlockInfor.reward_addr + "/balance", {}).then((res)=>{return res.data});
      //console.log("AddressBalanceNodeApi", AddressBalance)
    }
    //console.log("AddressBalance", AddressBalance)
    const updateAddress = db.prepare('update address set lastblock = ?, timestamp = ?, balance = ? where address = ?');
    updateAddress.run(BlockInfor.height, BlockInfor.timestamp, AddressBalance, BlockInfor.reward_addr);
    updateAddress.finalize();
    
    //Insert Tx
    const Txs = BlockInfor.txs;
    const insertTx = db.prepare('INSERT OR IGNORE INTO tx (id, block_indep_hash, block_height, timestamp, last_tx_action) VALUES (?, ?, ?, ?, ?)');
    Txs.map((Tx)=>{
      insertTx.run(Tx, BlockInfor.indep_hash, BlockInfor.height, BlockInfor.timestamp, Tx);
    })
    insertTx.finalize();

    //Write Block File
    writeFile("/blocks/" + enableBlockHeightDir(currentHeight), BlockInfor.height + ".json", JSON.stringify(BlockInfor), "syncingBlockByHeight")

    //Insert Block
    const insertStatement = db.prepare('INSERT OR REPLACE INTO block (id, height, indep_hash, block_size, mining_time, reward, reward_addr, txs_length, weave_size, timestamp, syncing_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertStatement.run(BlockInfor.height, BlockInfor.height, BlockInfor.indep_hash, BlockInfor.block_size, 0, BlockInfor.reward, BlockInfor.reward_addr, BlockInfor.txs.length, BlockInfor.weave_size, BlockInfor.timestamp, 0);
    insertStatement.finalize();
  
    return BlockInfor;
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
      db.get("SELECT COUNT(*) AS NUM FROM tx where block_height ='"+ Number(Height) +"'", (err, result) => {
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
      db.all("SELECT * FROM tx where block_height ='"+ Number(height) +"' order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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
      db.get("SELECT COUNT(*) AS NUM FROM tx", (err, result) => {
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
      db.all("SELECT * FROM tx order by id desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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
      db.all("SELECT * FROM address order by address desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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
      db.get("SELECT COUNT(*) AS NUM FROM tx where item_type = '"+FileType+"' and is_encrypt = '' and entity_type = 'File' ", (err, result) => {
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
      db.all("SELECT * FROM tx where item_type = '"+FileType+"' and is_encrypt = '' and entity_type = 'File' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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
      db.all("SELECT * FROM tx where item_type = '"+FileType+"' and from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'File' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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
      db.all("SELECT * FROM tx where from_address = '"+Address+"' and is_encrypt = '' and entity_type = 'Tx' order by block_height desc limit "+ Number(pagesize) +" offset "+ From +"", (err, result) => {
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

  
  function TxRowToJsonFormat(getTxPageValue) {
    const RS = []
    getTxPageValue.map((Item) =>{
      const ItemJson = {}
      ItemJson.id = Item.id
      ItemJson.owner = {}
      ItemJson.owner.address = Item.from_address
      //ItemJson.owner.key = Item.owner
      ItemJson.anchor = Item.anchor
      ItemJson.tags = JSON.parse(Item.tags)
      ItemJson.block = {}
      ItemJson.block.height = Item.block_height
      ItemJson.block.indep_hash = Item.block_indep_hash
      ItemJson.block.timestamp = Item.timestamp
      ItemJson.data = {}
      ItemJson.data.size = Item.data_size
      ItemJson.data.type = Item.content_type
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
      db.get("SELECT balance FROM address where address = '"+ Address +"'", (err, result) => {
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
    console.log("BlockInfor", BlockInfor)
    const MinerNodeStatus = await axios.get(NodeApi + '/info', {}).then(res=>res.data);
    const LightNodeStatus = {}
    LightNodeStatus['network'] = "chivesweave.mainnet";
    LightNodeStatus['version'] = 5;
    LightNodeStatus['release'] = 66;
    LightNodeStatus['height'] = MinerNodeStatus.height;
    LightNodeStatus['current'] = BlockInfor.indep_hash;
    LightNodeStatus['blocks'] = getBlockHeightFromDbValue;
    LightNodeStatus['peers'] = 1;
    LightNodeStatus['time'] = BlockInfor.timestamp;
    LightNodeStatus['type'] = "lightnode";
    return LightNodeStatus;
  }

  function getBlockInforByHeight(Height) {
    const HeightFilter = Number(Height)
    const BlockContent = readFile("/blocks/" + enableBlockHeightDir(Height), HeightFilter + '.json', "getBlockInforByHeight", 'utf-8');
    return BlockContent;
  }

  function getTxInforById(TxId) {
    const TxIdFilter = filterString(TxId)
    const TxContent = readFile("txs/" + TxIdFilter.substring(0, 2), TxIdFilter + '.json', "getTxInforById", 'utf-8');
    return TxContent;
  }

  async function getTxData(TxId) {
    const TxIdFilter = filterString(TxId)
    const getTxInforByIdFromDbValue = await getTxInforByIdFromDb(TxIdFilter);
    let FileContent = readFile("files/" + TxIdFilter.substring(0, 2), TxIdFilter, "getTxData", null);
    if(FileContent == null) {
        const TxContent = readFile("txs/" + TxIdFilter.substring(0, 2), TxIdFilter + '.json', "getTxData", 'utf-8');
        const TxContentJson = JSON.parse(TxContent);
        if(TxContentJson && TxContentJson.data && TxContentJson.data_root == '') {
            FileContent = TxContentJson;
        }
        else {
            FileContent = '';
        }
    }
    const FileName = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['item_name'] ? getTxInforByIdFromDbValue['item_name'] : TxId;
    const ContentType = getTxInforByIdFromDbValue && getTxInforByIdFromDbValue['content_type'] ? getTxInforByIdFromDbValue['content_type'] : "";
    console.log("ContentType", ContentType)
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
    const sanitizedInput = input?.replace(/[^a-zA-Z0-9_\-@. ]/g, '');
    return sanitizedInput;
  }

  async function getTxDataThumbnail(TxId) {
    mkdirForData();
    const TxContent = readFile("txs/" + TxId.substring(0, 2), TxId + '.json', "getTxDataThumbnail", 'utf-8');
    const TxInfor = JSON.parse(TxContent);
    //console.log("TxInfor", TxInfor);
    const TagsMap = {}
    TxInfor && TxInfor.tags && TxInfor.tags.length > 0 && TxInfor.tags.map( (Tag) => {
      TagsMap[Tag.name] = Tag.value;
    })
    const FileName = TagsMap['File-Name']
    const ContentType = TagsMap['Content-Type']

    //Thumbnail Exist
    const compressFilePath = DataDir + "/thumbnail/" + TxId.substring(0, 2) + "/" + TxId
    if(isFile(compressFilePath)) {
      console.log("compressFilePath", compressFilePath)
      const FileContent = readFile("thumbnail/" + TxId.substring(0, 2), TxId, "getTxDataThumbnail", null);
      return {FileName, ContentType, FileContent};
    }

    //Compress File
    const inputFilePath = DataDir + '/files/' + TxId.substring(0, 2) + '/' + TxId;
    const outputFilePath = DataDir + '/thumbnail/' + TxId.substring(0, 2);
    enableDir(outputFilePath)
    const fileType = contentTypeToFileType(ContentType);
    const fileTypeSuffix = String(fileType).toLowerCase();
    console.log("fileTypeSuffix", fileTypeSuffix)
    if(fileTypeSuffix == "jpg" || fileTypeSuffix == "jpeg") {
        sharp(inputFilePath).jpeg({ quality: 80 }).toFile(outputFilePath, (err, info) => {
            console.log("getTxDataThumbnail sharp:", err, info)
        });
    }
    else if(fileTypeSuffix == "png") {
      const files = await imagemin([inputFilePath], {
          destination: outputFilePath,
          plugins: [
              imageminPngquant()
          ]
      });
      console.log("getTxDataThumbnail compressedImage:", files)
    }    
    else if(fileTypeSuffix == "gif") {
    }

    //Thumbnail Exist
    const compressFilePath2 = DataDir + "/thumbnail/" + TxId.substring(0, 2) + "/" + TxId
    if(isFile(compressFilePath2)) {
      console.log("compressFilePath2", compressFilePath2)
      const FileContent = readFile("thumbnail/" + TxId.substring(0, 2), TxId, "getTxDataThumbnail", null);
      return {FileName, ContentType, FileContent};
    }

    //Out Original File Content
    const FileContent = readFile("files/" + TxId.substring(0, 2), TxId, "getTxDataThumbnail", null);
    return {FileName, ContentType, FileContent};

  }

  async function compressImage(TxId, ContentType) {
  }

export default {
    syncingBlock,
    syncingBlockPromiseAll,
    syncingBlockByHeight,
    syncingTx,
    syncingTxPromiseAll,
    syncingTxById,
    syncingChunks,
    syncingChunksPromiseAll,
    syncingTxParseBundle,
    syncingTxChunksById,
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
    getTxData,
    getTxDataThumbnail,
    getAddressBalance,
    getAddressBalanceMining,
    getAllAddressPageJson,
    getAllFileTypePageJson,
    getAllFileTypeAddressPageJson,
    getWalletTxsAllPageJson,
    getWalletTxsSentPageJson,
    getWalletTxsReceivedPageJson,
    getWalletTxsFilesPageJson,
    isFile,
    readFile,
    writeFile,
    filterString,
    compressImage,
    mkdirForData
};