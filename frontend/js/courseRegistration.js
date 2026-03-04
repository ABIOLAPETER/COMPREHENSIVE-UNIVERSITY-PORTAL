/* ==========================================================
   courseRegistration.js
   ========================================================== */

const token    = localStorage.getItem("token");
const role     = localStorage.getItem("role");
const userId   = localStorage.getItem("userId");

/* ===== GUARD ===== */
if (!token || role !== "STUDENT") {
  window.location.href = "index.html";
}

/* ===== STATE ===== */
let studentId          = null;
let activeSemester     = null;
let registrationId     = null;
let registrationData   = null;
let registrationStatus = null;   // "DRAFT" | "SUBMITTED" | "APPROVED"
let isProcessing       = false;  // prevents concurrent API calls
let pendingQueue       = [];     // serializes checkbox changes

// Helper — true when registration should be read-only (no course selection)
const isLocked = () => registrationStatus === "SUBMITTED" || registrationStatus === "APPROVED";

/* ===== DOM REFS ===== */
const courseListEl   = document.getElementById("courseList");
const totalCreditsEl = document.getElementById("totalCredits");
const errorEl        = document.getElementById("error");
const submitBtn      = document.getElementById("submitBtn");
const semesterBadge  = document.getElementById("semesterBadge");

/* ===== UI HELPERS ===== */
function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.add("visible");
}

function clearError() {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.classList.remove("visible");
}

function updateCreditsDisplay(credits) {
  if (totalCreditsEl) totalCreditsEl.textContent = credits ?? 0;
}

function setCheckboxLoading(checkbox, loading) {
  checkbox.disabled = loading;
  checkbox.closest(".course-item").style.opacity = loading ? "0.5" : "1";
}

function hideCourseUI() {
  const els = [
    document.getElementById("courseList"),
    document.getElementById("courseListLabel"),
    document.getElementById("successBanner"),
    document.querySelector(".summary-card"),
    document.querySelectorAll(".summary-card")[1],
  ];
  els.forEach(el => { if (el) el.style.display = "none"; });
  if (submitBtn) submitBtn.style.display = "none";
}

function lockUI(message) {
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Registration Unavailable";
  }
  courseListEl.querySelectorAll("input[type=checkbox]").forEach(cb => cb.disabled = true);
  showError(message);
}

