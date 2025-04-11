import mariadb from "mariadb";

export type DBEventType = 'connect' | 'disconnect' | 'error' | 'query' | 'reconnect';

export interface DBEventListener {
    eventType: DBEventType;
    callback: (data: any) => void;
}

export interface UserTable {
    /*
    Configuration de la table utilisateur, les collones doivent être renseignées
    */
    id: string;
    nom: string;
    prenom: string;
    password: string;
    pin: string;
    rfid: string;
    visage: string;
    table: string;
}

export interface AouthTable {
    /*
    Configuration de la table aouth, les collones doivent être renseignées
    */
    id: string;
    token: string;
    table: string;
}

export interface ItemTable {
    /*
    Configuration de la table item, les collones doivent être renseignées
    */
    id: string;
    name: string;
    expire: string;
    container: string;
    table: string;
}

export interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    itemTable: ItemTable;
    aouthTable: AouthTable;
    userTable: UserTable;
}

export interface DBAuthResponse {
    token: string;
    nom: string;
    prenom: string;
}

export interface UserItem{
    name: string;
    expire: string;
    container: string;
}

export default class DB {
    private pollConnexion: mariadb.PoolConnection | undefined;
    private listeners: DBEventListener[] = [];
    public host: string;
    public port: number;
    public user: string;
    public password: string;
    public database: string;
    public itemTable: ItemTable;
    public aouthTable: AouthTable;
    public userTable: UserTable;
    private isConnect: boolean = false;

    constructor(config: DBConfig) {
        this.host = config.host;
        this.port = config.port;
        this.user = config.user;
        this.password = config.password;
        this.database = config.database;
        this.itemTable = config.itemTable;
        this.aouthTable = config.aouthTable;
        this.userTable = config.userTable;
        this.Connexion().then((conn) => {
            this.pollConnexion = (conn as mariadb.PoolConnection);
            this.emitEvent('connect', { success: true, connexion: this.pollConnexion });
        }).catch((err) => {
            console.error('Database connection failed');
            this.emitEvent('error', { message: 'Connection failed', error: err });
        });
        process.on('SIGINT', () => {
            this.OnProgammeClose();
        });
        process.on('SIGTERM', () => {
            this.OnProgammeClose();
        });
        process.on('exit', () => {
            this.OnProgammeClose();
        });
    }

    private Connexion(): Promise<mariadb.PoolConnection | void> {
        return new Promise((resolve, reject) => {
            try {
                this.isConnect = true;
                resolve(mariadb.createPool({
                    host: this.host,
                    port: this.port,
                    user: this.user,
                    password: this.password,
                    database: this.database,
                    connectionLimit: 5,
                }).getConnection());
            }
            catch (err) {
                console.error('Database connection failed:', err);
                reject(err);
            }
        });
    }

    public Reconnect(): void {
        this.CloseConnexion().then(() => {
            this.Connexion().then((conn) => {
                this.pollConnexion = (conn as mariadb.PoolConnection);
                this.emitEvent('reconnect', { success: true, connexion: this.pollConnexion });
            }).catch((err) => {
                console.error('Database connection failed');
                this.emitEvent('error', { message: 'Reconnection failed', error: err });
            });
        }).catch((err) => {
            console.error('Database connection failed');
            this.emitEvent('error', { message: 'Connection close failed during reconnect', error: err });
        });
    }

