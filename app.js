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
const client = require("twilio")("ACeb8ba37f4f37774e9267194c88ab19b6", "46a19ddaae2df52f4ebac2d536c45d3b");
const Twiml = require("twilio").twiml.MessagingResponse;

const app = express();

app.get("/", (req, res) => {
    res.send("whatsapp://send?phone=+14155238886");
});

app.post("/whatsapp", (req, res) => {
    const twiml = new Twiml();
    twiml.message("hello from cgradestogo.");
    res.writeHead(200, {"content-Type": "text/xml"});
    res.end(twiml.toString());
});

app.listen(5000, () => console.log("server started on port 5000"));