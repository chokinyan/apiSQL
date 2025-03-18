import mariadb from "mariadb";
import DB from "../database";

export default class User {
    //@ts-expect-error
    public nom: string;
    //@ts-expect-error
    public prenom: string;
    private database : DB;
    private token : string;

    constructor(database : DB,token : string) {
        this.token = token;
        this.database = database;
    }

}