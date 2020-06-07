const sequelize = require("sequelize");
const db = require("../db/db");

const User = db.define("User", {
    id: {type: sequelize.STRING, primaryKey: true},
    email: {type: sequelize.STRING},
    password: {type: sequelize.STRING},
    resetToken:{type: sequelize.STRING, defaultValue: ""},
    resetExpire:{type: sequelize.DATE, defaultValue: ""}
});

module.exports = User;
