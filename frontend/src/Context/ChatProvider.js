import React, { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";

const ChatContext = createContext();
const url = window.location.href.split("/");
const ENDPOINT = url ? url[0] + "//" + url[2] : "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket;
const ChatProvider = ({ children }) => {
  // ENDPOINT = ;
  // console.log(url);
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState();
  const [activeUsers, setActiveUsers] = useState([]);
  const history = useHistory();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);

    if (!userInfo) history.push("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  useEffect(() => {
    socket = io(ENDPOINT);
  }, []);
  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        socket,
        setChats,
        activeUsers,
        setActiveUsers,
        io,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
