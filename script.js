const API_URL = "http://127.0.0.1:5000";

// ================= LOGIN =================
function login() {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {

        console.log("LOGIN RESPONSE:", data);

        if (data.token) {

            localStorage.setItem("token", data.token);
            localStorage.setItem("emp_id", data.emp_id);
            localStorage.setItem("name", data.name);
            localStorage.setItem("role", data.role);
            if (data.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "employee.html";
            }

        } else {
            document.getElementById("msg").innerText =
                data.message || "Login Failed";
        }

    })
    .catch(err => {
        console.error(err);
    });
}

// ================= APPLY LEAVE =================
function applyLeave() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Login Again");
        window.location.href = "login.html";
        return;
    }

    fetch(`${API_URL}/apply_leave`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            leave_type: document.getElementById("leave_type").value,
            start_date: document.getElementById("start_date").value,
            end_date: document.getElementById("end_date").value,
            reason: document.getElementById("reason").value
        })
    })
    .then(async res => {

        const data = await res.json();

        console.log("APPLY LEAVE:", data);

        if (!res.ok) {
            alert(data.msg || data.message || "Request Failed");
            return;
        }

        alert(data.message);
        loadLeaves();
    })
    .catch(err => {
        console.error(err);
    });
}

// ================= EMPLOYEE LEAVES =================
function loadLeaves() {

    let emp_id = localStorage.getItem("emp_id");
    let token = localStorage.getItem("token");

    if (!token) {
        console.log("No token found");
        return;
    }

    fetch(`${API_URL}/view_leaves/${emp_id}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(async res => {

        const data = await res.json();

        console.log("LEAVES:", data);

        if (!res.ok) {
            console.error(data);
            return;
        }

        let table = `
        <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
        </tr>
        `;

        if (!Array.isArray(data)) {
            console.error("Expected array:", data);
            return;
        }

        data.forEach(l => {

            let statusClass = (l.status || "Pending").toLowerCase();

            table += `
            <tr>
                <td>${l.leave_id}</td>
                <td>${l.leave_type}</td>
                <td class="${statusClass}">
                    ${l.status}
                </td>
            </tr>
            `;
        });

        document.getElementById("leaveTable").innerHTML = table;
    })
    .catch(err => {
        console.error(err);
    });
}

// ================= ADMIN REQUESTS =================
function loadRequests() {

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/all_requests`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(async res => {

        const data = await res.json();

        console.log("REQUESTS:", data);

        if (!res.ok) {
            console.error(data);
            return;
        }

        let table = `
        <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Status</th>
            <th>Action</th>
        </tr>
        `;

        let pending = 0;

        data.forEach(req => {

            if (req.status === "Pending") {
                pending++;
            }

            table += `
            <tr>
                <td>${req.leave_id}</td>
                <td>${req.name}</td>
                <td>${req.leave_type}</td>

                <td class="${req.status.toLowerCase()}">
                    ${req.status}
                </td>

                <td>
                    ${
                        req.status === "Pending"
                        ? `
                        <button class="approve-btn"
                        onclick="approveLeave(${req.leave_id})">
                        Approve
                        </button>

                        <button class="reject-btn"
                        onclick="rejectLeave(${req.leave_id})">
                        Reject
                        </button>
                        `
                        : req.status
                    }
                </td>
            </tr>
            `;
        });

        document.getElementById("requestTable").innerHTML = table;

        if (document.getElementById("totalRequests")) {
            document.getElementById("totalRequests").innerText = data.length;
        }

        if (document.getElementById("pendingRequests")) {
            document.getElementById("pendingRequests").innerText = pending;
        }
    })
    .catch(err => {
        console.error(err);
    });
}

// ================= APPROVE =================
function approveLeave(id) {

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/approve_leave/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadRequests();
    })
    .catch(err => console.error(err));
}

// ================= REJECT =================
function rejectLeave(id) {

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/reject_leave/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadRequests();
    })
    .catch(err => console.error(err));
}

// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {

    console.log("TOKEN:", localStorage.getItem("token"));

    if (
        window.location.pathname.includes("admin.html") ||
        window.location.pathname.includes("employee.html")
    ) {
        if (!localStorage.getItem("token")) {
            window.location.href = "login.html";
            return;
        }
    }

    if (document.getElementById("leaveTable")) {
        loadLeaves();
    }

    if (document.getElementById("requestTable")) {
        loadRequests();
    }
});

// ================= LOGOUT =================
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}