#[test_only]
module sui_chat::rtc_connect_tests;
// uncomment this line to import the module
// use sui_chat::sui_chat;

const ENotImplemented: u64 = 0;

#[test]
fun test_sui_chat() {
    // pass
}

#[test, expected_failure(abort_code = ::sui_chat::rtc_connect_tests::ENotImplemented)]
fun test_sui_chat_fail() {
    abort ENotImplemented
}

use sui::event;
use sui::tx_context;
use sui_chat::rtc_connect::{offer_connect, answer_connect, OfferConnectEvent, AnswerConnectEvent};

#[test]
fun test_offer_connect_event() {
    let mut ctx = tx_context::dummy();
    let sender = ctx.sender();
    let recipient = @0xCAFE;
    let cid = b"test-offer";

    // Call offer_connect, which should emit an event
    offer_connect(recipient, cid, &mut ctx);

    // Fetch the last emitted event of type OfferConnectEvent
    let event = event::last_emitted<OfferConnectEvent>();

    // Check event fields
    assert!(event.from == sender, 100);
    assert!(event.to == recipient, 101);
    assert!(event.cid == cid, 102);
}
