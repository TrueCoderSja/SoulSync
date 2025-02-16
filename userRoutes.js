const router=require("express").Router();
const pool=require("./db");
const JToken=require("./config/jwt.json").JWT_SECRET;
const jwt=require("jsonwebtoken");

function verifyRequest(req, res, next) {
    const token = req.headers["authorization"];

    if(!token) {
        return res.status(403).json({
            success: false,
            err: "access-denied"
        });
    }

    try {
        const decoded=jwt.verify(token, JToken);
        if(!decoded.type=="session-token") {
            return res.status(403).json({
                success: false,
                err: "invalid-token"
            });
        }

        req.email=decoded.email;
        req.userid=decoded.emailID;
        next();
    } catch(err) {
        console.log("An error ocurred");
        console.log(err);
    }
}

router.use(verifyRequest);

router.get("/ping", (req, res)=>{
    res.send("User Routes is pinging...");
})

module.exports=router;