import { v4 as uuidv4 } from "uuid";
import mariadb from "mariadb";
export type DBEventType = 'connect' | 'disconnect' | 'error' | 'query' | 'reconnect';

export interface DBError {
    operation: string;
    error: Error;
}

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
    UserId: string;
    id: string;
    name: string;
    expire: string;
    container: string;
    table: string;
    image: string;
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

export interface AuthResponse {
    token: string;
    nom: string;
    prenom: string;
}

export interface UserItem {
    name: string;
    expire: string;
    container: string;
    image?: string;
}

export type AuthMethods = "rfid" | "visage" | "pin" | "password" | "token";

export type AuthData = string | { password: string, name: string };

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
            this.emitEvent('error', { operation: 'Connection', error: err });
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
                const conn = mariadb.createPool({
                    host: this.host,
                    port: this.port,
                    user: this.user,
                    password: this.password,
                    database: this.database,
                    connectionLimit: 5,
                }).getConnection();
                this.isConnect = true;
                resolve(conn);
            }
            catch (err) {
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
                this.emitEvent('error', { operation: 'Reconnection', error: err });
            });
        }).catch((err) => {
            this.emitEvent('error', { operation: 'Connection during reconnect', error: err });
        });
    }

    public GetItemByUser(token: string): Promise<Array<UserItem>> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'PutItemBtUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`SELECT ${this.itemTable.id},${this.itemTable.name},${this.itemTable.expire},${this.itemTable.container},${this.itemTable.image} FROM ${this.database}.${this.itemTable.table} WHERE ${this.itemTable.id} = ?`, [userId])
                        .then((res) => {
                            this.emitEvent('query', { type: 'GetItemByUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve(res);
                        })
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'GetItemByUser', error: err });
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'GetItemByUser', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('GetItemByUser');
            }
        });
    }

    public PutItemByUser(token: string, item: UserItem): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'PutItemBtUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`INSERT INTO ${this.database}.${this.itemTable.table} (${this.itemTable.id},${this.itemTable.name},${this.itemTable.expire},${this.itemTable.container}) VALUES (?,?,?,?)`, [userId, item.name, new Date(item.expire).toISOString(), item.container])
                        .then((res) => {
                            console.log(res);

                            this.emitEvent('query', { type: 'PutItemBtUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve(JSON.stringify({ success: true }));
                        })
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'PutItemBtUser', error: err });
                            reject(err);
                        });
                });
            } else {
                this.NoPoolConError('PutItemBtUser');
            }
        });
    }

    public DeleteItemByUser(token: string, itemId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'DeleteItemByUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`DELETE FROM ${this.database}.${this.itemTable.table} WHERE ${this.itemTable.id} = ?`, [itemId])
                        .then((_res) => {
                            this.emitEvent('query', { type: 'DeleteItemByUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve(JSON.stringify({ success: true }));
                        }
                        )
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'DeleteItemByUser', error: err });
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'DeleteItemByUser', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('DeleteItemByUser');
            }
        });
    }

    private CreateAuth(userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                const token = uuidv4();
                this.pollConnexion.query(`INSERT INTO ${this.database}.${this.aouthTable.table} (${this.aouthTable.id},${this.aouthTable.token}) VALUES (?,?)`, [userId, token])
                    .then((_res) => {
                        this.emitEvent('query', { type: 'CreateAuth', success: true, userId: userId, connexion: this.pollConnexion });
                        resolve(token);
                    })
                    .catch((err) => {
                        this.emitEvent('error', { operation: 'CreateAuth', error: err });
                        reject(err);
                    });
            } else {
                this.NoPoolConError('CreateAuth');
            }
        });
    }

    public UserConnexion(data: any, method: AuthMethods): Promise<string | AuthResponse> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(data, method).then((userId) => {
                    (this.pollConnexion as mariadb.PoolConnection).query(`SELECT ${this.userTable.prenom},${this.userTable.nom} FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.id} = ?`, [userId])
                        .then((res) => {
                            if (res.length === 1) {
                                this.CreateAuth(userId).then((token) => {
                                    resolve({
                                        token: token,
                                        nom: res[0][this.userTable.nom],
                                        prenom: res[0][this.userTable.prenom]
                                    });
                                }).catch((err) => {
                                    reject(err);
                                });
                            } else {
                                reject(new Error('User not found'));
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'UserConnexion', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('GetUser');
            }
        });
    }

    private GetUserID(data: AuthData, method: AuthMethods): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {

                let column: string | undefined;
                if (method === 'rfid') {
                    column = this.userTable.rfid;
                } else if (method === 'pin') {
                    column = this.userTable.pin;
                } else if (method === 'visage') {
                    column = this.userTable.prenom;
                }

                if (!column) {
                    reject(new Error(`Invalid column for method: ${method}`));
                    return;
                }

                switch (method) {
                    case 'password':
                        if (typeof data !== 'object' || !data.password || !data.name) {
                            reject(new Error('Invalid data format for password method'));
                        }
                        this.pollConnexion.query(
                            `SELECT ${this.userTable.id} FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.password} = ? AND ${this.userTable.prenom} = ?`,
                            [(data as { password: string, name: string }).password, (data as { password: string, name: string }).name]
                        )
                            .then((res) => {
                                if (res.length === 1) {
                                    resolve(res[0][this.userTable.id]);
                                } else {
                                    reject(new Error('User not found'));
                                }
                            })
                            .catch((err) => {
                                reject(err);
                            });
                        break;
                    case 'token':
                        if (typeof data !== 'string') {
                            reject(new Error('Invalid data format for token method'));
                        }
                        this.pollConnexion.query(
                            `SELECT ${this.aouthTable.id} FROM ${this.database}.${this.aouthTable.table} WHERE ${this.aouthTable.token} = ?`,
                            [data]
                        )
                            .then((res) => {
                                if (res.length === 1) {
                                    resolve(res[0][this.aouthTable.id]);
                                } else {
                                    reject(new Error('User not found'));
                                }
                            })
                            .catch((err) => {
                                reject(err);
                            });
                        break;
                    default:
                        if (typeof data !== 'string' && typeof data !== 'number') {
                            reject(new Error('Invalid data format for authentication method'));
                            break;
                        }
                        this.pollConnexion.query(
                            `SELECT ${this.userTable.id} FROM ${this.database}.${this.userTable.table} WHERE ${column} = ?`,
                            [data]
                        )
                            .then((res) => {
                                if (res.length === 1) {
                                    resolve(res[0][this.userTable.id]);
                                } else {
                                    reject(new Error('User not found'));
                                }
                            })
                            .catch((err) => {
                                reject(err);
                            });
                        break;
                }

            } else {
                this.NoPoolConError('GetUserID');
            }
        });
    }

    public GetUserInfo(token: string, id: string | number): Promise<string | any> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'GetUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    if (id !== '3' || userId == '3') {
                        return reject(new Error('Non authorized user'));
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`SELECT ${this.userTable.prenom},${this.userTable.nom} FROM ${this.database}.${this.userTable.table} WHERE ${this.userTable.id} = ?`, [id])
                        .then((res) => {
                            if (res.length === 1) {
                                this.emitEvent('query', { type: 'GetUser', success: true, token: token, connexion: this.pollConnexion });
                                resolve(typeof res[0] === 'object' ? JSON.stringify(res[0]) : res[0]);
                            } else {
                                this.emitEvent('error', { operation: 'GetUser', error: new Error('User not found') });
                                reject(new Error('User not found'));
                            }
                        })
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'GetUser', error: err });
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'GetUser', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('GetUser');
            }
        });
    };

    public CreateUser(token: string, user: { nom: string, prenom: string, password: string, pin?: string, rfid?: string }): Promise<Object> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'CreateUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    if( userId !== '3') {
                        return reject(new Error('Non authorized user'));
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`
                        INSERT INTO ${this.database}.${this.userTable.table} (${this.userTable.nom}, ${this.userTable.prenom}, ${this.userTable.password}, ${this.userTable.pin}, ${this.userTable.rfid})
                        VALUES (?, ?, ?, ?, ?)`, [user.nom, user.prenom, user.password, user.pin || '', user.rfid || ''])
                        .then((_res) => {
                            this.emitEvent('query', { type: 'CreateUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve({ success: true });
                        })
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'CreateUser', error: err });
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'CreateUser', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('CreateUser');
            }
        });
    };

    public DeleteUser(token: string, id: string | number): Promise<Object> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.GetUserID(token, "token").then((userId) => {
                    if (userId === undefined || userId === null || userId === '') {
                        this.emitEvent('error', { operation: 'DeleteUser', error: new Error('User not found') });
                        reject(new Error('User not found'));
                        return;
                    }
                    if( id !== '3' || userId == '3') {
                        return reject(new Error('Non authorized user'));
                    }
                    (this.pollConnexion as mariadb.PoolConnection).query(`
                        UPDATE ${this.database}.${this.userTable.table} SET
                        ${this.userTable.prenom}='',
                        ${this.userTable.nom}='',
                        ${this.userTable.password}='',
                        ${this.userTable.pin}='',
                        ${this.userTable.rfid}=''
                        
                        WHERE ${this.userTable.id} = ?`, [userId])

                        .then((_res) => {
                            this.emitEvent('query', { type: 'DeleteUser', success: true, token: token, connexion: this.pollConnexion });
                            resolve({ success: true });
                        })
                        .catch((err) => {
                            this.emitEvent('error', { operation: 'DeleteUser', error: err });
                            reject(err);
                        });
                }).catch((err) => {
                    this.emitEvent('error', { operation: 'DeleteUser', error: err });
                    reject(err);
                });
            } else {
                this.NoPoolConError('DeleteUser');
            }
        });
    };

    public Deconnexion(token: string): Promise<Object> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`DELETE FROM ${this.database}.${this.aouthTable.table} WHERE ${this.aouthTable.token} = ?`, [token])
                    .then((_res) => {
                        this.emitEvent('query', { type: 'Deconnexion', success: true, token: token, connexion: this.pollConnexion });
                        resolve({ success: true });
                    })
                    .catch((err) => {
                        this.emitEvent('error', { operation: 'Deconnexion', error: err });
                        reject(err);
                    });
            } else {
                this.NoPoolConError('Deconnexion');
            }
        });
    }

    // Closes the database connection and releases the pool connection

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

    private NoPoolConError(operation: string): DBError {
        this.emitEvent('error', { error: new Error('No pool connection'), operation: `${operation}` });
        return {
            operation: operation,
            error: new Error('No pool connection')
        };
    }
}