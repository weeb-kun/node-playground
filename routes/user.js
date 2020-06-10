/*
   Copyright 2020 CGradesToGo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const passport = require("passport");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {Op} = require("sequelize");
const nexmo = require("../config/nexmo");

router.route("/register")
.get((req, res) => res.render("register"))
.post((req, res) => {
    User.findOne({ where: {email: req.body.email}})
        .then(user => {
            if(user){
                res.render("user/register", {
                    error: user.email + " already registered"
                });
            } else {
                nexmo.verify.request({
                    number: req.body.phone,
                    brand: "CGradesToGo",
                    code_length: "6"
                }, (err, result) => {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            User.create({ id: uuid.v4(),  email: req.body.email, password: hash, phone: req.body.phone})
                            .then(user => {
                                res.redirect(`/user/verifyPhone/${result.request_id}`);
                            })
                            .catch(err => {
                                console.error(err);
                                res.sendStatus(500);
                            });
                        });
                    });
                });
            }
        });
});

router.route("/verifyPhone/:id")
.get((req, res) => {
    res.render("verifyPhone", {id: req.params.id});
})
.post((req, res) => {
    nexmo.verify.check({
        request_id: req.params.id,
        code: req.body.code
    }, (err, result) => {
        if(result.status === "0"){
            res.redirect("/user/login");
        } else {
            console.log(result);
            res.sendStatus(400);
        }
    })
});

router.route("/login")
.get((req, res) => res.render("login"))
.post((req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/user/login"
    })(req, res, next);
});

router.route("/forgetpw")
.get((req, res) => res.render("forgot"))
.post((req, res, next) => {
    crypto.randomBytes(20, (err, buffer) => {
        User.findOne({where:{email: req.body.email}})
        .then(user => {
            if(!user) {
                res.redirect("/user/forgetpw");
            }
            user.resetToken = buffer.toString("hex");
            user.resetExpire = Date.now() + (60 * 60 * 1000);
            user.save()
            .then(user => {
                const smtp = nodemailer.createTransport({
                    service: "Gmail",
                    auth:{
                        user: "cgradestogo@gmail.com",
                        pass: process.env.gmailpw
                    }
                });
                smtp.sendMail({
                    to: user.email,
                    from: "cgradestogo@gmail.com",
                    subject: "test password reset",
                    text: `Use this link to reset your password:\n\nhttp://${req.headers.host}/user/reset/${buffer.toString("hex")}`
                }, err => {
                    if(err) return next(err);
                    res.redirect("/");
                });
            });
        });
    });
});

router.route("/reset/:token")
.get((req, res) => {
    User.findOne({where:{resetToken: req.params.token, resetExpire: {[Op.gt]: Date.now()}}})
    .then(user => {
        if(!user){
            res.redirect("/");
        }
        res.render("reset", {token: req.params.token})
    })
})
.post((req, res) => {
    User.findOne({ resetToken: req.params.token, resetExpire: {[Op.gt]: Date.now()}})
    .then(user => {
        if(!user){
            return res.redirect("back");
        }
        if(req.body.password === req.body.confirm){
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.password, salt, (err, hash) => {
                    user.resetToken = "";
                    user.resetExpire = "";
                    user.password = hash;
                    user.save()
                    .then(user => {
                        res.redirect("/user/login");
                    })
                })
            })
        } else {
            res.redirect("back");
        }
    })
});

function paginate(model){
    return async (req, res, next) => {
        res.results =  await model.findAndCountAll({limit: parseInt(req.query.limit), offset: (parseInt(req.query.page) - 1) * parseInt(req.query.limit)});
        next();
    }
}

router.get("/", paginate(User), (req, res) => {
    res.render("user/users", {users: res.results.rows, paginator: {limit: Math.ceil(res.results.count / parseInt(req.query.limit)), defaultPage: "user", currentPage: parseInt(req.query.page), totalPages: Math.ceil(res.results.count / parseInt(req.query.limit))}});
});

module.exports = router;