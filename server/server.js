const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("./data.db");


db.run(`
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE,
    time TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    idea TEXT,
    date TEXT
)
`);


app.post("/visit", (req, res) => {

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Chuẩn hóa IP local
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
    const time = new Date().toISOString();

    // Kiểm tra IP đã tồn tại chưa
    db.get("SELECT * FROM visitors WHERE ip = ?", [ip], (err, row) => {

        if (row) {
            return res.json({ message: "IP đã tồn tại" });
        }

        db.run(
            "INSERT INTO visitors (ip, time) VALUES (?, ?)",
               [ip, time],
               (err) => {
                   if (err) {s
                       return res.status(500).json({ error: "Lỗi lưu IP" });
                   }
                   res.json({ message: "Lượt truy cập mới" });
               }
        );
    });
});

app.get("/count", (req, res) => {
    db.get("SELECT COUNT(*) as total FROM visitors", (err, row) => {
        res.json(row);
    });
});


app.post("/add-idea", (req, res) => {
    const { name, idea } = req.body;

    const date = new Date().toLocaleDateString();

    db.run(
        "INSERT INTO ideas (name, idea, date) VALUES (?, ?, ?)",
           [name, idea, date],
           (err) => {
               if (err) {
                   return res.status(500).json({ error: "Lỗi lưu dữ liệu" });
               }
               res.json({ message: "Đã lưu thành công!" });
           }
    );
});

app.get("/ideas", (req, res) => {
    db.all("SELECT * FROM ideas ORDER BY id DESC", (err, rows) => {
        res.json(rows);
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
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

function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const text = input.value.toLowerCase();

    if (!text) return;

    chatBox.innerHTML += `<p><b>Bạn:</b> ${text}</p>`;
    input.value = "";

    chatBox.innerHTML += `<p id="loading"><b>AI:</b> Đang suy nghĩ...</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        document.getElementById("loading").remove();

        let reply = "Xin lỗi mình chưa hiểu câu hỏi 😅";

        for (let key in knowledge) {
            if (text.includes(key)) {
                const answers = knowledge[key];
                reply = answers[Math.floor(Math.random() * answers.length)];
            }
        }

        chatBox.innerHTML += `<p><b>AI:</b> ${reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}
