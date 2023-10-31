import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { useState } from "react";
import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  ModalHeader,
  ModalBody,
} from "@chakra-ui/react";
import downloadIcon from "../downloadIcon.png";
const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageOpen, setImageOpen] = useState(false);
  return (
    <>
      <ScrollableFeed>
        {messages &&
          messages.map((m, i) => (
            <div style={{ display: "flex" }} key={m._id}>
              {(isSameSender(messages, m, i, user._id) ||
                isLastMessage(messages, i, user._id)) && (
                <Tooltip
                  label={m.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
              {!m.contentType || m.contentType === "message" ? (
                <span
                  style={{
                    backgroundColor: `${
                      m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                    }`,
                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                    borderRadius: "20px",
                    padding: "5px 15px",
                    maxWidth: "75%",
                  }}
                >
                  {m.content}
                </span>
              ) : (
                <img
                  style={{
                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                    borderRadius: "20px",
                    padding: "5px 0px",
                    maxWidth: "75%",
                    height: "50vh",
                  }}
                  src={m.content}
                  alt="image"
                  onClick={() => {
                    setImageOpen(m.content);
                    onOpen();
                  }}
                />
              )}
            </div>
          ))}
      </ScrollableFeed>
      {/* {imageOpen && */}
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <img
              src={downloadIcon}
              style={{
                width: "32px",
                height: "32px",
                fontSize: "12px",
                position: "absolute",
                display: "flex",
                top: "0.5rem",
                left: "0.75rem",
              }}
            />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <img
              src={imageOpen}
              style={{
                border: "1px solid white",
                borderRadius: "0.375rem",
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* } */}
    </>
  );
};

export default ScrollableChat;
