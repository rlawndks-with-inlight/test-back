const fs = require('fs')
const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');
const port = 8001;
app.use(cors());
require('dotenv').config()
const im = require('imagemagick');
const sharp = require('sharp')
//passport, jwt
const jwt = require('jsonwebtoken')

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
//multer
const { upload } = require('./config/multerConfig')
//express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(passport.initialize());
// app.use(passport.session());
// passportConfig(passport);
const schedule = require('node-schedule');
const { swaggerUi, specs }  = require('./swagger/swagger');
const path = require('path');
const { getItem } = require('./routes/common')
app.set('/routes', __dirname + '/routes');
app.use('/config', express.static(__dirname + '/config'));
//app.use('/image', express.static('./upload'));
app.use('/image', express.static(__dirname + '/image'));
app.use('/public/css', express.static('public/css'));
app.use('/api', require('./routes/router'))
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

swaggerUi.setup(specs, { customCssUrl: CSS_URL })
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

app.get('/', (req, res) => {
        console.log("back-end initialized")
        res.send('back-end initialized')
});
const is_test = true;
app.connectionsN = 0;
const HTTP_PORT = 8001;
const HTTPS_PORT = 8443;

let server = undefined
if (is_test) {
        server = http.createServer(app).listen(HTTP_PORT, function () {
                console.log("Server on " + HTTP_PORT)
                //scheduleSystem();
        });

} else {
        const options = { // letsencrypt로 받은 인증서 경로를 입력해 줍니다.
                ca: fs.readFileSync("/etc/letsencrypt/live/purplevery19.cafe24.com/fullchain.pem"),
                key: fs.readFileSync("/etc/letsencrypt/live/purplevery19.cafe24.com/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/purplevery19.cafe24.com/cert.pem")
        };
        server = https.createServer(options, app).listen(HTTPS_PORT, function () {
                console.log("Server on " + HTTPS_PORT);
                scheduleSystem();
        });

}

app.get('/', (req, res) => {
        res.json({ message: `Server is running on port ${req.secure ? HTTPS_PORT : HTTP_PORT}` });
});
