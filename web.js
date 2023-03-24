const fs = require('fs')
const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const db = require('./config/db')
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
const { checkLevel, logRequestResponse, isNotNullOrUndefined,
        namingImagesPath, nullResponse, lowLevelResponse, response,
        returnMoment, sendAlarm, categoryToNumber, tooMuchRequest,
        getEnLevelByNum } = require('./util')
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

const path = require('path');
const { insertQuery } = require('./query-util')
const { getItem } = require('./routes/common')
app.set('/routes', __dirname + '/routes');
app.use('/config', express.static(__dirname + '/config'));
//app.use('/image', express.static('./upload'));
app.use('/image', express.static(__dirname + '/image'));
app.use('/api', require('./routes/router'))

app.get('/', (req, res) => {
        console.log("back-end initialized")
        res.send('back-end initialized')
});
const is_test = true;
app.connectionsN = 0;
const HTTP_PORT = 8001;
const HTTPS_PORT = 8443;


const dbQueryList = (sql, list) => {
        return new Promise((resolve, reject) => {
                db.query(sql, list, (err, result, fields) => {
                        if (err) {
                                console.log(sql)
                                console.log(err)
                                reject({
                                        code: -200,
                                        result: result
                                })
                        }
                        else {
                                resolve({
                                        code: 200,
                                        result: result
                                })
                        }
                })
        })
}

let time = new Date(returnMoment()).getTime();
let overFiveTime = new Date(returnMoment());
overFiveTime.setMinutes(overFiveTime.getMinutes() + 5)
overFiveTime = overFiveTime.getTime();

const scheduleSystem = () => {
        let use_alarm = false;
        let use_create_pay = true;
        schedule.scheduleJob('0 0/1 * * * *', async function () {
                let return_moment = returnMoment()
                console.log(return_moment)
                if (use_alarm) {
                        let date = return_moment.substring(0, 10);
                        let dayOfWeek = new Date(date).getDay()
                        let result = await dbQueryList(`SELECT * FROM alarm_table WHERE ((DATEDIFF(?, start_date) >= 0 AND days LIKE '%${dayOfWeek}%' AND type=1) OR ( start_date=? AND type=2 )) AND STATUS=1`, [date, date]);
                        if (result.code > 0) {
                                let list = [...result.result];
                                for (var i = 0; i < list.length; i++) {
                                        let time = new Date(return_moment).getTime();
                                        let overFiveTime = new Date(return_moment);
                                        overFiveTime.setMinutes(overFiveTime.getMinutes() + 1)
                                        overFiveTime = overFiveTime.getTime();

                                        let item_time = new Date(return_moment.substring(0, 11) + list[i].time).getTime();

                                        if (item_time >= time && item_time < overFiveTime) {
                                                sendAlarm(list[i].title, list[i].note, "alarm", list[i].pk, list[i].url);
                                                insertQuery("INSERT INTO alarm_log_table (title, note, item_table, item_pk, url) VALUES (?, ?, ?, ?, ?)", [list[i].title, list[i].note, "alarm", list[i].pk, list[i].url])
                                        }
                                }
                        }
                }
                if (use_create_pay) {
                        if (return_moment.includes('00:00:00')) {//매일 00시
                                let return_moment_list = return_moment.substring(0, 10).split('-');
                                let pay_day = parseInt(return_moment_list[2]);

                                let contracts = await dbQueryList(`SELECT * FROM v_contract`);
                                contracts = contracts?.result;

                                let pays = await dbQueryList(`SELECT contract_pk, MAX(day) as max_day FROM v_pay WHERE pay_category=0 group by contract_pk`);
                                pays = pays?.result;
                                let pay_obj = {};
                                for (var i = 0; i < pays.length; i++) {
                                        pay_obj[`${pays[i]?.contract_pk}-${pays[i]?.max_day}`] = true;
                                }
                                let pay_list = [];
                                for (var i = 0; i < contracts.length; i++) {
                                        if (contracts[i]?.pay_day == pay_day && !pay_obj[`${contracts[i]?.pk}-${return_moment.substring(0, 10)}`]) {
                                                pay_list.push(
                                                        [
                                                                contracts[i][`${getEnLevelByNum(0)}_pk`],
                                                                contracts[i][`${getEnLevelByNum(5)}_pk`],
                                                                contracts[i][`${getEnLevelByNum(10)}_pk`],
                                                                contracts[i][`monthly`],
                                                                0,
                                                                0,
                                                                contracts[i][`pk`],
                                                                return_moment.substring(0, 10)
                                                        ]
                                                )
                                        }
                                }
                                if (pay_list.length > 0) {
                                        let result = await insertQuery(`INSERT pay_table (${getEnLevelByNum(0)}_pk, ${getEnLevelByNum(5)}_pk, ${getEnLevelByNum(10)}_pk, price, pay_category, status, contract_pk, day) VALUES ?`, [pay_list]);
                                }

                        }
                }
        })

}

