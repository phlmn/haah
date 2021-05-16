// this is a wrapper to be able to use haah with js instead of ts.

require('ts-node').register({ /* options */ })
module.exports = require('./index.ts');
