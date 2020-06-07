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

const express = require("express");
//const client = require("twilio")("", "");
//const Twiml = require("twilio").twiml.MessagingResponse;
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const User = require("./models/User");
const exphbs = require("express-handlebars");
const cookieSession = require("cookie-session");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db/db");

const app = express();

app.engine("handlebars", exphbs({defaultLayout:"main"}));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
    secret: "cgradestogo",
    key:"adasd",
    cookie: {
        secure:false
    },
    resave:false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: "844416465405-l9dkr6e85svadu9hj3tshj23p3urjd2v.apps.googleusercontent.com",
    clientSecret: "B5cUM_DtRbEmmQgG2da2y3Xw",
    callbackURL: "http://localhost:5000/auth/google/callback",
    passReqToCallback: true
},
(request, accessToken, refreshToken, profile, done) => {
    User.findOrCreate({where: {id: profile.id}, defaults: {id: profile.id, email: profile.email}})
    .then(([user, created]) => {return done(null, user)});
}
));

passport.use(new LocalStrategy({usernameField: "email"}, (email, password, done) => {
    User.findOne({where: {email}})
        .then(user => {
            if(!user){
                return done(null, false, {message: "no user found."});
            }
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) throw err;
                if(match){
                    return done(null, user);
                } else {
                    return done(null, false, {message: "password incorrect."});
                }
            });
        })
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
    .then(user => done(null, user));
});

(() => {
    db.authenticate()
    .then(() => {
        db.sync({
            force: false
        }).then(() => {console.log("database synced")})
    }).catch(err => console.log(err));
})();

app.get("/", (req, res) => {
    res.sendStatus(200);
});

// app.post("/whatsapp", (req, res) => {
//     const twiml = new Twiml();
//     twiml.message("hello from cgradestogo.");
//     res.writeHead(200, {"content-Type": "text/xml"});
//     res.end(twiml.toString());
// });

app.get("/auth/google", (req, res, next) => {
    passport.authenticate("google", { scope: ["profile",
"email"]})(req, res, next);
});

app.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", {
        successRedirect: "/auth/google/success",
        failureRedirect: "/auth/google/failure"
    })(req, res, next);
});

app.get("/auth/google/success", (req, res) => {
    res.send(req.user.id);
});

app.get("/auth/google/failure", (req, res) => {
    res.sendStatus(400);
});

app.use("/user", require("./routes/user"));

app.listen(5000, () => console.log("server started on port 5000"));