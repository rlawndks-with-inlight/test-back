const mysql = require('mysql')

const db = mysql.createConnection({
    host : "localhost",
    user : 'root',
    password : 'qjfwk100djr!',
    port : 3306,
    database:'dalca_pay',
    timezone: 'Asia/Seoul',
    charset: 'utf8mb4'
})
db.connect();

module.exports = db;