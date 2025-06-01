import { useCallback, useEffect, useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, Container, Flex, Heading, Text } from '@radix-ui/themes';

import useRTCConnect from './hooks/useRTCConnect';
import useListenToOffer, { OfferConnectEvent } from './hooks/useListenToOffer';

import { ConnectionStatus, useChat } from './Provider';
import { RTCService } from './lib/RTCService';
import { IPFSService } from './lib/IPFSService';
import ChatMessages, { accountConnectServices } from './ChatMessages';

const ipfs = IPFSService.getInstance();

function App() {
  const account = useCurrentAccount();
  // List of connected accounts
  const [accountConnects, setAccountConnects] = useState<string[]>([]);
  // toAddr input
  const [toAddr, setToAddr] = useState('');
  // selected account to chat with
  const [selectedAccount, setSelectedAccount] = useState('');
  // state of all chats
  const { dispatch } = useChat()
  // messages to display

  const { offerConnect } = useRTCConnect();

  const listenToOffer = useListenToOffer();

  const createService = useCallback((to: string, isAnswering = false) => {
    setAccountConnects((prev) => [...prev, to]);
    setSelectedAccount(to);
    return new RTCService({
      onLocalSDP: async (sdp) => {
        console.log('Local SDP:', sdp);
        // Here you would typically send the SDP to the other peer
        dispatch({
          type: 'UPDATE_STATUS',
          channel: to,
          status: isAnswering ? ConnectionStatus.ANSWERING : ConnectionStatus.OFFERING,
        });
        // Upload to IPFS and get the CID
        const cid = await ipfs.add(sdp)
        console.log('IPFS CID:', cid);
        // Call contract with CID to send to other peer
        await offerConnect(to, cid);
        dispatch({
          type: 'UPDATE_STATUS',
          channel: to,
          status: isAnswering ? ConnectionStatus.ANSWERED : ConnectionStatus.OFFERED,
        });
      },
      onMessage: (data) => {
        console.log('Received message:', data);
        dispatch({ type: 'ADD_MESSAGE', channel: to, message: {
          id: 0,
          text: data as string,
          sender: `${to.slice(0, 8)}...${to.slice(-4)}`,
          timestamp: Date.now(),
        } });
      },
      onConnect: () => {
        dispatch({
          type: 'UPDATE_STATUS',
          channel: to,
          status: ConnectionStatus.CONNECTED,
        });
        console.log('Connected to:', to);
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
      dispatch({
        type: 'UPDATE_STATUS',
        channel: e.from,
        status: ConnectionStatus.OFFER_RECEIVED,
      });
      const service = createService(e.from, true);
      service.receiveOfferThenAnswer(sdp);

      accountConnectServices[e.from] = service;
    } else {
      // received answer after making offer
      console.log('Got answer', sdp)
      dispatch({
        type: 'UPDATE_STATUS',
        channel: e.from,
        status: ConnectionStatus.ANSWER_RECEIVED,
      });
      const service = accountConnectServices[e.from]
      service.receiveSDP(sdp)
    }
  }, [createService])

  // Start offering connect to toAddr
  const doConnect = useCallback(async () => {
    // already connected or connecting
    if (accountConnectServices[toAddr]) return;

    dispatch({
      type: 'UPDATE_STATUS',
      channel: toAddr,
      status: ConnectionStatus.INIT,
    });

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

          <ChatMessages
            accountConnects={accountConnects}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
          />

        </Container>
      </Container>
    </>
  );
}

export default App;
