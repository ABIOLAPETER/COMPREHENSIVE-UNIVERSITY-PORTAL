document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("error");

    errorEl.textContent = "";

    try {
        const response = await fetch("http://localhost:2003/v1/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        console.log("Response Status:", response.status);
        console.log("Response Headers:", response.headers);
        console.log("Response URL:", response.url);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }
console.log("Login Response Data:", data);
        // Save token
        localStorage.setItem("token", data.user.tokens.accessToken);

        // Save role
        localStorage.setItem("role", data.user.role);

        localStorage.setItem("userId", data.user.id);


        // Redirect
        window.location.href = "dashboard.html";

    } catch (err) {
        errorEl.textContent = err.message;
    }
});
