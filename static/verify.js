window.addEventListener("DOMContentLoaded", ()=>{
    const verifyBtn=document.getElementById("submit-btn");
    verifyBtn.addEventListener("click", e=>{
        e.preventDefault();
        register()
    });
})

function register() {
    
    const emailInput=document.getElementById("email");
    const email=localStorage.getItem("email");
    const otp=emailInput.value;
    fetch("/auth/verify-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"  // Specify JSON content type
        },
        body: JSON.stringify({
            email,
            otp
        })
    }).then(res => {
        return res.json();
    }).then(res=>{
        if(!res.success) {
            if(res.err=="invalid-credentials") {
                alert("Incorrect OTP");
            } else {
                console.log("An error occurred!");
            }
            return;
        }

        if(res.userData) {
            localStorage.setItem("sessionToken", res.token);
            localStorage.setItem("userData", JSON.stringify(res.userData));
            window.location.href="option.html";
        } else {
            localStorage.setItem("reg-token", res.token);
            window.location.href="detail.html";
        }
    }).catch(err=>{
        console.log(err);
    })
}