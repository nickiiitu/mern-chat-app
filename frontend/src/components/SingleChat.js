import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { Avatar, IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import imageUploadIcon from "../image_upload_icon.png";
import sendMessageIcon from "../sendMessage.png";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
// const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
// var socket, selectedChatCompare;
var selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState({
    content: "",
    contentType: "",
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [picLoading, setPicLoading] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const {
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
    socket,
    setActiveUsers,
    activeUsers,
  } = ChatState();
  const [pic, setPic] = useState("");
  const [uploadimg, setUploadImg] = useState("");
  const [isActive, setIsActive] = useState(false);
  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat?._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat?._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if ((event === "send" || event?.key === "Enter") && newMessage?.content) {
      socket.emit("stop typing", selectedChat?._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        const apiData = {
          content: newMessage?.content,
          chatId: selectedChat,
          contentType: newMessage?.contentType,
        };
        const { data } = await axios.post("/api/message", apiData, config);
        socket.emit("new message", data);
        setNewMessage({ contentType: "", content: "" });
        setUploadImg("");
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };
  useEffect(() => {
    // socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", (list) => {
      setActiveUsers(list);
      setSocketConnected(true);
    });
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line
  }, []);

  //logic to set profile pic of chat
  useEffect(() => {
    fetchMessages();
    if (selectedChat) {
      selectedChatCompare = selectedChat;
      const reciever =
        selectedChat && selectedChat?.users[0]._id === user?._id
          ? selectedChat?.users[1]
          : selectedChat?.users[0];
      setPic(
        selectedChat && selectedChat?.isGroupChat
          ? selectedChat?.groupIcon
          : reciever?.pic
      );
      setIsActive(activeUsers?.includes(reciever?._id));
      // eslint-disable-next-line
    }
  }, [selectedChat]);
  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });
  useEffect(() => {
    if (uploadimg) {
      setNewMessage({ content: uploadimg, contentType: "img" });
    }
  }, [uploadimg]);
  const typingHandler = (e) => {
    setNewMessage({ content: e.target.value, contentType: "message" });

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat?._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat?._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const postDetails = (pics) => {
    setPicLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "piyushproj");
      fetch("https://api.cloudinary.com/v1_1/piyushproj/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setUploadImg(data.url.toString());
          setPicLoading(false);
        })
        .catch((err) => {
          setPicLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
  };
  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            mb={3}
            mx={2}
            p={1}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            bg="white"
            borderRadius="lg"
          >
            {pic && (
              <Avatar
                h="43px"
                w="43px"
                cursor="pointer"
                src={pic}
                border={
                  selectedChat?.isGroupChat ? "0px" : isActive ? "2px" : "0px"
                }
                borderColor={isActive ? "#00A300 !important" : "white"}
              />
            )}
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat?.isGroupChat ? (
                <>
                  {getSender(user, selectedChat?.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat?.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat?.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="white"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading || picLoading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              {uploadimg && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <img
                    src={uploadimg}
                    style={{
                      width: "calc(100% - 40px)",
                      maxWidth: "75%",
                      marginLeft: "40px",
                      height: "50vh",
                    }}
                  />
                </div>
              )}
              <Box d={"flex"}>
                <label htmlFor="file">
                  <img
                    src={imageUploadIcon}
                    alt="image upload icon"
                    style={{
                      height: "40px",
                      width: "40px",
                      marginRight: "10px",
                    }}
                  />
                  <input
                    type="file"
                    id="file"
                    style={{ display: "none" }}
                    name="image"
                    accept="image/gif,image/jpeg,image/jpg,image/png"
                    multiple=""
                    data-original-title="upload photos"
                    onChange={(e) => {
                      postDetails(e.target.files[0]);
                      // setUploadImg(e.target.files[0]);
                    }}
                  ></input>
                </label>
                <Input
                  variant="filled"
                  bg="#EDF2F7"
                  placeholder="Enter a message.."
                  value={
                    uploadimg
                      ? "Click on send button to share Image"
                      : newMessage.contentType === "message"
                      ? newMessage.content
                      : ""
                  }
                  onChange={typingHandler}
                  autoFocus={true}
                  disabled={uploadimg}
                />
                <img
                  src={sendMessageIcon}
                  alt="Send Message Icon"
                  style={{
                    height: "40px",
                    width: "40px",
                    padding: "5px",
                  }}
                  onClick={() => sendMessage("send")}
                />
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
