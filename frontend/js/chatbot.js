document.addEventListener("DOMContentLoaded", () => {
  // Create UI elements
  const chatButton = document.createElement("button");
  chatButton.id = "ai-chat-btn";
  chatButton.innerHTML = "💬";
  chatButton.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--primary-color, #4F46E5);
    color: white;
    font-size: 28px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  `;

  chatButton.addEventListener("mouseover", () => chatButton.style.transform = "scale(1.1)");
  chatButton.addEventListener("mouseout", () => chatButton.style.transform = "scale(1)");

  const chatWindow = document.createElement("div");
  chatWindow.id = "ai-chat-window";
  chatWindow.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 350px;
    height: 450px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    display: none;
    flex-direction: column;
    z-index: 9998;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    font-family: 'Inter', sans-serif;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    background-color: var(--primary-color, #4F46E5);
    color: white;
    padding: 16px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>AI Recommendation Bot</span>
    <button id="close-chat-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">&times;</button>
  `;

  // Body
  const chatBody = document.createElement("div");
  chatBody.id = "ai-chat-body";
  chatBody.style.cssText = `
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: #f9fafb;
  `;

  // Input area
  const inputArea = document.createElement("div");
  inputArea.style.cssText = `
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
    background: #fff;
  `;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ask for recommendations...";
  input.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 20px;
    outline: none;
    font-size: 14px;
  `;
  const sendBtn = document.createElement("button");
  sendBtn.innerHTML = "Send";
  sendBtn.style.cssText = `
    background-color: var(--primary-color, #4F46E5);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 500;
  `;

  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);

  chatWindow.appendChild(header);
  chatWindow.appendChild(chatBody);
  chatWindow.appendChild(inputArea);

  document.body.appendChild(chatButton);
  document.body.appendChild(chatWindow);

  // Toggle chat
  chatButton.addEventListener("click", () => {
    chatWindow.style.display = chatWindow.style.display === "none" ? "flex" : "none";
  });
  
  header.querySelector("#close-chat-btn").addEventListener("click", () => {
    chatWindow.style.display = "none";
  });

  // Chat logic
  const addMessage = (text, isUser = false) => {
    const msg = document.createElement("div");
    msg.style.cssText = `
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.4;
      word-wrap: break-word;
      font-size: 14px;
      ${isUser ? `
        background-color: var(--primary-color, #4F46E5);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      ` : `
        background-color: #e5e7eb;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      `}
    `;
    msg.innerText = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const handleSend = async () => {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    input.value = "";
    
    // Add loading indicator
    const loadingId = "loading-" + Date.now();
    const loadingMsg = document.createElement("div");
    loadingMsg.id = loadingId;
    loadingMsg.innerText = "Thinking...";
    loadingMsg.style.cssText = "align-self: flex-start; color: #6b7280; font-size: 13px; font-style: italic;";
    chatBody.appendChild(loadingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text })
      });
      const data = await res.json();
      
      document.getElementById(loadingId).remove();
      addMessage(data.reply || "No response received.");
    } catch (err) {
      document.getElementById(loadingId).remove();
      addMessage("Sorry, I could not connect to the server.");
    }
  };

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });

  // Initial greeting message
  setTimeout(() => {
    addMessage("Hello! I'm your AI recommendation bot. Ask me for hackathon recommendations or help finding a team!");
  }, 500);
});
