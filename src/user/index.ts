import mariadb from "mariadb";
import DB from "../database";

export default class User {
    //@ts-expect-error
    public nom: string;
    //@ts-expect-error
    public prenom: string;
    private database : DB;
    private idUser : number;

    constructor(database : DB,id : number) {
        this.idUser = id;
        this.database = database;
    }

}