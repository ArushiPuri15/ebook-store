// src/components/Chatbot.js

import React, { useState } from 'react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = ({ onClose }) => {
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);

    const handleSendMessage = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!message) return;

        // Update chat log with user message
        setChatLog(prev => [...prev, { text: message, sender: 'user' }]);
        setMessage(''); // Clear input

        try {
            const response = await axios.post('http://localhost:5000/chatbot', { message });
            console.log("Response from chatbot:", JSON.stringify(response.data, null, 2));
            
            // Check the response structure and extract the chatbot's reply
            const botReply = response.data.reply || response.data.response || "Sorry, I didn't understand that.";
            
            // Update chat log with response from the chatbot
            setChatLog(prev => [...prev, { text: botReply, sender: 'bot' }]);
        } catch (error) {
            console.error("Error sending message to chatbot:", error);
            setChatLog(prev => [...prev, { text: "Error communicating with the chatbot.", sender: 'bot' }]);
        }
    };

    return (
        <div className="chatbot">
            <div className="chat-window">
                {chatLog.map((chat, index) => (
                    <div key={index} className={chat.sender}>
                        {chat.text}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button type="submit">Send</button>
            </form>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

export default Chatbot;
