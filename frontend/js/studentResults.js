const token = localStorage.getItem("token");
const studentId = localStorage.getItem("userId");

const API_BASE = "http://localhost:2003/v1/api";

async function apiFetch(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed");
  return data;
}

async function loadStudentData() {
  try {
    await Promise.all([
      loadGPA(),
      loadCGPA(),
      loadResults(),
    ]);
  } catch (err) {
    console.error(err.message);
  }
}

async function loadGPA() {
  const res = await apiFetch(`/gpa/${studentId}`);
  document.getElementById("gpaValue").innerText =
    res?.data?.gpa ?? "--";
}

async function loadCGPA() {
  const res = await apiFetch(`/cgpa/${studentId}`);
  document.getElementById("cgpaValue").innerText =
    res?.data?.cgpa ?? "--";
}

async function loadResults() {
  const res = await apiFetch(`/results/student/${studentId}`);
  const body = document.getElementById("resultsBody");

  body.innerHTML = "";

  if (res.data.length === 0) {
    body.innerHTML = `<tr><td colspan="5">No results published</td></tr>`;
    return;
  }

  res.data.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.course.title}</td>
      <td>${r.creditUnits}</td>
      <td>${r.score}</td>
      <td>${r.grade}</td>
      <td>${r.isPassed ? "PASSED" : "FAILED"}</td>
    `;
    body.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", loadStudentData);