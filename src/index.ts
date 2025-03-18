import express, { Request, Response } from 'express';
import database from './database';


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
        container: process.env.DB_ITEM_CONTAINER_COLLUM as string,
        expire: process.env.DB_ITEM_EXPIRE_COLLUM as string
    }
});

const app = express();
const port = 3000;

/* API */
app.post('/Authentification', (req: Request, res: Response) => {
    try {
        if (req.headers['content-type'] !== "application/json" || !req.headers['content-type']) {
            res.status(200).send("Not JSON");
            return;
        }
        req.on('data', (data) => {
            try{
                JSON.parse(data.toString());
            }
            catch(err){
                res.status(200).send("Error");
                return;
            }
            const body = JSON.parse(data.toString());
            console.log(body);
            switch (body.action) {
                case "login":
                    if (body && body.user && body.password) {
                        db.GetUser(body.user, body.password).then((data) => {
                            res.status(200).send(JSON.stringify(data));
                        }).catch((_err) => {
                            res.status(200).send("Error");
                        });
                    } else {
                        res.status(200).send("Missing user or password");
                    }
                    break;
                case "pin":
                    if (body && body.code) {
                        db.GetUserByPin(body.code).then((data) => {
                            res.status(200).send(JSON.stringify(data));
                        }).catch((_err) => {
                            res.status(200).send("Error");
                        });
                    } else {
                        res.status(200).send("Missing code");
                    }
                    break;
                case "visage":
                    if (body && body.visage) {
                        db.GetUserByVisage(body.visage).then((data) => {
                            res.status(200).send(JSON.stringify(data));
                        }).catch((_err) => {
                            res.status(200).send("Error");
                        });
                    } else {
                        res.status(200).send("Missing visage data");
                    }
                    break;
                case "rfid":
                    if (body && body.rfid) {
                        db.GetUserByRfid(body.rfid).then((data) => {
                            res.status(200).send(JSON.stringify(data));
                        }).catch((_err) => {
                            res.status(200).send("Error");
                        });
                    } else {
                        res.status(200).send("Missing rfid");
                    }
                    break;
                default:
                    res.status(200).send("Error: Invalid action");
                    break;
            }
        });
    } catch (err) {
        res.status(200).send("Error");
    }
});

app.delete('/Authentification', (req: Request, res: Response) => {
    req.on('data', (data) => {
        try {
            const body = JSON.parse(data.toString());
            if (body && body.token) {
                db.Deconnexion(body.token).then((data) => {
                    res.status(200).send(data);
                }).catch((_err) => {
                    res.status(200).send("Error");
                });
            } else {
                res.status(200).send("Missing token");
            }
        } catch (err) {
            res.status(200).send("Error");
        }
    });
});

app.get('/Item', (req: Request, res: Response) => {
    const params = req.query;
    if (params && params.token) {
        db.GetItemByUser(params.token as string).then((data) => {
            res.status(200).send(JSON.stringify(data));
        }).catch((_err) => {
            res.status(200).send("Error");
        });
    } else {
        res.status(200).send("Missing token");
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