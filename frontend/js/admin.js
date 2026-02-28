const API = "http://localhost:2003/v1/api";

function showDraftResults() {
  content.innerHTML = `
    <div class="card">
      <h4>Create Draft Result</h4>

      <input id="studentId" placeholder="Student ID" />
      <input id="courseId" placeholder="Course ID" />
      <input id="score" type="number" placeholder="Score" />

      <button onclick="createDraftResult()">Save Draft</button>

      <p id="resultMessage"></p>
    </div>
  `;
}

async function createDraftResult() {
  const studentId = document.getElementById("studentId").value;
  const courseId = document.getElementById("courseId").value;
  const score = Number(document.getElementById("score").value);

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId, courseId, score }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    document.getElementById("resultMessage").innerText =
      "Draft result created successfully";

  } catch (err) {
    document.getElementById("resultMessage").innerText = err.message;
  }
}

function showPublishResults() {
  content.innerHTML = `
    <div class="card">
      <h3>Publish Results (By Course)</h3>

      <input id="publishCourseId" placeholder="Course ID" />
      <button onclick="publishCourseResults()">Publish All Results</button>

      <p id="publishMsg"></p>
    </div>
  `;
}

async function publishCourseResults() {
  const courseId = document.getElementById("publishCourseId").value;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(
      "http://localhost:2003/v1/api/results/publish/course",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById("publishMsg").innerText =
      `Published ${data.result.publishedCount} results successfully`;

  } catch (err) {
    document.getElementById("publishMsg").innerText = err.message;
  }
}