const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
app.set("trust proxy", true); // QUAN TRỌNG khi deploy

const db = new sqlite3.Database("./data.db");

/* ================= GEMINI API ================= */

app.post("/ask", async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ reply: "Bạn chưa nhập nội dung." });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ reply: "Chưa cấu hình API key 😢" });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: `Bạn là Trợ lý Lớp Học Xanh chuyên về môi trường.
                                    Trả lời ngắn gọn, thân thiện.

                                    Câu hỏi: ${userMessage}`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(500).json({ reply: "AI đang bận 😢" });
        }

        const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "AI chưa trả lời được 😅";

            res.json({ reply });

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ reply: "Lỗi server 😢" });
    }
});

/* ================= DATABASE ================= */

db.serialize(() => {
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

});

/* ================= VISIT ================= */

app.post("/visit", (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (ip === "::1") ip = "127.0.0.1";
    if (ip?.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    const time = new Date().toISOString();

    db.get("SELECT * FROM visitors WHERE ip = ?", [ip], (err, row) => {
        if (row) {
            return res.json({ message: "IP đã tồn tại" });
        }

        db.run(
            "INSERT INTO visitors (ip, time) VALUES (?, ?)",
               [ip, time],
               (err) => {
                   if (err) {
                       return res.status(500).json({ error: "Lỗi lưu IP" });
                   }
                   res.json({ message: "Lượt truy cập mới" });
               }
        );
    });
});

/* ================= COUNT ================= */

app.get("/count", (req, res) => {
    db.get("SELECT COUNT(*) as total FROM visitors", (err, row) => {
        if (err) return res.status(500).json({ error: "Lỗi đếm" });
        res.json(row);
    });
});

/* ================= IDEAS ================= */

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
        if (err) return res.status(500).json({ error: "Lỗi lấy dữ liệu" });
        res.json(rows);
    });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server chạy tại port ${PORT}`);
});
