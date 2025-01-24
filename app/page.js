'use client';
import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [displayedResult, setDisplayedResult] = useState('');
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null); // To manage timeouts

  const TYPE_DELAY = 30; // Delay in milliseconds between each character

  /**
   * Simulates a typing effect by displaying the response character by character.
   * @param {string} plainText - The plain text to display.
   */
  const typeWriter = (plainText) => {
    setDisplayedResult('');
    setIsTyping(true);

    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < plainText.length) {
        setDisplayedResult((prev) => prev + plainText[currentIndex]);
        currentIndex += 1;
        typingTimeoutRef.current = setTimeout(typeNextChar, TYPE_DELAY);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();
  };

  /**
   * Handles the generation of text by sending the prompt to the backend API
   * and initiating the typing effect upon receiving the response.
   */
  async function handleGenerateText() {
    if (!prompt.trim()) {
      setError('Please enter a message.');
      return;
    }

    try {
      setError(null);
      setDisplayedResult('');
      setIsTyping(true);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Sanitize the HTML
      const sanitizedHTML = DOMPurify.sanitize(data.text, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'li', 'br', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style'], // Add more if needed
      });

      // Extract plain text for typing effect
      const plainText = sanitizedHTML.replace(/<[^>]+>/g, '');

      typeWriter(plainText); // Start typing effect with the plain text
    } catch (err) {
      console.error('Error generating text:', err);
      setError(err.message || 'Something went wrong');
      setIsTyping(false);
    }
  }

  /**
   * Cleanup on component unmount to clear any pending timeouts
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1rem',
        fontFamily: 'Arial, sans-serif',
        background: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#333'
        }}
      >
        gpt-4o-mini Chat
      </h1>

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid #ddd',
          marginBottom: '1rem',
        }}
      >
        {(displayedResult) && (
          <div style={{ marginBottom: '1rem' }}>
            {/* User Prompt */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <div
                style={{
                  background: '#007bff',
                  color: '#fff',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  maxWidth: '70%',
                  wordWrap: 'break-word',
                }}
              >
                {prompt}
              </div>
            </div>
            {/* ChatGPT Response with Typing Effect */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  background: '#f1f1f1',
                  color: '#333',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  maxWidth: '70%',
                  wordWrap: 'break-word',
                  minHeight: '1.5em', // To maintain height during typing
                }}
              >
                {displayedResult && (
                  <p>{displayedResult}<span className="cursor">|</span></p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Input Textarea */}
      <textarea
        rows={3}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '1rem',
          fontSize: '1rem',
          boxSizing: 'border-box',
        }}
        placeholder="Type your message..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerateText();
          }
        }}
      />

      {/* Send Button */}
      <button
        style={{
          width: '100%',
          background: '#007bff',
          color: '#fff',
          padding: '10px',
          fontSize: '1rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={handleGenerateText}
        disabled={isTyping}
      >
        {isTyping ? 'Typing...' : 'Send'}
      </button>

      {/* Error Message */}
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}

      {/* CSS for Blinking Cursor */}
      <style jsx>{`
        .cursor {
          display: inline-block;
          width: 10px;
          background-color: #333;
          margin-left: 2px;
          animation: blink 1s steps(2, start) infinite;
        }

        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
      `}</style>
    </main>
  );
}
