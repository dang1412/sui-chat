import * as React from 'react';
import { Box } from '@radix-ui/themes';
import { Message } from './Provider';
import { useEffect, useRef } from 'react';

const ChatMessages: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length > 0) {
      // Scroll to the bottom of the chat messages
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Box
      style={{
        maxHeight: 400,
        overflowY: 'auto',
        padding: 16,
        // background: '#f9f9f9',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {messages.map((msg) => (
        <Box
          key={msg.id}
          mb='3'
          p='3'
          style={{
            // background: '#fff',
            borderRadius: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            textAlign: msg.sender === 'Me' ? 'left' : 'right',
          }}
        >
          <Box as='span' style={{ fontWeight: 600, marginRight: 8 }}>
            {msg.sender}
          </Box>
          <Box as='span' style={{ color: '#888', fontSize: 12 }}>
            {msg.timestamp}
          </Box>
          <Box mt='2'>{msg.text}</Box>
        </Box>
      ))}
      <div ref={endRef} /> {/* Empty element at the end */}
    </Box>
  );
};

export default ChatMessages;