    public GetItemByUser(token: string): Promise<Array<UserItem>> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT ${this.itemTable.name},${this.itemTable.expire},${this.itemTable.container} FROM ${this.database}.${this.itemTable.table} INNER JOIN ${this.aouthTable.table} ON ${this.itemTable.id}=${this.aouthTable.id} WHERE ${this.aouthTable.token} = ? `, [token])
                    .then((res) => {
                        this.emitEvent('query', { type: 'GetItemByUser', success: true, token: token, connexion: this.pollConnexion });
                        resolve(res);
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'GetItemByUser', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetItemByUser' });
                reject(new Error(err));
            }
        });
    }

    public PutItemBtUser(token: string,item : UserItem): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserIdByToken(token).then((userId) => {
                    (this.pollConnexion as mariadb.PoolConnection).query(`INSERT INTO ${this.database}.${this.itemTable.table} (${this.itemTable.id},${this.itemTable.name},${this.itemTable.expire},${this.itemTable.container}) VALUES (?,?,?,?)`, [userId, item.name , item.expire, item.container])
                        .then((_res) => {
                            this.emitEvent('query', { type: 'PutItemBtUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve(JSON.stringify({ success: true }));
                        })
                        .catch((err) => {
                            this.emitEvent('error', { message: 'Query failed', operation: 'PutItemBtUser', error: err });
                            reject(err);
                        });
                });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'PutItemBtUser' });
                reject(new Error(err));
            }
        });
    }

    private GetUserIdByToken(token: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT ${this.aouthTable.id} FROM ${this.database}.${this.aouthTable.table} WHERE ${this.aouthTable.token} = ?`, [token])
                    .then((res) => {
                        if (res.length === 1) {
                            resolve(res[0].id);
                        } else {
                            reject(new Error('Token not found'));
                        }
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetUserIdByToken' });
                reject(new Error(err));
            }
        });
    }

    public GetUserByRfid(rfid: string): Promise<string | DBAuthResponse> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT id,prenom,nom FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.rfid} = ?`, [rfid])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, rfid: rfid, connexion: this.pollConnexion });
                        if (success) {
                            this.CreateAuth(res[0].id).then((token) => {
                                resolve({
                                    token: token,
                                    nom: res[0].nom,
                                    prenom: res[0].prenom
                                });
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                        else {
                            resolve(JSON.stringify({ success: false }));
                        }
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'GetUser', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetUser' });
                reject(new Error(err));
            }
        });
    }

    public GetUserByVisage(dataVisage: string): Promise<string | DBAuthResponse> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT id,prenom,nom FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.visage} = ?`, [dataVisage])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, DataVisage: dataVisage, connexion: this.pollConnexion });
                        if (success) {
                            this.CreateAuth(res[0].id).then((token) => {
                                resolve({
                                    token: token,
                                    nom: res[0].nom,
                                    prenom: res[0].prenom
                                });
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                        else {
                            resolve(JSON.stringify({ success: false }));
                        }
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'GetUser', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetUser' });
                reject(new Error(err));
            }
        });
    }

    public GetUserByPin(pin: string): Promise<string | DBAuthResponse> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT id,prenom,nom FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.pin} = ?`, [pin])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, pin: pin, connexion: this.pollConnexion });
                        if (success) {
                            this.CreateAuth(res[0].id).then((token) => {
                                resolve({
                                    token: token,
                                    nom: res[0].nom,
                                    prenom: res[0].prenom
                                })
                            }).catch((err) => {
                                console.log(err);
                                reject(err);
                            });
                        }
                        else {
                            resolve(JSON.stringify({ success: false }));
                        }
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'GetUser', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetUser' });
                reject(new Error(err));
            }
        });
    }

    public GetUser(prenom: string, password: string): Promise<string | DBAuthResponse> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT id,prenom,nom FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.prenom} = ? AND ${this.userTable.password} = ?`, [prenom, password])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, prenom: prenom, password: password, connexion: this.pollConnexion });
                        if (success) {
                            this.CreateAuth(res[0].id).then((token) => {
                                resolve({
                                    token: token,
                                    nom: res[0].nom,
                                    prenom: res[0].prenom
                                });
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                        else {
                            resolve(JSON.stringify({ success: false }));
                        }
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'GetUser', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'GetUser' });
                reject(new Error(err));
            }
        });
    }

    private CreateAuth(userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                const token = crypto.getRandomValues(new Uint32Array(16)).join('');
                this.pollConnexion.query(`INSERT INTO ${this.database}.${this.aouthTable.table} (${this.aouthTable.id},${this.aouthTable.token}) VALUES (?,?)`, [userId, token])
                    .then((_res) => {
                        this.emitEvent('query', { type: 'CreateAuth', success: true, userId: userId, connexion: this.pollConnexion });
                        resolve(token);
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'CreateAuth', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'CreateAuth' });
                reject(new Error(err));
            }
        });
    }

    public Deconnexion(token: string): Promise<Object> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`DELETE FROM ${this.database}.${this.aouthTable.table} WHERE ${this.aouthTable.token} = ?`, [token])
                    .then((_res) => {
                        this.emitEvent('query', { type: 'Deconnexion', success: true, token: token, connexion: this.pollConnexion });
                        resolve({ success: true });
                    })
                    .catch((err) => {
                        this.emitEvent('error', { message: 'Query failed', operation: 'Deconnexion', error: err });
                        reject(err);
                    });
            } else {
                const err = "pas de poll Con";
                this.emitEvent('error', { message: err, operation: 'Deconnexion' });
                reject(new Error(err));
            }
        });
    }

    public async CloseConnexion(): Promise<void> {
        if (this.pollConnexion) {
            await this.pollConnexion.release();
            this.isConnect = false;
            this.pollConnexion = undefined;
            this.emitEvent('disconnect', { success: true });
        }
    }

    public GetPollConnexion(): mariadb.PoolConnection | undefined {
        return this.pollConnexion;
    }

    // Listener management methods
    public addListener(eventType: DBEventType, callback: (data: any) => void): void {
        this.listeners.push({ eventType, callback });
    }

    public removeListener(eventType: DBEventType, callback: (data: any) => void): void {
        this.listeners = this.listeners.filter(
            listener => !(listener.eventType === eventType && listener.callback === callback)
        );
    }

    private emitEvent(eventType: DBEventType, data: any = null): void {
        this.listeners
            .filter(listener => listener.eventType === eventType)
            .forEach(listener => listener.callback(data));
    }

    public on(eventType: DBEventType, callback: (data: any) => void): void {
        this.addListener(eventType, callback);
    }

    private OnProgammeClose(): void {
        this.CloseConnexion().then(() => {
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
    };

    public IsConnect(): boolean {
        return this.isConnect;
    }
}