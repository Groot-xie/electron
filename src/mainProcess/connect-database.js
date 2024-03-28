// 在主进程中
const {  ipcMain } = require('electron');
const { Pool } = require('pg');

ipcMain.on('connect-to-210-database', async (event, querys = []) => {
  const pool = new Pool({
    user: 'postgres',     // 替换为您的数据库用户名
    host: '192.168.10.66',   // 替换为远程电脑的IP地址
    database: 'corehr1114', // 替换为您的数据库名
    password: '123456', // 替换为您的数据库密码
    port: 5432,                // 默认的PostgreSQL端口
    max: 10,                   // 连接池中的最大连接数
    idleTimeoutMillis: 30000,  // 连接在被移除之前的空闲时间
    connectionTimeoutMillis: 2000 // 连接超时时间
  });
  
  const result = await Promise.all(querys.map(query => queryDatabase(pool,query )))
  pool.end();
  event.sender.send('connect-to-210-database-response', result);
});


function queryDatabase(pool, query) {
  return new Promise((resolve, reject) => {
    pool.query(query, (err, res) => {
      if (err) {
        reject();
      } else {
        resolve(res.rows)
      }
    })
  })
}