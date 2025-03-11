export default class User {
    public nom: string;
    public prenom: string;
    private Aouth : string;

    constructor(nom: string, prenom: string) {
        this.nom = nom;
        this.prenom = prenom;
        this.Aouth = "Bearer";
    }
}