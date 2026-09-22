const KEY = "goalmates-pages-preview-v1";
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const seed = () => {
  const jordan = { id: "u-jordan", email: "jordan@goalmates.local", name: "Jordan Chen" };
  const sam = { id: "u-sam", email: "sam@goalmates.local", name: "Sam Alvarez" };
  const privateJ = { id: "s-j", type: "personal", name: "Jordan's space", ownerId: jordan.id };
  const privateS = { id: "s-s", type: "personal", name: "Sam's space", ownerId: sam.id };
  const house = { id: "s-h", type: "shared", name: "The Household (demo)", ownerId: jordan.id };
  const kitchen = { id: "p-k", spaceId: house.id, name: "Finish Kitchen Remodel", outcome: "Kitchen is painted, shelved, and usable." };
  return {
    users: [jordan, sam],
    spaces: [privateJ, privateS, house],
    memberships: [
      { userId: jordan.id, spaceId: privateJ.id },
      { userId: sam.id, spaceId: privateS.id },
      { userId: jordan.id, spaceId: house.id },
      { userId: sam.id, spaceId: house.id },
    ],
    projects: [kitchen],
    blocks: [
      { id: "b1", projectId: kitchen.id, type: "decision", title: "Paint color", content: "Warm white cabinets; keep existing hardware." },
    ],
    tasks: [
      { id: "t1", spaceId: house.id, projectId: kitchen.id, title: "Paint cabinet faces", estimate: 120, actual: 150, status: "completed", collab: "claimed", ownerId: jordan.id },
      { id: "t2", spaceId: house.id, projectId: kitchen.id, title: "Install pantry shelves", estimate: 90, status: "open", collab: "pool" },
      { id: "t3", spaceId: house.id, projectId: kitchen.id, title: "Cut and install trim", estimate: 75, status: "open", collab: "claimed", ownerId: sam.id },
      { id: "t4", spaceId: privateJ.id, title: "Renew passport quietly", estimate: 20, status: "open", collab: "personal", ownerId: jordan.id },
      { id: "t5", spaceId: house.id, title: "Grab Pepsi next store run", estimate: 10, status: "open", collab: "requested", requesterId: jordan.id, assigneeId: sam.id, context: "errand" },
      { id: "t6", spaceId: house.id, title: "Take out recycling", estimate: 10, status: "open", collab: "pool" },
    ],
    events: [{ id: "e1", spaceId: house.id, title: "Hardware store run", start: later(8), kind: "event" }],
    placements: [{ id: "pl1", spaceId: house.id, taskId: "t2", title: "Install pantry shelves", start: later(6), kind: "task" }],
    rituals: [
      { id: "r1", spaceId: house.id, name: "Daily debrief", prompts: ["What landed?", "What moved?"], doneOn: null },
      { id: "r2", spaceId: house.id, name: "Weekly planning", prompts: ["What is actually possible?", "Shared load?"], doneOn: null },
    ],
    captures: [],
    currentUserId: null,
    currentSpaceId: house.id,
    route: "home",
    focus: null,
  };
};

function later(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return d.toISOString();
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || seed();
  } catch {
    return seed();
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

let state = load();

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function user() {
  return state.users.find((item) => item.id === state.currentUserId);
}

function space() {
  return visibleSpaces().find((item) => item.id === state.currentSpaceId) || visibleSpaces()[0];
}

function visibleSpaces() {
  const ids = state.memberships.filter((item) => item.userId === state.currentUserId).map((item) => item.spaceId);
  return state.spaces.filter((item) => ids.includes(item.id));
}

function visibleTasks(spaceId = space()?.id) {
  return state.tasks.filter((task) => task.spaceId === spaceId);
}

function interpret(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1)
    .map((line) => {
      const duration = line.match(/(\d+)\s*(m|min|mins|h|hr|hours)\b/i);
      let estimate = null;
      if (duration) {
        estimate = /h/i.test(duration[2]) ? Number(duration[1]) * 60 : Number(duration[1]);
      }
      const title = line
        .replace(duration?.[0] || "", "")
        .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
        .replace(/^[-*•\d.)\s]+/, "")
        .trim();
      const due = /\btomorrow\b/i.test(line)
        ? new Date(Date.now() + 86400000).toISOString()
        : WEEKDAYS.some((day) => line.toLowerCase().includes(day))
          ? new Date(Date.now() + 86400000 * 2).toISOString()
          : null;
      const dups = visibleTasks()
        .filter((task) => similar(task.title, title))
        .map((task) => ({ id: task.id, title: task.title }));
      return { id: uid("c"), title: title || line, estimate, due, action: dups[0] ? "merge" : "accept", mergeId: dups[0]?.id, dups, evidence: line };
    });
}

