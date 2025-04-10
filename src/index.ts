import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import database from './database';
import mqtt from 'mqtt';
import bodyParser from 'body-parser';
import helmet from 'helmet';

let finCourseConnected: boolean = false;
let etatPorteConnected: boolean = false;

let etatPorte: string = "0";
let finCourse: string = "0";

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
        prenom: process.env.DB_USER_COLLUM as string,
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

const mqttClient = mqtt.connect(process.env.MQTT_HOST as string, {
    port: process.env.MQTT_PORT as unknown as number,
    username: process.env.MQTT_USER as string,
    password: process.env.MQTT_PASSWORD as string,
});

const app = express();
const portHttps = 3001;
const portHttp = 3000;

app.use(bodyParser.json());
app.use(helmet());

const option: https.ServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '../certificat/localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certificat/localhost.crt')),
};

const base64Encoding = (data: string | Object, isJson: boolean = false) => {
    if (isJson && typeof data === 'object') {
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }
    return Buffer.from(data as string).toString('base64');
}

const base64Decoding = (data: string, isJson: boolean = false) => {
    if (isJson) {
        return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    }
    return Buffer.from(data, 'base64').toString('utf-8');
}

/* API */

app.get('/Item', (req: Request, res: Response) => {
    const params = req.query;
    if (params && params.token) {
        db.GetItemByUser(params.token as string).then((data) => {
            res.status(200).send(base64Encoding(data, true));
        }).catch((_err) => {
            res.status(404).send(base64Encoding("{error : Error}"));
        });
    } else {
        res.status(401).send(base64Encoding("{error : Missing token}"));
    }

});

app.get('/FinCourse', (_req: Request, res: Response) => {
    if (!finCourseConnected) {
        res.status(404).send(base64Encoding("{error: MQTT not connected}"));
        return;
    }
    res.status(200).send(base64Encoding({ etat: finCourse }, true));
});

app.route('/Authentification')
    .post((req: Request, res: Response) => {
        try {
            if (req.headers['content-type'] !== "application/json" || !req.headers['content-type']) {
                res.status(404).send("{error : Not JSON}");
                return;
            }
            req.on('data', (data) => {
                try {
                    JSON.parse(data.toString());
                }
                catch (err) {
                    res.status(404).send(base64Encoding("{error : Error}"));
                    return;
                }
                const body = JSON.parse(data.toString());
                switch (body.action) {
                    case "login":
                        if (body && body.user && body.password) {
                            db.GetUser(body.user, body.password).then((data) => {
                                res.status(200).send(base64Encoding(data, true));
                            }).catch((_err) => {
                                res.status(404).send(base64Encoding("{error : Error}"));
                            });
                        } else {
                            res.status(404).send(base64Encoding("{error : Missing user or password}"));
                        }
                        break;
                    case "pin":
                        if (body && body.code) {
                            db.GetUserByPin(body.code).then((data) => {
                                res.status(200).send(base64Encoding(data, true));
                            }).catch((_err) => {
                                res.status(404).send(base64Encoding("{error : Error}"));
                            });
                        } else {
                            res.status(404).send(base64Encoding("{error : Missing pin}"));
                        }
                        break;
                    case "visage":
                        if (body && body.visage) {
                            db.GetUserByVisage(body.visage).then((data) => {
                                res.status(200).send(base64Encoding(data, true));
                            }).catch((_err) => {
                                res.status(404).send(base64Encoding("{error : Error}"));
                            });
                        } else {
                            res.status(404).send(base64Encoding("{error : Missing visage data}"));
                        }
                        break;
                    case "rfid":
                        if (body && body.rfid) {
                            db.GetUserByRfid(body.rfid).then((data) => {
                                res.status(200).send(base64Encoding(data, true));
                            }).catch((_err) => {
                                res.status(404).send(base64Encoding("{error : Error}"));
                            });
                        } else {
                            res.status(404).send(base64Encoding("{error : Missing rfid}"));
                        }
                        break;
                    default:
                        res.status(404).send(base64Encoding("{error : Missing action}"));
                        break;
                }
            });
        }
        catch (err) {
            res.status(404).send(base64Encoding("{error : Error}"));
        }
    })
    .delete((req: Request, res: Response) => {
        req.on('data', (data) => {
            try {
                const body = JSON.parse(data.toString());
                if (body && body.token) {
                    db.Deconnexion(body.token).then((data) => {
                        res.status(200).send(base64Encoding(data, true));
                    }).catch((_err) => {
                        res.status(404).send(base64Encoding("{error : Error}"));
                    });
                } else {
                    res.status(404).send(base64Encoding("{error : Missing token}"));
                }
            } catch (err) {
                res.status(404).send(base64Encoding("{error : Error}"));
            }
        });
    });

app.route('/EtatPorte')
    .post((req: Request, res: Response) => {
        try {
            if (req.headers['content-type'] !== "application/json" || !req.headers['content-type']) {
                res.status(404).send(base64Encoding("{error : Not JSON}"));
                return;
            }
            req.on('data', (data) => {
                try {
                    JSON.parse(data.toString());
                }
                catch (err) {
                    res.status(404).send(base64Encoding("{error : Error}"));
                    return;
                }
                const body = JSON.parse(data.toString());
                if (body && body.etat && etatPorteConnected) {
                    mqttClient.publish(process.env.MQTT_TOPIC_ETAT_LOCK as string, body.etat);
                    res.status(200).send(base64Encoding({ etat: body.etat }, true));
                } else {
                    res.status(404).send(base64Encoding("{error : Missing etat}"));
                }
            });
        }
        catch (err) {
            res.status(404).send(base64Encoding("{error : Error}"));
        }
    })
    .get((_req: Request, res: Response) => {
        if (!etatPorteConnected) {
            res.status(404).send(base64Encoding("{error: MQTT not connected}"));
            return;
        }
        res.status(200).send(base64Encoding({ etat: etatPorte }, true));
    });

/* Database */
db.on('error', (data) => {
    console.error(data);
});

/* MQTT */

mqttClient.on('message', (topic, payload, _packet) => {
    switch (topic) {
        case process.env.MQTT_TOPIC_ETAT_LOCK:
            etatPorte = payload.toString() == "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_FIN_COURSE:
            finCourse = payload.toString() == "1" ? "1" : "0";
            break;
        default:
            console.log("Error: Invalid topic");
            break;
    }
});

/* Start */
while (!db.IsConnect() && !mqttClient.connected) {
    console.log("Waiting for connection");
}
console.log(`Database is running at ${process.env.DB_HOST}:${process.env.DB_PORT}`);

http.createServer(app).listen(portHttp, () => {
    console.log(`Server is running at http://localhost:${portHttp}`);
});

https.createServer(option, app).listen(portHttps, () => {
    console.log(`Server is running at https://localhost:${portHttps}`);
});

mqttClient.subscribe(process.env.MQTT_TOPIC_ETAT_LOCK as string, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + process.env.MQTT_TOPIC_ETAT_LOCK);
    etatPorteConnected = true;
});
mqttClient.subscribe(process.env.MQTT_TOPIC_FIN_COURSE as string, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + process.env.MQTT_TOPIC_FIN_COURSE);
    finCourseConnected = true;
});