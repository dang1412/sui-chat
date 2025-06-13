import { Box, Button, Flex, Heading } from '@radix-ui/themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '@radix-ui/themes';

import { Message, useChat } from './Provider';
import TimeBefore from './TimeBefore';
import { useWebRTCConnect } from './hooks/useWebRTCConnect';

interface Props {}

const ChatMessages: React.FC<Props> = () => {
  // state of all chats
  const { state, dispatch } = useChat()
  const { getAccountConnectService } = useWebRTCConnect()

  const selectedAccount = state.selectedChannel || '';

  // messages to display
  const messages = useMemo(() => state.channels[selectedAccount]?.messages || [], [state, selectedAccount]);
  const channelStatus = useMemo(() => state.channels[selectedAccount]?.status || 'undefined', [state, selectedAccount]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      // Scroll to the bottom of the chat messages
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Chat input
  const [message, setMessage] = useState('');

  // Send chat input
  const sendMessage = useCallback(() => {
    const service = getAccountConnectService(selectedAccount);
    if (!selectedAccount || !service) return;
    
    // send to peer
    service.sendMessage(message);

    // display
    const messageData: Message = {
      id: 0,
      text: message,
      sender: 'Me',
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', channel: selectedAccount, message: messageData });

    setMessage('');
  }, [selectedAccount, message, dispatch]);

  return (
    <Flex style={{ height: 400, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box
        style={{
          width: 220,
          background: '#fafbfc',
          color: '#333',
          borderRight: '1px solid #eee',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Heading size='4' style={{ padding: '16px 12px 8px 16px' }}>
          List
        </Heading>
        <ScrollArea style={{ flex: 1 }}>
          {state.channelList.length === 0 ? (
            <Box px='4' py='2' style={{ color: '#888' }}>
              No connections
            </Box>
          ) : (
            state.channelList.map((addr) => (
              <Box
                key={addr}
                px='4'
                py='2'
                style={{
                  cursor: 'pointer',
                  background: selectedAccount === addr ? '#e6f0ff' : undefined,
                  borderLeft: selectedAccount === addr ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'background 0.2s',
                }}
                onClick={() => dispatch({ type: 'SELECT_CHANNEL', channel: addr })}
              >
                {addr.slice(0, 8)}...{addr.slice(-4)}
              </Box>
            ))
          )}
        </ScrollArea>
      </Box>

      {/* Chat Window */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          style={{
            borderBottom: '1px solid #eee',
            padding: '12px 16px',
            background: '#f8fafc',
            color: '#333',
            fontWeight: 500,
            minHeight: 48,
          }}
        >
          {selectedAccount
            ? `Chat with ${selectedAccount.slice(0, 8)}...${selectedAccount.slice(-4)}`
            : 'Select a connection to chat'}
            <div>{channelStatus}</div>
        </Box>
        <Box style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {/* Chat messages would go here */}
          {selectedAccount ? (
            // <Box><Text color='gray'>No messages yet.</Text></Box>
            // <ChatMessages messages={messages} />
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
                    <TimeBefore timestamp={msg.timestamp} />
                  </Box>
                  <Box mt='2'>{msg.text}</Box>
                </Box>
              ))}
              <div ref={endRef} /> {/* Empty element at the end */}
            </Box>
          ) : (
            <Box style={{ color: '#888' }}>Choose a connection from the sidebar.</Box>
          )}
        </Box>
        {selectedAccount && (
          <Flex px='3' py='2' gap='2' style={{ borderTop: '1px solid #eee' }}>
            <input
              type='text'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Type a message'
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
              // onChange, value, etc. for chat input
            />
            <Button onClick={sendMessage}>Send</Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

export default ChatMessages;