const CONTRACT_ADDRESS = "0xe4c18e4c522b2cbd839610f940070fd9e831744b";

const CONTRACT_ABI = [
    "function postMessage(string _text) public",
    "function getMessages() public view returns (tuple(address sender, string text, uint256 timestamp)[])",
    "function getMessageCount() public view returns (uint256)"
];

let provider;
let signer;
let contract;

const connectButton = document.getElementById("connectButton");
const postButton = document.getElementById("postButton");
const refreshButton = document.getElementById("refreshButton");

const walletAddress = document.getElementById("walletAddress");
const messageInput = document.getElementById("messageInput");
const messageList = document.getElementById("messageList");
const status = document.getElementById("status");
const characterCount = document.getElementById("characterCount");

messageInput.addEventListener("input", () => {
    characterCount.innerText = messageInput.value.length;
});

connectButton.addEventListener("click", connectWallet);
postButton.addEventListener("click", postMessage);
refreshButton.addEventListener("click", loadMessages);


async function connectWallet() {

    if (!window.ethereum) {
        alert(
            "MetaMask was not detected. Please open this DApp in a MetaMask-enabled browser."
        );
        return;
    }

    try {

        await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        provider = new ethers.BrowserProvider(window.ethereum);

        signer = await provider.getSigner();

        const address = await signer.getAddress();

        walletAddress.innerText =
            address.slice(0, 6) +
            "..." +
            address.slice(-4);

        connectButton.innerText = "Wallet Connected";

        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

        await loadMessages();

    } catch (error) {

        console.error(error);

        status.innerText =
            "Wallet connection failed.";

    }
}


async function postMessage() {

    const text = messageInput.value.trim();

    if (!contract) {
        alert("Please connect your wallet first.");
        return;
    }

    if (text.length === 0) {
        alert("Please enter a message.");
        return;
    }

    if (text.length > 200) {
        alert("Message must be 200 characters or less.");
        return;
    }

    try {

        status.innerText =
            "Waiting for wallet confirmation...";

        const transaction =
            await contract.postMessage(text);

        status.innerText =
            "Transaction submitted. Waiting for confirmation...";

        await transaction.wait();

        status.innerText =
            "Message successfully stored on blockchain!";

        messageInput.value = "";
        characterCount.innerText = "0";

        await loadMessages();

    } catch (error) {

        console.error(error);

        status.innerText =
            "Transaction failed or was cancelled.";

    }
}


async function loadMessages() {

    if (!contract) {
        return;
    }

    try {

        const messages =
            await contract.getMessages();

        messageList.innerHTML = "";

        if (messages.length === 0) {

            messageList.innerHTML =
                '<p class="empty-message">No messages yet.</p>';

            return;
        }

        [...messages]
            .reverse()
            .forEach((message) => {

                const address = message.sender;

                const shortAddress =
                    address.slice(0, 6) +
                    "..." +
                    address.slice(-4);

                const date =
                    new Date(
                        Number(message.timestamp) * 1000
                    );

                const div =
                    document.createElement("div");

                div.className = "message";

                const addressEl =
                    document.createElement("div");

                addressEl.className =
                    "message-address";

                addressEl.textContent =
                    shortAddress;

                const textEl =
                    document.createElement("div");

                textEl.className =
                    "message-text";

                textEl.textContent =
                    message.text;

                const timeEl =
                    document.createElement("div");

                timeEl.className =
                    "message-time";

                timeEl.textContent =
                    date.toLocaleString();

                div.appendChild(addressEl);
                div.appendChild(textEl);
                div.appendChild(timeEl);

                messageList.appendChild(div);
            });

    } catch (error) {

        console.error(error);

        messageList.innerHTML =
            '<p class="empty-message">Unable to load messages.</p>';

    }
}