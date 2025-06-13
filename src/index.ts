import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import database from './database';
import mqtt from 'mqtt';
import bodyParser, { json } from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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

let etatPorte: Array<string> = ["0", "0"];
let finCourse: Array<string> = ["0", "0"];
let finCourseFrais: Array<string> = ["0", "0"];
let temperature: Array<string> = ["0", "0"];

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
        rfid: process.env.DB_RFID_COLLUM as string
    },
    aouthTable: {
        table: process.env.DB_AOUTH_TABLE as string,
        id: process.env.DB_AOUTH_USER_COLLUM as string,
        token: process.env.DB_AOUTH_COLLUM as string
    },
    itemTable: {
        table: process.env.DB_ITEM_TABLE as string,
        id: process.env.DB_ITEM_ID_COLLUM as string,
        UserId: process.env.DB_ITEM_USER_COLLUM as string,
        name: process.env.DB_ITEM_NAME_COLLUM as string,
        container: process.env.DB_ITEM_CONTAINER_COLLUM as string,
        expire: process.env.DB_ITEM_EXPIRE_COLLUM as string,
        image: process.env.DB_ITEM_IMAGEURL_COLLUM as string
    }
});

const mqttClient = mqtt.connect({
    host: process.env.MQTT_HOST as string,
    port: process.env.MQTT_PORT as unknown as number,
    username: process.env.MQTT_USER as string,
    password: process.env.MQTT_PASSWORD as string,
    protocol: "mqtt"
});

const app = express();
const portHttps = 3001;
const portHttp = 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 100 requests per windowMs
    message: base64Encoding("{error : Too many requests}"),
});

//app.use((req, res,next)=> {
//    if (req.headers['x-forwarded-proto'] !== 'https') {
//        res.redirect('https://' + req.headers.host + req.originalUrl);
//    }
//    next();
//});
app.use(limiter);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(helmet());

const option: https.ServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '../certificat/localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certificat/localhost.crt')),
};

/* API */

app.get('/FinCourse', (_req: Request, res: Response) => {
    if (!mqttClient.connected) {
        res.status(500).json({ error: "MQTT not connected" });
        return;
    }
    res.status(200).json({ etat: finCourse });
});

app.get('/Temperature', (req: Request, res: Response) => {
    if (!mqttClient.connected) {
        res.status(500).json({ error: "MQTT not connected" });
        return;
    }

    const params = req.query;

    if (params && params.token) {
        db.GetUserID(params.token as string, "token").then((id) => {
            try {
                res.status(200).json({ temperature: temperature[Number(id) - 1] });
            }
            catch {
                res.status(400).json({ error: "error wrong user temperature" })
            }
        })
    }

});

app.route('/User')
    .get((req: Request, res: Response) => {
        const params = req.query;
        if (params && params.token) {
            db.GetUserInfo(params.token as string, params.id as string | number).then((data) => {
                if (data) {
                    res.status(200).json(data);
                } else {
                    res.status(404).json({ error: "User not found" });
                }
            }).catch((_err) => {
                res.status(500).json({ error: "Error" });
            });
        } else {
            res.status(400).json({ error: "Missing token" });
        }
    })
    .post((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json({ error: "Not JSON" });
                return;
            }

            if (!req.body) {
                res.status(400).json({ error: "Empty body" });
                return;
            }

            const body = req.body;
            if (body && body.token && body.name && body.password && body.pin && body.rfid) {
                db.CreateUser(body.token, {
                    nom: body.name,
                    prenom: body.prenom,
                    password: body.password,
                    pin: body.pin,
                    rfid: body.rfid
                }).then((data) => {
                    res.status(200).json(data);
                }).catch((_err) => {
                    res.status(500).json({ error: "Error" });
                });
            } else {
                res.status(400).json({ error: "Missing token or name or password" });
            }
        }
        catch (err) {
            res.status(500).json({ error: "Error" });
        }
    })
    .delete((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json({ error: "Not JSON" });
                return;
            }

            if (!req.body) {
                res.status(400).json({ error: "Empty body" });
                return;
            }

            const body = req.body;
            if (body && body.token && body.id) {
                db.DeleteUser(body.token, body.id).then((data) => {
                    res.status(200).json(data);
                }).catch((_err) => {
                    res.status(500).json({ error: "Error" });
                });
            } else {
                res.status(400).json({ error: "Missing token or id" });
            }
        }
        catch (err) {
            res.status(500).json({ error: "Error" });
        }
    });

