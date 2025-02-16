document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("details-form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        // Collect form values
        const userid = document.getElementById("userid").value.trim();
        const name = document.getElementById("name").value.trim();
        const gender = document.getElementById("gender").value; // Hidden input set from gender buttons
        const dob = document.getElementById("dob").value;
        const phone = document.getElementById("phone").value.trim();

        const regToken=localStorage.getItem("reg-token");
        const email=localStorage.getItem("email");

        // Validation: Check if fields are filled
        if (!userid || !name || !gender || !dob || !phone) {
            alert("⚠️ Please fill in all the fields before submitting!");
            return;
        }

        // Create payload
        const userData = {
            email,
            userid,
            name,
            gender,
            dob,
            phone,
        };

        fetch("/auth/register-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": regToken
            },
            body: JSON.stringify(userData),
        }).then(res=>{
            return res.json();
        }).then(data=>{
            if(!data.success) {
                console.log("An error occurred");
                console.log(data);
                return;
            }

            localStorage.setItem("sessionToken", data.token);
            window.location.href="option.html";
        }).catch(err => {
            console.error("Error submitting form");
            console.log(err)
        });
    });
});