<template>
  <DefaultLayout>
    <template #title>
      <a-button type="primary" icon="save" @click="exportSql">生成sql</a-button>
    </template>

    <div class="authority-sql">
      <a-table
        :columns="columns"
        :data-source="data"
        bordered
        :pagination="false"
        rowKey="id"
      >
        <template slot="title" slot-scope="currentPageData">
              <!-- :loading="!done" -->

          <div class="table-title">
            目标项&属性
            <a-button
              type="link"
              icon="plus"
              size="small"
              @click="addRow"
            />
          </div>
        </template>

        <template slot="action" slot-scope="itemData, rowData, index">
          <a-button type="link" @click="remove(rowData.id)" icon="delete"></a-button>
        </template>

        <template slot="code" slot-scope="itemData, rowData, index">
          <div v-if="codeEditArr.includes(rowData.id)">
            <a-input
              :ref="`code-${rowData.id}`"
              v-model="rowData.code"
              @keyup.enter="handleValueChange(rowData, 'code', 'codeEditArr')"
              @blur="handleValueChange(rowData, 'code', 'codeEditArr')"
            />
          </div>
          <span v-else>
            <a-button type="link" icon="edit" @click="handleCodeState(rowData.id, 'code', 'codeEditArr')"></a-button>
            {{ itemData }}
          </span>
        </template>
      
        <template slot="childCodes" slot-scope="itemData, rowData, index">
          <div v-for="(tag, tabIndex) in itemData" :key="tag">
            <a-tag closable @close="() => handleCloseTag(rowData, tabIndex)">
              {{ tag }}
            </a-tag>
          </div>
          <template>
            <a-input
              v-if="childCodesEditArr.includes(rowData.id)"
              :ref="`childCodes-${rowData.id}`"
              type="text"
              size="small"
              :style="{ width: '300px' }"
              :value="tagValue[rowData.id]"
              @change="handleTagInputChange($event, rowData.id)"
              @blur="handleTagInputConfirm(rowData)"
              @keyup.enter="handleTagInputConfirm(rowData)"
            />
            <a-tag v-else style="background: #fff; borderStyle: dashed;" @click="showTagInput(rowData.id)">
              <a-icon type="plus" />
            </a-tag>
          </template>
        </template>
      </a-table>

      <h3 style="margin-top: 24px;">功能点与目标项的关联关系</h3>
      <a-textarea :placeholder="placeholder" :rows="28" v-model="bindValue" />
    </div>
  </DefaultLayout>
</template>

<script>
import { ipcRenderer } from 'electron'
import DefaultLayout from '@/components/DefaultLayout.vue'

const fs = require('fs')

