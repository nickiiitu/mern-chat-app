import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { useDisclosure } from "@chakra-ui/hooks";
import { Input } from "@chakra-ui/input";
import { ChatState } from "../Context/ChatProvider";
import { Spinner } from "@chakra-ui/spinner";
import { Button, Flex, Avatar, Center, Tooltip } from "@chakra-ui/react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/modal";
import UserListItem from "./userAvatar/UserListItem";
const MyChats = ({ fetchAgain }) => {
  const [searchResult, setSearchResult] = useState([]);
  const [loggedUser, setLoggedUser] = useState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const { selectedChat, setSelectedChat, user, chats, setChats, activeUsers } =
    ChatState();

  const toast = useToast();
  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };
  const handleSearch = async () => {
    if (!search) {
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/user?search=${search}`, config);

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };
  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchAgain]);
  return (
    <Box
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        d={{ base: "block", md: "flex", lg: "flex" }}
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            onClick={onOpen}
            w={{ base: "100%", md: "49%", lg: "49%" }}
          >
            <i className="fas fa-search"></i>
            <Text
              d={{ md: "flex" }}
              ps="2"
              fontSize={{ base: "17px", md: "10px", lg: "12px" }}
            >
              Search User
            </Text>
          </Button>
        </Tooltip>
        <Button
          d="flex"
          justifyContent="center"
          fontSize={{ base: "17px", md: "10px", lg: "12px" }}
          rightIcon={<AddIcon />}
          w={{ base: "100%", md: "49%", lg: "49%" }}
        >
          <GroupChatModal>New Group Chat</GroupChatModal>
        </Button>
      </Box>
      <Box
        d="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => {
              const rec = chat.isGroupChat
                ? ""
                : chat?.users[0]?.pic === user.pic
                ? chat?.users[1]
                : chat?.users[0];
              const recImg = chat.isGroupChat ? chat.groupIcon : rec?.pic;
              const isActive = activeUsers.includes(rec?._id);
              return (
                <Flex
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                  color={selectedChat === chat ? "white" : "black"}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  key={chat._id}
                >
                  <Box w="25%">
                    <Avatar
                      size="md"
                      cursor="pointer"
                      name={user.name}
                      src={chat.isGroupChat ? chat.groupIcon : recImg}
                      border={"2px"}
                      borderColor={
                        isActive
                          ? "#00A300 !important"
                          : selectedChat === chat
                          ? "#38B2AC !important"
                          : "#E8E8E8 !important"
                      }
                    />
                  </Box>
                  <Box w="70%" key={chat._id}>
                    <Text>
                      {!chat.isGroupChat
                        ? getSender(loggedUser, chat.users)
                        : chat.chatName}
                    </Text>
                    {chat.latestMessage && (
                      <Text fontSize="xs">
                        <b>{chat.latestMessage.sender.name} : </b>
                        {chat?.latestMessage?.contentType === "img"
                          ? "img"
                          : chat?.latestMessage?.content?.length > 50
                          ? chat?.latestMessage.content.substring(0, 51) + "..."
                          : chat.latestMessage.content}
                      </Text>
                    )}
                  </Box>
                </Flex>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box d="flex" pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch();
                }}
                onKeyDown={(e) => {
                  if (e?.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml="auto" d="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default MyChats;
