import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("Connected to backend");
    // Send a message to delete item '1'
    socket.emit('delete_menu_item', '1');
});

socket.on("state_update", (data) => {
    console.log("State updated! Menu items:", data.menu.length);
    console.log("Is '1' still there?", data.menu.some(m => m.id === '1'));
    process.exit(0);
});
