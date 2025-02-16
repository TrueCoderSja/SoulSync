const router=require("express").Router();
const appConf=require("./config/appconf.json");
const mailer=require("./mail");
const pool=require("./db");
const jwt=require("jsonwebtoken");
const JToken=require("./config/jwt.json").JWT_SECRET;

router.get("/ping", (req, res)=>{
    res.send("Auth is pinging");
});

router.post("/send-otp", async (req, res) => {
    const { email }=req.body;
    if(!email) {
        return res.json({
            success: false,
            err: "incomplete-data"
        });
    }

    const domain=email.substring(email.lastIndexOf('@') + 1);
    if(!appConf.allowedDomains.includes(domain)) {
        return res.json({
            success: false,
            err: "domain-not-allowed"
        });
    }

    try {
        const {otp}=await mailer.sendOTP(email);
        console.log(`Sent OTP: ${otp}`);
        

        await pool.query(
            `INSERT INTO otps (email, otp, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
             ON CONFLICT (email) 
             DO UPDATE SET otp = $2, expires_at = NOW() + INTERVAL '5 minutes'`,
            [email, otp]
        );

        res.json({
            success: true
        });
    } catch(err) {
        console.log("An error occurred");
        console.error(err);
    }
});

router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.json({
            success: false,
            err: "incomplete-data"
        });
    }

    try {
        // Retrieve OTP from database
        const result = await pool.query(`SELECT otp FROM otps WHERE email = $1`, [email]);

        if (result.rows.length === 0) {
            return res.json({
                success: false,
                err: "email-not-found"
            });
        }

        const dbOtp = result.rows[0].otp; // Extract the OTP

        if (otp === dbOtp) {

            const result=await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
            if(result.rows.length>0) {
                const resultRow=result.rows[0];
                const token=jwt.sign({userid: resultRow.user_id, email, name: resultRow.name, type: "session-token"}, JToken, {expiresIn: "1h"});
                return res.json({
                    success: true,
                    token,
                    userData: result.rows[0]
                })
            }

            const token = jwt.sign({ email, type: "reg-token" }, JToken, { expiresIn: "30d" });
        
            res.json({
                success: true,
                token
            });
        } else {
            res.json({
                success: false,
                err: "invalid-credentials"
            });
        }
    } catch (error) {
        console.error("Database error:", error);
        res.json({
            success: false,
            err: "server-error"
        });
    }
});

router.post("/register-user", async (req, res) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.json({
            success: false,
            err: "access-denied"
        });
    }

    let decoded;
    try {
        // Use try-catch instead of callback
        decoded = jwt.verify(token, JToken);
        if (decoded.type !== "reg-token") {
            return res.status(401).json({ success: false, err: "invalid-token" });
        }
    } catch (err) {
        return res.status(401).json({ success: false, err: "invalid-token" });
    }

    const { userid, name, gender, dob, phone } = req.body;
    if (!userid || !name || !gender || !dob || !phone) {
        return res.json({
            success: false,
            err: "incomplete-data"  // Fixed typo: "inocomplete-data" → "incomplete-data"
        });
    }

    try {
        await pool.query(
            `INSERT INTO users (user_id, email, name, gender, dob, phone, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userid, decoded.email, name, gender, dob, phone]
        );

        // Generate session token
        const sessionToken = jwt.sign({ userid: userid, email: decoded.email, name: name, type: "session-token" }, JToken, { expiresIn: "30d" });

        res.json({
            success: true,
            token: sessionToken  // Return the session token
        });

    } catch (err) {
        console.error("Database error:", err);
        res.json({
            success: false,
            err: "server-error"
        });
    }
});


module.exports=router;