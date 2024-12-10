//Global vars
var cropper;
var timer;
var selectedUsers = [];

// Attach the function to a button click
$("#displayAccessTokenButton").click(() => {
    displayAccessToken();
});

$("#fetchTopSongsButton").click(() => {
    fetchTopSongs();
})

$("#postTextArea, #replyTextArea").keyup((event) => {
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;

    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0) return alert("no submit button found");

    if(value == ""){
         submitButton.prop("disabled", true);
         return;
    }

     submitButton.prop("disabled", false);
})

$("#submitPostButton, #submitReplyButton").click(event => {
    button = $(event.target);
    var isModal = button.parents(".modal").length == 1;
    var textbox = isModal ? $("#replyTextArea") : $("#postTextArea");
    var score = $("#postScore")
    var artist = $("#postArtist")
    var album = $("#postAlbum")

    //console.log(textbox.val());
    //console.log(artist.val())
    var data = {
        content: textbox.val(),
        score: score.val(),
        artist: artist.val(),
        album: album.val(),
    }

    if(isModal){
        var id = button.data().id;
        if(id == null){
            return alert("id is null");
        }
        //console.log(id);
        data.replyTo = id;
    }

    $.post("api/posts", data, postData => {
        if(postData.replyTo){
            location.reload();
        }
        else{
            var html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            score.val("");
            artist.val("");
            album.val("");
            button.prop("disabled", true);

        }
    })
})

$("#replyModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, results => {

        //outputPosts(results, $(".postsContainer"));
        outputPosts(results.postData, $("#originalPostContainer"));
    })
})

$("#replyModal").on("hidden.bs.modal", (event) => {
    $("#originalPostContainer").html("");
})

$("#filePhoto").change(function() {
    if(this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById("imagePreview");
            image.src = e.target.result

            if(cropper !== undefined){
                cropper.destroy();
            }


            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false
            })

        }
        reader.readAsDataURL(this.files[0]);
    }
})

$("#coverPhoto").change(function() {
    if(this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById("coverPreview");
            image.src = e.target.result

            if(cropper !== undefined){
                cropper.destroy();
            }


            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false
            })

        }
        reader.readAsDataURL(this.files[0]);
    }
})

$("#imageUploadButton").click(() => {
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null){
        alert("Could not upload image")
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }
        })
    })
})

$("#coverPhotoUploadButton").click(() => {
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null){
        alert("Could not upload image")
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }
        })
    })
})

$("#userSearchTextbox").keydown((event) => {
    clearTimeout(timer);

    var textbox = $(event.target);
    var value = textbox.val();
    
    if(value == "" && (event.which == 8 || event.keyCode == 8)){
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");

        if(selectedUsers.length == 0){
            $("#createChatButton").prop("disabled", true);
        }
        return;
    }

    timer = setTimeout(() => {
        value = textbox.val().trim();

        if(value == ""){
            $(".resultsContainer").html("");
        }else{
            searchUsers(value);
        }
    }, 1000)
})

$("#createChatButton").click(() => {
    var data = JSON.stringify(selectedUsers);

    $.post("/api/chats", { users: data }, chat => {

        if(!chat || !chat._id) return alert("invalid response");

        window.location.href = `/messages/${chat._id}`
    })
})

 $(document).on("click", ".upvotes", (event) => {
      var button = $(event.target);
      var postId = getPostIdFromElement(button);
      
      if(postId === undefined){
        return;
      }

      $.ajax({
        url: `/api/posts/${postId}/upvotes`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.upvotes.length || "");

            if(postData.upvotes.includes(userLoggedIn._id)){

                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
      })

 })

 $(document).on("click", ".downvotes", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined){
      return;
    }

    $.ajax({
      url: `/api/posts/${postId}/downvotes`,
      type: "PUT",
      success: (postData) => {
          button.find("span").text(postData.downvotes.length || "");

          if(postData.downvotes.includes(userLoggedIn._id)){

              button.addClass("active");
          }
          else{
              button.removeClass("active");
          }
      }
    })

})

$(document).on("click", ".post", (event) => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);

    if(postId !== undefined && !element.is("button")){
        window.location.href = '/posts/' + postId;
    }

})

