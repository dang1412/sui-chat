import { useCallback } from 'react';
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { useNetworkVariable } from '../networkConfig';

function useRTCConnect() {
  const rtcPackageId = useNetworkVariable('rtcPackageId');
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const offerConnect = useCallback(async (to: string, cid: string) => {
    const tx = new Transaction();

    tx.moveCall({
      arguments: [tx.pure.address(to), tx.pure.string(cid)],
      target: `${rtcPackageId}::rtc_connect::offer_connect`,
    });

    const rs = await signAndExecute({
      transaction: tx,
    });

    console.log('Transaction submitted:', rs.digest);
    await suiClient.waitForTransaction({ digest: rs.digest });
    console.log('Transaction confirmed:', rs.effects);
  }, [rtcPackageId, suiClient, signAndExecute]);

  return { offerConnect }
}

export default useRTCConnect;