app.route('/Item')
    .get((req: Request, res: Response) => {
        const params = req.query;

        if (params && params.token) {
            db.GetItemByUser(params.token as string, params.compartiement as string).then((data) => {
                res.status(200).json({
                    result: data
                });
            }).catch((_err) => {
                res.status(500).json({ error: "Error" });
            });
        } else {
            res.status(400).json({ error: "Missing token" });
        }
    })
    .post((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json({ error: "Not JSON" });
                return;
            }

            if (!req.body) {
                res.status(400).json({ error: "Empty body" });
                return;
            }

            const body = req.body;
            if (body && body.token && body.name && body.container) {
                db.PutItemByUser(body.token, {
                    name: body.name,
                    container: body.container,
                    expire: body.expire,
                    image: body.image
                }).then((data) => {
                    res.status(200).json(data);
                }).catch((_err) => {
                    res.status(500).json({ error: "Error" });
                });
            } else {
                res.status(400).json({ error: "Missing token or name or container" });
            }
        }
        catch (err) {
            res.status(500).json({ error: "Error" });
        }
    })
    .delete((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json({ error: "Not JSON" });
                return;
            }

            if (!req.body) {
                res.status(400).json({ error: "Empty body" });
                return;
            }

            const body = req.body;
            if (body && body.token && body.id) {
                db.DeleteItemByUser(body.token, body.id).then((data) => {
                    res.status(200).json(data);
                }).catch((_err) => {
                    res.status(500).json({ error: "Error" });
                });
            } else {
                res.status(400).json({ error: "Missing token or id" });
            }
        }
        catch (err) {
            res.status(500).json({ error: "Error" });
        }
    }
    );

app.route('/Authentification')
    .post((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json({ error: "Not JSON" });
                return;
            }

            if (!req.body) {
                res.status(400).json({ error: "Empty body" });
                return;
            }

            const body = req.body;
            switch (body.action) {
                case "login":
                    if (body && body.user && body.password) {
                        db.UserConnexion({ name: body.user, password: body.password }, "password").then((data) => {
                            res.status(200).json(data);
                        }).catch((_err) => {
                            res.status(500).json({ error: "Error" });
                        });
                    } else {
                        res.status(500).json({ error: "Missing user or password" });
                    }
                    break;
                case "pin":
                    if (body && body.code && /^[0-9]{4}$/.test(body.code)) {
                        db.UserConnexion(body.code, "pin").then((data) => {
                            res.status(200).json(data);
                        }).catch((_err) => {
                            res.status(500).json("{error : Error}");
                        });
                    } else {
                        res.status(400).json("{error : Missing pin}");
                    }
                    break;
                case "visage":
                    if (body && body.visage) {
                        db.UserConnexion(body.visage, "visage").then((data) => {
                            res.status(200).json(data);
                        }).catch((_err) => {
                            res.status(500).json("{error : Error}");
                        });
                    } else {
                        res.status(400).json("{error : Missing visage data}");
                    }
                    break;
                case "rfid":
                    if (body && body.rfid) {
                        db.UserConnexion(body.rfid, "rfid").then((data) => {
                            res.status(200).json(data);
                        }).catch((_err) => {
                            res.status(500).json("{error : Error}");
                        });
                    } else {
                        res.status(400).json({ error: "Missing rfid" });
                    }
                    break;
                default:
                    res.status(400).json({ error: "Missing action" });
                    break;
            }
        }
        catch (err) {
            res.status(500).json({ error: "Error" });
        }
    })
    .delete((req: Request, res: Response) => {
        if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
            res.status(400).json("{error : Not JSON}");
            return;
        }

        if (!req.body) {
            res.status(400).json("{error : Empty body}");
            return;
        }

        if (!req.body.token) {
            res.status(400).json("{error : Missing token}");
            return;
        }

        db.Deconnexion(req.body.token).then((data) => {
            res.status(200).json(data);
        }).catch((_err) => {
            res.status(500).json("{error : Error}");
        });
    });

