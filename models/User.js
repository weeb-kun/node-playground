const sequelize = require("sequelize");
const db = require("../db/db");

const User = db.define("User", {
    id: {type: sequelize.STRING, primaryKey: true},
    email: {type: sequelize.STRING},
    password: {type: sequelize.STRING},
    phone: { type:sequelize.STRING},
    resetToken:{type: sequelize.STRING, defaultValue: ""},
    resetExpire:{type: sequelize.DATE, defaultValue: sequelize.NOW}
});

module.exports = User;
