/* ==========================================================
   dashboard.js
   NOTE: apiFetch is provided by api.js — load it before this file
   ========================================================== */

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {

  const role  = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token || !role) {
    window.location.href = "index.html";
    return;
  }

  const title          = document.getElementById("dashboardTitle");
  const adminSection   = document.querySelector(".admin-section");
  const studentSection = document.querySelector(".student-section");

  adminSection.classList.add("hidden");
  studentSection.classList.add("hidden");

  if (role === "ADMIN") {
    title.textContent = "Admin Dashboard";
    adminSection.classList.remove("hidden");

    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("createFacultyBtn").addEventListener("click", createFaculty);
    document.getElementById("createDepartmentBtn").addEventListener("click", createDepartment);
    document.getElementById("createCourseBtn").addEventListener("click", createCourse);
    document.getElementById("approveBtn").addEventListener("click", handleApprove);
    document.getElementById("rejectBtn").addEventListener("click", handleReject);

    loadAdminDashboard();

  } else if (role === "STUDENT") {
    title.textContent = "Student Dashboard";
    studentSection.classList.remove("hidden");
    document.getElementById("logoutBtn").addEventListener("click", logout);
    loadStudentDashboardDetails();
  }
});

/* ===== AUTH ===== */
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

/* ===== HELPERS ===== */
function setMsg(id, text, isError = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "success");
}

function clearField(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function setActionMsg(text, isError = true) {
  const el = document.getElementById("regActionMsg");
  if (!el) return;
  el.textContent = text;
  el.className = "action-msg " + (isError ? "error" : "success");
}

/* ===== ADMIN DASHBOARD — called ONCE on load ===== */
async function loadAdminDashboard() {
  try {
    const [facultiesRes, departmentsRes, usersRes] = await Promise.all([
      apiFetch("/faculties"),
      apiFetch("/departments"),
      apiFetch("/auth/users"),
    ]);

    renderFaculties(facultiesRes.faculties);
    renderDepartments(departmentsRes.departments);
    renderUsers(usersRes.users);
    updateStats(
      facultiesRes.faculties.length,
      departmentsRes.departments.length,
      usersRes.users.length
    );
  } catch (err) {
    console.error("Admin dashboard load error:", err);
  }

  // Load registrations separately — default to SUBMITTED (pending)
  loadRegistrations("SUBMITTED");
}

/* ===== REGISTRATIONS ===== */

// Called by filter tabs in HTML and on initial load
async function loadRegistrations(status = "SUBMITTED") {
  const tbody = document.getElementById("registrationsTable");
  tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><span class="spinner"></span>Loading...</td></tr>`;

  try {
    const query = status === "ALL" ? "" : `?status=${status}`;
    const res   = await apiFetch(`/registrations${query}`);
    const regs  = res.registrations || [];

    // Update pending count stat
    if (status === "SUBMITTED" || status === "ALL") {
      const pending = status === "ALL"
        ? regs.filter(r => r.status === "SUBMITTED").length
        : regs.length;
      document.getElementById("totalPending").textContent = pending;
    }

    renderRegistrations(regs);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);font-style:italic">Failed to load registrations.</td></tr>`;
    console.error("Failed to load registrations:", err.message);
  }
}

function renderRegistrations(registrations) {
  const tbody = document.getElementById("registrationsTable");

  if (!registrations.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--ink-soft);font-style:italic">No registrations found.</td></tr>`;
    return;
  }

  tbody.innerHTML = registrations.map(r => {
    const student    = r.student || {};
    const name       = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "—";
    const matric     = student.matricNumber || student.matricNo || "—";
    const dept       = r.department?.name || student.department?.name || "—";
    const statusClass = (r.status || "").toLowerCase();

    return `
      <tr class="clickable" onclick="openRegistrationDrawer(${JSON.stringify(r).split('"').join('&quot;')})">
        <td>${name}</td>
        <td style="font-family:monospace;font-size:13px">${matric}</td>
        <td>${dept}</td>
        <td>${r.level || "—"}</td>
        <td>${r.totalCredits ?? "—"}</td>
        <td><span class="status-pill ${statusClass}">${r.status || "—"}</span></td>
      </tr>
    `;
  }).join("");
}

/* ===== REGISTRATION DRAWER ===== */

// Holds the registration currently open in the drawer
let activeRegistration = null;

