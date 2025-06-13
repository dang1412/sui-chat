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
  channelList: string[]; // List of channels
  selectedChannel?: string; // Currently selected channel
  channels: {
    [channel: string]: ChannelData
  }
};

type Action = 
  | { type: 'ADD_MESSAGE'; channel: string; message: Message }
  | { type: 'UPDATE_STATUS'; channel: string; status: ConnectionStatus }
  | { type: 'ADD_CHANNEL'; channel: string }
  | { type: 'SELECT_CHANNEL'; channel: string }

const initialState: State = {
  channelList: [],
  selectedChannel: undefined,
  channels: {}
};

function chatReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const { channel, message } = action;
      message.id = id++;
      const channelData = state.channels[channel] || { status: ConnectionStatus.CONNECTED, messages: [] };
      return {
        ...state,
        channels: {
          ...state.channels,
          [channel]: {
            ...channelData,
            messages: [...channelData.messages, message],
          }
        },
      };
    }
    case 'UPDATE_STATUS': {
      const { channel, status } = action;
      const channelData = state.channels[channel] || { status: ConnectionStatus.CONNECTED, messages: [] };
      return {
        ...state,
        channels: {
          ...state.channels,
          [channel]: {
            ...channelData,
            status,
          },
        }
      };
    }
    case 'ADD_CHANNEL': {
      const { channel } = action;
      if (state.channelList.includes(channel)) return state; // Prevent duplicates
      return {
        ...state,
        channelList: [...state.channelList, channel],
      }
    }
    case 'SELECT_CHANNEL': {
      const { channel } = action;
      if (!state.channelList.includes(channel)) return state; // Prevent selecting non-existent channel
      return {
        ...state,
        selectedChannel: channel,
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