const knowledge = {
    rac: [
        "Bạn nên phân loại rác thành hữu cơ, tái chế và vô cơ.",
        "Phân loại rác giúp giảm ô nhiễm môi trường 🌱"
    ],
    dien: [
        "Hãy tắt quạt và đèn khi không sử dụng.",
        "Tiết kiệm điện giúp giảm khí thải CO2."
    ],
    nuoc: [
        "Không nên để vòi nước chảy liên tục.",
        "Tiết kiệm nước giúp bảo vệ tài nguyên thiên nhiên."
    ]
};

// type effect
function typeEffect(element, text, speed = 25) {
    element.innerHTML = "";
    let i = 0;

    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        }
    }

    typing();
}

// sendMessage
async function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const text = input.value.trim();

    if (!text) return;

    // usermess
    chatBox.innerHTML += `<p><b>Bạn:</b> ${text}</p>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loading = document.createElement("p");
    loading.id = "loading";
    loading.innerHTML = "<b>AI:</b> Đang suy nghĩ...";
    chatBox.appendChild(loading);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch("https://lop-hoc-xanh.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();


        loading.remove();


        const aiMessage = document.createElement("p");
        aiMessage.innerHTML = "<b>AI:</b> ";
        chatBox.appendChild(aiMessage);

        const span = document.createElement("span");
        aiMessage.appendChild(span);


        typeEffect(span, data.reply, 20);

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        loading.remove();
        chatBox.innerHTML += `<p><b>AI:</b> Lỗi kết nối server 😢</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}




const API_URL = "https://script.google.com/macros/s/AKfycbzkRet7cKrKXjFJ7SPv4lUgbVC7hl8WyveEtYGkGKVDPwt3lvBCRfEss9qAaXg3IquajQ/exec";


function toggleMenu() {
    document.getElementById("dropdownMenu").classList.toggle("show");
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const id = this.getAttribute("href");
        const target = document.querySelector(id);
        if (!target) return;

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        document.getElementById("dropdownMenu").classList.remove("show");
    });
});


async function submitIdea(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();

    const selected = Array.from(document.querySelectorAll('#ideaOptions input:checked'))
        .map(i => i.value);

    if (!name || selected.length === 0) {
        alert("Vui lòng chọn ít nhất 1 ý tưởng!");
        return;
    }

    const idea = selected.join(", ");

    try {
        await fetch(
            `${API_URL}?type=idea&name=${encodeURIComponent(name)}&idea=${encodeURIComponent(idea)}`,
            { method: "GET", mode: "no-cors" }
        );

        alert("Gửi thành công!");

        document.getElementById("name").value = "";
        document.querySelectorAll('#ideaOptions input').forEach(i => i.checked = false);

        saveLocalIdea(name, idea);

        setTimeout(() => {
            loadStats();
            renderChart();
            renderTable();
        }, 500);

    } catch (err) {
        console.error("Lỗi gửi ý tưởng:", err);
        alert("Có lỗi xảy ra!");
    }
}

/* =========================
   LOCAL STORAGE
========================= */
function saveLocalIdea(name, idea) {
    const ideas = JSON.parse(localStorage.getItem("ideas") || "[]");
    ideas.push({
        date: new Date().toLocaleDateString(),
        name,
        idea
    });
    localStorage.setItem("ideas", JSON.stringify(ideas));
}

function renderTable() {
    const ideas = JSON.parse(localStorage.getItem("ideas") || "[]");
    const table = document.getElementById("ideaTable");
    table.innerHTML = "";

    ideas.forEach(i => {
        const row = `
                <tr>
                    <td>${i.date}</td>
                    <td>${i.name}</td>
                    <td>${i.idea}</td>
                </tr>
            `;
        table.innerHTML += row;
    });
}


let chart;

function renderChart() {
    const ideas = JSON.parse(localStorage.getItem("ideas") || "[]");

    const counts = {};

    ideas.forEach(i => {
        i.idea.split(", ").forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const ctx = document.getElementById("ideaChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percent = ((value / total) * 100).toFixed(1);
                            return context.label + ": " + value + " hs (" + percent + "%)";
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/* =========================
   VISIT
========================= */
async function countVisit() {
    try {
        await fetch(`${API_URL}?type=visit`, {
            method: "GET",
            mode: "no-cors"
        });
    } catch (err) {
        console.error("Lỗi đếm visit:", err);
    }
}

/* =========================
   SCROLL TOP
========================= */
const scrollBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
        scrollBtn.style.display = "flex";
    } else {
        scrollBtn.style.display = "none";
    }
});

scrollBtn.onclick = () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

/* =========================
   LOAD STATS (JSONP)
========================= */
function handleStats(data) {
    document.getElementById("visitCounter").innerText = data.visits || 0;
}

function loadStats() {
    const oldScript = document.getElementById("statsScript");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "statsScript";
    script.src = `${API_URL}?type=stats&callback=handleStats`;

    document.body.appendChild(script);
}

/* =========================
   DARK MODE
========================= */
function toggleDarkMode() {
    const body = document.body;
    const icon = document.getElementById("themeIcon");
    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
        icon.src = "https://cdn-icons-png.flaticon.com/512/869/869869.png";
        localStorage.setItem("theme", "dark");
    } else {
        icon.src = "https://cdn-icons-png.flaticon.com/512/581/581601.png";
        localStorage.setItem("theme", "light");
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    const icon = document.getElementById("themeIcon");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        icon.src = "https://cdn-icons-png.flaticon.com/512/869/869869.png";
    }
}

/* =========================
   LOAD WEB
========================= */
window.addEventListener("load", async () => {
    loadTheme();

    if (!localStorage.getItem("visited")) {
        await countVisit();
        localStorage.setItem("visited", "true");
    }

    renderTable();
    renderChart();

    setTimeout(loadStats, 500);
});
