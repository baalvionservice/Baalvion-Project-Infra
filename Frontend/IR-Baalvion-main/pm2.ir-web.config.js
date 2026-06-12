// Production launch for the IR frontend (next start on :3027). Avoids pm2 shell
// arg-parsing issues by declaring args here.
module.exports = {
  apps: [
    {
      name: 'ir-web',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3027',
      interpreter: 'node',
      env: { NODE_ENV: 'production', PORT: '3027' },
    },
  ],
};
