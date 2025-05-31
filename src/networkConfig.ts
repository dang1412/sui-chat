import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_COUNTER_PACKAGE_ID,
  TESTNET_RTC_PACKAGE_ID,
  MAINNET_COUNTER_PACKAGE_ID,
  LOCALNET_RTC_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    localnet: {
      url: 'http://localhost:9000',
      variables: {
        counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
        rtcPackageId: LOCALNET_RTC_PACKAGE_ID,
      },
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
        rtcPackageId: '',
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        counterPackageId: '',
        rtcPackageId: TESTNET_RTC_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        counterPackageId: MAINNET_COUNTER_PACKAGE_ID,
        rtcPackageId: '',
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