let server = undefined
if (is_test) {
        server = http.createServer(app).listen(HTTP_PORT, function () {
                console.log("Server on " + HTTP_PORT)
                scheduleSystem();
        });

} else {
        const options = { // letsencrypt로 받은 인증서 경로를 입력해 줍니다.
                ca: fs.readFileSync("/etc/letsencrypt/live/dalcapay.com/fullchain.pem"),
                key: fs.readFileSync("/etc/letsencrypt/live/dalcapay.com/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/dalcapay.com/cert.pem")
        };
        server = https.createServer(options, app).listen(HTTPS_PORT, function () {
                console.log("Server on " + HTTPS_PORT);
                scheduleSystem();
        });

}
server.on('connection', function (socket) {
        // Increase connections count on newly estabilished connection
        app.connectionsN++;

        socket.on('close', function () {
                // Decrease connections count on closing the connection
                app.connectionsN--;
        });
});
const resizeFile = async (path, filename) => {
        try {
                // await sharp(path + '/' + filename)
                //         .resize(64, 64)
                //         .jpeg({quality:100})
                //         .toFile(path + '/' + filename.substring(3, filename.length))
                //        await fs.unlink(path + '/' + filename, (err) => {  // 원본파일 삭제 
                //                 if (err) {
                //                     console.log(err)
                //                     return
                //                 }
                //             })
                fs.rename(path + '/' + filename, path + '/' + filename.replaceAll('!@#', ''), function (err) {
                        if (err) throw err;
                        console.log('File Renamed!');
                });
        } catch (err) {
                console.log(err)
        }
}
// fs.readdir('./image/profile', async (err, filelist) => {
//         if (err) {
//                 console.log(err);
//         } else {
//                 for (var i = 0; i < filelist.length; i++) {
//                         if (filelist[i].includes('!@#')) {
//                                 await resizeFile('./image/profile', filelist[i]);
//                         }
//                 }
//         }
// });

// Default route for server status

