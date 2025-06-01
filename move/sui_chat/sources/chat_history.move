module sui_chat::chat_history {

    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::string;
    use sui::vector;

    /// Chat channel with list of history bunches (IPFS hashes)
    struct ChatChannel has key {
        id: UID,
        name: string::String, // Optional name like "with Alice"
        history: vector<string::String>, // IPFS hashes
        owner: address, // Who owns this channel
    }

    /// Per-user container for all chat channels
    struct UserHistory has key {
        id: UID,
        owner: address,
        channels: vector<UID>, // IDs of ChatChannel objects
    }

    /// Initialize a user's history object (call this once per user)
    public entry fun create_user_history(ctx: &mut TxContext): UserHistory {
        let uid = object::new(ctx);
        let sender = tx_context::sender(ctx);
        UserHistory {
            id: uid,
            owner: sender,
            channels: vector::empty<UID>(),
        }
    }

    /// Add a new chat channel under this user
    public entry fun create_channel(
        user: &mut UserHistory,
        name: string::String,
        ctx: &mut TxContext
    ): ChatChannel {
        let sender = tx_context::sender(ctx);
        assert!(sender == user.owner, 0); // only owner can create channels
        let channel_id = object::new(ctx);
        let channel = ChatChannel {
            id: channel_id,
            name,
            history: vector::empty<string::String>(),
            owner: sender,
        };
        let channel_ref = object::uid_to_address(&channel.id);
        vector::push_back(&mut user.channels, channel.id);
        channel
    }

    /// Add an IPFS hash to a chat channel
    public entry fun add_history(
        channel: &mut ChatChannel,
        ipfs_hash: string::String,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == channel.owner, 1); // only owner can add
        vector::push_back(&mut channel.history, ipfs_hash);
    }

    /// View all hashes (readonly, frontend call)
    public fun get_history(channel: &ChatChannel): &vector<string::String> {
        &channel.history
    }
}