export default {
  name: 'TargetItem',
  data() {
    return {
      fileName: undefined,
      columns: [
        {
          title: 'code',
          dataIndex: 'code',
          key: 'code',
          ellipsis: true,
          width: 350,
          scopedSlots: { customRender: 'code' }
        },
        {
          title: '属性code',
          dataIndex: 'childCodes',
          key: 'childCodes',
          scopedSlots: { customRender: 'childCodes' },
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          width: 100,
          scopedSlots: { customRender: 'action' },
        }
      ],
      data: [],
      bindValue: '',
      tagValue: {},
      codeEditArr: [],
      childCodesEditArr: [],
      done: true,
      placeholder: `
        用换行分割，例如：
        TM-EquipmentManagementMenu-Action-Export		pt.permission.group
        TM-LeaveListMenu-Action-ViewDetail		hr.department
      `
    }
  },
  methods: {
    /**
     * 导出sql
     */
    exportSql() {
      if (this.data.length === 0 && this.bindValue.trim() === '') {
        return this.$message.error('空')
      } else {
        this.connectDatabase();
      }
    },

    /**
     * 链接数据库
     */
    connectDatabase() {
      // 发送请求到主进程
        this.done = false;
        const sql = [];

        // 目标项
        const targetItems = this.data.map(item => `'${item.code}'`).join(',');
        if (targetItems.length) {
          sql.push(`select * from uc_role_award_goal_item_rule_define where code in (${targetItems})`);
        } else {
          sql.push(`select * from uc_role_award_goal_item_rule_define where code = 'xxhxxhxxh'`);
        }
        // 目标项属性
        const childItems = this.data.reduce((result, next) => {
          result.push(...next.childCodes.map(childCode => ({ code: next.code, childCode })));
          return result
        }, [])
        if (childItems.length) {
          sql.push(`select * FROM uc_role_award_goal_item_property_define WHERE ${childItems.map(item => `(code= '${item.childCode}' AND rule_define_code= '${item.code}')`).join(' OR ')}`)
        } else {
          sql.push(`select * FROM uc_role_award_goal_item_property_define WHERE code= 'xxhxxhxxh' AND rule_define_code = 'xxhxxhxxh'`)
        }
        // 功能点和目标项的绑定关系
        if (this.bindValue.trim()) {
          const list = this.bindValue.trim().split(/\r\n|\n/).map(item => item.split(/\s+/)).filter(item => item[0] && item[1]);
          sql.push(`select * FROM uc_permission_mdf_relation WHERE ${list.map(item => `permission_code = '${item[0]}' AND goal_item_rule_define_code = '${item[1]}'`).join(' OR ')}`)
        }

        ipcRenderer.send('connect-to-TargetItem-database', 'JAVA_210', sql);
        
        // 接收主进程的响应
        ipcRenderer.on('connect-to-TargetItem-database-response', (event, res) => {
          // 处理数据库响应
          if (this.done) return;
          this.done = true
          if (!res) {
            this.$message.error('出错！！！')
            return
          }
          if (res[0].length === 0 && res[1].length === 0 && res[2].length === 0) {
            this.$message.error('未查询到任何数据！')
          } else {
            this.generateSql(res[0], res[1], res[2]);
          }
        });
    },

    /**
     * 生成sql文件
     */
    generateSql(items = [], itemsAttribute = [], bindMap = []) {
      let sql = '';

      if (items.length) {
        sql += `
          -- 新增目标项
          DO $$
          BEGIN
            ${
              items.reduce((result, next) => {
                result += `
                  -- ${next.name}
                  IF NOT EXISTS(select id from uc_role_award_goal_item_rule_define where code = '${next.code}')
                  THEN
                    INSERT INTO uc_role_award_goal_item_rule_define(code, table_name, name, is_delete, create_time, update_time) VALUES ('${next.code}', '${next.table_name}', '${next.name}',  0, NOW(),  NOW());
                  END IF;
                `
                return result;
              }, '')
            }
          END $$;
        `;
      }

      if (itemsAttribute.length) {
        sql += `
          -- 新增目标项的属性（过滤字段）
          DO $$
          BEGIN
            ${
              itemsAttribute.reduce((result, next) => {
                result += `
                  IF NOT EXISTS (select id FROM uc_role_award_goal_item_property_define WHERE code = '${next.code}' AND rule_define_code = '${next.rule_define_code}')
                  THEN
                    INSERT INTO uc_role_award_goal_item_property_define (code, name, description, rule_define_code, data_type, input_type, operation_list, sort_index, column_name, is_delete, create_uid, create_time, update_uid, update_time, datasource_code, search_read) VALUES ('${next.code}', '${next.name}', null, '${next.rule_define_code}', ${next.data_type}, null, '${next.operation_list}', null, '${next.column_name}', 0, null, NOW(), null, NOW(), ${this.dealNull(next.datasource_code)}, null);
                  END IF;
                `
                return result;
              }, '')
            }
          END $$;
        `
      }

      if (bindMap.length) {
        sql += `
          -- 添加功能点与目标项的关联关系
          DO $$
          BEGIN
            ${
              bindMap.reduce((result, next) => {
                result += `
                  IF NOT EXISTS (select id FROM uc_permission_mdf_relation WHERE permission_code = '${next.permission_code}' AND goal_item_rule_define_code = '${next.goal_item_rule_define_code}')
                  THEN
                      INSERT INTO uc_permission_mdf_relation (permission_code,goal_item_rule_define_code,is_delete,create_time,update_time) VALUES ('${next.permission_code}','${next.goal_item_rule_define_code}',0,NOW(),NOW());
                  END IF;
                `
                return result;
              }, '')
            }
          END $$;
        `
      }

      const position = ipcRenderer.sendSync('dialog.showSaveDialogSync', {
        title: '保存sql文件',
        defaultPath: this.fileName ? this.fileName : `${Date.now()}.sql`,
        nameFieldLabel: 'sql名：',
        properties: ['createDirectory']
      })

      fs.writeFile(position, sql, 'utf-8', error => {
        if (error) {
          this.$message.error('保存失败！')
        } else {
          this.$message.success('保存成功！')
        }
      })
    },

    dealNull(data) {
      return data ? `'${data}'` : 'null'
    },

    /**
     * @description 切换code的编辑状态
     * @param { number } id rowData-id
     * @param { string } field 字段名称
     * @param { string } editArrName 对应的编辑数组
     */
    handleCodeState(id, field, editArrName) {
      const index = this[editArrName].findIndex(item => item === id)
      if (index === -1) {
        this[editArrName].push(id)
        this.$nextTick(() => {
          this.$refs[`${field}-${id}`]?.focus()
        })
      } else {
        this[editArrName].splice(index, 1)
      }
    },
    /**
     * @description 处理输入框变化
     * @param { object } rowData 行数据
     * @param { string } field 字段名称
     * @param { string } editArrName 对应的编辑数组
     */
    handleValueChange(rowData, field, editArrName) {
      if (!this[editArrName].includes(rowData.id)) return
      console.log('chufa111')
      const value = rowData[field].trim()
      if (value) {
        const index = this[editArrName].findIndex(item => item === rowData.id)
        this[editArrName].splice(index, 1)
      }
    },
    /**
     * @description 处理tag输入变化
     * @param { object } e 事件对象
     * @param { number } id rowId
     */
    handleTagInputChange(e, id) {
      this.tagValue[id] = e.target.value;
    },
    /**
     * @description 处理tag输入框确认
     * @param { object } rowData 当前行数据
     */
    handleTagInputConfirm(rowData) {
      const value = (this.tagValue[rowData.id] || '').trim()
      if (!value) return
      if (rowData.childCodes.includes(value)) return this.$message.error('有重复项！')
      rowData.childCodes.push(this.tagValue[rowData.id])
      this.tagValue[rowData.id] = ''
      const index = this.childCodesEditArr.findIndex(item => item === rowData.id)
      this.childCodesEditArr.splice(index, 1)
    },
    /**
     * @description 展示tag输入框
     * @param { number } id 行id
     */
    showTagInput(id) {
      this.childCodesEditArr.push(id)
      this.$nextTick(() => {
        this.$refs[`childCodes-${id}`]?.focus()
      })
    },
    /**
     * @description 处理关闭tag
     * @param { object } rowData 行数据
     * @param { number } index tag的index
     */
    handleCloseTag(rowData, index) {
      rowData.childCodes.splice(index, 1)
    },
    /**
     * @description 删除一行
     * @param { number } id 当前行id
     */
    remove(id) {
      const index = this.data.findIndex(item => item.id === id)
      this.data.splice(index, 1)
    },
    /**
     * @description 增加一行
     */
    addRow() {
      const id = Date.now()
      this.data.push({
        id,
        code: '',
        childCodes: []
      })
      this.codeEditArr.push(id)
      this.$nextTick(() => {
        this.$refs[`code-${id}`]?.focus()
      })
    },
  },
  components: {
    DefaultLayout
  }
}
</script>

<style scoped>
  .table-title {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
</style>