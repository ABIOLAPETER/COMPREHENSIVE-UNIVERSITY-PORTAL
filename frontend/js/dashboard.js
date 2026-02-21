const role = localStorage.getItem("role");
const title = document.getElementById("title");
const content = document.getElementById("content");
const token = localStorage.getItem("token");
console.log("User Role:", role);
console.log("Auth Token:", token);
if (role === "STUDENT") {
  title.innerText = "Student Dashboard";
  content.innerHTML = `
    <button onclick="viewCourses()">Register Courses</button>
  `;
}

if (role === "ADMIN") {
  title.innerText = "Admin Dashboard";
  content.innerHTML = `
    <button>Create Faculty</button>
    <button>Create Department</button>
  `;
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
