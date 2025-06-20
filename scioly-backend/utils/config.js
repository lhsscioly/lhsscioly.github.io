require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI
const ADMIN_KEY = process.env.ADMIN_KEY
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

module.exports = { MONGODB_URI, PORT, ADMIN_KEY, EMAIL_USER, EMAIL_PASS }