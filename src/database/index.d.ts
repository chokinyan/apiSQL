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
    constructor(config: DBConfig);

    public host: string;
    public port: number;
    public user: string;
    public password: string;
    public database: string;
    public userCollum: string;
    public passwordCollum: string;
    public table: string;

    private Connexion(): Promise<mariadb.PoolConnection | void>;
    public Reconnect(): void;
    public GetUser(user: string, password: string): void;
    public CloseConnexion(): Promise<void>;
    public GetPollConnexion(): mariadb.PoolConnection | undefined;


    public on(event: DBEventType, callback: (data: any) => void): this;
    public on(event: "connect", callback: (data: { success: boolean, connexion: mariadb.PoolConnection }) => void): this;
    public on(event: "disconnect", callback: (data: { success: boolean }) => void): this;
    public on(event: "error", callback: (data: { message: string, error: any }) => void): this;
    public on(event: "query", callback: (data: { query: string }) => void): this;
    public on(event: "reconnect", callback: () => void): this;

    public addListener(event: DBEventType, callback: (data: any) => void): this;
    public addListener(event: "connect", callback: (data: { success: boolean, connexion: mariadb.PoolConnection }) => void): this;
    public addListener(event: "disconnect", callback: (data: { success: boolean }) => void): this;
    public addListener(event: "error", callback: (data: { message: string, error: any }) => void): this;
    public addListener(event: "query", callback: (data: { type: string, success: boolean, user: string, password: string, connexion: mariadb.PoolConnection }) => void): this;
    public addListener(event: "reconnect", callback: () => void): this;
}
