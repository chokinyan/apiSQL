import express from 'express';
import database from './database';
import user from './user';


const db: database = new database({
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT as string),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    userCollum: process.env.DB_USER_NAME_COLLUM as string,
    prenomCollum: process.env.DB_USER_COLLUM as string,
    passwordCollum: process.env.DB_PASSWORD_COLLUM as string,
    table: {
        userTable: process.env.DB_USER_TABLE as string,
        aouthTable: process.env.DB_AOUTH_TABLE as string,
        itemTable: process.env.DB_ITEM_TABLE as string,
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
                if (body && body.user && body.password) {
                    db.GetUser(body.user, body.password).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            case "visage":
                if (body && body.user && body.password) {
                    db.GetUser(body.user, body.password).then((data) => {
                        res.send(data);
                    }).catch((_err) => {
                        res.send("Error");
                    });
                }
                break;
            case "rfid":
                if (body && body.user && body.password) {
                    db.GetUser(body.user, body.password).then((data) => {
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
        const body = JSON.parse(req.body);
        if (body && body.user && body.password) {
            db.GetUser(body.user, body.password).then((data) => {
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