/* ===== SIDEBAR SELECTED LIST ===== */
// Called ONLY after a confirmed backend response — never optimistically
function updateSidebarList(courseId, code, units, isAdded) {
  const list = document.getElementById("selectedList");
  if (!list) return;

  if (isAdded) {
    const empty = list.querySelector(".selected-list-empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = "selected-item";
    item.dataset.courseId = courseId;
    item.innerHTML = `
      <span class="selected-item-code">${code}</span>
      <span class="selected-item-units">${units} unit${units != 1 ? "s" : ""}</span>
    `;
    list.appendChild(item);
  } else {
    list.querySelector(`[data-course-id="${courseId}"]`)?.remove();
    if (!list.children.length) {
      list.innerHTML = `<div class="selected-list-empty">No courses selected yet.</div>`;
    }
  }
}

/* ===== SAFETY NET — recalculate credits from registrationData ===== */
// Used when a request fails to prevent credit counter drift
function recalculateCreditsFromState() {
  const courses = registrationData?.courses || [];
  const total = courses.reduce((sum, c) => sum + (c.creditUnits ?? 0), 0);
  updateCreditsDisplay(total);
}

/* ===== 1. LOAD STUDENT PROFILE ===== */
async function loadStudentProfile() {
  try {
    const res     = await apiFetch(`/students/user/${userId}`);
    const student = res.studentProfile;

    if (!student?._id) throw new Error("Student profile not found");

    studentId = student._id;

    const nameEl   = document.getElementById("studentName");
    const levelEl  = document.getElementById("studentLevel");
    const matricEl = document.getElementById("studentMatric");
    const deptEl   = document.getElementById("studentDept");

    if (nameEl)   nameEl.textContent   = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A";
    if (levelEl)  levelEl.textContent  = student.level ?? "--";
    if (matricEl) matricEl.textContent = student.matricNumber || student.matricNo || "N/A";
    if (deptEl)   deptEl.textContent   = student.department?.name || "N/A";

    return student;
  } catch (err) {
    showError(`Could not load student profile: ${err.message}`);
    throw err;
  }
}

/* ===== 2. LOAD ACTIVE SEMESTER ===== */
async function loadActiveSemester() {
  try {
    const res      = await apiFetch("/semesters/active");
    activeSemester = res.semester;

    if (!activeSemester) throw new Error("No active semester in response");

    if (semesterBadge) {
      const sessionName = activeSemester.session?.name || "";
      semesterBadge.textContent =
        `${activeSemester.name} Semester${sessionName ? " — " + sessionName : ""}`;
    }

    if (activeSemester.isLocked) {
      lockUI("Registration is currently closed for this semester.");
    }

  } catch (err) {
    console.warn("Could not load active semester:", err.message);
    if (semesterBadge) semesterBadge.textContent = "Semester unavailable";
  }
}

/* ===== 3. LOAD OR CREATE REGISTRATION ===== */
async function loadOrCreateDraft() {
  try {
    const res        = await apiFetch("/registrations/current");
    registrationData = res.registration;
    registrationId     = registrationData?._id;
    registrationStatus = registrationData?.status || null;
    console.log("Registration status:", registrationStatus);
    return registrationData;
  } catch (err) {
    const msg = err.message.toLowerCase();
    if (
      err.status === 404 ||
      msg.includes("not found") ||
      msg.includes("no registration")
    ) {
      return await createDraft();
    }
    showError(`Could not load registration: ${err.message}`);
    throw err;
  }
}

async function createDraft() {
  try {
    const res        = await apiFetch("/registrations/draft", "POST");
    registrationData = res.registration;
    registrationId   = registrationData._id;
    return registrationData;
  } catch (err) {
    showError(`Could not create registration: ${err.message}`);
    throw err;
  }
}

/* ===== 4. LOAD ELIGIBLE COURSES ===== */
async function loadCourses() {
  courseListEl.innerHTML = `
    <div class="loading-state">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton" style="height:48px"></div>
      <div class="skeleton"></div>
    </div>`;

  try {
    const res     = await apiFetch(`/courses/eligible/${studentId}`);
    const courses = res.courses || [];

    if (!courses.length) {
      courseListEl.innerHTML = `
        <p style="color:var(--ink-soft);font-style:italic;padding:20px 0">
          No eligible courses found for this semester.
        </p>`;
      return;
    }

    const addedCourseIds = new Set(
      (registrationData?.courses || []).map(c =>
        c.course?._id?.toString() || c.course?.toString()
      )
    );

    renderCourses(courses, addedCourseIds);

    // Populate sidebar selected list from existing draft on load
    const existing = registrationData?.courses || [];
    existing.forEach(c => {
      const course = c.course || c;
      updateSidebarList(
        course._id?.toString(),
        course.code,
        c.creditUnits ?? course.creditUnits,
        true
      );
    });

    // Sync credits with existing draft
    updateCreditsDisplay(registrationData?.totalCredits || 0);

  } catch (err) {
    showError(`Could not load courses: ${err.message}`);
    courseListEl.innerHTML = "";
  }
}

/* ===== 5. RENDER COURSES ===== */
function renderCourses(courses, addedCourseIds = new Set()) {
  courseListEl.innerHTML = "";

  const core     = courses.filter(c => c.type === "CORE").sort((a, b) => a.code.localeCompare(b.code));
  const elective = courses.filter(c => c.type === "ELECTIVE").sort((a, b) => a.code.localeCompare(b.code));

  if (core.length) {
    courseListEl.appendChild(createGroupHeader("CORE", "core"));
    core.forEach(c => courseListEl.appendChild(createCourseItem(c, addedCourseIds)));
  }

  if (elective.length) {
    courseListEl.appendChild(createGroupHeader("ELECTIVE", "elective"));
    elective.forEach(c => courseListEl.appendChild(createCourseItem(c, addedCourseIds)));
  }
}

function createGroupHeader(label, type) {
  const div = document.createElement("div");
  div.className = "course-group-header";
  div.innerHTML = `<span class="group-dot ${type}"></span>${label} COURSES`;
  return div;
}

function createCourseItem(course, addedCourseIds = new Set()) {
  const isAdded = addedCourseIds.has(course._id?.toString());
  const div = document.createElement("div");
  div.className = "course-item";

  div.innerHTML = `
    <label class="course-label">
      <input
        type="checkbox"
        data-id="${course._id}"
        data-code="${course.code}"
        data-units="${course.creditUnits}"
        ${isAdded ? "checked" : ""}
        ${isLocked() ? "disabled" : ""}
      />
      <span class="course-info">
        <span class="course-top">
          <span class="course-code">${course.code}</span>
          <span class="course-title">${course.title}</span>
          <span class="course-units-badge">${course.creditUnits} unit${course.creditUnits !== 1 ? "s" : ""}</span>
        </span>
        <span class="course-bottom">
          <span class="course-tag ${course.type.toLowerCase()}">${course.type}</span>
          <span class="course-tag">${course.level} Level</span>
          <span class="course-tag">${course.semester}</span>
          ${isAdded && !isLocked() ? `<span class="course-tag" style="background:#e0f0e9;color:#1a7a4a">✓ Added</span>` : ""}
          ${isAdded && isLocked()  ? `<span class="course-tag" style="background:#e0f0e9;color:#1a7a4a">✓ Registered</span>` : ""}
        </span>
      </span>
    </label>
  `;

  if (!isLocked()) {
    div.querySelector("input").addEventListener("change", handleSelection);
  }

  return div;
}

/* ===== 6. HANDLE CHECKBOX — queued to prevent race conditions ===== */
function handleSelection(e) {
  const checkbox  = e.target;
  const courseId  = checkbox.dataset.id;
  const isChecked = checkbox.checked;

  // Disable immediately to prevent double-clicks while queued
  setCheckboxLoading(checkbox, true);

  pendingQueue.push({ checkbox, courseId, isChecked });

  if (!isProcessing) processQueue();
}

async function processQueue() {
  if (isProcessing || pendingQueue.length === 0) return;

  isProcessing = true;
  const { checkbox, courseId, isChecked } = pendingQueue.shift();

  clearError();

  try {
    if (isChecked) {
      const res = await apiFetch(`/registrations/${registrationId}/courses`, "POST", { courseId });
      registrationData = res.registration;
      // Update sidebar only after backend confirms — prevents ghost entries
      updateSidebarList(courseId, checkbox.dataset.code, checkbox.dataset.units, true);
    } else {
      const res = await apiFetch(`/registrations/${registrationId}/courses/${courseId}`, "DELETE");
      registrationData = res.registration;
      updateSidebarList(courseId, null, null, false);
    }

    // Always read credits from backend — never calculate locally
    updateCreditsDisplay(registrationData.totalCredits);

  } catch (err) {
    showError(err.message);
    checkbox.checked = !isChecked; // revert checkbox visually
    recalculateCreditsFromState(); // reset counter to actual server state
  } finally {
    setCheckboxLoading(checkbox, false);
    isProcessing = false;
    processQueue(); // process next item
  }
}

/* ===== 7. RENDER SUBMITTED/APPROVED REGISTRATION VIEW ===== */
function renderSubmittedView(registration) {
  const view = document.getElementById("regSubmittedView");
  if (!view) return;

  const status     = registration.status || "";
  const isApproved = status === "APPROVED";

  // Hero banner — different look for APPROVED vs SUBMITTED
  const hero = document.getElementById("submittedHero");
  if (hero) {
    hero.style.background = isApproved
      ? "linear-gradient(135deg, #1a7a4a 0%, #14532d 100%)"  // green for approved
      : "linear-gradient(135deg, #1a1714 0%, #233577 100%)"; // dark blue for submitted
  }

  const heroTitle = hero?.querySelector("h3");
  if (heroTitle) {
    heroTitle.textContent = isApproved
      ? "Registration Approved ✓"
      : "Registration Submitted ⏳";
  }

  const semLabel = document.getElementById("submittedSemesterLabel");
  if (semLabel) {
    semLabel.textContent =
      `${registration.semester} Semester — ${registration.session} · ${registration.level} Level`;
  }

  const submittedAt = new Date(registration.updatedAt || registration.createdAt);
  const dateEl = document.getElementById("submittedDate");
  const timeEl = document.getElementById("submittedTime");
  if (dateEl) dateEl.textContent = submittedAt.toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  if (timeEl) timeEl.textContent = submittedAt.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit"
  });

  const tableContainer = document.getElementById("regSummaryTable");
  if (tableContainer) {
    const courses = registration.courses || [];
    tableContainer.innerHTML = `
      <table class="reg-summary-table">
        <thead>
          <tr>
            <th>#</th><th>Code</th><th>Title</th><th>Units</th><th>Type</th><th>Carry-Over</th>
          </tr>
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
          <tr class="reg-total-row">
            <td colspan="3">Total Credit Units</td>
            <td colspan="3">${registration.totalCredits}</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span class="status-pill ${status.toLowerCase()}">
          ${isApproved ? "✓ Approved" : "⏳ Submitted"}
        </span>
        <span class="reg-id-label">Reg ID: ${registration._id}</span>
      </div>
    `;
  }

  view.classList.add("visible");

  const courseListLabel = document.getElementById("courseListLabel");
  const _courseListEl   = document.getElementById("courseList");
  if (courseListLabel) courseListLabel.style.display = "none";
  if (_courseListEl)   _courseListEl.style.display   = "none";

  updateCreditsDisplay(registration.totalCredits);

  const _selectedList = document.getElementById("selectedList");
  if (_selectedList) {
    const courses = registration.courses || [];
    if (courses.length) {
      _selectedList.innerHTML = courses.map(c => {
        const course = c.course || c;
        return `
          <div class="selected-item">
            <span class="selected-item-code">${course.code || "—"}</span>
            <span class="selected-item-units">${c.creditUnits ?? course.creditUnits} unit${(c.creditUnits ?? course.creditUnits) !== 1 ? "s" : ""}</span>
          </div>
        `;
      }).join("");
    }
  }
}

/* ===== 8. SUBMIT REGISTRATION ===== */
async function submitRegistration(e) {
  e.preventDefault();
  clearError();

  if (!registrationId) {
    showError("No active registration found. Please refresh the page.");
    return;
  }

  if (!registrationData?.courses?.length) {
    showError("Please add at least one course before submitting.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Submitting";

  try {
    const res        = await apiFetch(`/registrations/${registrationId}/submit`, "PATCH");
    registrationData   = res.registration;
    registrationStatus = "SUBMITTED";

    alert("Registration submitted successfully!");

    hideCourseUI();
    renderSubmittedView(registrationData);

  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = "Submit Registration";
  }
}

/* ===== FORM SUBMIT LISTENER ===== */
document.getElementById("courseForm").addEventListener("submit", submitRegistration);

/* ===== BOOT ===== */
async function init() {
  try {
    await loadStudentProfile();
    await loadActiveSemester();
    await loadOrCreateDraft();

    if (registrationStatus === "SUBMITTED" || registrationStatus === "APPROVED") {
      hideCourseUI();
      renderSubmittedView(registrationData);
    } else {
      await loadCourses();
    }
  } catch {
    // individual functions handle and display their own errors
  }
}

init();