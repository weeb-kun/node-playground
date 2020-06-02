const sequelize = require("sequelize");
const db = require("../db/db");

const User = db.define("User", {
    id: {type: sequelize.STRING, primaryKey: true}
});

module.exports = User;
