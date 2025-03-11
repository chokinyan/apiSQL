import mariadb from "mariadb";

export type DBEventType = 'connect' | 'disconnect' | 'error' | 'query' | 'reconnect';

export interface DBEventListener {
    eventType: DBEventType;
    callback: (data: any) => void;
}

export interface TableConfig {
    userTable: string;
    aouthTable: string;
    itemTable: string;
}

export interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    userCollum: string;
    passwordCollum: string;
    table: TableConfig;
}

export default class DB {
    private pollConnexion: mariadb.PoolConnection | undefined;
    private listeners: DBEventListener[] = [];
    public host: string;
    public port: number;
    public user: string;
    public password: string;
    public database: string;
    public userCollum: string;
    public passwordCollum: string;
    public table: TableConfig;

    constructor(config: DBConfig) {
        this.host = config.host;
        this.port = config.port;
        this.user = config.user;
        this.password = config.password;
        this.database = config.database;
        this.userCollum = config.userCollum;
        this.passwordCollum = config.passwordCollum;
        this.table = config.table;
        this.Connexion().then((conn) => {
            this.pollConnexion = (conn as mariadb.PoolConnection);
            this.emitEvent('connect', { success: true, connexion: this.pollConnexion });
        }).catch((err) => {
            console.error('Database connection failed');
            this.emitEvent('error', { message: 'Connection failed', error: err });
        });
    }

    private Connexion(): Promise<mariadb.PoolConnection | void> {
        return new Promise((resolve, reject) => {
            try {
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

    public GetUser(user: string, password: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT * FROM ${this.database}.${this.table.userTable} WHERE ${this.userCollum} = ? AND ${this.passwordCollum} = ?`, [user, password])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, user: user, password: password, connexion: this.pollConnexion });
                        resolve(success);
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

    public async CloseConnexion(): Promise<void> {
        if (this.pollConnexion) {
            await this.pollConnexion.release();
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
}