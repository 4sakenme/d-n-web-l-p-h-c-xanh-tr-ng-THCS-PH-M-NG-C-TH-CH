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
