window.addEventListener("DOMContentLoaded", ()=>{
    const email=localStorage.getItem("email");
    const sessionToken=localStorage.getItem("sessionToken");
    const userData=localStorage.getItem("userData");

    if(email && sessionToken && userData) {
        window.location.href="option.html";
    }
    
    const registerBtn=document.getElementById("register-btn");
    registerBtn.addEventListener("click", e=>{
        e.preventDefault();
        register()
    });
})

function register() {
    
    const emailInput=document.getElementById("email");
    const email=emailInput.value;
    fetch("/auth/send-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"  // Specify JSON content type
        },
        body: JSON.stringify({
            email: email
        })
    }).then(res => {
        return res.json();
    }).then(res=>{
        if(!res.success) {
            console.log("An error occurred");
            return;
        }

        localStorage.setItem("email", email);
        window.location.href="verify.html";
    }).catch(err=>{
        console.log(err);
    })
}