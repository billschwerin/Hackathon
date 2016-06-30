var adskServiceBaseUrl = "https://developer.api.autodesk.com/";
var currentThread = {};

var adskAjax = function(accessToken, apiPath, version, path, method, contentType, dataObject) {
    var url = adskServiceBaseUrl + apiPath + "/" + version + "/" + path;
    var headers = {
        Authorization: "Bearer " + accessToken,
        "Content-Type" : contentType
    };
    
    var dataAsJson = JSON.stringify(dataObject); 
    var ajaxSettings = {
        url: url,
        method: method,
        headers: headers,
        data: dataAsJson
    };

    return $.ajax(ajaxSettings);
    
}

var adskAjaxJson = function(accessToken, apiPath, version, path, method, dataObject) {
    return adskAjax(accessToken, apiPath, version, path, method, "application/json", dataObject);
}

var commentAjax = function(accessToken, path, method, dataObject) {
    var endPath = "resources/" + path;
    return adskAjaxJson(accessToken, "comments", "v2", endPath, method, dataObject);
};

var postCommentAjax = function(accessToken, urn, comment) {
    return commentAjax(accessToken, urn, "POST", comment);
}

var getCommentsAjax = function(accessToken, urn) {
    return commentAjax(accessToken, urn, "GET", null);
}

var postPGChannelAjax = function(dataObject) {
    var dataAsJson = JSON.stringify(dataObject); 
    var ajaxSettings = {
        url: "http://localhost:3000/channels",
        method: "POST",
        data: dataObject
    };

    return $.ajax(ajaxSettings);
}

var globalAccessToken = null;

// Page related stuff
var createCommentsHtml = function(comments) {
    var $commentsDiv = $("#comments");
    $commentsDiv.empty();

    var $comments = $("<ul></ul>");
    for (var i = 0; i < comments.length; ++i) {
        var $comment = $("<li>" + comments[i].body + "</li>");
        $comment.linkify();
        $comments.append($comment);
    }
    $commentsDiv.append($comments);

    //thread info
    var $threadInfo = $("#threadInfo");
    $threadInfo.empty();
    var $info = $("<h3>Thread: " + currentThread.friendly_name + "</h3>");
    $threadInfo.append($info);

    $("#FavoriteCheckbox").prop("checked", currentThread.favorite) ;
};

var loadCommentsOnPage = function(accessToken) {
    var ajaxLoadCall = getCommentsAjax(accessToken, currentThread.urn);
    ajaxLoadCall.done(createCommentsHtml);
};





var threadClickHandler = function(data){
    currentThread = data
    loadCommentsOnPage(globalAccessToken);
}

var createThreadHtml = function(threads) {
    var $threadDiv = $("#threads");
    $threadDiv.empty();

    var $threads = $("<ul></ul>");
    for (var i = 0; i < threads.data.length; ++i) {
        var thisThread = threads.data[i];
        var nl = '&#013;';
        var $thread = $('<li><a title="Channel: ' + thisThread.channel + nl 
            + 'Category: ' + thisThread.category + nl + 'Subject: ' + thisThread.subject + '">' + thisThread.friendly_name + '</a></li>');

            // Subject:" + thisThread.subject + " Channel:" + thisThread.channel + " Subkey:" + thisThread.subkey +  "</li>");
        $thread.click(function(thread) {
            threadClickHandler(thread);
        }.bind(null, thisThread));
        $threads.append($thread);
    }
    $threadDiv.append($threads);
};

var loadThreadsOnPage = function(query) {

    var url = "http://localhost:3000/channels";
    if(query)
        url = url + query;
    var ajaxSettings = {
        url: url ,
        method: "GET",

    };

    var getThreadCall = $.ajax(ajaxSettings);
    getThreadCall.done(createThreadHtml);
};

var onSubmitComment = function() {
    var $commentInput = $("#commentInput");
    var newCommentBody = $commentInput.val();
    $commentInput.val('');

    var newComment = { body: newCommentBody };
    var postAjax = postCommentAjax(globalAccessToken, currentThread.urn, newComment)
    postAjax.done(function() {
        loadCommentsOnPage(globalAccessToken);
    });

    return false;
}
 


var onSaveUrn = function() {
    var friendlyName = $("#FriendlyName").val();
    var subject = $("#Subject").val();
    var channel = $("#Channel").val();
    var category = $("#Category").val();
    var checked =  $("#Favorites").prop("checked");
    var urnVal = 'urn:adsk.objects:os.object:model2016-06-23-18-48-14 channel: ' + channel + ' category: ' + category + ' subject: ' + subject;
    var newURN = btoa(urnVal);

    var channelObject = {};
    channelObject.userid = 12345;
    channelObject.friendly_name = friendlyName;
    channelObject.subject = subject;
    channelObject.channel = channel;
    channelObject.category = category;
    channelObject.favorite = checked;
    channelObject.urn = newURN;

    currentThread = channelObject;

    loadCommentsOnPage(globalAccessToken);

    var addChannel = postPGChannelAjax(channelObject);
    addChannel.done(function(){
        loadThreadsOnPage()
    });
}

var onFilterThreads = function() {
    var friendlyName = $("#FriendlyName").val();
    var subject = $("#Subject").val();
    var channel = $("#Channel").val();
    var category = $("#Category").val();
    var checked =  $("#Favorites").prop("checked");
    var query = '?friendly_name__like=%'+ friendlyName +
                '%&channel__like=%' + channel +
                '%&category__like=%' + category +
                '%&subject__like=%' + subject + '%';
    if(checked){
        query = query + '&favorite=true';
    }
                
    loadThreadsOnPage(query);
}

var onClearFilter = function() {
    $("#FriendlyName").val('');
    $("#Subject").val('');
    $("#Channel").val('');
    $("#Category").val('');
    $("#Favorites").prop("checked", false);
    loadThreadsOnPage();
}

var onToggleFavorite = function(){
    var checked =  $("#FavoriteCheckbox").prop("checked");
    console.log(checked);
}

$(document).ready(function () {
   // setupAuthLink();
    $.get("/api/accessToken", function (accessToken) {
        globalAccessToken = accessToken;
        console.log("globalAccessToken: " + globalAccessToken);
        loadThreadsOnPage();
    });
});

