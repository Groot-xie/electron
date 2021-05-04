import { ipcMain, Notification } from 'electron'

ipcMain.on('notification', (event, params) => {
  const notification = new Notification(params)
  notification.show()
})