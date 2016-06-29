//var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE2LTA2LTIzLTE4LTQ4LTE0aHR0cDovL3d3dy5jbm4uY29tNDZhODBhNzUtNTUyNS00YTE0LTQ3YmItNWU5OGViZjk1ODRh';
var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YmVpaDg5M2RheDNleHdyazhyeGJncWpzaGh3bWJsZXEyMDE2MDYyN3QxNDE4MTk4NDd6L0F1Lm9iag==';
var clientId = 'BEIh893DAx3exwrk8RxBGQJsHHWMbLeq'
//var clientId = 'UevAemQT1BdgNeJtPqlqy2DZoEL9fqaU'
var callbackUrl = 'http%3A%2F%2Fmycloud-staging.autodesk.com%3A3000%2Fauthcallback'
var adskServiceBaseUrl = "https://developer.api.autodesk.com/";
var scope = "data:read data:write data:create data:search bucket:create bucket:read bucket:update bucket:delete code:all account:read account:write user-profile:read";

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
        $comments.append($comment);
    }
    $commentsDiv.append($comments);
};

var loadCommentsOnPage = function(accessToken, urn) {
    var ajaxLoadCall = getCommentsAjax(accessToken, urn);
    ajaxLoadCall.done(createCommentsHtml);
};

var createThreadHtml = function(threads) {
    var $threadDiv = $("#threads");
    $threadDiv.empty();

    var $threads = $("<ul></ul>");
    for (var i = 0; i < threads.data.length; ++i) {
        var thisThread = threads.data[i];
        var $thread = $("<li><h3>" + thisThread.friendly_name + "</h3> Subject:" + thisThread.subject + " Channel:" + thisThread.channel + " Subkey:" + thisThread.subkey +  "</li>");
        $threads.append($thread);
    }
    $threadDiv.append($threads);
};

var loadThreadsOnPage = function() {
    var ajaxSettings = {
        url: "http://localhost:3000/channels",
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
    var postAjax = postCommentAjax(globalAccessToken, defaultUrn, newComment)
    postAjax.done(function() {
        loadCommentsOnPage(globalAccessToken, defaultUrn);
    });

    return false;
}
 
var onSubmitUrl = function() {

    var code = $("#Subject").val();
    var channel = $("#Channel").val();
    var subkey = $("#Subkey").val();
    var urnVal = 'urn:adsk.objects:os.object:model2016-06-23-18-48-14 code: ' + code + ' channel: ' + channel + ' subkey: ' + subkey;
    var newURN = btoa(urnVal);
    
    $("#prevOutput").val(defaultUrn);
    var $UrnOutput = $("#UrnOutput").val(urnVal);
    defaultUrn = newURN;
    $("#currOutput").val(defaultUrn);
    loadCommentsOnPage(globalAccessToken, defaultUrn);
}

var onSaveUrn = function() {
    var friendlyName = $("#FriendlyName").val();
    var code = $("#Subject").val();
    var channel = $("#Channel").val();
    var subkey = $("#Subkey").val();
    var urnVal = 'urn:adsk.objects:os.object:model2016-06-23-18-48-14 code: ' + code + ' channel: ' + channel + ' subkey: ' + subkey;
    var newURN = btoa(urnVal);

    var channelObject = {};
    channelObject.userid = 12345;
    channelObject.friendly_name = friendlyName;
    channelObject.subject = code;
    channelObject.channel = channel;
    channelObject.subkey = subkey;
    channelObject.urn = newURN;

    $("#prevOutput").val(defaultUrn);
    var $UrnOutput = $("#UrnOutput").val(urnVal);
    defaultUrn = newURN;
    $("#currOutput").val(defaultUrn);
    loadCommentsOnPage(globalAccessToken, defaultUrn);

    postPGChannelAjax(channelObject);
    loadThreadsOnPage();
}

var setupAuthLink = function() {
    var $authArea = $('#authArea');
    var $link = $('<a href="https://developer.api.autodesk.com/authentication/v1/authorize?response_type=code&client_id=' + 
        clientId + '&redirect_uri=' +
        callbackUrl + '&scope=' +
        scope + '">Oxygen Login</a>');
    $authArea.empty();
    $authArea.append($link);
}

$(document).ready(function () {
   // setupAuthLink();
    $.get("/api/accessToken", function (accessToken) {
        globalAccessToken = accessToken;
        console.log("globalAccessToken: " + globalAccessToken);
        //loadCommentsOnPage(accessToken, defaultUrn);
        //doChannelSample(accessToken);
        loadThreadsOnPage();
    });
});
