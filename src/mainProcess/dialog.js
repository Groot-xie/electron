import { ipcMain, dialog } from 'electron'

ipcMain.on('dialog.showOpenDialogSync', (event, params) => {
  const position = dialog.showOpenDialogSync(params)
  event.returnValue = position
})

ipcMain.on('dialog.showSaveDialogSync', (event, params) => {
  const position = dialog.showSaveDialogSync(params)
  event.returnValue = position
})
