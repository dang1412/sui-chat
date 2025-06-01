import {
  SuiClient,
} from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = '0x...'; // your published package ID
const MODULE_NAME = 'chat_history';
const STRUCT_NAME = 'UserHistory';

export async function getOrCreateUserHistory(suiClient: SuiClient, userAddress: string) {
  // 1. Try to find UserHistory owned by the user
  const ownedObjects = await suiClient.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: `${PACKAGE_ID}::${MODULE_NAME}::${STRUCT_NAME}`,
    },
    options: {
      showType: true,
      showContent: true,
    },
  });

  if (ownedObjects.data.length > 0) {
    // Found existing one
    return {
      status: 'exists',
      objectId: ownedObjects.data[0].data?.objectId!,
    };
  }

  // 2. If not found, prepare a tx block to create one
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::create_user_history`,
  });

  return {
    status: 'needsCreate',
    transactionBlock: tx,
  };
}