function similar(a, b) {
  const norm = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

function progress(projectId) {
  const tasks = state.tasks.filter((task) => task.projectId === projectId && task.status !== "archived");
  if (!tasks.length) return 0;
  const done = tasks.filter((task) => task.status === "completed");
  return Math.round((done.length / tasks.length) * 100);
}

function go(route) {
  state.route = route;
  save();
  render();
}

function html(strings, ...values) {
  return strings.reduce((out, part, index) => out + part + (values[index] ?? ""), "");
}

function render() {
  const root = document.getElementById("app");
  if (!state.currentUserId) {
    root.innerHTML = html`
      <main class="auth">
        <p class="kicker">GitHub Pages preview</p>
        <h1>GoalMates</h1>
        <p class="muted">This public preview runs in your browser. Data stays on this device. The full household server app is in the GitHub repo for a later hosted deploy.</p>
        <form class="panel" id="login">
          <label>Email<input name="email" type="email" value="jordan@goalmates.local" required /></label>
          <label>Password<input name="password" type="password" value="household-demo" required /></label>
          <p class="error hidden" id="login-error">Email or password did not match.</p>
          <button class="btn" type="submit">Continue</button>
          <p class="meta">Demo: jordan@goalmates.local or sam@goalmates.local / household-demo</p>
        </form>
      </main>`;
    document.getElementById("login").onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const email = String(form.get("email")).toLowerCase();
      const found = state.users.find((item) => item.email === email);
      if (!found || form.get("password") !== "household-demo") {
        document.getElementById("login-error").classList.remove("hidden");
        return;
      }
      state.currentUserId = found.id;
      state.currentSpaceId = visibleSpaces().find((item) => item.type === "shared")?.id || visibleSpaces()[0].id;
      go("home");
    };
    return;
  }

  const me = user();
  const current = space();
  const routes = [
    ["home", "Now"],
    ["capture", "Capture"],
    ["plan", "Plan"],
    ["tasks", "Do"],
    ["review", "Review"],
  ];
  root.innerHTML = html`
    <div class="shell">
      <aside class="side hidden-mobile">
        <p class="display">GoalMates</p>
        <p class="meta">Capture → Plan → Do → Review</p>
        ${routes.map(([id, label]) => `<button data-go="${id}">${label}</button>`).join("")}
        <button data-go="projects">Projects</button>
        <button data-go="opportunity">Opportunity</button>
        <p class="meta">${me.name}</p>
        <button id="signout">Sign out</button>
      </aside>
      <div>
        <div class="banner">Device-local preview on GitHub Pages. Shared work is simulated on this phone only.</div>
        <header class="page" style="padding-bottom:0">
          <div class="row">
            <strong>${me.name}</strong>
            <select id="space">${visibleSpaces()
              .map((item) => `<option value="${item.id}" ${item.id === current.id ? "selected" : ""}>${item.type === "personal" ? "Private" : "Shared"} · ${item.name}</option>`)
              .join("")}</select>
          </div>
        </header>
        <main class="page" id="page">${pageHtml(state.route, current)}</main>
        <nav class="nav">${routes.map(([id, label]) => `<button data-go="${id}">${label}</button>`).join("")}</nav>
      </div>
    </div>`;

  root.querySelectorAll("[data-go]").forEach((button) => {
    button.onclick = () => go(button.dataset.go);
  });
  document.getElementById("signout").onclick = () => {
    state.currentUserId = null;
    go("home");
  };
  document.getElementById("space").onchange = (event) => {
    state.currentSpaceId = event.target.value;
    save();
    render();
  };
  bindPage(state.route, current);
}

