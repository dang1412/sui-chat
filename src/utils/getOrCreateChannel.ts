import {
  SuiClient,
} from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = '0x...'; // your package ID
const MODULE_NAME = 'chat_history';
const USER_HISTORY_STRUCT = `${PACKAGE_ID}::${MODULE_NAME}::UserHistory`;
// const CHAT_CHANNEL_STRUCT = `${PACKAGE_ID}::${MODULE_NAME}::ChatChannel`;

// Decode a base64 string to a UTF-8 string in the browser
function base64ToString(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Get or create a chat channel with a specific name for a user
 */
export async function getOrCreateChatChannel({
  client,
  userAddress,
  channelName,
  initialIpfsHash,
}: {
  client: SuiClient;
  userAddress: string;
  channelName: string;
  initialIpfsHash: string;
}) {
  // 1. Get UserHistory
  const userHistories = await client.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: USER_HISTORY_STRUCT,
    },
    options: { showContent: true },
  });

  if (userHistories.data.length === 0) {
    throw new Error(`UserHistory not found for ${userAddress}`);
  }

  const userHistoryObject = userHistories.data[0];
  const userHistoryId = userHistoryObject.data?.objectId!;
  const userHistoryContent = userHistoryObject.data?.content as any;

  // 2. See if the channel already exists by checking the `channel_names`
  const { fields } = userHistoryContent;
  const channelNames: string[] = fields.channel_names.map((s: { fields: { bytes: string } }) =>
    base64ToString(s.fields.bytes)
  );

  const channelIndex = channelNames.findIndex((n) => n === channelName);

  if (channelIndex !== -1) {
    // 3. Get corresponding channel ID
    const channelId = fields.channel_ids[channelIndex];

    return {
      status: 'exists',
      objectId: channelId,
    };
  }

  // 4. Create new ChatChannel by calling `create_channel`
  const tx = new Transaction();
  const userHistoryInput = tx.object(userHistoryId);

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::create_channel`,
    arguments: [
      userHistoryInput,
      tx.pure.string(channelName),
      tx.pure.string(initialIpfsHash),
    ],
  });

  return {
    status: 'needsCreate',
    transactionBlock: tx,
  };
}
