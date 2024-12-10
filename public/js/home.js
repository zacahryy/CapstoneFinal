$(document).ready(() => {
    $.get("/api/posts", { followingOnly: true }, results => {

        outputPosts(results, $(".postsContainer"));
    })
})

// function outputPosts(results, container){
//     container.html("");

//     results.forEach(result => {
//         var html = createPostHtml(result);
//         container.prepend(html);
//     });

//     if (results.length == 0){
//         container.append("<span class='no Results'>Nothing to show.</span>")
//     }
// }