function openRegistrationDrawer(registration) {
  activeRegistration = registration;

  const student  = registration.student || {};
  const name     = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "—";
  const matric   = student.matricNumber || student.matricNo || "—";
  const dept     = registration.department?.name || student.department?.name || "—";
  const status   = registration.status || "";

  // Populate header
  document.getElementById("rd-studentName").textContent = name;
  document.getElementById("rd-matric").textContent      = matric;
  document.getElementById("rd-level").textContent       = registration.level || "—";
  document.getElementById("rd-dept").textContent        = dept;
  document.getElementById("rd-semester").textContent    = `${registration.semester} — ${registration.session}`;

  // Status pill
  const pill = document.getElementById("rd-statusPill");
  pill.textContent  = status;
  pill.className    = `status-pill ${status.toLowerCase()}`;

  // Drawer stripe colour — amber for pending, green for approved
  const stripe = document.getElementById("regDrawerStripe");
  stripe.className = "drawer-stripe" +
    (status === "SUBMITTED" ? " warning" : status === "APPROVED" ? " success" : "");

  // Action bar — only show for SUBMITTED
  const actionBar = document.getElementById("regActionBar");
  actionBar.style.display = status === "SUBMITTED" ? "flex" : "none";

  // Reset action message
  setActionMsg("", true);

  // Enable buttons
  document.getElementById("approveBtn").disabled = false;
  document.getElementById("rejectBtn").disabled  = false;

  // Render course table
  renderRegistrationCourses(registration.courses || []);

  openDrawer("registrationDrawer");
}

