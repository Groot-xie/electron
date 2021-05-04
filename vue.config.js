module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'com.electron.groot',
        productName: '脚本工具',
        copyright: 'Copyright © 2021 groot',
        mac: {
          icon: './public/icon.png'
        }
      }
    }
  }
}