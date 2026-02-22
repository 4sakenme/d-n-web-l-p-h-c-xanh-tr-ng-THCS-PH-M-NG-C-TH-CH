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

async function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const text = input.value;

    if (!text) return;

    // Hiện tin nhắn người dùng
    chatBox.innerHTML += `<p><b>Bạn:</b> ${text}</p>`;
    input.value = "";

    // Loading
    chatBox.innerHTML += `<p id="loading"><b>AI:</b> Đang suy nghĩ...</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();

        document.getElementById("loading").remove();

        chatBox.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        document.getElementById("loading").remove();
        chatBox.innerHTML += `<p><b>AI:</b> Lỗi kết nối server 😢</p>`;
    }
}