$(document).on("click", ".followButton", (event) => {
    var button = $(event.target);
    var userId = button.data().user;
    
    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            
            if (xhr.status == 404){
                alert("User Not Found");
                return;
            }
            var difference = 1;
            if(data.following && data.following.includes(userId)){
                button.addClass("following");
                button.text("Following");
            }else {
                button.removeClass("following");
                button.text("Follow");
                difference = -1;
            }

            var followersLabel = $("#followersValue");
            if(followersLabel.length != 0){
                var followersText= followersLabel.text();
                followersText = parseInt(followersText);
                followersLabel.text(followersText + difference);
            }
        }
    })

})

 function getPostIdFromElement(element){
     var isRoot = element.hasClass("post");
     var rootElement = isRoot ? element : element.closest(".post");
     var postId = rootElement.data().id;

     if(postId === undefined){
         return alert("post id undefined");
     }

     return postId;
 }

function createPostHtml(postData) {

    var postedBy = postData.postedBy;
    //var displayName = postedBy.username;
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt))

    var upvoteButtonActiveClass = postData.upvotes.includes(userLoggedIn._id) ? "active" : "";
    var downvoteButtonActiveClass = postData.downvotes.includes(userLoggedIn._id) ? "active" : "";
    if(postedBy._id === undefined){
        return console.log("user object not populated");
    }

    var replyFlag = "";
    if(postData.replyTo && postData.replyTo._id){

        if(!postData.replyTo._id){
            console.log("replyTo not populated");
        }
        if(!postData.replyTo.postedBy._id){
            console.log("postedBy not populated");
        }

        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>${replyToUsername}</a>
                    </div>`
    }

    var albumCover = fetchAlbumCover(postData.album)
    console.log(albumCover)
    var postHTML = "";

    if(replyFlag == ""){
            postHTML = `<div class='post' data-id='${postData._id}'>

            <div class='mainContentContainer'>

                <div class='userImageContainer'>
                    <img src="${postedBy.profilePic}">
                </div>
                <div class='postContentContainer'>
                    <div class='header'>
                        <a class='username' href='/profile/${postedBy.username}'>${postedBy.username}</a>
                        <span class='date'>${timestamp}</span>
                    </div>
                    ${replyFlag}
                    <div class='postBody'>
                        <span class="scoring">Score: ${postData.score}</span>
                        <span class="scoring">Artist: ${postData.artist}</span>
                        <span class="scoring">Album: ${postData.album}</span>
                        <div>${postData.content}</div>
                        <img id="album-cover-${postData._id}" src=${albumCover} style="max-width: 250px;">
                    </div>
                    <div class='postFooter'>
                        <div class='postButtonContainer comments'>
                            <button data-bs-toggle='modal' data-bs-target='#replyModal'>
                                <i class="fa-solid fa-comments"></i>
                            </button>
                        </div>
                        <div class='postButtonContainer green'>
                            <button class='upvotes ${upvoteButtonActiveClass}'>
                                <i class="fa-solid fa-circle-chevron-up"></i>
                                <span>${postData.upvotes.length || ""}</span>
                            </button>
                        </div>
                        <div class='postButtonContainer red'>
                            <button class='downvotes ${downvoteButtonActiveClass}'>
                                <i class="fa-solid fa-circle-chevron-down"></i>
                                <span>${postData.downvotes.length || ""}</span>
                            </button>
                        </div>
                    </div>
                </div>
            
            </div>

        </div>`;
    }else{
        postHTML = `<div class='post' data-id='${postData._id}'>

            <div class='mainContentContainer'>

                <div class='userImageContainer'>
                    <img src="${postedBy.profilePic}">
                </div>
                <div class='postContentContainer'>
                    <div class='header'>
                        <a class='username' href='/profile/${postedBy.username}'>${postedBy.username}</a>
                        <span class='date'>${timestamp}</span>
                    </div>
                    ${replyFlag}
                    <div class='postBody'>
                        <div>${postData.content}</div>
                    </div>
                    <div class='postFooter'>
                        <div class='postButtonContainer comments'>
                            <button data-bs-toggle='modal' data-bs-target='#replyModal'>
                                <i class="fa-solid fa-comments"></i>
                            </button>
                        </div>
                        <div class='postButtonContainer green'>
                            <button class='upvotes ${upvoteButtonActiveClass}'>
                                <i class="fa-solid fa-circle-chevron-up"></i>
                                <span>${postData.upvotes.length || ""}</span>
                            </button>
                        </div>
                        <div class='postButtonContainer red'>
                            <button class='downvotes ${downvoteButtonActiveClass}'>
                                <i class="fa-solid fa-circle-chevron-down"></i>
                                <span>${postData.downvotes.length || ""}</span>
                            </button>
                        </div>
                    </div>
                </div>
            
            </div>

        </div>`;
    } 
        // Return the HTML string with a placeholder for the album cover
    setTimeout(async () => {
            try {
                if (postData.album) {
                    const albumCoverUrl = await fetchAlbumCover(postData.album); // Fetch the album cover URL
    
                    // Update the image src dynamically
                    const albumCoverImg = document.getElementById(`album-cover-${postData._id}`);
                    if (albumCoverUrl) {
                        albumCoverImg.src = albumCoverUrl;
                    } else {
                        albumCoverImg.alt = `Album cover not found for ${postData.album}`;
                    }
                }
            } catch (error) {
                console.error("Error fetching album cover for post:", error);
            }
    }, 0);

    return postHTML;
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 60)
         return ' Just now';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

function outputPosts(results, container){
    container.html("");

    if(!Array.isArray(results)){
        results = [results];
    }

    results.forEach(result => {
        var html = createPostHtml(result);
        container.prepend(html);
    });

    if (results.length == 0){
        container.append("<span class='no Results'>Nothing to show.</span>")
    }
}

function outputPostsWithReplies(results, container){
    container.html("");

    if(results.replyTo != undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData)
    container.append(mainPostHtml);

    results.replies.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);
    });
}

// Fetch the access token from the server
async function displayAccessToken() {
    try {
        const response = await fetch('/api/spotify/access-token');
        if (response.ok) {
            const data = await response.json();
            console.log("Spotify Access Token:", data.accessToken);
        } else {
            console.error("Failed to fetch access token:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching access token:", error);
    }
}

async function fetchTopSongs() {
    console.log("Fetching the top 5 songs on Spotify...");

    try {
        // API call to fetch featured playlists (this is an example endpoint)
        const response = await fetch('/api/spotify/featured-playlists'); // Update to your backend endpoint
        if (response.ok) {
            const data = await response.json();

            console.log(data)

            // Get the first playlist's tracks as an example
            const tracks = data.tracks.items.slice(0, 5); // Get the top 5 tracks

            // Print songs to console and display them in the DOM
            console.log("Top 5 Songs:");
            tracks.forEach((track, index) => {
                console.log(`${index + 1}. ${track.name} by ${track.artists.map(a => a.name).join(", ")}`);
            });
        } else {
            console.error("Failed to fetch top songs:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching top songs null:", error);
    }
}

async function fetchAlbumCover(albumName) {
    try {
        const query = encodeURIComponent(albumName); // Encode special characters
        const response = await fetch(`/api/spotify/search?type=album&q=${query}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the album cover URL
        if (data.albums && data.albums.items.length > 0) {
            return data.albums.items[0].images[0]?.url || null; // Ensure it's a string
        } else {
            console.error("No albums found for the given name.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching album cover:", error);
        return null;
    }
}

function outputUsers(results, container){
    container.html("");

    results.forEach(result => {
        var html = createUserHtml(result, true);
        container.append(html);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>No results found</span>");
    }
}

function createUserHtml(userData, showfollowButton) {
    var username = userData.username;
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"

    var followButton = "";

    if(showfollowButton && userLoggedIn._id != userData._id){
        followButton = `<div class = 'followButtonContainer'>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>`
                            
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${username}</a>
                    </div>
                </div>
                ${followButton}
            </div>`;
}

function searchUsers(searchTerm){
    $.get("/api/users", { search: searchTerm }, results => {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container){
    container.html("");

    results.forEach(result => {

        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
            return;
        }
        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(() => userSelected(result))

        container.append(element);
    });

    if(results.length == 0) {
        container.append("<span class='noResults'>No results found</span>");
    }
}

function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml()
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml() {
    var elements = [];

    selectedUsers.forEach(user => {
        var username = user.username;
        var userElement = $(`<span class='selectedUser'>${username}</span>`);
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}