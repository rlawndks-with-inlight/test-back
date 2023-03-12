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
    lowLevelResponse, response, removeItems, returnMoment, formatPhoneNumber, categoryToNumber, sendAlarm, makeMaxPage, queryPromise, makeHash, commarNumber, getKewordListBySchema
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
const addContract = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 10)
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", [])
        }
        const { pay_type, deposit, monthly, document_src, address, address_detail, zip_code } = req.body;
        let result = await insertQuery('INSERT INTO contract_table (pay_type, deposit, monthly, document_src, address, address_detail, zip_code, realtor_pk, step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [pay_type, deposit, monthly, document_src, address, address_detail, zip_code, decode?.pk, 1]);
        console.log(result)
        return response(req, res, 100, "success", {
            result_pk: result?.result?.insertId
        });
    }
    catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", []);
    }

}
module.exports = {
    addContract,
};