import { useCallback } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { EventId, SuiClient, SuiEvent } from "@mysten/sui/client";

import { useNetworkVariable } from "../networkConfig";

export interface OfferConnectEvent {
  from: string;
  to: string;
  cid: string
}

export default function useListenToOffer() {
  const rtcPackageId = useNetworkVariable("rtcPackageId");
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const listenToOffer = useCallback(async (onOffer: (e: OfferConnectEvent) => void) => {

    const type = `${rtcPackageId}::rtc_connect::OfferConnectEvent`
    // const unsub = await suiClient.subscribeEvent({
    //   filter: {
    //     MoveEventType: `${rtcPackageId}::sui_chat::OfferConnectEvent`,
    //   },
    //   onMessage: (event) => {
    //     console.log("Received OfferConnectEvent:", event);
    //     // Handle the event, e.g., update state or UI
    //   }
    // })

    // get current latest event
    const cursor = await getLatestEvent(suiClient, type);

    // only interested in newer events
    const unsub = pollingEvents(suiClient, { cursor, type, onMessages: (events) => {
      console.log("Got new events:", events);
      for (const event of events) {
        const data = event.parsedJson as OfferConnectEvent & {cid: number[]};
        const cid = new TextDecoder().decode(Uint8Array.from(data.cid));
        if (data.to === account?.address) {
          onOffer({...data, cid}); // Call the callback with the event data
        }
      }
    }});

    return unsub;
  }, [rtcPackageId, suiClient, account])

  return listenToOffer
}

interface EventTracking {
  type: string;
  cursor?: EventId | null;
  onMessages: (events: SuiEvent[]) => void;
}

function pollingEvents(client: SuiClient, track: EventTracking) {
  let polling = true;
  let cursor = track.cursor;
  const startPolling = async () => {
    const { data, nextCursor } = await client.queryEvents({
      query: {
        MoveEventType: track.type,
      },
      cursor,
      order: 'ascending',
      limit: 5,
    });

    if (data.length > 0) {
      // update cursor to the next one
      cursor = nextCursor;
      track.onMessages(data);
    }

    if (polling) {
      setTimeout(() => {
        startPolling();
      }, 15000); // Poll every 15 seconds
    }
  }

  startPolling();

  // Return a function to stop polling
  return () => polling = false;
}

// Get the latest event of a specific type
// so program can continue to listen to new events only
async function getLatestEvent(client: SuiClient, type: string): Promise<EventId | null> {
  const { data } = await client.queryEvents({
    query: {
      MoveEventType: type,
    },
    order: 'descending',
    limit: 1,
  });

  if (data.length > 0) {
    console.log("Latest OfferConnectEvent:", data[0]);
    return data[0].id;
  } else {
    console.log("No OfferConnectEvent found.");
    return null;
  }
}