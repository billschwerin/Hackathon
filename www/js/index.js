var currentUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YmVpaDg5M2RheDNleHdyazhyeGJncWpzaGh3bWJsZXEyMDE2MDYyN3QxNDE4MTk4NDd6L0F1Lm9iag==';
var adskServiceBaseUrl = "https://developer.api.autodesk.com/";
var currentThreadName = "";
var displayingFavorites = true;

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
    var $info = $("<h3>Thread: " + currentThreadName + "</h3>");
    $threadInfo.append($info);
};

var loadCommentsOnPage = function(accessToken, urn) {
    var ajaxLoadCall = getCommentsAjax(accessToken, urn);
    ajaxLoadCall.done(createCommentsHtml);
};





var threadClickHandler = function(data){
    currentThreadName = data.friendly_name;
    currentUrn = data.urn;
    loadCommentsOnPage(globalAccessToken, currentUrn);
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
    if (displayingFavorites){
        if(query){
            query = query + '&favorite=true';
        } else {
            query = '?favorite=true';
        }
    }

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
    var postAjax = postCommentAjax(globalAccessToken, currentUrn, newComment)
    postAjax.done(function() {
        loadCommentsOnPage(globalAccessToken, currentUrn);
    });

    return false;
}
 


var onSaveUrn = function() {
    var friendlyName = $("#FriendlyName").val();
    currentThreadName = friendlyName;
    var subject = $("#Subject").val();
    var channel = $("#Channel").val();
    var category = $("#Category").val();
    var urnVal = 'urn:adsk.objects:os.object:model2016-06-23-18-48-14 channel: ' + channel + ' category: ' + category + ' subject: ' + subject;
    var newURN = btoa(urnVal);

    var channelObject = {};
    channelObject.userid = 12345;
    channelObject.friendly_name = friendlyName;
    channelObject.subject = subject;
    channelObject.channel = channel;
    channelObject.category = category;
    channelObject.urn = newURN;


    currentUrn = newURN;

    loadCommentsOnPage(globalAccessToken, currentUrn);

    var addChannel = postPGChannelAjax(channelObject);
    addChannel.done(function(){
        loadThreadsOnPage()
    });
}

var onDisplayFilterThreads = function(){
    displayingFavorites = false;
    onFilterThreads();
}

var onDisplayFavoriteThreads = function(){
    displayingFavorites = true;
    onClearFilter();
}

var onFilterThreads = function() {
    var friendlyName = $("#FriendlyName").val();
    var subject = $("#Subject").val();
    var channel = $("#Channel").val();
    var category = $("#Category").val();

    var query = '?friendly_name__like=%'+ friendlyName +
                '%&channel__like=%' + channel +
                '%&category__like=%' + category +
                '%&subject__like=%' + subject + '%';
                
    loadThreadsOnPage(query);
}

var onClearFilter = function() {
    $("#FriendlyName").val('');
    $("#Subject").val('');
    $("#Channel").val('');
    $("#Category").val('');

    loadThreadsOnPage();
}

$(document).ready(function () {
   // setupAuthLink();
    $.get("/api/accessToken", function (accessToken) {
        globalAccessToken = accessToken;
        console.log("globalAccessToken: " + globalAccessToken);
        loadThreadsOnPage();
    });
});

