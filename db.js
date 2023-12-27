import sqlite3 from 'sqlite3';
const sqlite3Verbose = sqlite3.verbose();

const db = new sqlite3Verbose.Database('D:/chiveslightnode.db'); // or provide a file path for persistent storage


db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS address (
            address TEXT PRIMARY KEY,
            balance INTEGER,
            txs INTEGER,
            sent INTEGER,
            received INTEGER,
        
            lastblock INTEGER,
            timestamp INTEGER,
            profile TEXT,
            chivesDrive INTEGER DEFAULT 0,
            chivesEmail INTEGER DEFAULT 0,
            
            chivesBlog INTEGER DEFAULT 0,
            chivesMessage INTEGER DEFAULT 0,
            chivesForum INTEGER DEFAULT 0,
            chivesDb INTEGER DEFAULT 0,
            agent INTEGER DEFAULT 0,
        
            referee TEXT,
            last_tx_action TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS block (
            indep_hash TEXT PRIMARY KEY,
            previous_block TEXT,
            height INTEGER,
            timestamp INTEGER,
            syncing_status INTEGER default 0
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
            bundleTxParse INTEGER
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
    db.run(`CREATE INDEX IF NOT EXISTS idx_block_height ON block (height);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_block_timestamp ON block (timestamp);`);
        
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
