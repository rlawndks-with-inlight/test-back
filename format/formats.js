
const listFormatBySchema = (schema, data_) => {
    let data = [...data_];
    let option_list = {};
    if (schema == 'academy_category') {
        option_list = {
            period:[
                { name: '1일', val: 1 },
                { name: '3일', val: 3 },
                { name: '1주일', val: 7 },
                { name: '2주일', val: 14 },
                { name: '3주일', val: 21 },
                { name: '1개월', val: 30 },
                { name: '2개월', val: 60 },
                { name: '3개월', val: 90 },
                { name: '6개월', val: 180 },
                { name: '1년', val: 365 },
            ],
            difficulty:[
                { name: '왕초보', val: 1 },
                { name: '검색기', val: 2 },
                { name: '단타', val: 3 },
                { name: '종목발굴', val: 4 },
                { name: '기억분석', val: 5 },
            ],
        }
        for (var i = 0; i < data.length; i++) {
            for(var j = 0;j<Object.keys(option_list).length;j++){
                let obj = option_list[Object.keys(option_list)[j]].find(e=>e.val==data[i][Object.keys(option_list)[j]])
                data[i][Object.keys(option_list)[j]] = obj.name;
            }
        }
    }
    return data;
}
const sqlJoinFormat = (schema, sql_, order_, page_sql_) => {
    let sql = sql_;
    let page_sql = page_sql_;
    let order = order_;
    if(schema=='academy_category'){
        sql = ` SELECT academy_category_table.*, user_table.nickname AS master_nickname FROM academy_category_table`;
        sql += ` LEFT JOIN user_table ON academy_category_table.master_pk=user_table.pk `;
        order = 'academy_category_table.sort'
    }
    return {
        page_sql:page_sql,
        sql:sql,
        order:order
    }
}
module.exports = {
    listFormatBySchema, sqlJoinFormat
};
// const sqlJoinFormat = (schema, sql_, page_sql_) => {
//     let sql = sql_;
//     let page_sql = page_sql_;
//     let need_join_obj = {
//         academy_category: {
//             join_table_list: [
//                 'user_table',
//             ],
//             join_columns: [
//                 { column: 'pk', as: 'master_pk', join_table: join_table_list[0] },
//                 { column: 'nickname', as: 'master_nickname', join_table: join_table_list[0] },
//             ],
//             join_: []
//         },
//     }
//     if(need_join_obj[schema]){
//         let sql = `SELECT * `
//         let join_columns = "";
//         let join_sql = "";
//         for(var i = 0;i<need_join_obj[schema].join_table_list.length;i++){
//             let join_table = need_join_obj[schema].join_table_list[i];
//             let join_columns = need_join_obj[schema].join_columns;
//             for(var j =0;j<join_columns.length;j++){
//                 if(join_table==join_columns[j].join_table){
//                     join_columns += `, ${join_table}.${join_columns[j].column} AS ${join_columns[j].as}`
//                 }
//             }
            
//         }
//     }
//     return {
//         page_sql:page_sql,
//         sql:sql
//     }
// }