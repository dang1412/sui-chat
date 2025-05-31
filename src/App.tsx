import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, Container, Flex, Heading } from '@radix-ui/themes';
import { ScrollArea } from '@radix-ui/themes';

import useRTCConnect from './hooks/useRTCConnect';
import useListenToOffer, { OfferConnectEvent } from './hooks/useListenToOffer';

import { Message, useChat } from './Provider';
import { RTCService } from './lib/RTCService';
import { IPFSService } from './lib/IPFSService';
import ChatMessages from './ChatMessages';

const ipfs = IPFSService.getInstance();

const accountConnectServices: { [acc: string]: RTCService } = {};

let id = 0;

function App() {
  const account = useCurrentAccount();
  // List of connected accounts
  const [accountConnects, setAccountConnects] = useState<string[]>([]);
  // toAddr input
  const [toAddr, setToAddr] = useState('');
  // selected account to chat with
  const [selectedChat, setSelectedChat] = useState('');
  // state of all chats
  const { state, dispatch } = useChat()
  // messages to display
  const messages = useMemo(() => state[selectedChat] || [], [state, selectedChat]);

  const { offerConnect } = useRTCConnect();

  const listenToOffer = useListenToOffer();

  const createService = useCallback((to: string) => {
    return new RTCService({
      onLocalSDP: async (sdp) => {
        console.log('Local SDP:', sdp);
        // Here you would typically send the SDP to the other peer
        // Upload to IPFS and get the CID
        const cid = await ipfs.add(sdp)
        console.log('IPFS CID:', cid);
        // Call contract with CID to send to other peer
        offerConnect(to, cid);
      },
      onMessage: (data) => {
        console.log('Received message:', data);
        dispatch({ type: 'ADD_MESSAGE', channel: to, message: {
          id: id++,
          text: data as string,
          sender: `${to.slice(0, 8)}...${to.slice(-4)}`,
          timestamp: Date.now(),
        } });
      },
      onConnect: () => {
        console.log('Connected to:', to);
        setAccountConnects((prev) => [...prev, to]);
      }
    });
  }, [offerConnect]);

  // receive offer or answer
  const onOfferAnswer = useCallback(async (e: OfferConnectEvent) => {
    console.log('Received offer:', e);

    const sdp = await ipfs.fetch<RTCSessionDescriptionInit>(e.cid);

    if (!accountConnectServices[e.from]) {
      // received offer from a new address
      console.log('Got offer', sdp)
      const service = createService(e.from);
      service.receiveOfferThenAnswer(sdp);

      accountConnectServices[e.from] = service;
    } else {
      // received answer after making offer
      console.log('Got answer', sdp)
      const service = accountConnectServices[e.from]
      service.receiveSDP(sdp)
    }
  }, [createService])

  // Start offering connect to toAddr
  const doConnect = useCallback(async () => {
    // already connected or connecting
    if (accountConnectServices[toAddr]) return;

    const service = createService(toAddr);

    service.createChannel(`${toAddr}-chat`);
    service.createOffer();

    accountConnectServices[toAddr] = service;
  }, [toAddr, createService]);

  // Start listening to offer (or answer) after logging in
  useEffect(() => {
    let unsub = () => {};
    if (!account) return unsub;

    (async () => {
      unsub = await listenToOffer(onOfferAnswer);
    })()

    // Cleanup the subscription
    return unsub
  }, [account])

  // Chat input
  const [message, setMessage] = useState('');

  // Send chat input
  const sendMessage = useCallback(() => {
    const service = accountConnectServices[selectedChat];
    if (!selectedChat || !service) return;
    
    // send to peer
    service.sendMessage(message);

    // display
    const messageData: Message = {
      id: id++,
      text: message,
      sender: 'Me',
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', channel: selectedChat, message: messageData });

    setMessage('');
  }, [selectedChat, account, message, dispatch]);

  return (
    <>
      <Flex
        position='sticky'
        px='4'
        py='2'
        justify='between'
        style={{
          borderBottom: '1px solid var(--gray-a2)',
        }}
      >
        <Box>
          <Heading>Decentralized Chat</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt='5'
          pt='2'
          px='4'
          style={{ background: 'var(--gray-a2)', minHeight: 500 }}
        >
          {account ? (
            <Heading>Please allow microphone when connect to enable WebRTC</Heading>
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}

          <Box my='3'>
            <Flex gap='2'>
              <input
                type='text'
                placeholder='Enter Address to connect'
                value={toAddr}
                onChange={(e) => setToAddr(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <Button onClick={doConnect}>Connect</Button>
            </Flex>
          </Box>

          {/* Main layout: Sidebar + Chat window */}
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
                {accountConnects.length === 0 ? (
                  <Box px='4' py='2' style={{ color: '#888' }}>
                    No connections
                  </Box>
                ) : (
                  accountConnects.map((addr) => (
                    <Box
                      key={addr}
                      px='4'
                      py='2'
                      style={{
                        cursor: 'pointer',
                        background: selectedChat === addr ? '#e6f0ff' : undefined,
                        borderLeft: selectedChat === addr ? '4px solid #3b82f6' : '4px solid transparent',
                        transition: 'background 0.2s',
                      }}
                      onClick={() => setSelectedChat(addr)}
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
                {selectedChat
                  ? `Chat with ${selectedChat.slice(0, 8)}...${selectedChat.slice(-4)}`
                  : 'Select a connection to chat'}
              </Box>
              <Box style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                {/* Chat messages would go here */}
                {selectedChat ? (
                  // <Box><Text color='gray'>No messages yet.</Text></Box>
                  <ChatMessages messages={messages} />
                ) : (
                  <Box style={{ color: '#888' }}>Choose a connection from the sidebar.</Box>
                )}
              </Box>
              {selectedChat && (
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

        </Container>
      </Container>
    </>
  );
}

export default App;
