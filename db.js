/** Database setup for BizTime. */

const { Client } = require('pg')

let DB_URI

if (process.env.NODE_ENV === 'test') {
    DB_URI = 'postgresql:///biztimefs_test'
} else {
    DB_URI = 'postgresql:///biztimefs'
}

let db = new Client({
    connectionString: DB_URI
})

db.connect();

module.exports = db