import { useCallback, useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, Container, Flex, Heading, Text } from '@radix-ui/themes';

import ChatMessages from './ChatMessages';
import { useWebRTCConnect } from './hooks/useWebRTCConnect';

function App() {
  const account = useCurrentAccount();
  // toAddr input
  const [toAddr, setToAddr] = useState('');

  // listen to connect request and connect to peer
  const { offerConnect } = useWebRTCConnect()

  const doConnect = useCallback(() => {
    if (!toAddr) {
      alert('Please enter an address to connect');
      return;
    }
    offerConnect(toAddr);
  }, [toAddr, offerConnect]);

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
            <>
              <Heading>Please allow microphone when connect to enable WebRTC</Heading>
              <Text>{account.address}</Text>
            </>
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

          <ChatMessages />

        </Container>
      </Container>
    </>
  );
}

export default App;
