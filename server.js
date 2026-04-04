const express = require("express");
const mysql = require("mysql2"); // Đổi từ sqlite3 sang mysql2
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

// 1. CẤU HÌNH MIDDLEWARE
app.use(express.json());
app.set("trust proxy", true);

// 2. CẤU HÌNH CORS
app.use(cors({
    origin: [
        'http://truonghocxanh.zya.me',
        'https://truonghocxanh.zya.me',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 3. KẾT NỐI DATABASE MYSQL (AEONFREE)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối và tạo bảng nếu chưa có
db.query(`CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(255) UNIQUE, time VARCHAR(255))`, (err) => {
    if (err) console.error("Lỗi tạo bảng visitors:", err.message);
});
db.query(`CREATE TABLE IF NOT EXISTS ideas (id INT AUTO_INCREMENT PRIMARY KEY, name TEXT, idea TEXT, date VARCHAR(255))`, (err) => {
    if (err) console.error("Lỗi tạo bảng ideas:", err.message);
});

// 4. PHỤC VỤ FILE TĨNH
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= ROUTES XỬ LÝ ================= */

// API GEMINI AI (GIỮ NGUYÊN MODEL 2.5 FLASH)
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
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.json({ reply: "AI đang gặp lỗi kỹ thuật, thử lại sau nhé!" });
        }

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

    db.query("SELECT * FROM visitors WHERE ip = ?", [ip], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi DB" });
        if (results.length > 0) return res.json({ message: "IP đã tồn tại" });

        db.query("INSERT INTO visitors (ip, time) VALUES (?, ?)", [ip, time], (err) => {
            if (err) return res.status(500).json({ error: "Lỗi lưu IP" });
            res.json({ message: "Lượt truy cập mới" });
        });
    });
});

// LẤY TỔNG SỐ LƯỢT TRUY CẬP
app.get("/count", (req, res) => {
    db.query("SELECT COUNT(*) as total FROM visitors", (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi đếm" });
        res.json({ total: results[0].total });
    });
});

// THÊM Ý TƯỞNG (IDEAS)
app.post("/add-idea", (req, res) => {
    const { name, idea } = req.body;
    const date = new Date().toLocaleDateString("vi-VN");

    if (!name || !idea) return res.status(400).json({ error: "Thiếu thông tin" });

    db.query("INSERT INTO ideas (name, idea, date) VALUES (?, ?, ?)", [name, idea, date], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi lưu dữ liệu" });
        res.json({ message: "Đã lưu thành công!" });
    });
});

// LẤY DANH SÁCH Ý TƯỞNG
app.get("/ideas", (req, res) => {
    db.query("SELECT * FROM ideas ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy dữ liệu" });
        res.json(results);
    });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server MySQL đang chạy tại port: ${PORT}`);
});
