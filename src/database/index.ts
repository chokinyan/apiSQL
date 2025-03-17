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
    prenomCollum: string;
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
    public prenomCollum: string;
    public passwordCollum: string;
    public table: TableConfig;

    constructor(config: DBConfig) {
        this.host = config.host;
        this.port = config.port;
        this.user = config.user;
        this.password = config.password;
        this.database = config.database;
        this.userCollum = config.userCollum;
        this.prenomCollum = config.prenomCollum;
        this.passwordCollum = config.passwordCollum;
        this.table = config.table;
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

    public GetUser(user: string, password: string): Promise<boolean | string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`SELECT id,prenom FROM ${this.database}.${this.table.userTable} WHERE ${this.userCollum} = ? AND ${this.passwordCollum} = ?`, [user, password])
                    .then((res) => {
                        const success = res.length === 1;
                        this.emitEvent('query', { type: 'GetUser', success: success, user: user, password: password, connexion: this.pollConnexion });
                        if (success) {
                            this.CreateAuth(res[0].id).then((token) => {
                                resolve(JSON.parse(`{"id":${res[0].id},"token":"${token}",nom:"${user}",prenom:"${res[0].prenom}"}`));
                            }).catch((err) => {
                                reject(err);
                            });
                        }
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

    private CreateAuth(userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                const token = crypto.getRandomValues(new Uint32Array(16)).join('');
                this.pollConnexion.query(`INSERT INTO ${this.database}.${this.table.aouthTable} (id_Utilisateur,token) VALUES (?,?)`, [userId, token])
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

    public Deconnexion(token: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.pollConnexion) {
                this.pollConnexion.query(`DELETE FROM ${this.database}.${this.table.aouthTable} WHERE token = ?`, [token])
                    .then((_res) => {
                        this.emitEvent('query', { type: 'Deconnexion', success: true, token: token, connexion: this.pollConnexion });
                        resolve(true);
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
}