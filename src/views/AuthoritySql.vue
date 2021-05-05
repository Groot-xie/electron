<template>
  <div class="authority-sql">
    <div class="authority-sql-tools">
      <a-button type="primary" icon="import" @click="importFile" style="margin-right: 12px;">导入</a-button>
      <a-button type="primary" icon="save" @click="saveFile">保存</a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      bordered
      :pagination="false"
      rowKey="id"
    >
      <template slot="principalId" slot-scope="itemData, rowData, index">
        <div v-if="principalIdEditArr.includes(rowData.id)">
          <a-input
            :ref="`principalId-${rowData.id}`"
            v-model="rowData.principalId"
            @keyup.enter="handleValueChange(rowData, 'principalId', 'principalIdEditArr')"
            @blur="handleValueChange(rowData, 'principalId', 'principalIdEditArr')"
          />
        </div>
        <span v-else>
          <a-button type="link" icon="edit" @click="handlePrincipalIdState(rowData.id, 'principalId', 'principalIdEditArr')"></a-button>
          {{ itemData }}
        </span>
      </template>


      <template slot="isNew" slot-scope="itemData, rowData">
        <a-checkbox v-model="rowData.isNew"></a-checkbox>
      </template>

      <template slot="desc" slot-scope="itemData, rowData, index">
        <div v-if="rowData.isNew && descEditArr.includes(rowData.id)">
          <a-input
            :ref="`desc-${rowData.id}`"
            v-model="rowData.desc"
            @keyup.enter="handleValueChange(rowData, 'desc', 'descEditArr')"
            @blur="handleValueChange(rowData, 'desc', 'descEditArr')"
          />
        </div>
        <span v-else>
          <a-button v-if="rowData.isNew" type="link" icon="edit" @click="handlePrincipalIdState(rowData.id, 'desc', 'descEditArr')"></a-button>
          {{ itemData }}
        </span>
      </template>

      <template slot="featuresMap" slot-scope="itemData, rowData, index">
        <div v-for="(tag, tabIndex) in itemData" :key="tag">
          <a-tag closable @close="() => handleCloseTag(rowData, tabIndex)">
            {{ tag }}
          </a-tag>
        </div>
        <template>
          <a-input
            v-if="featuresMapEditArr.includes(rowData.id)"
            :ref="`featuresMap-${rowData.id}`"
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

       <template slot="action" slot-scope="itemData, rowData, index">
         <a-button type="link" @click="remove(rowData.id)" icon="delete"></a-button>
       </template>

      <template slot="title" slot-scope="currentPageData">
        <div class="table-title">
          <a-button
            type="link"
            icon="plus"
            size="small"
            @click="addRow"
          />
        </div>
      </template>
    </a-table>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

const fs = require('fs')

