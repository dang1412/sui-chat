#[test_only]
module sui_chat::chat_history_tests;

use sui::test_scenario;
use std::string;

use sui_chat::chat_history::{
    create_user_history,
    UserHistory,
};

#[test]
fun test_create_user_history() {
    // Initialize test scenario
    let mut scenario = test_scenario::begin(@0x1);

    // Create a user history object
    {
        create_user_history(scenario.ctx());
    };

    // Move to next transaction to check the created object
    scenario.next_tx(@0x1);

    // Retrieve the created UserHistory object
    let user_history = scenario.take_from_sender<UserHistory>();

    // Verify the UserHistory object
    assert!(user_history.owner() == @0x1, 0); // Check owner is the sender
    assert!(user_history.channels().length() == 0, 1); // Check channels vector is empty

    // Clean up by returning the object to the scenario
    scenario.return_to_sender(user_history);

    // End the test scenario
    scenario.end();
}

#[test]
fun test_create_channel() {
    // Initialize test scenario
    let mut scenario = test_scenario::begin(@0x1);

    // Create a user history object
    {
        create_user_history(scenario.ctx());
    };

    // Move to next transaction to check the created object
    scenario.next_tx(@0x1);

    // Retrieve the created UserHistory object
    let mut user_history = scenario.take_from_sender<UserHistory>();

    // Create a channel in the user's history
    let channel_name = string::utf8(b"Test Channel");
    user_history.create_channel(channel_name, scenario.ctx());

    // Move to next transaction to check the created channel
    scenario.next_tx(@0x1);

    // Retrieve the updated UserHistory object
    // user_history = scenario.take_from_sender<UserHistory>();

    // Verify that the channel was created successfully
    assert!(user_history.channels().length() == 1, 0); // Check one channel exists

    // Clean up by returning the object to the scenario
    scenario.return_to_sender(user_history);

    // End the test scenario
    scenario.end();
}
