import React, { createContext, useReducer, useContext, ReactNode } from 'react';

export interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: number;
}

export enum ConnectionStatus {
  // Offer side
  INIT='INIT',
  OFFERING='OFFERING',
  OFFERED='OFFERED',
  ANSWER_RECEIVED='ANSWER_RECEIVED',

  // Answer side
  OFFER_RECEIVED='OFFER_RECEIVED',
  ANSWERING='ANSWERING',
  ANSWERED='ANSWERED',

  // Both sides
  CONNECTED= 'CONNECTED',
}

export interface ChannelData {
  status: ConnectionStatus;
  messages: Message[];
}

let id = 0;

type State = {
  [channel: string]: ChannelData
};

type Action = 
  | { type: 'ADD_MESSAGE'; channel: string; message: Message }
  | { type: 'UPDATE_STATUS'; channel: string; status: ConnectionStatus }

const initialState: State = {};

function chatReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const { channel, message } = action;
      message.id = id++;
      const channelData = state[channel] || { status: ConnectionStatus.CONNECTED, messages: [] };
      return {
        ...state,
        [channel]: {
          ...channelData,
          messages: [...channelData.messages, message],
        },
      };
    }
    case 'UPDATE_STATUS': {
      const { channel, status } = action;
      const channelData = state[channel] || { status: ConnectionStatus.CONNECTED, messages: [] };
      return {
        ...state,
        [channel]: {
          ...channelData,
          status,
        },
      };
    }
    default:
      return state;
  }
}

const ChatContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);