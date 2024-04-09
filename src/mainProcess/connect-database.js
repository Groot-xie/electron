// 在主进程中
const {  ipcMain } = require('electron');
const { Pool } = require('pg');

const DATABASE = {
  JAVA_210: {
    user: 'postgres',
    host: '192.168.10.66',
    database: 'corehr1114',
    password: '123456',
    port: 5432,
    max: 10,                   // 连接池中的最大连接数
    idleTimeoutMillis: 30000,  // 连接在被移除之前的空闲时间
    connectionTimeoutMillis: 2000 // 连接超时时间
  },
  JAVA_DEMOCORE: {
    user: 'democorejava',
    host: '192.168.10.212',
    database: 'democorejava',
    password: 'aabb123',
    port: 5432,
    max: 10,                   // 连接池中的最大连接数
    idleTimeoutMillis: 30000,  // 连接在被移除之前的空闲时间
    connectionTimeoutMillis: 2000 // 连接超时时间
  },
  OODO_COREHR_TEST: {
    user: 'corehr2test',
    host: '192.168.10.210',
    database: 'corehr2test',
    password: 'aabb123',
    port: 15432,
    max: 10,                   // 连接池中的最大连接数
    idleTimeoutMillis: 30000,  // 连接在被移除之前的空闲时间
    connectionTimeoutMillis: 2000 // 连接超时时间
  }
}

ipcMain.on('connect-to-language-database', async (event, source, querys = []) => {
  const pool = new Pool(DATABASE[source]);
  
  const result = await Promise.all(querys.map(query => queryDatabase(pool, query)))
  pool.end();
  event.sender.send('connect-to-language-database-response', result);
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