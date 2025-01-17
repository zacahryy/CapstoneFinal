$(document).ready(() => {
    $.get(`/api/chats/${chatId}/messages`, (data) => {
        var messages = [];
        var lastSenderId = "";

        data.forEach((message, index) => {
            var html = createMessageHtml(message, data[index + 1], lastSenderId);
            messages.push(html);

            lastSenderId = message.sender._id;
        })

        var messagesHtml = messages.join("");
        addMessagesHtmlToPage(messagesHtml);
        scrollToBottom(false);
    })
})

$(".sendMessageButton").click(() => {
    messageSubmitted()
})

$(".inputTextbox").keydown((event) => {

    if(event.which === 13){
        messageSubmitted();
        return false;
    }
})

function addMessagesHtmlToPage(html){
    $(".chatMessages").append(html);
}

function messageSubmitted() {
    var content = $(".inputTextbox").val().trim();

    if(content != ""){
        sendMessage(content);
        $(".inputTextbox").val("");
    }
}

function sendMessage(content) {
    $.post("/api/messages", { content: content, chatId: chatId }, (data, status, xhr) => {

        if(xhr.status != 201){
            alert("Could not send message");
            $(".inputTextbox").val(content);
            return;
        }

        addChatMessageHtml(data);
    })
}

function addChatMessageHtml(message) {
    if(!message || !message._id) {
        alert("message is not valid");
        return;
    }


    var messageDiv = createMessageHtml(message, null, "");

    addMessagesHtmlToPage(messageDiv);
    scrollToBottom(true);
}

function createMessageHtml(message, nextMessage, lastSenderId) {

    var sender = message.sender;
    var senderUser = sender.username;

    var currentSenderId = sender._id;
    var nextSenderId = nextMessage != null ? nextMessage.sender._id : "";

    var isFirst = lastSenderId != currentSenderId;
    var isLast = nextSenderId != currentSenderId;

    var nameElement = "";
    if(isFirst){
        liClassName += " first";

        if(!isMine){
            nameElement = `<div class='senderName'>${senderUser}</div>`
        }
    }

    if(isLast){
        liClassName += " last";
    }


    var isMine = message.sender._id == userLoggedIn._id;
    var liClassName = isMine ? "mine" : "theirs";
    return `<li class='message ${liClassName}'>
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${message.content}
                    </span>
                </div>
            </li>`;
}

function scrollToBottom(animated){
    var container = $(".chatMessages");
    var scrollHeight = container[0].scrollHeight;

    if(animated) {
        container.animate({ scrollTop: scrollHeight }, "slow")
    }else{
        container.scrollTop(scrollHeight);
    }
}