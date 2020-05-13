const fs = require("fs");
const glob = require("glob");
const Client = require("ssh2-sftp-client");
const chalk = require("chalk");

const redLog = function() {
  console.log.call(null, chalk.red([...arguments]));
};

const greenLog = function() {
  console.log.call(null, chalk.green([...arguments]));
};

const blueLog = function() {
  console.log.call(null, chalk.blue([...arguments]));
};

const genMissionTime = ms => {
  const min = Math.floor((ms / 1000 / 60) << 0);
  const sec = Math.floor((ms / 1000) % 60);
  return min + "min:" + sec + "sec";
};

const sftp = new Client();

/***
 * 路径结尾要添加  '/'
 */
class SftpPlugin {
  // dir 本地目录格式 path.join(__dirname, '..', 'dist/')

  constructor({
    dir = "./dist/",
    url = "/www/",
    host = "192.168.0.1",
    port = "22",
    username = "username",
    password = "password",
    readyTimeout = 20000,
    filterFile = null
  } = {}) {
    // constructor是一个构造方法，用来接收类参数

    this.url = url;
    this.dir = dir;
    this.filterFile = filterFile;
    this.startTime = new Date().getTime(); // 开始时间
    this.endTime = null;
    this.config = {
      host, // 服务器地址
      port,
      username,
      password,
      readyTimeout
    };
  }

  start() {
    this.start = new Date().getTime(); // 开始时间
    this.put();
  }

  end() {
    this.end = new Date().getTime();
    const timeDiff = this.end - this.start;
    const time = genMissionTime(timeDiff);
    blueLog(`任务耗时:${time}`);
  }

  put() {
    // 自动上传到FTP服务器
    if (!this.dir) {
      redLog("无法上传SFTP,请检查参数");
      return;
    }

    sftp
      .connect(this.config)
      .then(() => {
        // 连接服务器
        blueLog(`连接成功...`);
        sftp
          .list(this.url)
          .then(list => {
            blueLog(`正在清理文件...`);
            this.deleteServerFile(list).then(() => {
              this.globLocalFile();
            });
          })
          .catch(err => {
            this.exError(err);
          });
      })
      .catch(err => {
        this.exError("sftp连接失败" + err);
      });
  }

  async deleteServerFile(list) {
    // 删除服务器上文件(夹)
    for (const fileInfo of list) {
      const path = this.url + fileInfo.name;

      if (fileInfo.type === "-") {
        await sftp.delete(path);
      } else {
        await sftp.rmdir(path, true);
      }
    }

    return new Promise(resovle => {
      resovle();
    });
  }

  globLocalFile() {
    // 获取本地路径所有文件

    glob(this.dir + "**", (er, files) => {
      // 本地目录下所有文件(夹)的路径

      files.splice(0, 1); // 删除路径../dist/

      if (this.filterFile && typeof this.filterFile === "function")
        files = files.filter(x => this.filterFile(x));

      this.uploadFileToSftp(files);
    });
  }

  async uploadFileToSftp(files) {
    // 传输文件到服务器
    for (const localSrc of files) {
      const targetSrc = localSrc.replace(
        this.dir.replace(/\\/g, "/"),
        this.url
      );

      if (fs.lstatSync(localSrc).isDirectory()) {
        // 是文件夹
        await sftp.mkdir(targetSrc);
        // console.log(`uploading: ${localSrc}->${targetSrc}`);
      } else {
        await sftp.put(localSrc, targetSrc);
      }
      greenLog(`uploading: ${localSrc}->${targetSrc}`);
    }

    blueLog("已上传至SFTP服务器!");

    sftp.end();
    this.end();
  }

  exError(err) {
    // 出错请调用此方法
    sftp.end();
    redLog("sftpError:", err);
  }
}

module.exports = SftpPlugin;