app.route('/EtatPorte')
    .post((req: Request, res: Response) => {
        try {
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
                res.status(400).json("{error : Not JSON}");
                return;
            }
            if (!req.body) {
                res.status(400).json("{error : Empty body}");
                return;
            }
            if (!mqttClient.connected) {
                res.status(500).json("{error: MQTT not connected}");
                return;
            }

            const body = req.body;
            if (body && (typeof body.etat === 'string' || typeof body.etat === 'number') && /^[0-1]$/.test(String(body.etat))) {
                db.GetUserID(body.token as string, "token").then((id) => {
                    let user: string = "";
                    if (id == "1") {
                        user = process.env.MQTT_TOPIC_ETAT_LOCK_UU as string;
                    }
                    else if (id == "2") {
                        user = process.env.MQTT_TOPIC_ETAT_LOCK_UD as string;
                    }

                    mqttClient.publish(user, `${body.etat}`);
                    res.status(200).json({ etat: body.etat, user: id });
                })
            } else {
                res.status(400).json("{error : Missing etat}");
            }
        }
        catch (_err) {
            res.status(500).json("{error : Error}");
        }
    })
    .get((_req: Request, res: Response) => {
        if (!mqttClient.connected) {
            res.status(500).json("{error: MQTT not connected}");
            return;
        }
        res.status(200).json({ etat: etatPorte });
    });

app.get('/alerte', (_req: Request, res: Response) => {
    db.VerifPeremption().then((value) => {
        res.status(200).send(value);
    })
});

/* Database */
db.on('error', (data) => {
    console.error(data);
});

/* MQTT */
mqttClient.on('message', (topic, payload, _packet) => {
    //console.log(topic);
    switch (topic) {
        case process.env.MQTT_TOPIC_ETAT_LOCK_UU:
            etatPorte[0] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_ETAT_LOCK_UD:
            etatPorte[1] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_FIN_COURSE_UU:
            finCourse[0] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_FIN_COURSE_UD:
            finCourse[1] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UU:
            finCourseFrais[0] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UD:
            finCourseFrais[1] = payload.toString() === "1" ? "1" : "0";
            break;
        case process.env.MQTT_TOPIC_TEMP_UU:
            temperature[0] = payload.toString();
            break;
        case process.env.MQTT_TOPIC_TEMP_UD:
            temperature[1] = payload.toString();
            break;
        default:
            console.log("Error: Invalid topic");
            break;
    }
});

mqttClient.on("error", (err) => {
    console.log(err);
    mqttClient.reconnect();
});

/* Start */
console.log(`Database is running at ${process.env.DB_HOST}:${process.env.DB_PORT}`);

http.createServer(app).listen(portHttp, () => {
    console.log(`Server is running at http://localhost:${portHttp}`);
});

https.createServer(option, app).listen(portHttps, () => {
    console.log(`Server is running at https://localhost:${portHttps}`);
});

mqttClient.subscribe([process.env.MQTT_TOPIC_ETAT_LOCK_UU, process.env.MQTT_TOPIC_ETAT_LOCK_UD] as Array<string>, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + [process.env.MQTT_TOPIC_ETAT_LOCK_UU, process.env.MQTT_TOPIC_ETAT_LOCK_UD]);
});

mqttClient.subscribe([process.env.MQTT_TOPIC_FIN_COURSE_UU, process.env.MQTT_TOPIC_FIN_COURSE_UD] as Array<string>, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + [process.env.MQTT_TOPIC_FIN_COURSE_UU, process.env.MQTT_TOPIC_FIN_COURSE_UD]);
});

mqttClient.subscribe([process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UU, process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UD] as Array<string>, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + [process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UU, process.env.MQTT_TOPIC_FIN_COURSE_FRAIS_UD]);
});

mqttClient.subscribe([process.env.MQTT_TOPIC_TEMP_UU, process.env.MQTT_TOPIC_TEMP_UD] as Array<string>, (err, _grant, _packet) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribe to topic: " + [process.env.MQTT_TOPIC_TEMP_UU, process.env.MQTT_TOPIC_TEMP_UD]);
});