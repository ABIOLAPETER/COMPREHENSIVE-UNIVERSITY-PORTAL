document.getElementById("createFacultyBtn")
  .addEventListener("click", createFaculty);
document.getElementById("createDepartmentBtn")
  .addEventListener("click", createDepartment);
document.getElementById("logoutBtn")
  .addEventListener("click", logout);

document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const title = document.getElementById("dashboardTitle");
  const adminSection = document.querySelector(".admin-section");
  const studentSection = document.querySelector(".student-section");

  if (!token || !role) {
    window.location.href = "index.html";
    return;
  }

  // 🔒 HIDE EVERYTHING FIRST
  adminSection.classList.add("hidden");
  studentSection.classList.add("hidden");

  // ✅ SHOW ONLY WHAT THE ROLE NEEDS
  if (role === "ADMIN") {
    title.textContent = "Admin Dashboard";
    adminSection.classList.remove("hidden");
    loadAdminDashboard()
  } 
  else if (role === "STUDENT") {
    title.textContent = "Student Dashboard";
    studentSection.classList.remove("hidden");
    loadStudentDashboardDetails()
  }
});
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

/* ================= API ================= */

const API_BASE = "http://localhost:2003/v1/api";

async function apiFetch(url, method = "GET", body = null) {

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

/* ================= FACULTY ================= */

async function createFaculty() {
  const nameInput = document.getElementById("facultyName");
  const codeInput = document.getElementById("facultyCode");
  const msg = document.getElementById("facultyMsg");

  msg.textContent = "";

  if (!nameInput.value.trim() || !codeInput.value.trim()) {
    msg.textContent = "All fields are required";
    return;
  }

  try {
    await apiFetch("/faculties", "POST", {
      name: nameInput.value.trim(),
      code: codeInput.value.trim()
    });

    msg.textContent = "Faculty created successfully";
    nameInput.value = "";
    codeInput.value = "";

    loadFaculties();

  } catch (err) {
    msg.textContent = err.message;
  }
}

async function loadFaculties() {
  const select = document.getElementById("facultySelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select Faculty</option>`;

  try {
    const res = await apiFetch("/faculties");

    // ✅ MATCH BACKEND RESPONSE
    const faculties = res.faculties;

    faculties.forEach(faculty => {
      const option = document.createElement("option");
      option.value = faculty._id;
      option.textContent = `${faculty.name} (${faculty.code})`;
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Failed to load faculties:", err.message);
  }
}

/* ================= DEPARTMENT ================= */

async function createDepartment() {

  const nameInput = document.getElementById("departmentName");
  const codeInput = document.getElementById("departmentCode");
  const facultySelect = document.getElementById("facultySelect");
  const msg = document.getElementById("departmentMsg");

  msg.textContent = "";

  if (!nameInput.value.trim() || !facultySelect.value || !codeInput.value.trim()) {
    msg.textContent = "All fields are required";
    return;
  }

  try {
    await apiFetch("/departments", "POST", {
      name: nameInput.value.trim(),
      code: codeInput.value.trim(),
      facultyId: facultySelect.value
    });

    msg.textContent = "Department created successfully";
    nameInput.value = "";

  } catch (err) {
    msg.textContent = err.message;
  }
}


// DASHBOARD-------STUDENTS

async function loadStudentDashboardDetails() {
  try {
    const role = localStorage.getItem("role");
    if (role !== "STUDENT") return;

    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not authenticated");

    const studentResponse = await apiFetch(`/students/user/${userId}`);
    console.log("studentResponse:", studentResponse);

    const student =
      studentResponse.studentProfile

    if (!student || !student._id) {
      throw new Error("Student profile not found");
    }

    const studentId = student._id;
    console.log("studentId:", studentId);

    // const gpaResponse = await apiFetch(`/gpa/${studentId}`);
    // const cgpaResponse = await apiFetch(`/cgpa/${studentId}`);

    // console.log("gpaResponse:", gpaResponse);
    // console.log("cgpaResponse:", cgpaResponse);

    bindStudentProfile(student);
    // bindAcademicStats(
    //   gpaResponse.data || gpaResponse,
    //   cgpaResponse.data || cgpaResponse
    // );

  } catch (error) {
    console.error("Dashboard Load Error:", error);
    showDashboardError("Unable to load dashboard data.");
  }
}

function bindStudentProfile(student) {

  console.log(student);
  
  document.getElementById("studentName").textContent =
    `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A";

  document.getElementById("studentMatric").textContent =
    student.matricNumber || student.matricNo || "N/A";

  document.getElementById("studentLevel").textContent =
    student.level || "N/A";
}

function bindAcademicStats(gpaData, cgpaData) {
  document.getElementById("gpaValue").textContent =
    gpaData?.gpa?.toFixed(2) || "--";

  document.getElementById("cgpaValue").textContent =
    cgpaData?.cgpa?.toFixed(2) || "--";
}

function showDashboardError(message) {
  alert(message);
}


async function loadAdminDashboard() {
  try {
    const [facultiesRes, departmentsRes, usersRes] = await Promise.all([
      apiFetch("/faculties"),
      apiFetch("/departments"),
      apiFetch("/auth")
    ]);

    renderFaculties(facultiesRes.faculties);
    renderDepartments(departmentsRes.departments);
    renderUsers(usersRes.users);

    updateStats(
      facultiesRes.faculties.length,
      departmentsRes.departments.length,
      usersRes.users.length
    );

  } catch (error) {
    console.error("Admin dashboard load error:", error);
  }
}

function updateStats(facultyCount, departmentCount, userCount) {
  document.getElementById("totalFaculties").textContent = facultyCount;
  document.getElementById("totalDepartments").textContent = departmentCount;
  document.getElementById("totalUsers").textContent = userCount;
}


function renderFaculties(faculties) {
  const tbody = document.getElementById("facultiesTable");
  tbody.innerHTML = "";

  faculties.forEach(f => {
    tbody.innerHTML += `
      <tr>
        <td>${f.name}</td>
        <td>${f.code}</td>
        <td>${new Date(f.createdAt).toLocaleDateString()}</td>
      </tr>
    `;
  });
}
function renderDepartments(departments) {
  const tbody = document.getElementById("departmentsTable");
  tbody.innerHTML = "";

  departments.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.code}</td>
        <td>${d.faculty?.name || "—"}</td>
      </tr>
    `;
  });
}


function renderUsers(users) {
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = "";

  users.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.firstName || ""} ${u.lastName || ""}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
      </tr>
    `;
  });
}