// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageBoard {

    struct Message {
        address sender;
        string text;
        uint256 timestamp;
    }

    Message[] private messages;

    event MessagePosted(
        address indexed sender,
        string text,
        uint256 timestamp
    );

    function postMessage(string memory _text) public {
        require(bytes(_text).length > 0, "Message cannot be empty");
        require(bytes(_text).length <= 200, "Message too long");

        messages.push(
            Message({
                sender: msg.sender,
                text: _text,
                timestamp: block.timestamp
            })
        );

        emit MessagePosted(msg.sender, _text, block.timestamp);
    }

    function getMessages() public view returns (Message[] memory) {
        return messages;
    }

    function getMessageCount() public view returns (uint256) {
        return messages.length;
    }
}