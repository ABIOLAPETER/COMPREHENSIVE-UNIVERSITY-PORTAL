// function loadStudentSidebar() {
//   sidebar.innerHTML = `
//     <button onclick="loadStudentHome()">Home</button>
//     <button onclick="loadMyCourses()">My Courses</button>
//     <button onclick="loadResults()">Results</button>
//     <button onclick="loadGPA()">GPA & CGPA</button>
//   `;
// }

async function loadGPA() {
  const userId = localStorage.getItem("userId");

  try {
    const gpa = await apiFetch(`/gpa/${userId}`);
    const cgpa = await apiFetch(`/cgpa/${userId}`);

    content.innerHTML = `
      <h3>Academic Performance</h3>

      <div class="card">
        <p><strong>Current GPA:</strong> ${gpa.gpa}</p>
        <p><strong>Credits:</strong> ${gpa.totalCredits}</p>
      </div>

      <div class="card">
        <p><strong>CGPA:</strong> ${cgpa.cgpa}</p>
        <p><strong>Total Credits:</strong> ${cgpa.totalCredits}</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

