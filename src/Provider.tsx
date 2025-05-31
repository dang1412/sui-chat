import React, { createContext, useReducer, useContext, ReactNode } from 'react';

export type Message = {
  id: number;
  text: string;
  sender: string;
  timestamp: number;
};

type State = {
  [channel: string]: Message[];
};

type Action = 
  | { type: 'ADD_MESSAGE'; channel: string; message: Message };

const initialState: State = {};

function chatReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const { channel, message } = action;
      return {
        ...state,
        [channel]: [...(state[channel] || []), message],
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