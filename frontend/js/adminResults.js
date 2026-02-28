const token = localStorage.getItem("token");
const API_BASE = "http://localhost:2003/v1/api";

async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function loadStudentCourses() {
  const studentId = document.getElementById("studentIdInput").value;
  const body = document.getElementById("adminResultsBody");

  if (!studentId) return alert("Enter student ID");

  body.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const res = await apiFetch(`/registrations/student/${studentId}`);
    body.innerHTML = "";

    res.data.courses.forEach(c => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${c.course.title}</td>
        <td>${c.creditUnits}</td>
        <td>
          <input type="number" min="0" max="100"
            id="score-${c.course._id}" />
        </td>
        <td>${c.status ?? "NOT CREATED"}</td>
        <td>
          <button onclick="createResult('${studentId}','${c.course._id}')">
            Save Draft
          </button>
        </td>
      `;

      body.appendChild(row);
    });
  } catch (err) {
    body.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
  }
}

async function createResult(studentId, courseId) {
  const score = document.getElementById(`score-${courseId}`).value;
  if (!score) return alert("Enter score");

  try {
    await apiFetch("/results", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        courseId,
        score: Number(score),
      }),
    });

    alert("Draft result created");
  } catch (err) {
    alert(err.message);
  }
}

async function publishResult(resultId) {
  try {
    await apiFetch(`/results/publish`, {
      method: "POST",
      body: JSON.stringify({ resultId }),
    });

    alert("Result published (GPA & CGPA updated)");
  } catch (err) {
    alert(err.message);
  }
}