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

// ================= HIỆU ỨNG GÕ CHỮ =================
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

// ================= GỬI TIN NHẮN =================
async function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const text = input.value.trim();

    if (!text) return;

    // Tin nhắn người dùng
    chatBox.innerHTML += `<p><b>Bạn:</b> ${text}</p>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Hiện AI đang gõ
    const loading = document.createElement("p");
    loading.id = "loading";
    loading.innerHTML = "<b>AI:</b> Đang suy nghĩ...";
    chatBox.appendChild(loading);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();

        // Xóa loading
        loading.remove();

        // Tạo dòng AI mới
        const aiMessage = document.createElement("p");
        aiMessage.innerHTML = "<b>AI:</b> ";
        chatBox.appendChild(aiMessage);

        const span = document.createElement("span");
        aiMessage.appendChild(span);

        // Hiệu ứng gõ chữ
        typeEffect(span, data.reply, 20);

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        loading.remove();
        chatBox.innerHTML += `<p><b>AI:</b> Lỗi kết nối server 😢</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
