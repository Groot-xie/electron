<template>
  <div>
    <h1>从210数据库捞取多语言脚本</h1>
    <a-textarea  placeholder="输入要上线的多语言key，用换行分割" :rows="28" v-model="value" />
    <a-button type="primary" @click="confirm" style="margin-top: 12px">
      生成上线脚本
    </a-button>
  </div>
</template>

<script>
const { Pool } = require('pg');
const fs = require('fs');
import { ipcRenderer } from 'electron'

export default {
  data() {
    return {
      value: ''
    }
  },
   
  methods: {
    confirm(e) {
      const value = this.value.trim()
      if (value) {
        const list = value.split(/\r\n|\n/);
        let str = '';
        for(let i = 0; i < list.length; i++) {
          if (i === list.length - 1) {
            str += `'${list[i].trim()}'`
          } else {
            str += `'${list[i].trim()}',`
          }
        }
        this.connectDatabase(str)
      }
    },

    async connectDatabase(str) {
      // 创建一个连接池
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

      await this.generateLanguage(pool, str);

      pool.end();
    },

    async generateLanguage(pool, str) {
      const str1 = await this.query_lb_base_language_detail(pool, str)
      const str2 = await this.query_lb_base_languag_row(pool, str)
      const template = `
          -- 生成多语言key
          begin;

          drop table if exists a3_lb_base_language_detail;

          create table if not exists a3_lb_base_language_detail(
            id                    SERIAL NOT NULL,
            is_delete             integer,
            create_uid            integer,
            create_time           timestamp with time zone,
            update_uid            integer,
            update_time           timestamp with time zone,
            app            varchar(128),
            hierarchy_code varchar(128),
            custom_type    varchar(128),
            key            varchar(128),
            PRIMARY KEY (id)
          );
          

          ${str1}

          delete from a3_lb_base_language_detail where is_delete = 1 and key  in (select key from a3_lb_base_language_detail where is_delete = 0);


          insert into lb_base_language_detail(
            is_delete,
            app,
            hierarchy_code,
            custom_type,
            key,
            update_uid,
            update_time,
            create_uid,
            create_time
          ) 
          select 
                b.is_delete,
                b.app,
                b.hierarchy_code,
                b.custom_type,
                b.key,
                1,
                now(),
                1,
                now()
          from lb_base_language_detail a
          right join a3_lb_base_language_detail b on
          a.key = b.key
          where a.key is null
          and b.key is not null;

          update lb_base_language_detail a
          set is_delete = b.is_delete,
              app = b.app,
              hierarchy_code = b.hierarchy_code,
              custom_type = b.custom_type
          from a3_lb_base_language_detail b
          where a.key = b.key;


          drop table if exists a3_lb_base_language_detail;
          commit ;

          
          -- 生成多语言key的详情
          BEGIN;

          drop table if exists a3_lb_base_languag_row;
          
          create table if not exists a3_lb_base_languag_row
          (
              id                    SERIAL NOT NULL,
              is_delete             integer,
              create_uid            integer,
              create_time           timestamp with time zone,
              update_uid            integer,
              update_time           timestamp with time zone,
              language              varchar(32),
              default_translation   varchar(512),
              customize_translation varchar(512),
              field_key             varchar(128),
              PRIMARY KEY (id)
          );
        
          

          ${str2}



          delete from a3_lb_base_languag_row where id in (
            select id from a3_lb_base_languag_row a
              left join (select field_key,language from a3_lb_base_languag_row where is_delete = 1) b
              on a.language = b.language and a.field_key = b.field_key
              where a.is_delete = 0
              and b.language is not null
              and b.field_key is not null
            );
        
        
          insert into lb_base_languag_row (
            is_delete,
            create_uid,
            create_time,
            update_uid,
            update_time,
            language,
            default_translation,
            customize_translation,
            field_key
          )
          select distinct b.is_delete,
                          1,
                          now(),
                          1,
                          now(),
                          b.language,
                          b.default_translation,
                          b.customize_translation,
                          b.field_key
          from lb_base_languag_row a
                  right join a3_lb_base_languag_row b on
                  a.field_key = b.field_key
                  and a.language = b.language
          where a.field_key is null;
          
          
          update lb_base_languag_row a
          set default_translation = b.default_translation,
              update_time = now(),
              update_uid = 1,
              is_delete = b.is_delete
          from a3_lb_base_languag_row b
          where a.field_key = b.field_key
          and a.language = b.language;
          
          drop table if exists a3_lb_base_languag_row;
          
          COMMIT;

      `
      console.log(template)
      const position = ipcRenderer.sendSync('dialog.showSaveDialogSync', {
        title: '保存sql文件',
        defaultPath: this.fileName ? this.fileName : `${Date.now()}.sql`,
        nameFieldLabel: 'sql名：',
        properties: ['createDirectory']
      })

      fs.writeFile(position, template, 'utf-8', error => {
        if (error) {
          this.$message.error('保存失败！')
        } else {
          this.$message.success('保存成功！')
        }
      })
    },

    /**
     * 查询 lb_base_language_detail 表
     */
    query_lb_base_language_detail(pool, str) {
      return new Promise((resolv, reject) => {
        pool.query(`SELECT * FROM lb_base_language_detail WHERE KEY in (${str});`, (err, res) => {
         if (err) {
           this.$message.error(`This is an error message: ${err.stack}`);
         } else {
           const rows = res.rows;
           const result = `
             INSERT INTO "public"."lb_base_language_detail" ("id", "is_delete", "create_uid", "create_time", "update_uid", "update_time", "app", "hierarchy_code", "custom_type", "key") VALUES
               ${rows.map(item => `(${item.id}, ${item.is_delete}, NULL, '2024-03-26 17:42:55.918283+08', NULL, '2024-03-26 17:42:55.918283+08', '${item.app}', '${item.hierarchy_code}', '${item.custom_type}', '${item.key}')`).join(',\n')};
           `
           resolv(result)
         }
       });
      })
    },

    query_lb_base_languag_row(pool, str) {

      return new Promise((resolv, reject) => {
        pool.query(`SELECT * FROM lb_base_languag_row WHERE field_key in (${str});`, (err, res) => {
          if (err) {
            this.$message.error(`This is an error message: ${err.stack}`);
          } else {
            const rows = res.rows;
            console.log(rows);
            const result = `
              INSERT INTO "public"."lb_base_languag_row" ("id", "is_delete", "create_uid", "create_time", "update_uid", "update_time", "language", "default_translation", "customize_translation", "field_key") VALUES
                ${rows.map(item => `(${item.id}, ${item.is_delete}, NULL, '2024-03-26 17:42:55.918283+08', NULL, '2024-03-28 11:59:34.806111+08', '${item.language}', '${item.default_translation}', '${item.customize_translation}', '${item.field_key}')`).join(',\n')};
            `
            resolv(result)
          }
        })
      })

     },

  }
}
</script>

<style scoped lang='less'>

</style>