app.get('/api/item', async (req, res) => {
        try {
                // if (tooMuchRequest(app.connectionsN)) {
                //          return response(req, res, -120, "접속자 수가 너무많아 지연되고있습니다.(잠시후 다시 시도 부탁드립니다.)", [])
                //  }
                let table = req.query.table ?? "user";
                //console.log(table)
                const pk = req.query.pk ?? 0;
                const permission_list = ['setting', 'notice', 'master', 'academy_category', 'review'];
                let whereStr = " WHERE pk=? ";
                const decode = checkLevel(req.cookies.token, 0)
                if ((!decode || decode?.user_level == -10) && !permission_list.includes(table)) {
                        return response(req, res, -150, "권한이 없습니다.", []);
                }
                if (table == 'master') {
                        table = 'user';
                }
                if (table == "setting") {
                        whereStr = "";
                }

                let sql = `SELECT * FROM ${table}_table ` + whereStr;

                if (req.query.views) {
                        db.query(`UPDATE ${table}_table SET views=views+1 WHERE pk=?`, [pk], (err, result_view) => {
                                if (err) {
                                        console.log(err)
                                        return response(req, res, -200, "서버 에러 발생", []);
                                }
                        })
                }
                db.query(sql, [pk], async (err, result) => {
                        if (err) {
                                console.log(err)
                                return response(req, res, -200, "서버 에러 발생s", []);
                        } else {
                                console.log(req.body)

                                if (table == 'academy' && decode?.user_level <= 0 && req.query.views) {
                                        let is_exist = await dbQueryList(`SELECT * FROM subscribe_table WHERE user_pk=${decode?.pk} AND use_status=1 AND transaction_status >= 0 AND academy_category_pk=${result[0]?.category_pk} AND end_date>=? ORDER BY pk DESC`, [returnMoment().substring(0, 10)]);
                                        console.log(is_exist)
                                        is_exist = is_exist?.result;
                                        if (is_exist.length > 0) {
                                        } else {
                                                if (decode?.user_level < 40) {
                                                        return response(req, res, -150, "권한이 없습니다.", [])
                                                }
                                        }
                                        let is_period = await dbQueryList(`SELECT * FROM academy_category_table WHERE pk=? AND (start_date <='${returnMoment().substring(0, 10)}' AND end_date>='${returnMoment().substring(0, 10)}') `, [result[0]?.category_pk])
                                        is_period = is_period?.result;
                                        if (is_period.length > 0) {
                                        } else {
                                                if (decode?.user_level < 40) {
                                                        return response(req, res, -150, "수강 기간이 아닙니다.", [])
                                                }
                                        }
                                }
                                return response(req, res, 100, "success", result[0]);
                        }
                })

        }
        catch (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", []);
        }
});
const checkItemBySchema = (schema) => {

}
app.get('/api/getvideocontent', (req, res) => {
        try {
                console.log(app.connectionsN)
                //  if (tooMuchRequest(app.connectionsN)) {
                //          return response(req, res, -120, "접속자 수가 너무많아 지연되고있습니다.(잠시후 다시 시도 부탁드립니다.)", [])
                //  }
                const decode = checkLevel(req.cookies.token, 0)
                if (!decode) {
                        return response(req, res, -150, "권한이 없습니다.", [])
                }

                const pk = req.query.pk;
                let sql1 = `SELECT video_table.* , user_table.nickname, user_table.name FROM video_table LEFT JOIN user_table ON video_table.user_pk = user_table.pk WHERE video_table.pk=? LIMIT 1`;//비디오 정보
                let sql2 = `SELECT video_relate_table.*, video_table.* FROM video_relate_table LEFT JOIN video_table ON video_relate_table.relate_video_pk = video_table.pk WHERE video_relate_table.video_pk=? `//관련영상
                let sql3 = `SELECT video_table.pk, video_table.link, video_table.title, user_table.name, user_table.nickname FROM video_table LEFT JOIN user_table ON video_table.user_pk = user_table.pk ORDER BY pk DESC LIMIT 5`;//최신영상
                if (req.query.views) {
                        db.query("UPDATE video_table SET views=views+1 WHERE pk=?", [pk], (err, result_view) => {
                                if (err) {
                                        console.log(err)
                                        return response(req, res, -200, "서버 에러 발생", [])
                                } else {
                                }
                        })
                }
                db.query(sql1, [pk], async (err, result1) => {
                        if (err) {
                                console.log(err)
                                return response(req, res, -200, "서버 에러 발생", []);
                        } else {
                                await db.query(sql2, [pk], async (err, result2) => {
                                        if (err) {
                                                console.log(err)
                                                return response(req, res, -200, "서버 에러 발생", [])
                                        } else {
                                                await db.query(sql3, async (err, result3) => {
                                                        if (err) {
                                                                console.log(err)
                                                                return response(req, res, -200, "서버 에러 발생", [])
                                                        } else {
                                                                return response(req, res, 100, "success", {
                                                                        video: result1[0],
                                                                        relates: result2,
                                                                        latests: result3
                                                                })
                                                        }
                                                })
                                        }
                                })
                        }
                })
        } catch (err) {
                console.log(err)
                return response(req, res, -200, "서버 에러 발생", [])
        }
});

app.get('/', (req, res) => {
        res.json({ message: `Server is running on port ${req.secure ? HTTPS_PORT : HTTP_PORT}` });
});
