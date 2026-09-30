const CONTRACT_ADDRESS = "0xe4c18e4c522b2cbd839610f940070fd9e831744b";

const CONTRACT_ABI = [
    "function postMessage(string _text)",
    "function getMessages() view returns (tuple(address sender,string text,uint256 timestamp)[])",
    "function getMessageCount() view returns (uint256)"
];

let provider = null;
let signer = null;
let contract = null;

const connectButton = document.getElementById("connectButton");
const postButton = document.getElementById("postButton");
const refreshButton = document.getElementById("refreshButton");

const walletAddress = document.getElementById("walletAddress");
const messageInput = document.getElementById("messageInput");
const messageList = document.getElementById("messageList");
const status = document.getElementById("status");
const characterCount = document.getElementById("characterCount");


// ----------------------------
// Character counter
// ----------------------------

messageInput.addEventListener("input", function () {
    characterCount.textContent = messageInput.value.length;
});


// ----------------------------
// Connect Wallet
// ----------------------------

connectButton.addEventListener("click", async function (event) {

    event.preventDefault();

    if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
    }

    try {

        status.textContent = "Connecting wallet...";

        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        if (!accounts || accounts.length === 0) {
            throw new Error("No wallet account selected.");
        }

        // Check network
        const chainId = await window.ethereum.request({
            method: "eth_chainId"
        });

        // Sepolia = 11155111 = 0xaa36a7
        if (chainId !== "0xaa36a7") {

            status.textContent = "Switching to Sepolia...";

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [
                    {
                        chainId: "0xaa36a7"
                    }
                ]
            });
        }

        provider = new ethers.BrowserProvider(window.ethereum);

        signer = await provider.getSigner();

        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

        const address = await signer.getAddress();

        walletAddress.textContent =
            address.substring(0, 6) +
            "..." +
            address.substring(address.length - 4);

        connectButton.textContent = "Wallet Connected ✓";

        status.textContent = "Connected to Sepolia.";

        console.log("Wallet connected:", address);
        console.log("Contract:", CONTRACT_ADDRESS);

        await loadMessages();

    } catch (error) {

        console.error("Wallet connection error:", error);

        status.textContent =
            "Wallet connection failed: " +
            (error.shortMessage || error.message);

    }
});


// ----------------------------
// Post Message
// ----------------------------

postButton.addEventListener("click", async function (event) {

    event.preventDefault();

    if (!contract || !signer) {
        alert("Please connect your wallet first.");
        return;
    }

    const text = messageInput.value.trim();

    if (!text) {
        alert("Please enter a message.");
        return;
    }

    if (text.length > 200) {
        alert("Message must be 200 characters or less.");
        return;
    }

    try {

        status.textContent =
            "Please confirm the transaction in MetaMask...";

        const tx = await contract.postMessage(text);

        status.textContent =
            "Transaction submitted. Waiting for confirmation...";

        console.log("Transaction:", tx.hash);

        await tx.wait();

        status.textContent =
            "✓ Message successfully stored on blockchain!";

        messageInput.value = "";
        characterCount.textContent = "0";

        await loadMessages();

    } catch (error) {

        console.error("Transaction error:", error);

        status.textContent =
            "Transaction failed: " +
            (error.shortMessage || error.message);

    }
});


// ----------------------------
// Refresh
// ----------------------------

refreshButton.addEventListener("click", async function (event) {

    event.preventDefault();

    if (!contract) {
        alert("Please connect your wallet first.");
        return;
    }

    await loadMessages();
});


// ----------------------------
// Load Messages
// ----------------------------

async function loadMessages() {

    if (!contract) {
        return;
    }

    try {

        const messages = await contract.getMessages();

        messageList.innerHTML = "";

        if (messages.length === 0) {

            const empty = document.createElement("p");

            empty.className = "empty-message";
            empty.textContent = "No messages yet.";

            messageList.appendChild(empty);

            return;
        }

        const reversedMessages = [...messages].reverse();

        reversedMessages.forEach(function (message) {

            const div = document.createElement("div");
            div.className = "message";

            const address = message.sender;

            const shortAddress =
                address.substring(0, 6) +
                "..." +
                address.substring(address.length - 4);

            const addressEl = document.createElement("div");

            addressEl.className = "message-address";
            addressEl.textContent = shortAddress;


            const textEl = document.createElement("div");

            textEl.className = "message-text";
            textEl.textContent = message.text;


            const timeEl = document.createElement("div");

            timeEl.className = "message-time";

            const date = new Date(
                Number(message.timestamp) * 1000
            );

            timeEl.textContent = date.toLocaleString();


            div.appendChild(addressEl);
            div.appendChild(textEl);
            div.appendChild(timeEl);

            messageList.appendChild(div);
        });

    } catch (error) {

        console.error("Load messages error:", error);

        messageList.innerHTML = "";

        const errorMessage = document.createElement("p");

        errorMessage.className = "empty-message";
        errorMessage.textContent =
            "Unable to load blockchain messages.";

        messageList.appendChild(errorMessage);
    }
}


// ----------------------------
// Wallet change handling
// ----------------------------

if (window.ethereum) {

    window.ethereum.on("accountsChanged", function () {
        window.location.reload();
    });

    window.ethereum.on("chainChanged", function () {
        window.location.reload();
    });
}