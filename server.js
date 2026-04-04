const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

// 1. CẤU HÌNH MIDDLEWARE
app.use(express.json());
app.set("trust proxy", true); // Quan trọng khi deploy Render/Railway

// 2. CẤU HÌNH CORS (Sửa link Aeonfree của bạn vào đây)
app.use(cors({
    origin: ['https://tên-miền-của-bạn.aeonfree.com', 'http://127.0.0.1:5500'], // Thêm link local để test nếu cần
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 3. KẾT NỐI DATABASE SQLITE
const dbPath = path.resolve(__dirname, "data.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Lỗi kết nối DB:", err.message);
    else console.log("Đã kết nối Database SQLite.");
});

// Khởi tạo bảng nếu chưa có
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS visitors (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT UNIQUE, time TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, idea TEXT, date TEXT)`);
});

// 4. PHỤC VỤ FILE TĨNH
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= ROUTES XỬ LÝ ================= */

// API GEMINI AI
app.post("/ask", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!userMessage) return res.status(400).json({ reply: "Bạn chưa nhập nội dung." });
        if (!API_KEY) return res.status(500).json({ reply: "Chưa cấu hình API key trên Server 😢" });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Bạn là Trợ lý Lớp Học Xanh chuyên về môi trường. Trả lời ngắn gọn, thân thiện. Câu hỏi: ${userMessage}` }] }]
                })
            }
        );

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI đang bận, thử lại sau nhé 😅";
        res.json({ reply });

    } catch (err) {
        console.error("Lỗi Gemini:", err);
        res.status(500).json({ reply: "Lỗi kết nối AI 😢" });
    }
});

// ĐẾM LƯỢT TRUY CẬP (VISIT)
app.post("/visit", (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (ip === "::1") ip = "127.0.0.1";
    if (ip?.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    const time = new Date().toISOString();

    db.get("SELECT * FROM visitors WHERE ip = ?", [ip], (err, row) => {
        if (err) return res.status(500).json({ error: "Lỗi DB" });
        if (row) return res.json({ message: "IP đã tồn tại" });

        db.run("INSERT INTO visitors (ip, time) VALUES (?, ?)", [ip, time], (err) => {
            if (err) return res.status(500).json({ error: "Lỗi lưu IP" });
            res.json({ message: "Lượt truy cập mới" });
        });
    });
});

// LẤY TỔNG SỐ LƯỢT TRUY CẬP
app.get("/count", (req, res) => {
    db.get("SELECT COUNT(*) as total FROM visitors", (err, row) => {
        if (err) return res.status(500).json({ error: "Lỗi đếm" });
        res.json(row);
    });
});

// THÊM Ý TƯỞNG (IDEAS)
app.post("/add-idea", (req, res) => {
    const { name, idea } = req.body;
    const date = new Date().toLocaleDateString("vi-VN");

    if (!name || !idea) return res.status(400).json({ error: "Thiếu thông tin" });

    db.run("INSERT INTO ideas (name, idea, date) VALUES (?, ?, ?)", [name, idea, date], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi lưu dữ liệu" });
        res.json({ message: "Đã lưu thành công!" });
    });
});

// LẤY DANH SÁCH Ý TƯỞNG
app.get("/ideas", (req, res) => {
    db.all("SELECT * FROM ideas ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy dữ liệu" });
        res.json(rows);
    });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
