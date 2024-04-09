<template>
  <DefaultLayout>
    <template #title>
      <a-button type="primary" @click="confirm" :loading="!done">
        生成接口权限上线脚本
      </a-button>
    </template>
    <div class="generate-acl">
      <div class="generate-acl-javapath">
        接口：
        <a-textarea  placeholder="输入要上线的接口path，用换行分割" :rows="28" v-model="value" />
      </div>
      <div class="generate-acl-code">
        对应功能点：
        <a-textarea  placeholder="输入要上线的功能点，用换行分割" :rows="28" v-model="code" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ipcRenderer } from 'electron'
import DefaultLayout from '@/components/DefaultLayout.vue'

const fs = require('fs');

export default {
  components: {
    DefaultLayout
  },
  data() {
    return {
      value: '',
      code: '',
      done: true,
    }
  },
   
  methods: {
    formatTextarea(value) {
      if (!value) {
        return ''
      }
      const list = value.split(/\r\n|\n/);
      let str = '';
      for(let i = 0; i < list.length; i++) {
        if (i === list.length - 1) {
          str += `'${list[i].trim()}'`
        } else {
          str += `'${list[i].trim()}',`
        }
      }
      return str;
    },

    confirm(e) {
      const value = this.value.trim()
      const code = this.code.trim()
      if (value) {
        const str1 = this.formatTextarea(value);
        const str2 = this.formatTextarea(code);
        this.connectDatabase(str1, str2)
      } else {
          this.$message.error('空')
      }
    },

    connectDatabase(str1, str2) {
      // 发送请求到主进程
        this.done = false;

        const beforeAction = `
          DROP TABLE IF EXISTS uc_menu_role_update;
          CREATE TABLE uc_menu_role_update
          (
              id                   SERIAL       NOT NULL,
              is_delete            INT,
              key                  VARCHAR(128) NOT NULL,
              name                 varchar(128),
              parent_id            INT,
              parent_key           VARCHAR(128),
              parent_left          INT,
              parent_right         INT,
              index                INT,
              is_tab               boolean,
              application_id       INT,
              enabled              integer,
              icon_id              BIGINT,
              icon_url             character varying(128) COLLATE pg_catalog."default",
              description          character varying(128) COLLATE pg_catalog."default",
              app_link             character varying(128) COLLATE pg_catalog."default",
              data_flag            integer,
              mobile_module        character varying(128) COLLATE pg_catalog."default",
              mobile_model         character varying(128) COLLATE pg_catalog."default",
              category_code        character varying(256) COLLATE pg_catalog."default",
              component_path       character varying(60) COLLATE pg_catalog."default",
              mobile_show_type     character varying(20) COLLATE pg_catalog."default",

              iconfont             varchar(64),
              router_name          VARCHAR(64),
              router_param         text,

              app_key              varchar(128),
              app_name             varchar(128),
              app_is_delete        INT,

              app_is_standard      integer,
              app_enabled          integer,
              app_app_version      text COLLATE pg_catalog."default" DEFAULT ''::character varying,
              app_app_link         text COLLATE pg_catalog."default" DEFAULT ''::character varying,
              app_app_ico          integer,
              app_icon_url         text COLLATE pg_catalog."default" DEFAULT ''::character varying,
              app_app_announcement text COLLATE pg_catalog."default" DEFAULT ''::text,
              app_sort_index       integer,

              app_iconfont         VARCHAR(128),

              view_name            varchar(128),
              view_type            varchar(128),
              view_key             VARCHAR(128),
              view_is_delete       INT,
              role_type            text,
              role_name            text,
              role_description     text,
              PRIMARY KEY (id)
          );;



          insert into uc_menu_role_update(is_delete,
                                          key,
                                          name,
                                          parent_id,
                                          parent_left,
                                          parent_right,
                                          index,
                                          is_tab,
                                          iconfont,
                                          router_name,
                                          router_param,
                                          application_id,
                                          app_key,
                                          app_name,
                                          app_is_delete,
                                          app_is_standard,
                                          app_enabled,
                                          app_app_version,
                                          app_app_link,
                                          app_app_ico,
                                          app_icon_url,
                                          app_app_announcement,
                                          app_sort_index,
                                          app_iconfont,
                                          view_name,
                                          view_type,
                                          view_key,
                                          view_is_delete,
                                          role_type,
                                          role_name,
                                          role_description,
                                          enabled,
                                          icon_id,
                                          icon_url,
                                          description,
                                          app_link,
                                          data_flag,
                                          mobile_module,
                                          mobile_model,
                                          category_code,
                                          component_path,
                                          mobile_show_type)
          select m.is_delete        as is_delete,
                m.key              as key,
                m.name             as name,
                m.parent_id        as parent_id,
                m.parent_left      as parent_left,
                m.parent_right     as parent_right,
                m.index            as index,
                m.is_tab           as is_tab,
                m.iconfont         as iconfont,
                m.router_name      as router_name,
                m.router_param     as router_param,
                m.application_id   as application_id,
                a.key              as app_key,
                a.name             as app_name,
                a.is_delete        as app_is_delete,
                a.is_standard      as app_is_standard,
                a.enabled          as app_enabled,
                a.app_version      as app_app_version,
                a.app_link         as app_app_link,
                a.app_ico          as app_app_ico,
                a.icon_url         as app_icon_url,
                a.app_announcement as app_app_announcement,
                a.sort_index       as app_sort_index,
                a.iconfont         as app_iconfont,
                v.name             as view_name,
                v.type             as view_type,
                v.key              as view_key,
                v.is_delete        as view_is_delete,
                r.type             as role_type,
                r.name             as role_name,
                r.description      as role_description,
                m.enabled          as enabled,
                m.icon_id          as icon_id,
                m.icon_url         as icon_url,
                m.description      as description,
                m.app_link         as app_link,
                m.data_flag        as data_flag,
                m.mobile_module    as mobile_module,
                m.mobile_model     as mobile_model,
                m.category_code    as category_code,
                m.component_path   as component_path,
                m.mobile_show_type as mobile_show_type
          from uc_ui_application a
                  right join uc_ui_menu m on
              a.id = m.application_id
                  left join uc_ui_view v on
              m.id = v.uimenuid
                  left join uc_ui_view_base_role_mapping vr on
              v.id = vr.uiviewid
                  left join uc_custom_role r on
              vr.roleid = r.id
          where v.key in (
            ${str2 ? str2 : `'--------------'`}
          );

          -- 匹配parent_key

          update uc_menu_role_update mru
          set parent_key = (select key from uc_ui_menu t1 where t1.id = mru.parent_id )
          from uc_ui_menu m
          where mru.key = m.key;
        `

        const arr = [`SELECT * FROM uc_custom_role WHERE javapath in (${str1});`];
        if (str2) {
          arr.push('SELECT * FROM uc_menu_role_update')
        }
        ipcRenderer.send('connect-to-acl-database', [`SELECT * FROM uc_custom_role WHERE javapath in (${str1});`, 'SELECT * FROM uc_menu_role_update'], beforeAction);
        
        // 接收主进程的响应
        ipcRenderer.on('connect-to-acl-database-response', (event, res) => {
          // 处理数据库响应
          if (this.done) return;
          this.done = true
          if (!res) {
            this.$message.error('出错！！！')
            return
          }
          console.log('res', res)
          if (res[0].length === 0) {
            this.$message.error('未查询到任何数据！')
          } else {
            const template = `
              ${this.deal_uc_custom_role_result(res[0])}

              ${ this.deal_uc_menu_role_update_result(res[1])}
            `
            this.generateAcl(template);
          }
        });
        
     
    },

    /**
     * 查询 uc_custom_role 表
     */
    deal_uc_custom_role_result(rows) {
      if (rows.length === 0) {
        return ''
      }
      const str = `
        INSERT INTO "public"."a3_uc_custom_role" ("id", "type", "name", "description", "created", "modified", "roletypeid", "javapath") VALUES
          ${rows.map(item => `(${item.id}, '${item.type}', '${item.name}', '${item.description}', '2023-11-07 14:23:34.700317+08', '2023-11-07 14:23:34.700317+08', ${item.roletypeid ? `'${item.roletypeid}'` : 'NULL'}, '${item.javapath}')`).join(',\n')};
      `
      const template = `
        -- ********************** 第一步 **********************

        begin;

        DROP TABLE if exists a3_uc_custom_role;

        CREATE TABLE a3_uc_custom_role(
          type text COLLATE pg_catalog."default",
          id SERIAL       NOT NULL,
          name text COLLATE pg_catalog."default" NOT NULL,
          description text COLLATE pg_catalog."default",
          created timestamp with time zone,
          modified timestamp with time zone,
          roletypeid text COLLATE pg_catalog."default",
          javapath text,
          PRIMARY KEY (id)
        );

        ${str}

      
        insert into uc_custom_role (
          type,
          name,
          description,
          created,
          modified,
          roletypeid,
          javapath
        )
        select  r2.type,
                r2.name,
                r2.description,
                r2.created,
                r2.modified,
                r2.roletypeid,
                r2.javapath
        from a3_uc_custom_role r2 left join uc_custom_role r1 on r2.name = r1.name
        where r2.name is not null
        and r1.name is null;

        update uc_custom_role a
        set type = b.type,
        name = b.name,
        description = b.description,
        javapath = b.javapath
        from a3_uc_custom_role b
        where a.name = b.name;

        DROP TABLE if exists a3_uc_custom_role;

        commit;
      `
      return template
    },

    /**
     * 查询 uc_menu_role_update 表
     */
    deal_uc_menu_role_update_result(rows) {
      if (rows.length === 0) {
        return ''
      }
      const str = `
        INSERT INTO "public"."uc_menu_role_update" ("id", "is_delete", "key", "name", "parent_id", "parent_key", "parent_left", "parent_right", "index", "is_tab", "application_id", "enabled", "icon_id", "icon_url", "description", "app_link", "data_flag", "mobile_module", "mobile_model", "category_code", "component_path", "mobile_show_type", "iconfont", "router_name", "router_param", "app_key", "app_name", "app_is_delete", "app_is_standard", "app_enabled", "app_app_version", "app_app_link", "app_app_ico", "app_icon_url", "app_app_announcement", "app_sort_index", "app_iconfont", "view_name", "view_type", "view_key", "view_is_delete", "role_type", "role_name", "role_description") VALUES
          ${rows.map(item => `(${item.id}, ${item.is_delete}, '${item.key}', '${item.name}', ${item.parent_id}, ${item.parent_key}, ${item.parent_left}, ${item.parent_right}, ${item.index}, ${item.is_tab}, ${item.application_id}, ${item.enabled}, ${item.icon_id}, ${item.icon_url}, ${item.description}, ${item.app_link}, ${item.data_flag}, ${item.mobile_module}, ${item.mobile_model}, ${item.category_code}, ${item.component_path}, ${item.mobile_show_type}, ${item.iconfont}, ${item.router_name}, ${item.router_param}, ${item.app_key}, ${item.app_name}, ${item.app_is_delete}, ${item.app_is_standard}, ${item.app_enabled}, ${item.app_app_version}, ${item.app_app_link}, ${item.app_app_ico}, ${item.app_icon_url}, ${item.app_app_announcement}, ${item.app_sort_index}, ${item.app_iconfont}, ${item.view_name}, ${item.view_type}, ${item.view_key}, ${item.view_is_delete}, ${item.role_type}, ${item.role_name}, ${item.role_description})`).join(',\n')};
      `
      const template = `
         -- ********************** 第二步 **********************
        begin;
    
        DROP TABLE IF EXISTS uc_menu_role_update;
        CREATE  TABLE uc_menu_role_update
        (
            id                   SERIAL       NOT NULL,
            is_delete            INT,
            key                  VARCHAR(128) NOT NULL,
            name                 varchar(128),
            parent_id            INT,
            parent_key           VARCHAR(128),
            parent_left          INT,
            parent_right         INT,
            index                INT,
            is_tab               boolean,
            application_id       INT,
            enabled              integer,
            icon_id              BIGINT,
            icon_url             character varying(128) COLLATE pg_catalog."default",
            description          character varying(128) COLLATE pg_catalog."default",
            app_link             character varying(128) COLLATE pg_catalog."default",
            data_flag            integer,
            mobile_module        character varying(128) COLLATE pg_catalog."default",
            mobile_model         character varying(128) COLLATE pg_catalog."default",
            category_code        character varying(256) COLLATE pg_catalog."default",
            component_path       character varying(60) COLLATE pg_catalog."default",
            mobile_show_type     character varying(20) COLLATE pg_catalog."default",
    
            iconfont             varchar(64),
            router_name          VARCHAR(64),
            router_param         text,
    
            app_key              varchar(128),
            app_name             varchar(128),
            app_is_delete        INT,
    
            app_is_standard      integer,
            app_enabled          integer,
            app_app_version      text COLLATE pg_catalog."default" DEFAULT ''::character varying,
            app_app_link         text COLLATE pg_catalog."default" DEFAULT ''::character varying,
            app_app_ico          bigint,
            app_icon_url         text COLLATE pg_catalog."default" DEFAULT ''::character varying,
            app_app_announcement text COLLATE pg_catalog."default" DEFAULT ''::text,
            app_sort_index       integer,
    
            app_iconfont         VARCHAR(128),
    
            view_name            varchar(128),
            view_type            varchar(128),
            view_key             VARCHAR(128),
            view_is_delete       INT,
            role_type            text,
            role_name            text,
            role_description     text,
            PRIMARY KEY (id)
        );
    
        ${str}
    
        -- app 数据导入
        
        INSERT INTO uc_ui_application(is_delete,
                                      create_time,
                                      update_time,
                                      key,
                                      name,
                                      is_standard,
                                      enabled,
                                      app_version,
                                      app_link,
                                      app_ico,
                                      icon_url,
                                      app_announcement,
                                      sort_index,
                                      iconfont)
        select distinct mru.app_is_delete,
                        now(),
                        now(),
                        mru.app_key,
                        mru.app_name,
                        mru.app_is_standard,
                        mru.app_enabled,
                        mru.app_app_version,
                        mru.app_app_link,
                        mru.app_app_ico,
                        mru.app_icon_url,
                        mru.app_app_announcement,
                        mru.app_sort_index,
                        mru.app_iconfont
        from uc_menu_role_update mru
                left join uc_ui_application app on
            mru.app_key = app.key
        where app.key is null
          and mru.app_key is not null;
        
        -- 更新app属性
        update uc_ui_application app
        set is_delete        = mru.app_is_delete,
            update_time      = now(),
            key              = mru.app_key,
            name             = mru.app_name,
            is_standard      = mru.app_is_standard,
            enabled          = mru.app_enabled,
            app_version      = mru.app_app_version,
            app_link         = mru.app_app_link,
            app_ico          = mru.app_app_ico,
            icon_url         = mru.app_icon_url,
            app_announcement = mru.app_app_announcement,
            sort_index       = mru.app_sort_index,
            iconfont         = mru.app_iconfont
        from uc_menu_role_update mru
        
        where mru.app_key = app.key
          and mru.app_key is not null;
        
        
        
        -- select * from uc_ui_application;
        
        -- select * from uc_ui_application;
        
        
        -- 更新菜单数据
        
        
        INSERT INTO uc_ui_menu(is_delete,
                              create_time,
                              update_time,
                              key,
                              name,
        --                                  parent_id,
                              parent_left,
                              parent_right,
                              index,
                              is_tab,
        --                           application_id,
                              application_key,
                              enabled,
                              icon_id,
                              icon_url,
                              description,
                              app_link,
                              data_flag,
                              mobile_model,
                              mobile_module,
                              category_code,
                              component_path,
                              mobile_show_type,
                              iconfont,
                              router_name,
                              router_param)
        select distinct mru.is_delete,
                        now(),
                        now(),
                        mru.key,
                        mru.name,
                        mru.parent_left,
                        mru.parent_right,
                        mru.index,
                        mru.is_tab,
                        mru.app_key,
                        mru.enabled,
                        mru.icon_id,
                        mru.icon_url,
                        mru.description,
                        mru.app_link,
                        mru.data_flag,
                        mru.mobile_model,
                        mru.mobile_module,
                        mru.category_code,
                        mru.component_path,
                        mru.mobile_show_type,
                        mru.iconfont,
                        mru.router_name,
                        mru.router_param
        from uc_menu_role_update mru
                left join uc_ui_menu m on
            mru.key = m.key
        where m.key is null
          and mru.key is not null;
        
        -- 更新menu 属性
        update uc_ui_menu m
        set is_delete        = mru.is_delete,
            update_time      = now(),
            key              = mru.key,
            name             = mru.name,
            parent_left      = mru.parent_left,
            parent_right     = mru.parent_right,
            index            = mru.index,
            is_tab           = mru.is_tab,
            application_key  = mru.app_key,
            enabled          = mru.enabled,
            icon_id          = mru.icon_id,
            icon_url         = mru.icon_url,
            description      = mru.description,
            app_link         = mru.app_link,
            data_flag        = mru.data_flag,
            mobile_model     = mru.mobile_model,
            mobile_module    = mru.mobile_module,
            category_code    = mru.category_code,
            component_path   = mru.component_path,
            mobile_show_type = mru.mobile_show_type,
            iconfont         = mru.iconfont,
            router_name      = mru.router_name,
            router_param     = mru.router_param
        from uc_menu_role_update mru
        where mru.key = m.key
          and mru.key is not null;
        
        
        -- 匹配菜单的app id
        update uc_ui_menu m
        set application_id = (select id from uc_ui_application t1 where t1.key = m2.application_key)
        from uc_ui_menu m2
        where m2.key = m.key;
        
        -- 匹配菜单的 parent——id
        
        update uc_ui_menu m
        set parent_id = (select id from uc_ui_menu t1 where t1.key = mru.parent_key)
        from uc_menu_role_update mru
        where mru.key = m.key;
        
        
        -- 删掉重复的菜单
    
          delete
        from uc_ui_menu
        where id in (
            select max(id) as id1
            from uc_ui_menu
            group by key
            having count(id) > 1
              and key is not null
        );
    
        -- 更新 view
        
        
        INSERT INTO uc_ui_view (is_delete,
                                create_time,
                                update_time,
                                key,
                                name,
                                type,
                                menu_key)
        select distinct mru.view_is_delete,
                        now(),
                        now(),
                        mru.view_key,
                        mru.view_name,
                        mru.view_type,
                        mru.key
        from uc_menu_role_update mru
                left join uc_ui_view v on
            mru.view_key = v.key
        where v.key is null;
        
        -- 更新view属性
        update uc_ui_view v
        set is_delete   = mru.view_is_delete,
            update_time = now(),
            key         = mru.view_key,
            name        = mru.view_name,
            type        = mru.view_type,
            menu_key    = mru.key
        from uc_menu_role_update mru
        
        where mru.view_key = v.key
          and mru.view_key is not null;
        
        -- 查看重复的view
        select max(id) as id1, key
        from uc_ui_view
        group by key
        having count(id) > 1
          and key is not null;
        -- 删除重复多余的view
        delete
        from uc_ui_view
        where id in (
            select max(id) as id1 from uc_ui_view group by key having count(id) > 1 and key is not null
        );
        -- 删除view中 key为null的脏数据
        delete
        from uc_ui_view
        where key is null;
        
        -- 匹配菜单的menu id
        update uc_ui_view v
        set uimenuid = (select id from uc_ui_menu t1 where t1.key = v2.menu_key and t1.is_delete = 0)
        from uc_ui_view v2
        where v.key = v2.key;
        
        
        
        -- 更新view role mapping
        
        
        -- 导入临时表数据
        
        drop table if exists t11;
        create  table t11
        (
            id        SERIAL primary key,
            uiviewid  int,
            view_key  text,
            role_name text,
            roleid    int
        );
        
        INSERT INTO t11 (view_key,
                        uiviewid,
                        roleid,
                        role_name)
        select distinct mru.view_key,
                        v.id,
                        r.id,
                        mru.role_name
        from uc_menu_role_update mru
                left join uc_ui_view v on v.key = mru.view_key
            and v.is_delete = 0
                left join uc_custom_role r on mru.role_name = r.name
        where mru.view_key is not null
          and mru.role_name is not null;
        
        
        INSERT INTO uc_ui_view_base_role_mapping (uiviewid,
                                                  roleid)
        select distinct t.uiviewid, t.roleid
        from t11 t
                left join uc_ui_view_base_role_mapping vr on
            t.uiviewid = vr.uiviewid and t.roleid = vr.roleid
        where vr.uiviewid is null;
        
        
        
        -- select * from uc_ui_view_base_role_mapping;
        
        -- 删除 脏数据
        delete
        from uc_ui_view_base_role_mapping
        where id in (
            select vr.id
            from uc_ui_view_base_role_mapping vr
                    left join t11 t on t.uiviewid = vr.uiviewid
                and t.roleid = vr.roleid
            where t.uiviewid is null
              and vr.roleid is null
        );
        
        
        commit;
    
        DROP TABLE IF EXISTS uc_menu_role_update;
        drop table if exists t11;
      `
      return template
    },

    dealNull(value, isNumber = true) {
      if (isNumber) {
        return value ?? 'NULL'
      } else {
        return value ? `'${value}'` : 'NULL'
      }
    },

    generateAcl(template) {
      
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
  }
}
</script>

<style scoped>
  .generate-acl {
    display: flex;
  }
  .generate-acl-javapath,
  .generate-acl-code {
    flex: 1;
  }
</style>