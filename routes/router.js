const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig')
const {
    onLoginById, getItems, getItem, onLogout, getUserToken
} = require('./common');
/**
 * @swagger
 *  /api/login:
 *    post:
 *      tags: [Auth]
 *      summary: 로그인 API
 *      description: 로그인 API
 *      requestBody:
 *          x-name: body
 *          required: true
 *          content:
 *              application/json: 
 *                  schema:
 *                      required:
 *                      - user_name
 *                      - password
 *                      properties:
 *                          user_name:
 *                              type: string
 *                          password:
 *                              type: string
 *      responses:
 *       100:
 *        description: success
 *       -100:
 *        description: 존재하지 않는 회원입니다.
 *       -200:
 *        description: 서버 에러 발생
 */
/**
 * @swagger
 *  /api/auth:
 *    get:
 *      tags: [Auth]
 *      summary: 유저정보 리턴 API
 *      description: 유저정보 리턴 API
 *      responses:
 *       100:
 *        description: success
 *       -150:
 *        description: 로그인하지 않은 회원입니다.
 *       -200:
 *        description: 서버 에러 발생
 */
/**
 * @swagger
 *  /api/logout:
 *    post:
 *      tags: [Auth]
 *      summary: 로그아웃 API
 *      description: 로그아웃 API
 *      responses:
 *       100:
 *        description: 로그아웃 성공
 *       -200:
 *        description: 서버 에러 발생
 */
/**
 * @swagger
 *  /api/item:
 *    get:
 *      tags:
 *      - Item
 *      summary: 컨텐츠 단일 조회
 *      description: 컨텐츠 단일 조회
 *      produces:
 *      - application/json
 *      parameters:
 *        - in: query
 *          name: id
 *          required: true
 *          schema:
 *            type: integer
 *          description: 상품 id
 *      responses:
 *       100:
 *        description: success
 *       -100:
 *        description: 존재하지 않는 게시물 입니다.
 *       -150:
 *        description: 권한이 없습니다.
 *       -200:
 *        description: 서버 에러 발생
 */
/**
 * @swagger
 *  /api/items:
 *    get:
 *      tags:
 *      - Item
 *      summary: 컨텐츠 리스트 조회
 *      description: 컨텐츠 리스트 조회
 *      produces:
 *      - application/json
 *      parameters:
 *        - in: query
 *          name: order
 *          required: false
 *          schema:
 *            type: string
 *          description: 정렬할 컬럼 (내림차순)
 *        - in: query
 *          name: keyword
 *          required: false
 *          schema:
 *            type: string
 *          description: 검색할 키워드 (title, note)
 *        - in: query
 *          name: page
 *          required: false
 *          schema:
 *            type: integer
 *          description: 페이지
 *        - in: query
 *          name: page_cut
 *          required: false
 *          schema:
 *            type: integer
 *          description: 페이지당 리스트 갯수
 *        - in: query
 *          name: user_id
 *          required: false
 *          schema:
 *            type: integer
 *          description: 유저 id
 *      responses:
 *       100:
 *        description: success
 *       -150:
 *        description: 권한이 없습니다.
 *       -200:
 *        description: 서버 에러 발생
 */
router.post('/login', onLoginById);
router.get('/auth', getUserToken);
router.post('/logout', onLogout);
router.get('/items', getItems);
router.get('/item', getItem);


module.exports = router;