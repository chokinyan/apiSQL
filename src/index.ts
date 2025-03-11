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
    table: process.env.DB_TABLE as string,
});

const app = express();
const port = 3000;

app.post('/Connect', (req, res) => {
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