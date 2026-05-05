// PM2 process manager configuration
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup        ← survive reboots

module.exports = {
  apps: [
    {
      name:             'salesorbit',
      script:           './server.js',
      cwd:              __dirname,

      instances:        1,          // increase to 'max' for multi-core if needed
      exec_mode:        'fork',

      autorestart:      true,
      watch:            false,
      max_memory_restart: '512M',

      // Log files
      error_file:       '/var/log/salesorbit/error.log',
      out_file:         '/var/log/salesorbit/out.log',
      log_date_format:  'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:       true,

      // Environment — override anything not set in .env
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
