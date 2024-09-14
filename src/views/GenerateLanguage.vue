<template>
  <DefaultLayout title-justify-content="space-between">
    <template #title>
      <div>
        source:
        <a-select v-model="source" style="width: 180px">
          <a-select-option value="JAVA_210"> java 210 </a-select-option>
          <a-select-option value="JAVA_DEMOCORE">
            java democore
          </a-select-option>
          <a-select-option value="OODO_COREHR_TEST">
            oodo corehr_2_test
          </a-select-option>
        </a-select>
      </div>
      <a-button type="primary" @click="confirm" :loading="!done">
        生成多语言上线脚本
      </a-button>
    </template>
    <div class="generate-language">
      <a-textarea
        placeholder="输入要上线的多语言key，用换行分割"
        :rows="28"
        v-model="value"
      />
    </div>
  </DefaultLayout>
</template>

<script>
import { ipcRenderer } from "electron";
import DefaultLayout from "@/components/DefaultLayout.vue";

const fs = require("fs");

export default {
  components: {
    DefaultLayout,
  },
  data() {
    return {
      source: "JAVA_210",
      value: "",
      done: true,
    };
  },

  methods: {
    confirm(e) {
      const value = this.value.trim();
      if (value) {
        const list = value.split(/\r\n|\n/);
        let str = "";
        for (let i = 0; i < list.length; i++) {
          if (i === list.length - 1) {
            str += `'${list[i].trim()}'`;
          } else {
            str += `'${list[i].trim()}',`;
          }
        }
        this.connectDatabase(str);
      } else {
        this.$message.error("空");
      }
    },

    connectDatabase(str) {
      // 发送请求到主进程
      this.done = false;

      ipcRenderer.send("connect-to-language-database", this.source, [
        `SELECT * FROM lb_base_language_detail WHERE KEY in (${str});`,
        `SELECT * FROM lb_base_languag_row WHERE field_key in (${str});`,
      ]);

      // 接收主进程的响应
      ipcRenderer.on("connect-to-language-database-response", (event, res) => {
        // 处理数据库响应
        if (this.done) return;
        this.done = true;
        if (!res) {
          this.$message.error("出错！！！");
          return;
        }
        if (res[0].length === 0 || res[1].length === 0) {
          this.$message.error("未查询到任何数据！");
        } else {
          const str1 = this.deal_lb_base_language_detail_result(res[0]);
          const str2 = this.deal_query_lb_base_languag_row_result(res[1]);
          this.generateLanguage(str1, str2);
        }
      });
    },

    generateLanguage(str1, str2) {
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

      `;
      const position = ipcRenderer.sendSync("dialog.showSaveDialogSync", {
        title: "保存sql文件",
        defaultPath: this.fileName ? this.fileName : `${Date.now()}.sql`,
        nameFieldLabel: "sql名：",
        properties: ["createDirectory"],
      });

      fs.writeFile(position, template, "utf-8", (error) => {
        if (error) {
          this.$message.error("保存失败！");
        } else {
          this.$message.success("保存成功！");
        }
      });
    },

    /**
     * 查询 lb_base_language_detail 表
     */
    deal_lb_base_language_detail_result(rows) {
      const str = `
          INSERT INTO "public"."a3_lb_base_language_detail" ("id", "is_delete", "create_uid", "create_time", "update_uid", "update_time", "app", "hierarchy_code", "custom_type", "key") VALUES
            ${rows
              .map(
                (item) =>
                  `(${item.id}, ${item.is_delete}, NULL, '2024-03-26 17:42:55.918283+08', NULL, '2024-03-26 17:42:55.918283+08', '${item.app}', '${item.hierarchy_code}', '${item.custom_type}', '${item.key}')`
              )
              .join(",\n")};
        `;
      return str;
    },

    deal_query_lb_base_languag_row_result(rows) {
      const str = `
        INSERT INTO "public"."a3_lb_base_languag_row" ("id", "is_delete", "create_uid", "create_time", "update_uid", "update_time", "language", "default_translation", "customize_translation", "field_key") VALUES
          ${rows
            .map(
              (item) =>
                `(${item.id}, ${
                  item.is_delete
                }, NULL, '2024-03-26 17:42:55.918283+08', NULL, '2024-03-28 11:59:34.806111+08', '${
                  item.language
                }', '${item.default_translation}', '${this.nullToEmpty(
                  item.customize_translation
                )}', '${item.field_key}')`
            )
            .join(",\n")};
      `;
      return str;
    },
  },
};
</script>

<style scoped lang='less'>
</style>