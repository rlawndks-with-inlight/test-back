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
    getEnLevelByNum, getKoLevelByNum,
    getQuestions, getNumByEnLevel
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
        const { pay_type, deposit, monthly, document_src, address, address_detail, zip_code, start_date, end_date, pay_day } = req.body;
        let result = await insertQuery('INSERT INTO contract_table (pay_type, deposit, monthly, document_src, address, address_detail, zip_code, start_date, end_date, pay_day, realtor_pk, step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [pay_type, deposit, monthly, document_src, address, address_detail, zip_code, start_date, end_date, pay_day, decode?.pk, 1]);
        return response(req, res, 100, "success", {
            result_pk: result?.result?.insertId
        });
    }
    catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", []);
    }

}
const updateContract = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 10)
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", [])
        }
        const { pay_type, deposit, monthly, address, address_detail, zip_code, start_date, pay_day, pk, document_src } = req.body;
        console.log(req.body)

        let value_str = "pay_type=?, deposit=?, monthly=?, address=?, address_detail=?, zip_code=? , start_date=?, pay_day=? ";
        let value_list = [pay_type, deposit, monthly, address, address_detail, zip_code, start_date, pay_day];
        if (document_src) {
            if (document_src == -1) {
                value_list.push('')
            } else {
                value_list.push(document_src)
            }
            value_str += `, document_src=?`
        }
        let result = await insertQuery(`UPDATE contract_table SET ${value_str} WHERE pk=${pk}`, value_list);
        return response(req, res, 100, "success", []);
    }
    catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", []);
    }

}
const getHomeContent = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", [])
        }
        let result_list = [];
        let sql_list = [
            { table: 'notice', sql: 'SELECT notice_table.*, user_table.nickname FROM notice_table LEFT JOIN user_table ON notice_table.user_pk=user_table.pk WHERE notice_table.status=1 ORDER BY notice_table.sort DESC LIMIT 2', type: 'list' },
            { table: 'setting', sql: 'SELECT * FROM setting_table', type: 'obj' },
            { table: 'contract', sql: `SELECT * FROM v_contract WHERE ${getEnLevelByNum(decode?.user_level)}_pk=${decode?.pk} ORDER BY pk DESC LIMIT 5`, type: 'list' },
            { table: 'pay', sql: `SELECT * FROM v_pay WHERE ${getEnLevelByNum(decode?.user_level)}_pk=${decode?.pk} ORDER BY pk DESC LIMIT 5`, type: 'list' },
        ];

        for (var i = 0; i < sql_list.length; i++) {
            result_list.push(queryPromise(sql_list[i]?.table, sql_list[i]?.sql));
        }
        for (var i = 0; i < result_list.length; i++) {
            await result_list[i];
        }
        let result_obj = {};
        for (var i = 0; i < sql_list.length; i++) {
            result_list.push(queryPromise(sql_list[i].table, sql_list[i].sql, sql_list[i].type));
        }
        for (var i = 0; i < result_list.length; i++) {
            await result_list[i];
        }
        let result = (await when(result_list));
        for (var i = 0; i < (await result).length; i++) {
            result_obj[(await result[i])?.table] = (await result[i])?.data;
        }
        return response(req, res, 100, "success", result_obj)

    } catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const requestContractAppr = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 10);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        const { user_pk, contract_pk, request_level } = req.body;
        let user = await dbQueryList(`SELECT * FROM user_table WHERE pk=${user_pk}`);
        user = user?.result[0];
        let contract = await dbQueryList(`SELECT * FROM contract_table WHERE pk=${contract_pk}`);
        contract = contract?.result[0];
        if (contract?.realtor_pk != decode?.pk) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        if (request_level == 0 || request_level == 5) {

        } else {
            return response(req, res, -100, "잘못된 레벨입니다.", []);
        }
        if (request_level != user?.user_level) {
            return response(req, res, -100, "선택한 유저의 레벨이 잘못되었습니다.", []);
        }
        let result = await insertQuery(`UPDATE contract_table SET ${getEnLevelByNum(request_level)}_pk=${user_pk} WHERE pk=${contract_pk}`);
        return response(req, res, 100, "success", []);
    } catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const confirmContractAppr = async (req, res) => {
    try {
        const { contract_pk } = req.body;
        const decode = checkLevel(req.cookies.token, 0);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        if (decode?.user_level != 0 && decode?.user_level != 5) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        let contract = await dbQueryList(`SELECT * FROM contract_table WHERE pk=${contract_pk}`);
        contract = contract?.result[0];
        if (contract[`${getEnLevelByNum(decode?.user_level)}_appr`] == 1) {
            return response(req, res, -100, "이미 수락한 계약입니다.", []);
        }
        await db.beginTransaction();
        let result = await insertQuery(`UPDATE contract_table SET ${getEnLevelByNum(decode?.user_level)}_appr=1 WHERE pk=${contract_pk}`);

        let now_contract = await dbQueryList(`SELECT * FROM contract_table WHERE pk=${contract_pk}`);
        now_contract = now_contract?.result[0];
        if (
            now_contract[`${getEnLevelByNum(0)}_appr`] == 1 &&
            now_contract[`${getEnLevelByNum(5)}_appr`] == 1 &&
            now_contract[`deposit`] > 0 &&
            now_contract[`monthly`] > 0
        ) {
            let result2 = await insertQuery(`INSERT pay_table (${getEnLevelByNum(0)}_pk, ${getEnLevelByNum(5)}_pk, ${getEnLevelByNum(10)}_pk, price, pay_category, status, contract_pk, day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    now_contract[`${getEnLevelByNum(0)}_pk`],
                    now_contract[`${getEnLevelByNum(5)}_pk`],
                    now_contract[`${getEnLevelByNum(10)}_pk`],
                    now_contract[`deposit`],
                    1,
                    0,
                    now_contract[`pk`],
                    returnMoment().substring(0, 10)
                ])
            let now = returnMoment().substring(0, 10);
            if (now >= `${now_contract.start_date}`) {//월세 관련
                let pay_list = [];
                let contract_day = `${now_contract['pay_day'] >= 10 ? `${now_contract['pay_day']}` : `0${now_contract['pay_day']}`}`
                let pay_date = now_contract.start_date.substring(0, 7) + `-${contract_day}`;
                for (var i = 0; i < 100000; i++) {
                    //console.log(date_format)'
                    if (pay_date.includes('-12-')) {
                        pay_date = pay_date.split('-');
                        pay_date = `${(parseInt(pay_date[0]) + 1)}-01-${contract_day}`
                    } else {
                        pay_date = pay_date.split('-');
                        pay_date[1] = parseInt(pay_date[1]) + 1;
                        pay_date[1] = `${pay_date[1] >= 10 ? pay_date[1] : `0${pay_date[1]}`}`
                        pay_date = `${pay_date[0]}-${(pay_date[1])}-${contract_day}`
                    }
                    if (pay_date <= now && pay_date >= now_contract.start_date) {
                        pay_list.push(
                            [
                                now_contract[`${getEnLevelByNum(0)}_pk`],
                                now_contract[`${getEnLevelByNum(5)}_pk`],
                                now_contract[`${getEnLevelByNum(10)}_pk`],
                                now_contract[`monthly`],
                                0,
                                0,
                                now_contract[`pk`],
                                pay_date
                            ]
                        )
                    } else {
                        if (pay_date > now) {
                            break;
                        }
                    }
                }
                if(pay_list.length>0){
                    let result = await insertQuery(`INSERT pay_table (${getEnLevelByNum(0)}_pk, ${getEnLevelByNum(5)}_pk, ${getEnLevelByNum(10)}_pk, price, pay_category, status, contract_pk, day) VALUES ?`, [pay_list]);
                }
            }
        }
        await db.commit();
        return response(req, res, 100, "success", []);
    } catch (err) {
        console.log(err)
        await db.rollback();
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onResetContractUser = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 10);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        const { contract_pk, request_level } = req.body;
        let contract = await dbQueryList(`SELECT * FROM contract_table WHERE pk=${contract_pk}`);
        contract = contract?.result[0];
        if (contract?.realtor_pk != decode?.pk) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        let result = await insertQuery(`UPDATE contract_table SET ${getEnLevelByNum(request_level)}_pk=NULL, ${getEnLevelByNum(request_level)}_appr=0 WHERE pk=${contract_pk}`);
        return response(req, res, 100, "success", []);
    } catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const onChangeCard = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        const { card_number, card_name, card_expire, card_cvc, card_password } = req.body;
        let result = await insertQuery(`UPDATE user_table SET card_number=?, card_name=?, card_expire=?, card_cvc=?, card_password=? WHERE pk=?`, [card_number, card_name, card_expire, card_cvc, card_password, decode?.pk]);
        return response(req, res, 100, "success", []);
    } catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
const getCustomInfo = async (req, res) => {
    try {
        const decode = checkLevel(req.cookies.token, 0);
        if (!decode) {
            return response(req, res, -150, "권한이 없습니다.", []);
        }
        const { level, page } = req.query;
        let my_contracts = await dbQueryList(`SELECT * FROM contract_table WHERE ${getEnLevelByNum(decode?.user_level)}_pk=${decode?.pk} ORDER by pk DESC`);
        my_contracts = my_contracts?.result;
        let user_pk_list = my_contracts.map((item) => {
            return item[`${getEnLevelByNum(level)}_pk`]
        })
        let user_count = 0;
        if (user_pk_list.length > 0) {
            user_count = await dbQueryList(`SELECT COUNT(*) FROM user_table WHERE pk IN (${user_pk_list.join()}) `);
            user_count = user_count?.result[0];
            user_count = user_count['COUNT(*)'];
            user_count = makeMaxPage(user_count, 10);
        }
        let user_list = [];
        if (user_pk_list.length > 0) {
            user_list = await dbQueryList(`SELECT * FROM user_table WHERE pk IN (${user_pk_list.join()}) LIMIT ${(page - 1) * 10}, 10`);
            user_list = user_list?.result;
        }
        return response(req, res, 100, "success", {
            data: user_list,
            maxPage: user_count
        });
    } catch (err) {
        console.log(err)
        return response(req, res, -200, "서버 에러 발생", [])
    }
}
module.exports = {
    addContract, getHomeContent, updateContract, requestContractAppr, confirmContractAppr, onResetContractUser, onChangeCard, getCustomInfo
};