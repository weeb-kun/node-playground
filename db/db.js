const sequelize = require("sequelize");

const db = new sequelize("test", "test", "test", {
    host:"localhost",
    dialect: "mysql",
    define: {
        timestamps: false,
        freezeTableName: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = db;