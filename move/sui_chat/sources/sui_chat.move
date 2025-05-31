/*
/// Module: sui_chat
module sui_chat::sui_chat;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module sui_chat::rtc_connect {
    use sui::event;
    // use sui::tx_context::{Self, TxContext};

    /// Offer event
    public struct OfferConnectEvent has drop, copy {
        from: address,
        to: address,
        cid: vector<u8>,
    }

    /// Answer event
    public struct AnswerConnectEvent has drop, copy {
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

    /// Emit answer event
    public entry fun answer_connect(to: address, cid: vector<u8>, ctx: &mut TxContext) {
        let event = AnswerConnectEvent {
            from: ctx.sender(),
            to,
            cid,
        };
        event::emit(event);
    }
}
