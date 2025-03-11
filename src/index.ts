import express from 'express';
import database from './database';


const db = new database({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'raspberry',
    database: 'test',
    userCollum: 'username',
    passwordCollum: 'password',
    table: 'users',
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