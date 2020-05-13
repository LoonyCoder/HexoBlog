const SftpPlugin = require('folder-sftp-upload')
const ftp = {
  host: '111.229.232.226',
  username: 'root',
  password: 'GMX1016++.',
  port: '22',
  url: '/root/plenilune/blog/',
  readyTimeout: 30000
}

const config = {
  ...ftp,
  dir: './public/',
  filterFile: null
}

const sp = new SftpPlugin(config)
sp.start()