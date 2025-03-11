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
    public nom: string;
    public prenom: string;
    private Aouth : string;
    private database : DB;

    constructor(database : DB) {
        this.database = database;
        this.nom = "";
        this.prenom = "";
        this.Aouth = "Bearer";
    }
}