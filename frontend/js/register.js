const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "STUDENT") {
  window.location.href = "login.html";
}

const level = 200;        // later: fetch from backend
const semester = "FIRST";

const courseListEl = document.getElementById("courseList");
const totalCreditsEl = document.getElementById("totalCredits");
const errorEl = document.getElementById("error");

let totalCredits = 0;
let selectedCourses = [];

// 1️⃣ Load courses
async function loadCourses() {
  try {
    const res = await fetch(
      `http://localhost:2003/v1/api/courses?level=${level}&semester=${semester}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    renderCourses(data.data);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

// 2️⃣ Render courses
function renderCourses(courses) {
  courses.forEach(course => {
    const div = document.createElement("div");
    div.className = "course";

    div.innerHTML = `
      <label>
        <input 
          type="checkbox"
          data-id="${course._id}"
          data-units="${course.creditUnits}"
        />
        ${course.code} - ${course.title} (${course.creditUnits} units)
      </label>
    `;

    const checkbox = div.querySelector("input");
    checkbox.addEventListener("change", handleSelection);

    courseListEl.appendChild(div);
  });
}

// 3️⃣ Handle selection
function handleSelection(e) {
  const units = Number(e.target.dataset.units);
  const courseId = e.target.dataset.id;

  if (e.target.checked) {
    totalCredits += units;
    selectedCourses.push(courseId);
  } else {
    totalCredits -= units;
    selectedCourses = selectedCourses.filter(id => id !== courseId);
  }

  totalCreditsEl.textContent = totalCredits;
}

// 4️⃣ Submit registration
document.getElementById("courseForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:2003/v1/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        level,
        semester,
        courses: selectedCourses,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("Registration submitted successfully!");
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

loadCourses();
