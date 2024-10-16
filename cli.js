#!/usr/bin/env node  // 让系统识别为 Node.js 脚本

import { spawn } from 'child_process';// 使用 spawn 代替 exec
let expressProcess; // 存储 Express 服务器进程的引用

// 解析 CLI 参数
const args = process.argv.slice(2); // 获取传递的命令行参数
console.log(`Received CLI arguments: ${args}`);

// 启动 Express 服务器
function startExpress() {
  console.log('Starting Express server...');

  expressProcess = spawn('npm', ['run', 'express'], { stdio: 'inherit', shell: true });

  expressProcess.on('close', (code) => {
    console.log(`Express server exited with code ${code}`);
  });
}

// 停止 Express 服务器
function stopExpress() {
  if (expressProcess) {
    console.log('Stopping Express server...');
    expressProcess.kill('SIGTERM'); // 发送 SIGTERM 信号停止进程
  } else {
    console.log('No Express server is running.');
  }
}

// 主逻辑：根据 CLI 参数执行不同操作
if (args.includes('--start')) {
  startExpress();
} else if (args.includes('--stop')) {
  stopExpress();
} else {
  console.log('No valid command provided. Use --start to start the server and --stop to stop it.');
}
