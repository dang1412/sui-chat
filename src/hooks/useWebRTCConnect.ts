import { useCallback, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

import { RTCService } from '../lib/RTCService'
import { IPFSService } from '../lib/IPFSService'
import { ConnectionStatus, useChat } from '../Provider'

import useListenToMessage, { EventMessagePayload } from './useListenToMessage'
import useSendMessage from './useSendMessage'

const ipfs = IPFSService.getInstance();

const accountConnectServices: { [acc: string]: RTCService } = {};

function getAccountConnectService(to: string) {
  return accountConnectServices[to] || null;
}

export function useWebRTCConnect() {
  // listen to messages from peers (offer or answer)
  const listenToMessage = useListenToMessage()

  const account = useCurrentAccount()

  const { sendMessage } = useSendMessage()

  const { dispatch } = useChat()

  const createService = useCallback((to: string, isAnswering = false) => {
    // setAccountConnects((prev) => [...prev, to]);
    // setSelectedAccount(to);
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
        await sendMessage(to, cid);
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
  }, [sendMessage]);

  const onEventMessage = useCallback(async (e: EventMessagePayload) => {
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

  // Start listening to offer (or answer) after logging in
  useEffect(() => {
    let unsub = () => {};
    if (!account) return unsub;

    (async () => {
      unsub = await listenToMessage(onEventMessage);
    })()

    // Cleanup the subscription
    return unsub
  }, [account, listenToMessage, onEventMessage]);

  // Start offering connect to toAddr
  const offerConnect = useCallback(async (toAddr: string) => {
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
  }, [createService]);

  return {
    offerConnect,
    getAccountConnectService,
  };
}
