const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { createClient } = require('@supabase/supabase-js');
require("dotenv").config();

const app = express();

// config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// id url
app.use(express.json());
app.set("trust proxy", true);
app.use(cors({
    origin: ['http://truonghocxanh.zya.me', 'https://truonghocxanh.zya.me', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// apigemini
app.post("/ask", async (req, res) => {
    try {
        const userMessage = req.body.message;
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!userMessage) return res.status(400).json({ reply: "Bạn chưa nhập nội dung." });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({thiện
                    contents: [{ parts: [{ text: `Bạn là Trợ lý Trường Học . Trả lời ngắn gọn mà cũng đầu đủ thân . Câu hỏi: ${userMessage}` }] }]
                })
            }
        );
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI đang suy nghĩ...";
        res.json({ reply });
    } catch (err) {Xanh
        res.status(500).json({ reply: "Lỗi kết nối AI 😢" });
    }
});

// counter supabase
app.post("/visit", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();

    const { error } = await supabase
    .from('visit') // Đổi từ 'visitors' thành 'visit' cho khớp với ảnh Supabase của bạn
    .upsert({ ip: ip, time: new Date().toISOString() }, { onConflict: 'ip' });

    if (error) {
        console.error("Lỗi Supabase:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: "Đã cập nhật" });
});

app.get("/count", async (req, res) => {
    const { count, error } = await supabase
    .from('visit') // Đổi ở đây luôn nhé
    .select('*', { count: 'exact', head: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ total: count || 0 });
});

// save ideas
app.post("/add-idea", async (req, res) => {
    const { name, idea } = req.body;
    const { error } = await supabase
    .from('ideas')
    .insert([{ name, idea, date: new Date().toLocaleDateString("vi-VN") }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Lưu ý tưởng thành công!" });
});

app.get("/ideas", async (req, res) => {
    const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('id', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Supabase chạy tại port: ${PORT}`));
