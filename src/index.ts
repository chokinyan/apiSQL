import express from 'express';
import database from './database';
import user from './user';


const db: database = new database({
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT as string),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    userTable: {
        table: process.env.DB_USER_TABLE as string,
        id: process.env.DB_USER_ID_COLLUM as string,
        nom: process.env.DB_USER_NAME_COLLUM as string,
        prenom: process.env.DB_PASSWORD_COLLUM as string,
        password: process.env.DB_PASSWORD_COLLUM as string,
        pin: process.env.DB_PIN_COLLUM as string,
        rfid: process.env.DB_RFID_COLLUM as string,
        visage: process.env.DB_VISAGE_COLLUM as string
    },
    aouthTable: {
        table: process.env.DB_AOUTH_TABLE as string,
        id: process.env.DB_AOUTH_USER_COLLUM as string,
        token: process.env.DB_AOUTH_COLLUM as string
    },
    itemTable: {
        table: process.env.DB_ITEM_TABLE as string,
        id: process.env.DB_ITEM_USER_COLLUM as string,
        name: process.env.DB_ITEM_NAME_COLLUM as string,
        expire: process.env.DB_ITEM_EXPIRE_COLLUM as string
    }
});

const app = express();
const port = 3000;

const connectedUsers: Array<user> = [];

/* API */

app.post('/Authantication', (req, res) => {
    try {
        const body = JSON.parse(req.body);
        switch (body.action) {
            case "login":
                if (body && body.user && body.password) {
                    db.GetUser(body.user, body.password).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            case "pin":
                if (body && body.code) {
                    db.GetUserByPin(body.code).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            case "visage":
                if(body && body.visage){
                    db.GetUserByVisage(body.visage).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            case "rfid":
                if(body && body.rfid){
                    db.GetUserByRfid(body.rfid).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            default:
                res.send("Error");
                break;
        }

    } catch (err) {
        res.send("Error");
    }
});

app.delete('/Authantication', (req, res) => {
    try {
        const token = JSON.parse(req.body);
        if (token.token) {
            db.Deconnexion(token.token).then((data) => {
                res.send(data);
            }).catch((_err) => {
                res.send("Error");
            });
        }
    }
    catch (err) {
        res.send("Error");
    }
});

db.on('error', (data) => {
    console.error(data);
});

db.on('connect', () => {
    console.log("connecter");
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});