export default {
  name: 'AuthoritySql',
  data() {
    return {
      fileName: undefined,
      columns: [
        {
          title: '接口-principalId',
          dataIndex: 'principalId',
          key: 'principalId',
          ellipsis: true,
          width: 350,
          scopedSlots: { customRender: 'principalId' }
        },
        {
          title: '是否新增',
          dataIndex: 'isNew',
          key: 'isNew',
          width: 120,
          scopedSlots: { customRender: 'isNew' },
        },
        {
          title: '描述',
          dataIndex: 'desc',
          key: 'desc',
          width: 200,
          ellipsis: true,
          scopedSlots: { customRender: 'desc' },
        },
        {
          title: '对应功能点',
          dataIndex: 'featuresMap',
          key: 'featuresMap',
          scopedSlots: { customRender: 'featuresMap' },
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
      tagValue: {},
      principalIdEditArr: [],
      descEditArr: [],
      featuresMapEditArr: []
    }
  },
  methods: {
    /**
     * @description 切换PrincipalId的编辑状态
     * @param { number } id rowData-id
     * @param { string } field 字段名称
     * @param { string } editArrName 对应的编辑数组
     */
    handlePrincipalIdState(id, field, editArrName) {
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
      if (rowData.featuresMap.includes(value)) return this.$message.error('有重复项！')
      rowData.featuresMap.push(this.tagValue[rowData.id])
      this.tagValue[rowData.id] = ''
      const index = this.featuresMapEditArr.findIndex(item => item === rowData.id)
      this.featuresMapEditArr.splice(index, 1)
    },
    /**
     * @description 展示tag输入框
     * @param { number } id 行id
     */
    showTagInput(id) {
      this.featuresMapEditArr.push(id)
      this.$nextTick(() => {
        this.$refs[`featuresMap-${id}`]?.focus()
      })
    },
    /**
     * @description 处理关闭tag
     * @param { object } rowData 行数据
     * @param { number } index tag的index
     */
    handleCloseTag(rowData, index) {
      rowData.featuresMap.splice(index, 1)
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
        principalId: '',
        isNew: false,
        desc: '',
        featuresMap: []
      })
      this.principalIdEditArr.push(id)
      this.$nextTick(() => {
        this.$refs[`principalId-${id}`]?.focus()
      })
    },
    /**
     * @description 校验数据
     * @return { boolean } false: 通过 true: 不通过
     */
    checkData() {
      const errorItem = this.data.find(item => !item.principalId || item.featuresMap.length <= 0)
      if (errorItem) {
        if (!errorItem.principalId) {
          this.$message.error('接口-principalId不能为空')
        } else if (errorItem.featuresMap.length <= 0) {
          this.$message.error('功能点不能为空')
        }
      }
      return !errorItem
    },
    /**
     * @description 导入sql脚本
     */
    importFile() {
      const position = ipcRenderer.sendSync('dialog.showOpenDialogSync', {
        message: '请选择sql脚本',
        properties: ['openFile'],
        filters: [
          { name: 'sql', extensions: ['sql'] }
        ]
      })
     
      if (position && position[0]) {
        fs.readFile(position[0], 'utf-8', (error, data) => {
          if (error) {
            this.$message.error('导入失败！')
          } else {
            try {
              if (/(\-\- \[{.*}\])/.test(data)) {
                let str = RegExp.$1
                str = str.replace('-- ', '')
                console.log(str)
                this.data = JSON.parse(str)
                this.$message.success('导入成功！')
                let pathArr = position[0].split('/')
  
                this.fileName = pathArr[pathArr.length - 1]
              } else {
                throw new Error('error')
              }
            } catch (error) {
              this.$message.error('解析失败，请检查文件！')
            } 
          }
        })
      }
    },
    /**
     * @description 保存文件
     */
    saveFile() {
      if (!this.checkData()) return
      const position = ipcRenderer.sendSync('dialog.showSaveDialogSync', {
        title: '保存sql文件',
        defaultPath: this.fileName ? this.fileName : `${Date.now()}.sql`,
        nameFieldLabel: 'sql名：',
        properties: ['createDirectory']
      })
      
      if (position) {
        let data = ''
        // 处理新增
        this.data.filter(item => item.isNew).forEach(item => {
          data += 
`
  DO
  $$
      BEGIN
          IF NOT EXISTS(select * from uc_custom_role where name ='${item.principalId}')
          THEN
            INSERT INTO uc_custom_role (type, name, description, created, modified) VALUES (null, '${item.principalId}', '${item.desc}', now(), now());
          END IF;
      END
  $$;
`
        })
        // 处理功能点
        this.data.forEach(item => {
          item.featuresMap.forEach(feature => {
            data += 
`
  DO
  $$
      BEGIN
          IF NOT EXISTS(select *
                        from uc_ui_view_base_role_mapping
                        where uiviewid =
                              (select id from uc_ui_view where key = '${feature}')
                          and roleid = (select id from uc_custom_role where name = '${item.principalId}'))
          THEN
              insert into uc_ui_view_base_role_mapping (uiviewid,
                                                        roleid)
              values ((select id from uc_ui_view where key = '${feature}'),
                      (select id from uc_custom_role where name = '${item.principalId}'));
          END IF;
      END
  $$;
`
          })
        })
        data += `\n-- ${JSON.stringify(this.data)}`
        fs.writeFile(position, data, 'utf-8', error => {
          if (error) {
            this.$message.error('保存失败！')
          } else {
            this.fileName = undefined
            this.data = []
            this.$message.success('保存成功！')
          }
        })
      }
    }
  }
}
</script>

<style scoped>
  .authority-sql {
    padding: 24px;
  }
  .table-title {
    text-align: left;
  }
  .authority-sql-tools {
    display: flex;
    align-content: center;
    justify-content: flex-end;
    height: 40px;
  }
</style>