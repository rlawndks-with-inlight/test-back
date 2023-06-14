const express = require('express')
//const { json } = require('body-parser')
const router = express.Router()
const cors = require('cors')
router.use(cors())
router.use(express.json())

const crypto = require('crypto')
//const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const when = require('when')
let iconv = require('iconv-lite');
const { checkLevel, getSQLnParams, getUserPKArrStrWithNewPK,
    isNotNullOrUndefined, namingImagesPath, nullResponse,
    lowLevelResponse, response, removeItems, returnMoment, formatPhoneNumber,
    categoryToNumber, sendAlarm, makeMaxPage, queryPromise, makeHash, commarNumber, getKewordListBySchema,
    getQuestions, initialPay
} = require('../util')
const {
    getRowsNumWithKeyword, getRowsNum, getAllDatas,
    getDatasWithKeywordAtPage, getDatasAtPage,
    getKioskList, getItemRows, getItemList, dbQueryList, dbQueryRows, insertQuery, getTableAI
} = require('../query-util')
const macaddress = require('node-macaddress');

const db = require('../config/db')
const { upload } = require('../config/multerConfig')
const { Console, table } = require('console')
const { abort } = require('process')
const axios = require('axios')
//const { pbkdf2 } = require('crypto')
const salt = "435f5ef2ffb83a632c843926b35ae7855bc2520021a73a043db41670bfaeb722"
const saltRounds = 10
const pwBytes = 64
const jwtSecret = "djfudnsqlalfKeyFmfRkwu"
const { format, formatDistance, formatRelative, subDays } = require('date-fns')
const geolocation = require('geolocation')
const { sqlJoinFormat, listFormatBySchema, myItemSqlJoinFormat } = require('../format/formats')
const { param } = require('jquery')
const kakaoOpt = {
    clientId: '4a8d167fa07331905094e19aafb2dc47',
    redirectUri: 'http://172.30.1.19:8001/api/kakao/callback',
};
const {getZItems} = require('./datas')
const { _ } = require('lodash')
const onLoginById = async (req, res) => {
    try {
        let { id, pw } = req.body;
        if (id == 'testcoder' && pw == 'testcoder!@') {
            const token = jwt.sign({
                pk: 1,
                nickname: '나는야개발자',
                name: '홍길동',
                id: 'testcoder',
                user_level: 0,
                phone: '01000000000',
                profile_img: "/image/content/1680595670782-content.png",
                type: 0
            },
                jwtSecret,
                {
                    expiresIn: '60000m',
                    issuer: 'fori',
                });
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 60 * 60 * 1000 * 10 * 10 * 10,
                //sameSite: 'none', 
                //secure: true 
            });
            return response(req, res, 100, "success", []);
        } else {
            return response(req, res, -100, "존재하지 않는 회원입니다.", []);
        }
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}

const getItems = (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0)
        if(!decode){
            return response(req, res, -150, "권한이 없습니다.", [])
        }
        let {
            order,
            keyword,
            page,
            page_cut,
            user_id
        } = req.query;

        let result = [];
        let count = 0;
        let z_item = getZItems();
        for (var i = 0; i < z_item.length; i++) {
            let is_use_item = true;
            if (user_id) {
                if (user_id != z_item[i].user.id) {
                    is_use_item = false;
                }
            }
            if (keyword) {
                if (!z_item[i].title.includes(keyword) && !z_item[i].note.includes(keyword)) {
                    is_use_item = false;
                }
            }
            if (is_use_item) {
                delete z_item[i].note;
                result.push(z_item[i]);
                count++;
            }
        }
        if (order) {
            result = result.sort(function (a, b) {
                let x = a[order].toLowerCase();
                let y = b[order].toLowerCase();
                if (x < y) {
                    return 1;
                }
                if (x > y) {
                    return -1;
                }
                return 0;
            });
        }
        if (page && page_cut) {
            result = result.splice((page - 1) * page_cut, page * page_cut)
        }
        return response(req, res, 100, "success", {
            content: result,
            count: count
        });

    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getItem = (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0)
        if(!decode){
            return response(req, res, -150, "권한이 없습니다.", [])
        }
        const { id } = req.query;
        let z_item = getZItems();
        let item = _.find(z_item, { id: id });
        if (item) {
            return response(req, res, 100, "success", item);
        } else {
            return response(req, res, -100, "존재하지 않는 게시물 입니다.", []);
        }
    } catch (e) {
        console.log(e)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onLogout = (req, res) => {
    try {
        res.clearCookie('token')
        //res.clearCookie('rtoken')
        return response(req, res, 100, "로그아웃 성공", [])
    }
    catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
module.exports = {
    onLoginById, getItems, getItem, onLogout
};