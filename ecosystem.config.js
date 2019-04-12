module.exports = {
  apps: [ {
    name: "shakeLogger",
    script: "./server_logger.js",
    env: {
      "NODE_ENV": "production",
    }
  },
  {
    name: "shakeWeb",
    script: "./server_web.js",
    env: {
      "NODE_ENV": "production",
    }
  } ]
}
