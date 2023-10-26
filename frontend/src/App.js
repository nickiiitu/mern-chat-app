import "./App.css";
import Homepage from "./Pages/Homepage";
import { Route } from "react-router-dom";
import Chatpage from "./Pages/Chatpage";
import { useEffect } from "react";
import { ChatState } from "./Context/ChatProvider";

function App() {
  const { socket, user } = ChatState();
  useEffect(() => {
    // Add event listener for beforeunload event
    console.log("unload1");
    const handleUnload = (e) => {
      // Emit a socket event before the tab is closed
      // e.preventDefault();
      console.log("unload");
      socket.emit("leave", user);
      return (e.returnValue = "Are you sure you want to close?");
    };

    window.addEventListener("beforeunload", handleUnload);

    // Cleanup event listener on component unmount
    // return () => {
    //   window.removeEventListener("beforeunload", handleUnload);
    // };
  }, []);
  return (
    <div className="App">
      <Route path="/" component={Homepage} exact />
      <Route path="/chats" component={Chatpage} />
    </div>
  );
}

export default App;
