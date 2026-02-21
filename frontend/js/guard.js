function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    console.log("No token found, redirecting to login page.");
  }
}
