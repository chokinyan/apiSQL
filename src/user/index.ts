import mariadb from "mariadb";
import DB from "../database";

function generateRandomString(length : number) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export default class User {
    //@ts-expect-error
    public nom: string;
    //@ts-expect-error
    public prenom: string;
    private Aouth : string;
    private database : DB;
    private idUser : number;

    constructor(database : DB,id : number) {
        this.idUser = id;
        this.database = database;
        this.Aouth = generateRandomString(50);
        this.CreateAuth();
    }

    private CreateAuth() : Promise<void> {
        return new Promise((resolve, reject) => {
            if(this.database.GetPollConnexion() !== undefined) {
                (this.database.GetPollConnexion() as mariadb.PoolConnection).query(`INSERT INTO ${this.database.table.aouthTable} (id_user, oauth_code) VALUES (${this.idUser}, '${this.Aouth}')`).then(() => {
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            } else {
                reject("No connection");
            }
        });
    }



}