function renderRegistrationCourses(courses) {
  const container = document.getElementById("rd-courseTable");

  if (!courses.length) {
    container.innerHTML = `<div class="drawer-empty">No courses in this registration.</div>`;
    return;
  }

  const totalCredits = courses.reduce((sum, c) => sum + (c.creditUnits ?? 0), 0);

  container.innerHTML = `
    <table class="reg-course-table">
      <thead>
        <tr><th>#</th><th>Code</th><th>Title</th><th>Units</th><th>Type</th><th>Carry-Over</th></tr>
      </thead>
      <tbody>
        ${courses.map((c, i) => {
          const course = c.course || c;
          return `
            <tr>
              <td style="color:var(--ink-soft)">${i + 1}</td>
              <td><span style="font-weight:700;color:var(--accent);font-size:12px">${course.code || "—"}</span></td>
              <td>${course.title || "—"}</td>
              <td>${c.creditUnits ?? course.creditUnits ?? "—"}</td>
              <td><span class="course-tag ${(course.type || "").toLowerCase()}">${course.type || "—"}</span></td>
              <td>${c.isCarryOver
                ? `<span class="course-tag" style="background:#fef3e2;color:#b45309">Yes</span>`
                : `<span class="course-tag">No</span>`
              }</td>
            </tr>
          `;
        }).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align:right">Total Credit Units</td>
          <td colspan="3"><strong>${totalCredits}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;
}

/* ===== APPROVE ===== */
async function handleApprove() {
  if (!activeRegistration) return;

  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn  = document.getElementById("rejectBtn");

  approveBtn.disabled = true;
  rejectBtn.disabled  = true;
  approveBtn.textContent = "Approving...";
  setActionMsg("", true);

  try {
    const res = await apiFetch(`/registrations/${activeRegistration._id}/approve`, "PATCH");

    // Update local state
    activeRegistration.status = "APPROVED";

    // Update pill and stripe in drawer
    const pill = document.getElementById("rd-statusPill");
    pill.textContent = "APPROVED";
    pill.className   = "status-pill approved";

    document.getElementById("regDrawerStripe").className = "drawer-stripe success";

    // Hide action bar — registration is now approved
    document.getElementById("regActionBar").style.display = "none";

    setActionMsg("Registration approved successfully.", false);

    // Refresh the registrations table in background
    const activeFilter = document.querySelector(".reg-filter-btn.active")?.dataset.status || "SUBMITTED";
    loadRegistrations(activeFilter);

    // Refresh pending count
    refreshPendingCount();

  } catch (err) {
    setActionMsg(err.message || "Approval failed.", true);
    approveBtn.disabled    = false;
    rejectBtn.disabled     = false;
  } finally {
    approveBtn.textContent = "✓ Approve Registration";
  }
}

/* ===== REJECT ===== */
async function handleReject() {
  if (!activeRegistration) return;

  // Simple confirmation — swap for a modal if you want a rejection reason field later
  if (!confirm(`Reject registration for this student? This cannot be undone.`)) return;

  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn  = document.getElementById("rejectBtn");

  approveBtn.disabled    = true;
  rejectBtn.disabled     = true;
  rejectBtn.textContent  = "Rejecting...";
  setActionMsg("", true);

  try {
    await apiFetch(`/registrations/${activeRegistration._id}/reject`, "PATCH");

    activeRegistration.status = "REJECTED";

    const pill = document.getElementById("rd-statusPill");
    pill.textContent = "REJECTED";
    pill.className   = "status-pill rejected";

    document.getElementById("regDrawerStripe").className = "drawer-stripe";
    document.getElementById("regActionBar").style.display = "none";

    setActionMsg("Registration rejected.", false);

    const activeFilter = document.querySelector(".reg-filter-btn.active")?.dataset.status || "SUBMITTED";
    loadRegistrations(activeFilter);
    refreshPendingCount();

  } catch (err) {
    setActionMsg(err.message || "Rejection failed.", true);
    approveBtn.disabled   = false;
    rejectBtn.disabled    = false;
  } finally {
    rejectBtn.textContent = "✕ Reject";
  }
}

async function refreshPendingCount() {
  try {
    const res = await apiFetch("/registrations?status=SUBMITTED");
    document.getElementById("totalPending").textContent =
      (res.registrations || []).length;
  } catch {
    // non-fatal
  }
}

/* ===== TARGETED REFRESHES ===== */
async function refreshFacultiesTable() {
  try {
    const res = await apiFetch("/faculties");
    renderFaculties(res.faculties);
  } catch (err) {
    console.error("Failed to refresh faculties:", err.message);
  }
}

async function refreshDepartmentsTable() {
  try {
    const res = await apiFetch("/departments");
    renderDepartments(res.departments);
  } catch (err) {
    console.error("Failed to refresh departments:", err.message);
  }
}

async function refreshStats() {
  try {
    const [fRes, dRes, uRes] = await Promise.all([
      apiFetch("/faculties"),
      apiFetch("/departments"),
      apiFetch("/auth/users"),
    ]);
    updateStats(fRes.faculties.length, dRes.departments.length, uRes.users.length);
  } catch (err) {
    console.error("Failed to refresh stats:", err.message);
  }
}

/* ===== STATS ===== */
function updateStats(facultyCount, departmentCount, userCount) {
  document.getElementById("totalFaculties").textContent   = facultyCount;
  document.getElementById("totalDepartments").textContent = departmentCount;
  document.getElementById("totalUsers").textContent       = userCount;
}

/* ===== CREATE FACULTY ===== */
async function createFaculty() {
  const name = document.getElementById("facultyName").value.trim();
  const code = document.getElementById("facultyCode").value.trim();
  setMsg("facultyMsg", "");
  if (!name || !code) { setMsg("facultyMsg", "All fields are required."); return; }
  try {
    await apiFetch("/faculties", "POST", { name, code });
    setMsg("facultyMsg", "Faculty created successfully.", false);
    clearField("facultyName", "facultyCode");
    refreshFacultiesTable();
    refreshStats();
  } catch (err) {
    setMsg("facultyMsg", err.message);
  }
}

/* ===== CREATE DEPARTMENT ===== */
async function createDepartment() {
  const facultyId = document.getElementById("dept-facultyId").value;
  const name      = document.getElementById("dept-name").value.trim();
  const code      = document.getElementById("dept-code").value.trim();
  setMsg("departmentMsg", "");
  if (!name || !code || !facultyId) { setMsg("departmentMsg", "All fields are required."); return; }
  try {
    await apiFetch("/departments", "POST", { name, code, facultyId });
    setMsg("departmentMsg", "Department created successfully.", false);
    clearField("dept-name", "dept-code");
    loadFacultyDepartments(facultyId);
    refreshDepartmentsTable();
    refreshStats();
  } catch (err) {
    setMsg("departmentMsg", err.message);
  }
}

/* ===== CREATE COURSE ===== */
async function createCourse() {
  const departmentId = document.getElementById("course-deptId").value;
  const title        = document.getElementById("course-name").value.trim();
  const code         = document.getElementById("course-code").value.trim();
  const creditUnits  = document.getElementById("course-units").value;
  const type         = document.getElementById("course-type").value;
  setMsg("courseMsg", "");
  if (!title || !code || !creditUnits || !type || !departmentId) { setMsg("courseMsg", "All fields are required."); return; }
  try {
    await apiFetch("/courses", "POST", { title, code, creditUnits: Number(creditUnits), department: departmentId, type });
    setMsg("courseMsg", "Course created successfully.", false);
    clearField("course-name", "course-code", "course-units", "course-type");
    loadDepartmentCourses(departmentId);
  } catch (err) {
    setMsg("courseMsg", err.message);
  }
}

/* ===== RENDER TABLES ===== */
function renderFaculties(faculties) {
  const tbody = document.getElementById("facultiesTable");
  if (!faculties.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--ink-soft);font-style:italic">No faculties yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = faculties.map(f => `
    <tr class="clickable" onclick="openFacultyDrawer(${JSON.stringify(f).split('"').join('&quot;')})">
      <td>${f.name}</td><td>${f.code}</td><td>${new Date(f.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join("");
}

function renderDepartments(departments) {
  const tbody = document.getElementById("departmentsTable");
  if (!departments.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--ink-soft);font-style:italic">No departments yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = departments.map(d => `
    <tr class="clickable" onclick="openDepartmentDrawer(${JSON.stringify(d).split('"').join('&quot;')})">
      <td>${d.name}</td><td>${d.code}</td><td>${d.faculty?.name || "—"}</td>
    </tr>
  `).join("");
}

function renderUsers(users) {
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.firstName || ""} ${u.lastName || ""}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
    </tr>
  `).join("");
}

/* ===== FACULTY DRAWER ===== */
async function openFacultyDrawer(faculty) {
  document.getElementById("fd-name").textContent    = faculty.name;
  document.getElementById("fd-code").textContent    = faculty.code;
  document.getElementById("fd-created").textContent = new Date(faculty.createdAt).toLocaleDateString();
  document.getElementById("dept-facultyId").value      = faculty._id;
  document.getElementById("dept-facultyDisplay").value = `${faculty.name} (${faculty.code})`;
  setMsg("departmentMsg", "");
  clearField("dept-name", "dept-code");
  openDrawer("facultyDrawer");
  await loadFacultyDepartments(faculty._id);
}

async function loadFacultyDepartments(facultyId) {
  const list = document.getElementById("fd-departments-list");
  list.innerHTML = `<div class="drawer-empty"><span class="spinner"></span> Loading...</div>`;
  try {
    const res         = await apiFetch(`/departments?faculty=${facultyId}`);
    const departments = res.departments || [];
    if (!departments.length) {
      list.innerHTML = `<div class="drawer-empty">No departments yet. Add one below.</div>`;
      return;
    }
    list.innerHTML = departments.map(d => `
      <div class="drawer-list-item" onclick="openDepartmentDrawer(${JSON.stringify(d).split('"').join('&quot;')})">
        <span class="drawer-list-item-name">${d.name}</span>
        <span class="drawer-list-item-code">${d.code}</span>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="drawer-empty" style="color:var(--danger)">Failed to load departments.</div>`;
  }
}

/* ===== DEPARTMENT DRAWER ===== */
async function openDepartmentDrawer(department) {
  document.getElementById("dd-name").textContent    = department.name;
  document.getElementById("dd-code").textContent    = department.code;
  document.getElementById("dd-faculty").textContent = department.faculty?.name || "—";
  document.getElementById("course-deptId").value      = department._id;
  document.getElementById("course-deptDisplay").value = `${department.name} (${department.code})`;
  setMsg("courseMsg", "");
  clearField("course-name", "course-code", "course-units", "course-type");
  openDrawer("departmentDrawer");
  await loadDepartmentCourses(department._id);
}

async function loadDepartmentCourses(departmentId) {
  const list = document.getElementById("dd-courses-list");
  list.innerHTML = `<div class="drawer-empty"><span class="spinner"></span> Loading...</div>`;
  try {
    const res     = await apiFetch(`/courses?department=${departmentId}`);
    const courses = res.courses || [];
    if (!courses.length) {
      list.innerHTML = `<div class="drawer-empty">No courses yet. Add one below.</div>`;
      return;
    }
    list.innerHTML = `<div class="drawer-list">${courses.map(c => `
      <div class="course-item">
        <div class="course-item-top">
          <span class="course-item-name">${c.title}</span>
          <span class="drawer-list-item-code">${c.code}</span>
        </div>
        <div class="course-item-meta">
          <span class="course-tag ${c.type}">${c.type}</span>
          <span class="course-tag">${c.level} Level</span>
          <span class="course-tag">${c.creditUnits} unit${c.creditUnits !== 1 ? "s" : ""}</span>
          <span class="course-tag">${c.semester} sem</span>
        </div>
      </div>
    `).join("")}</div>`;
  } catch (err) {
    list.innerHTML = `<div class="drawer-empty" style="color:var(--danger)">Failed to load courses.</div>`;
  }
}

/* ===== STUDENT DASHBOARD ===== */
async function loadStudentDashboardDetails() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not authenticated");
    const studentResponse = await apiFetch(`/students/user/${userId}`);
    const student         = studentResponse.studentProfile;
    if (!student?._id) throw new Error("Student profile not found");
    bindStudentProfile(student);
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    showDashboardError("Unable to load dashboard data.");
  }
}

function bindStudentProfile(student) {
  document.getElementById("studentName").textContent =
    `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A";
  document.getElementById("studentMatric").textContent =
    student.matricNumber || student.matricNo || "N/A";
  document.getElementById("studentLevel").textContent = student.level || "N/A";
}

function bindAcademicStats(gpaData, cgpaData) {
  document.getElementById("gpaValue").textContent  = gpaData?.gpa?.toFixed(2)   || "--";
  document.getElementById("cgpaValue").textContent = cgpaData?.cgpa?.toFixed(2) || "--";
}

function showDashboardError(message) { alert(message); }