function pageHtml(route, current) {
  const open = visibleTasks().filter((task) => task.status !== "completed");
  if (route === "home") {
    const ritual = state.rituals.find((item) => item.spaceId === current.id && item.doneOn !== today());
    return html`
      <p class="kicker">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
      <h1>Hello, ${user().name.split(" ")[0]}.</h1>
      <p class="muted">${current.type === "shared" ? "Shared space" : "Private space"}: ${current.name}</p>
      <section class="panel"><h2>What deserves attention</h2>${open.slice(0, 6).map(taskRow).join("") || empty("Nothing open.")}</section>
      <section class="panel">
        <h2>Quick capture</h2>
        <textarea id="quick" placeholder="Call dentist tomorrow 15m"></textarea>
        <p><button class="btn" id="quick-go">Review extracted items</button></p>
      </section>
      <section class="panel"><h2>${ritual ? ritual.name : "No ritual waiting"}</h2>${ritual ? `<button class="btn secondary" data-go="review">Open debrief</button>` : `<p class="muted">Today's loop is clear.</p>`}</section>
    `;
  }
  if (route === "capture") {
    const latest = [...state.captures].reverse()[0];
    return html`
      <p class="kicker">Front door</p>
      <h1>Capture</h1>
      <section class="panel">
        <h2>Photo or typed list</h2>
        <label>Image<input id="file" type="file" accept="image/*" /></label>
        <img id="preview" class="source hidden" alt="Captured planner" />
        <label>Notes<textarea id="capture-text"></textarea></label>
        <p class="muted">Local OCR runs in this browser. If it cannot read handwriting, type what you see. Nothing is created until you accept.</p>
        <button class="btn" id="process">Process capture</button>
        <p class="meta" id="ocr-status"></p>
      </section>
      ${latest ? `<section class="panel" id="recon">${reconcileHtml(latest)}</section>` : ""}
    `;
  }
  if (route === "plan") {
    const start = startOfWeek(new Date());
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return html`
      <p class="kicker">Plan</p>
      <h1>Week on the desk</h1>
      <p class="muted">Green marks are scheduled tasks. Brass marks are events.</p>
      <div class="week">${days
        .map((day) => {
          const key = day.toISOString().slice(0, 10);
          const items = [...state.placements, ...state.events].filter(
            (item) => item.spaceId === current.id && item.start.slice(0, 10) === key,
          );
          return `<section class="day"><h3>${day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</h3>${items
            .map((item) => `<div class="chip ${item.kind}">${fmt(item.start)} ${item.title}</div>`)
            .join("")}</section>`;
        })
        .join("")}</div>
      <section class="panel">
        <h2>Place unscheduled work</h2>
        ${open
          .filter((task) => !state.placements.some((item) => item.taskId === task.id))
          .map(
            (task) =>
              `<div class="task"><div><strong>${esc(task.title)}</strong><form class="row place" data-id="${task.id}"><input type="datetime-local" name="start" required /><button class="btn secondary">Place</button></form></div></div>`,
          )
          .join("")}
      </section>
    `;
  }
  if (route === "tasks") {
    const members = state.users.filter((item) => item.id !== user().id);
    return html`
      <h1>Do</h1>
      <p class="muted">Standalone tasks are first-class. Projects are optional.</p>
      <section class="panel"><h2>Open work</h2>${open.map(taskRow).join("")}</section>
      <section class="panel">
        <h2>Add a task</h2>
        <form id="add-task">
          <label>Title<input name="title" required /></label>
          <label>Estimate (min)<input name="estimate" type="number" /></label>
          <label>Relationship<select name="project">${current ? `<option value="">Standalone</option>` : ""}${state.projects
            .filter((project) => project.spaceId === current.id)
            .map((project) => `<option value="${project.id}">${esc(project.name)}</option>`)
            .join("")}</select></label>
          ${current.type === "shared" ? `<label>Collaboration<select name="collab"><option value="pool">Shared pool</option><option value="claimed">Claimed by me</option></select></label>` : ""}
          <button class="btn">Save task</button>
        </form>
      </section>
      ${current.type === "shared"
        ? `<section class="panel"><h2>Lightweight ask</h2><form id="ask"><label>Need<input name="title" required placeholder="Grab Pepsi next store run" /></label><label>Ask<select name="assignee">${members
            .map((item) => `<option value="${item.id}">${esc(item.name)}</option>`)
            .join("")}</select></label><button class="btn secondary">Send ask</button></form></section>`
        : ""}
    `;
  }
  if (route === "projects") {
    const projects = state.projects.filter((project) => project.spaceId === current.id);
    return html`
      <h1>Projects</h1>
      ${projects
        .map((project) => {
          const pct = progress(project.id);
          return `<article class="panel"><h2>${esc(project.name)}</h2><p class="muted">${esc(project.outcome || "")}</p><div class="progress"><span style="width:${pct}%"></span></div><p class="meta">${pct}% from completed work</p>${visibleTasks()
            .filter((task) => task.projectId === project.id)
            .map(taskRow)
            .join("")}</article>`;
        })
        .join("")}
      <section class="panel"><h2>New project</h2><form id="add-project"><label>Name<input name="name" required /></label><label>Outcome<textarea name="outcome"></textarea></label><button class="btn">Create project</button></form></section>
    `;
  }
  if (route === "opportunity") {
    const minutes = 45;
    const ideas = open
      .map((task) => {
        const estimate = task.estimate || 30;
        let score = estimate <= minutes ? 70 : 30;
        const reasons = [estimate <= minutes ? `fits ${minutes} minutes` : "longer than the window"];
        if (task.collab === "requested") {
          score += 10;
          reasons.push("someone asked you");
        }
        return { task, score, reasons };
      })
      .filter((item) => item.score >= 40)
      .sort((a, b) => b.score - a.score);
    return html`
      <h1>I have some time</h1>
      <p class="muted">Offers, not assignments. Ignore anything that is not useful.</p>
      ${ideas
        .map(
          (item) =>
            `<article class="panel"><h2>${esc(item.task.title)}</h2><p class="meta">${item.task.estimate || "?"}m · ${item.reasons.join(" · ")}</p><button class="btn secondary start-focus" data-id="${item.task.id}">Start</button></article>`,
        )
        .join("") || `<p class="muted">Nothing obvious fits. Rest is a valid use of time.</p>`}
    `;
  }
  if (route === "focus") {
    const session = state.focus;
    if (!session) return `<p class="muted">No open session.</p>`;
    return html`<h1>Focus</h1><p class="kicker">${esc(session.title)}</p><div class="timer" id="clock">00:00</div><form id="end-focus" class="panel"><label>Notes<textarea name="notes"></textarea></label><label class="row" style="text-transform:none;letter-spacing:0"><input type="checkbox" name="complete" /> Mark the task complete</label><button class="btn">End session</button></form>`;
  }
  if (route === "review") {
    const done = visibleTasks().filter((task) => task.status === "completed");
    const ritual = state.rituals.find((item) => item.spaceId === current.id);
    const samples = done.filter((task) => task.estimate && task.actual);
    const ratio = samples.length
      ? samples.reduce((sum, task) => sum + task.actual / task.estimate, 0) / samples.length
      : null;
    return html`
      <h1>Review</h1>
      <section class="panel">
        <h2>${ratio ? (ratio > 1.2 ? "Work is taking longer than planned" : "Estimates are landing close") : "Not enough closed loops yet"}</h2>
        <p class="muted">${ratio ? `Actuals are about ${Math.round(ratio * 100)}% of the estimate across ${samples.length} finished tasks.` : "After a few estimates and actuals, calibration can show up. No score is invented before then."}</p>
      </section>
      <section class="panel"><h2>Completed</h2>${done.map((task) => `<p>${esc(task.title)}</p>`).join("")}</section>
      ${ritual
        ? `<section class="panel"><h2>${esc(ritual.name)}</h2><form id="ritual">${ritual.prompts
            .map((prompt) => `<label>${esc(prompt)}<textarea name="${esc(prompt)}"></textarea></label>`)
            .join("")}<button class="btn">Close this ritual</button></form></section>`
        : ""}
    `;
  }
  return "";
}

function taskRow(task) {
  const project = state.projects.find((item) => item.id === task.projectId);
  return html`<article class="task">
    <button class="tick complete" data-id="${task.id}" ${task.status === "completed" ? "disabled" : ""}>${task.status === "completed" ? "✓" : ""}</button>
    <div>
      <strong>${esc(task.title)}</strong>
      <p class="meta">${project ? project.name : "Standalone"}${task.estimate ? ` · ${task.estimate}m` : ""}${task.collab !== "personal" ? ` · ${task.collab}` : ""}</p>
      ${task.collab === "pool" ? `<button class="btn secondary claim" data-id="${task.id}">I'll take this</button>` : ""}
    </div>
  </article>`;
}

function reconcileHtml(capture) {
  return html`<h2>Review extracted items</h2><p class="meta">${capture.status}${capture.provider ? ` · ${capture.provider}` : ""}</p>
    ${capture.error ? `<p class="error">${esc(capture.error)}</p>` : ""}
    ${capture.image ? `<img class="source" src="${capture.image}" alt="Source" />` : ""}
    ${capture.candidates
      .map(
        (item) => `<article class="panel cand" data-id="${item.id}">
          <label>Title<input name="title" value="${esc(item.title)}" /></label>
          <label>Estimate<input name="estimate" value="${item.estimate || ""}" /></label>
          <label>Action<select name="action"><option value="accept">Accept standalone</option><option value="project">Attach to Kitchen Remodel</option><option value="create">Create project from this</option><option value="skip">Skip</option>${item.dups.length ? `<option value="merge">Merge duplicate</option>` : ""}</select></label>
          ${item.dups.length ? `<p class="meta">Possible duplicate: ${esc(item.dups[0].title)} — you decide.</p>` : ""}
        </article>`,
      )
      .join("")}
    ${capture.candidates.length ? `<button class="btn" id="accept">Accept selected items</button>` : `<p class="muted">No items were invented. Type them from the source if you can see them.</p>`}`;
}

function bindPage(route, current) {
  document.querySelectorAll(".complete").forEach((button) => {
    button.onclick = () => {
      const task = state.tasks.find((item) => item.id === button.dataset.id);
      task.status = "completed";
      task.actual = task.actual || task.estimate || 10;
      save();
      render();
    };
  });
  document.querySelectorAll(".claim").forEach((button) => {
    button.onclick = () => {
      const task = state.tasks.find((item) => item.id === button.dataset.id);
      task.collab = "claimed";
      task.ownerId = user().id;
      save();
      render();
    };
  });
  const quick = document.getElementById("quick-go");
  if (quick) {
    quick.onclick = () => {
      const text = document.getElementById("quick").value;
      addCapture({ sourceType: "text", text, provider: "text" });
      go("capture");
    };
  }
  const file = document.getElementById("file");
  if (file) {
    file.onchange = () => {
      const chosen = file.files?.[0];
      if (!chosen) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById("preview");
        preview.src = reader.result;
        preview.classList.remove("hidden");
        preview.dataset.url = reader.result;
      };
      reader.readAsDataURL(chosen);
    };
  }
  const process = document.getElementById("process");
  if (process) {
    process.onclick = async () => {
      const status = document.getElementById("ocr-status");
      const typed = document.getElementById("capture-text").value.trim();
      const image = document.getElementById("preview")?.dataset.url;
      if (typed) {
        addCapture({ sourceType: "text", text: typed, image, provider: "text" });
        render();
        return;
      }
      if (!image) {
        status.textContent = "Choose an image or type the list.";
        return;
      }
      status.textContent = "Reading the page in this browser…";
      try {
        const { createWorker } = await import("https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.esm.min.js");
        const worker = await createWorker("eng");
        const result = await worker.recognize(image);
        await worker.terminate();
        const text = result.data.text.trim();
        if (!text) {
          addCapture({
            sourceType: "image",
            text: "",
            image,
            provider: "tesseract",
            error: "Local OCR found no readable text. The image stayed saved. Type the items you can see.",
          });
        } else {
          addCapture({ sourceType: "image", text, image, provider: "tesseract" });
        }
      } catch (error) {
        addCapture({
          sourceType: "image",
          text: "",
          image,
          provider: "tesseract",
          error: `OCR failed (${error.message}). The image is still here for manual entry.`,
        });
      }
      render();
    };
  }
  const accept = document.getElementById("accept");
  if (accept) {
    accept.onclick = () => {
      const capture = state.captures.at(-1);
      document.querySelectorAll(".cand").forEach((node, index) => {
        const candidate = capture.candidates[index];
        const action = node.querySelector("[name=action]").value;
        const title = node.querySelector("[name=title]").value.trim();
        const estimate = Number(node.querySelector("[name=estimate]").value) || null;
        if (action === "skip") return;
        if (action === "merge") return;
        let projectId = null;
        if (action === "project") projectId = state.projects.find((item) => item.spaceId === current.id)?.id || null;
        if (action === "create") {
          const project = { id: uid("p"), spaceId: current.id, name: title, outcome: "Created from capture" };
          state.projects.push(project);
          projectId = project.id;
        }
        state.tasks.push({
          id: uid("t"),
          spaceId: current.id,
          projectId,
          title,
          estimate,
          status: "open",
          collab: current.type === "shared" ? "pool" : "personal",
          ownerId: current.type === "shared" ? null : user().id,
        });
      });
      capture.status = "reconciled";
      go("plan");
    };
  }
  document.querySelectorAll(".place").forEach((form) => {
    form.onsubmit = (event) => {
      event.preventDefault();
      const task = state.tasks.find((item) => item.id === form.dataset.id);
      const start = new Date(form.start.value).toISOString();
      state.placements.push({ id: uid("pl"), spaceId: current.id, taskId: task.id, title: task.title, start, kind: "task" });
      save();
      render();
    };
  });
  const addTask = document.getElementById("add-task");
  if (addTask) {
    addTask.onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(addTask);
      state.tasks.push({
        id: uid("t"),
        spaceId: current.id,
        projectId: form.get("project") || null,
        title: String(form.get("title")),
        estimate: Number(form.get("estimate")) || null,
        status: "open",
        collab: form.get("collab") || (current.type === "shared" ? "pool" : "personal"),
        ownerId: user().id,
      });
      save();
      render();
    };
  }
  const ask = document.getElementById("ask");
  if (ask) {
    ask.onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(ask);
      state.tasks.push({
        id: uid("t"),
        spaceId: current.id,
        title: String(form.get("title")),
        estimate: 10,
        status: "open",
        collab: "requested",
        requesterId: user().id,
        assigneeId: String(form.get("assignee")),
        context: "errand",
      });
      save();
      render();
    };
  }
  const addProject = document.getElementById("add-project");
  if (addProject) {
    addProject.onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(addProject);
      state.projects.push({ id: uid("p"), spaceId: current.id, name: String(form.get("name")), outcome: String(form.get("outcome") || "") });
      save();
      render();
    };
  }
  document.querySelectorAll(".start-focus").forEach((button) => {
    button.onclick = () => {
      const task = state.tasks.find((item) => item.id === button.dataset.id);
      state.focus = { taskId: task.id, title: task.title, startedAt: Date.now(), planned: task.estimate || 25 };
      go("focus");
    };
  });
  if (route === "focus" && state.focus) {
    const clock = document.getElementById("clock");
    const tick = () => {
      const remaining = state.focus.planned * 60 - Math.floor((Date.now() - state.focus.startedAt) / 1000);
      const abs = Math.abs(remaining);
      clock.textContent = `${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.getElementById("end-focus").onsubmit = (event) => {
      event.preventDefault();
      clearInterval(timer);
      const form = new FormData(event.target);
      if (form.get("complete")) {
        const task = state.tasks.find((item) => item.id === state.focus.taskId);
        if (task) {
          task.status = "completed";
          task.actual = Math.max(1, Math.round((Date.now() - state.focus.startedAt) / 60000));
        }
      }
      state.focus = null;
      go("home");
    };
  }
  const ritual = document.getElementById("ritual");
  if (ritual) {
    ritual.onsubmit = (event) => {
      event.preventDefault();
      const found = state.rituals.find((item) => item.spaceId === current.id);
      found.doneOn = today();
      save();
      render();
    };
  }
}

function addCapture({ sourceType, text, image, provider, error }) {
  state.captures.push({
    id: uid("cap"),
    sourceType,
    image: image || null,
    raw: text,
    provider,
    error: error || null,
    status: error || !text ? "failed" : "needs_review",
    candidates: text ? interpret(text) : [],
  });
  save();
}

function empty(text) {
  return `<p class="muted">${text}</p>`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function fmt(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

document.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
  render();
});
