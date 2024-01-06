import settings from 'electron-settings';
import sqlite3 from 'sqlite3';
const sqlite3Verbose = sqlite3.verbose();

const ChivesLightNodeSetting = await settings.get('chives-light-node');
console.log("ChivesLightNodeSetting db", ChivesLightNodeSetting)
const DataDir = ChivesLightNodeSetting && ChivesLightNodeSetting.NodeStorageDirectory ? ChivesLightNodeSetting.NodeStorageDirectory : "D:\\";

const db = new sqlite3Verbose.Database(DataDir + '/chiveslightnode.db');

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
            status TEXT not null
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
    db.run(`CREATE INDEX IF NOT EXISTS idx_address_agent ON address (agent);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_address_referee ON address (referee);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_address_last_tx_action ON address (last_tx_action);`);


});
  


export default db
