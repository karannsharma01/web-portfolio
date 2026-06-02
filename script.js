document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.section-reveal');

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    revealElements.forEach(el => revealObserver.observe(el));

    // --- 2. Navbar Background on Scroll ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // --- 3. Dynamic Blob Movement ---
    const blobs = document.querySelectorAll('.blob');
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;
            
            blob.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // --- 4. Chatbot Logic (Gemini API) ---
    const chatToggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const closeChatBtn = document.getElementById('close-chat');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // UI Toggle
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if(chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // API Configuration - Read from environment variable injected by build script
    const API_KEY = window.ENV?.API_KEY || 'MISSING_API_KEY'; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

    // System Context (Karan's Resume)
    const systemPrompt = `You are the AI assistant for Karan's portfolio website. Your job is to answer questions about Karan's skills, experience, and projects professionally and concisely. 
    Context:
    - Name: Karan, Location: Hamirpur, Himachal Pradesh.
    - Role: AI & Machine Learning Engineer.
    - Education: B.Tech in Computer Science (AI & ML) at Jawaharlal Nehru Govt. Engineering College (2022-2026), CGPA 7.8.
    - Skills: Python, C/C++, JavaScript, SQL, PyTorch, TensorFlow, Scikit-learn, Hugging Face, LangChain, Docker, Kubernetes, AWS EC2, GitHub Actions, CI/CD, FastAPI, MongoDB, MySQL, Qdrant, ChromaDB, Streamlit, Pandas.
    - Experience:
      1. Dripi (AI/ML Intern, Jan 2026 - Present): Built rule-based fashion recommendation engine, implemented vector search with Qdrant, developed image moderation pipeline (Hugging Face NSFW + ONNX).
      2. IIT Mandi (Research Intern, June-July 2025): Built stacked ensemble ML model for treatment efficacy, addressed class imbalance.
      3. NIT Hamirpur (ML Intern, June-July 2024): Extractive QA system using RoBERTa. Paper selected for ICMLDE 2024.
    - Projects:
      1. Price Pilot: E-commerce price comparison (Python, Flask, React, MongoDB, Gemini API, Phi-3).
      2. Cold Mail Generator: LLM email tool (Streamlit, LLaMA 3.3, LangChain, ChromaDB).
      3. ESRGAN Image Super-Resolution: Used PyTorch, achieved 25.15 dB PSNR on DIV2K.
    - Achievements: Solved 150+ problems on LeetCode/GFG, Led team of 10.
    Rule: Only answer questions related to Karan's professional profile. Keep answers short (1-3 sentences). Don't invent information.`;

    let conversationHistory = [];

    async function sendMessageToGemini(userText) {
        // Prepare payload with history and system prompt
        const contents = [
            {
                role: "user",
                parts: [{ text: "SYSTEM INSTRUCTION: " + systemPrompt }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I will act as Karan's assistant." }]
            }
        ];

        // Append past conversation
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });

        // Append current message
        contents.push({
            role: "user",
            parts: [{ text: userText }]
        });

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contents: contents })
            });

            if (!response.ok) {
                console.error("API Error:", response.status);
                return "Sorry, I'm having trouble connecting right now.";
            }

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;
            
            // Save to history
            conversationHistory.push({ role: 'user', text: userText });
            conversationHistory.push({ role: 'bot', text: botResponse });
            
            return botResponse;

        } catch (error) {
            console.error("Fetch Error:", error);
            return "Oops, something went wrong on my end.";
        }
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        msgDiv.textContent = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.classList.add('message', 'bot', 'typing-indicator');
        indicatorDiv.id = 'typing-indicator';
        indicatorDiv.innerHTML = '<span></span><span></span><span></span>';
        chatBody.appendChild(indicatorDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicatorDiv = document.getElementById('typing-indicator');
        if (indicatorDiv) {
            indicatorDiv.remove();
        }
    }

    async function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (!text) return;

        // User message
        appendMessage('user', text);
        chatInput.value = '';

        // Bot loading
        showTypingIndicator();

        // Fetch response
        const botText = await sendMessageToGemini(text);

        // Bot message
        removeTypingIndicator();
        appendMessage('bot', botText);
    }

    sendBtn.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleChatSubmit();
        }
    });
});
