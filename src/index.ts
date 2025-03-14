import express from 'express';
import database from './database';
import user from './user';

const db = new database({
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT as string),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    userCollum: process.env.DB_USER_COLLUM as string,
    passwordCollum: process.env.DB_PASSWORD_COLLUM as string,
    table: {
        userTable: process.env.DB_USER_TABLE as string,
        aouthTable: process.env.DB_AOUTH_TABLE as string,
        itemTable: process.env.DB_ITEM_TABLE as string,
    }
});

const app = express();
const port = 3000;

const connectedUsers : Array<user> = [];

/* API */

app.get('/Connect', (req, res) => {
    if(req.query.user && req.query.password) {
        db.GetUser(req.query.user as string, req.query.password as string).then((data) => {
            res.send(data);
        }).catch((_err) => {
            res.send("Error");
        });
    }
});




db.on('connect', () => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});