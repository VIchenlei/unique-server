module.exports = {
  dev: {
    connectionLimit: 20, // important
    // waitForConnections: true, // If true, the pool will queue the connection request and call it when one becomes available.

    host: '192.168.0.248',
    port: '3306',
    user: 'yadb',
    password: 'yadb@123',
    database: 'yaxt',
    charset: 'utf8',
    debug: false
  }
}