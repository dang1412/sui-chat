# WebRTC Chat App with Sui Blockchain Signaling

This is a decentralized peer-to-peer (P2P) chat application that uses WebRTC for real-time communication and the Sui Blockchain for the signaling (handshake) process — enabling direct, serverless message exchange between users.

## How It Works

### 1. Initiating a Handshake

One peer initiates a connection by generating WebRTC offer data and sends it to the blockchain by calling a smart contract function. This function emits an event containing the handshake info.

### 2. Listening for Events

The other peer listens to these blockchain events, detects one targeting it, and responds by sending its WebRTC answer data using the same smart contract method. The smart contract emits another event for the initiator to receive.

### 3. Establishing P2P Connection

After both sides exchange their WebRTC offer/answer info through events, a direct P2P WebRTC connection is established — enabling chat without any centralized server.

## Techs Used

- IPFS: for uploading network info and only store the cid on-chain
- Sui contract:
  - For sending network info from user to user (emitting event).
  - User queries event from the contract and filter their's message (polling).
- Sui contract for storing user history data as a bunch, so user can keep the message history (TODO).
- WebRTC for p2p connection.

The move contract part is quite simple.

```rs
/// Offer event
public struct OfferConnectEvent has drop, copy {
  from: address,
  to: address,
  cid: vector<u8>,
}

/// Emit offer event
public entry fun offer_connect(to: address, cid: vector<u8>, ctx: &mut TxContext) {
  let event = OfferConnectEvent {
    from: ctx.sender(),
    to,
    cid,
  };
  event::emit(event);
}
```

## 🔁 Event Polling Mechanism

1. Currently, event listening is implemented via polling the blockchain every 15 seconds from the frontend.
2. This has two downsides:
  - 📈 **Scalability concern**: Polling from many clients can overload the RPC node.
  - 🧹 **Inefficiency**: Every client receives all events and must filter out irrelevant ones.

=> We need a separate indexer for event listening.

## ✅ Benefits

- ⚡ Fully **Decentralized**: No signaling server is required — the blockchain handles handshake communication.
- 🧩 **Modular**: This signaling method can be reused across any Sui-based dApp needing user-to-user messaging.
- 💸 **Low Cost**: Only minimal on-chain actions are needed, keeping gas usage and cost extremely low.
