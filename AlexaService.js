
var https = require('https');

/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        /*
        if (event.session.application.id !== "amzn1.echo-sdk-ams.app.[your own app id goes here]") {
            context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
                     
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
                     
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
        
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    // get the intent name
    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    if ("GetReminder" === intentName) {
        console.log("GetReminder");
        getReminder(intent, session, callback);
    } else if ("SetReminder" === intentName) {
        console.log("SetReminder");
        setReminder(intent, session, callback);
    } else if ("DeleteReminder" === intentName) {
        console.log("DeleteReminder");
        deleteReminder(intent, session, callback);
    }else if ("AMAZON.StopIntent" === intentName){
        
        var sessionAttributes = {};
        var speechOutput = "It was pleasure talking to you. Bye Bye And Have a Good one";
        var repromptText = "It was pleasure talking to you. Bye Bye And Have a Good one";
        //var speechOutput = "Dont bug me. Get lost";
        //var repromptText = "Dont bug me. Get lost";
        var shouldEndSession = true;

    callback(sessionAttributes,
             buildSpeechletResponse("Bye", speechOutput, repromptText, shouldEndSession));
        
    }
        
    else {
        console.log("Unknown intent");
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

/** 
 * Functions that control the app's behavior.
 */
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Alexa AmerisourceBergen S.A.P. Hybris demo app,"
                + "This application will let you create and fetch reminders from S.A.P. Hybris using voice commands of ALEXA,"
                + "You can get your reminders by saying get reminders for today or tomorrow or say create a reminder with title for today";
    var repromptText = "You can get your reminders by saying get reminders for today or tomorrow or say create a reminder with title for today";
    var shouldEndSession = false;
    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the message in the session and prepares the speech to reply to the user.
 */
function getReminder(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlotDate = intent.slots.Date;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlotDate.value) {
        message_dateValue = messageSlotDate.value;
        console.log("Message slot contains: " + message_dateValue + ".");
        sessionAttributes = createMessageAttributes(message_dateValue);
        repromptText = "You can ask me to repeat your message by saying get reminders for today or tomorrow";

        var startDateString  = adjustStartDate(messageSlotDate.value);
        var endDateString    = adjustEndDate(messageSlotDate.value);
        var options = getDataFromHybris(startDateString,endDateString);
    
        var req = https.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('reached on data');
            var reminders = JSON.parse(chunk);
            console.log(chunk);
            
            if(reminders.calendarEntryDateMapWsDTOList !== undefined && reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList !== undefined ){
                var reminderCount = reminders.calendarEntryDateMapWsDTOList[0].amount;
                console.log(reminderCount);
                speechOutput = "There are," + reminderCount + "reminders for you,"
                var count;
                for (var i=0;i<reminderCount;i++){
                    
                        switch (i){
                        case 0: count = " " + "first"; break;
                        case 1: count = " " + "second";break;
                        case 2: count = " " + "third";break;
                        case 3: count = " " + "fourth";break;
                        case 4: count = " " + "fivth";break;
                        case 5: count = " " + "sixth"; break;
                        default: count = " " + (i+1);
                        }
                    speechOutput += "The title for the" + count  + "reminder is:"; 
                    speechOutput = speechOutput + " " + reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].title + ",";
                    console.log(reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].title);
                    intent.slots.productNumber = reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].entryNotes;
                    speechOutput += "The calender note that you have maintained is," + intent.slots.productNumber + ",";
                    
                }
            }
            else{
                //console.log(count.calendarEntryDateMapWsDTOList[0].calendarEntryList[0].calendarEntryItems[0].name);
                speechOutput = "Sorry there are no reminders for you today. Would you like to set a reminder for today, if yes please say create a reminder for today";
                repromptText = "Sorry there are no reminders for you today. Would you like to set a reminder for today, if yes please say create a reminder for today";
            }
           
            callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
           
            });
            res.on('end', function() {
            console.log("reached on end");
            });
        });
        req.on('error', function(e) {
            console.log('reached on error');
            speechOutput = "error in service call";
            repromptText = "error in service call";
            callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });

        req.end();
   
    } else {
        speechOutput = "I didn't hear the date clearly, please try again by mentioning for which date you want to get the reminders";
        repromptText = "I didn't hear the date clearly, please try again by mentioning for which date you want to get the reminders";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}

/*function getReminderWithoutIntent(searchTitle,startDate,endDate) {
    
        var code = null;
    
        var startDateString  = adjustStartDate(startDate);
        var endDateString    = adjustEndDate(endDate);
        var options = getDataFromHybris(startDateString,endDateString);
 
        var req = https.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('reached on data');
            var reminders = JSON.parse(chunk);
            console.log(chunk);
            
            if(reminders.calendarEntryDateMapWsDTOList !== undefined && reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList !== undefined ){
                var reminderCount = reminders.calendarEntryDateMapWsDTOList[0].amount;
                console.log("reminder count is :" + reminderCount);
                for (var i=0;i<reminderCount;i++){
                    var title = reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].title;
                    console.log("title is:" + title);
                    console.log("search title is" + searchTitle);
                    if(title === searchTitle){
                        code = reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].code;
                        return code;
                    }
                }
            }
            else{
             return null;
            }});
            
            res.on('end', function() {
            console.log("reached on end");
            });
        });
        
        req.on('error', function(e) {
            console.log('reached on error');
           return null;
        });

        req.end();
   
    } */



function setReminder(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlotDate = intent.slots.Date;
     console.log("reach 1");
    var messageSlotTitle = intent.slots.Title;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlotDate.value && messageSlotTitle.value) {
        message_dateValue = messageSlotDate.value;
        message_title = messageSlotTitle.value;
        console.log("Message slot contains: " + message_dateValue + ".");
        console.log("Message slot contains: " + message_title + ".");
        
        sessionAttributes = createMessageAttributes(message_dateValue);
        repromptText = "You can ask me to repeat your message by saying, get my reminder for today or tomorrow?";

        var startDateString = generateStartDate(messageSlotDate.value);
        var options = getCreateDataFromHybris();
        
        var requestString = '{"entryDate":"' + startDateString + '","entryNotes":"test th444","title":"' + message_title + '","calendarEntryItems": {"productCode": "10001010","quantity": 8}}';
        console.log(requestString);
        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('reached on data');
            //var reminders = JSON.parse(chunk);
            console.log(JSON.parse(chunk));
            speechOutput = "Your reminder has been created successfully";
            callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
           
            });
            res.on('end', function() {
            console.log("reached on end");
            speechOutput = "Your reminder has been created successfully";
            repromptText = "Your reminder has been created successfully";
            callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
        req.on('error', function(e) {
            console.log('reached on error');
            console.log(e.getMessage());
            speechOutput = "error in service call";
            repromptText = "error in service call";
            callback(sessionAttributes, 
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });

        req.write(requestString);
        req.end();
   
    } else {
        speechOutput = "I didn't hear the date and title of the reminder clearly, please try again and mentioned the title and the date";
        repromptText = "I didn't hear the date and title of the reminder clearly, please try again and mentioned the title and the date";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }

}

//Delete Reminder
/**
 * Sets the message in the session and prepares the speech to reply to the user.
 */
function deleteReminder(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlotEntryID = intent.slots.Title;
    var messageSlotDate = intent.slots.Date
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    var reminders;
    if (messageSlotEntryID.value && messageSlotDate.value) {
        
        message_idValue = messageSlotEntryID.value;
        console.log("Message slot contains: " + message_idValue + ".");
        sessionAttributes = createMessageAttributes(message_idValue);
        repromptText = "You can ask me to repeat your message by saying delete reminder with reminder id";
        
        /*************************************************************************************************/
        var code = null;
        var startDateString  = adjustStartDate(messageSlotDate.value);
        var endDateString    = adjustEndDate(messageSlotDate.value);
        var options = getDataFromHybris(startDateString,endDateString);

        var req = https.get(options, function(res) {
            
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('reached on get reminder data');
                reminders = JSON.parse(chunk);
                console.log(chunk);
            });
            
            res.on('end', function() {
                console.log("reached on end get reminders");
                console.log("reminder data is" + reminders);
                if(reminders.calendarEntryDateMapWsDTOList !== undefined && reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList !== undefined ){
                    var reminderCount = reminders.calendarEntryDateMapWsDTOList[0].amount;
                    console.log("reminder count is :" + reminderCount);
                    for (var i=0;i<reminderCount;i++){
                        var title = reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].title;
                        console.log("title is:" + title);
                        console.log("search title is" + message_idValue);
                        if(title === message_idValue){
                            code = reminders.calendarEntryDateMapWsDTOList[0].calendarEntryList[i].code;
                            
                        console.log("code recived from get reminders is:" + code);
                        var option1 = deleteReminderFromHybris(code);
                
                        var requestString = '{"entryId":"' + message_idValue + '}';
                        console.log(requestString);
                        var req1 = https.request(option1, function(res1) {
                            res1.setEncoding('utf8');
                            res1.on('data', function (chunk) {
                                console.log('reached on data');
                            //var reminders = JSON.parse(chunk);
                            console.log(JSON.parse(chunk));
                            });
                            res1.on('end', function() {
                                console.log("reached on end delete");
                                speechOutput = "You reminder has been deleted successfully, Do you want to create a new one or get the latest reminders again. You can also say bye to shut me off.";
                                repromptText = "You reminder has been deleted successfully, Do you want to create a new one or get the latest reminders again. You can also say bye to shut me off.";
                                shouldEndSession = false;
                                callback(sessionAttributes, 
                                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                            });
                        });
                        req1.on('error', function(e) {
                            console.log('reached on error');
                            console.log(e.getMessage());
                            speechOutput = "There was some problem with connecting with the hybris server. You can try again by saying delete the reminder by saying delete reminder title for today";
                            repromptText = "There was some problem with connecting with the hybris server. You can try again by saying delete the reminder by saying delete reminder title for today";
                            shouldEndSession = false;
                            callback(sessionAttributes, 
                                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                        });
                        req1.end();
                    }
                }
            }
            else{
                // case when reminder was not found
                speechOutput = "There are no remider with that title. You can delete the reminder by saying delete reminder title for today";
                repromptText = "There are no remider with that title. You can delete the reminder by saying delete reminder title for today";
                shouldEndSession = false;
                callback(sessionAttributes, 
                    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            }
            });
        });
        
        req.on('error', function(e) {
                speechOutput = "There was some problem with connecting with the hybris server. You can try again by saying delete the reminder by saying delete reminder title for today";
                repromptText = "There was some problem with connecting with the hybris server. You can try again by saying delete the reminder by saying delete reminder title for today";
                shouldEndSession = false;
                callback(sessionAttributes, 
                    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });

        req.end();
        
        /**************************************************************************************************/

    } else {
        speechOutput = "I didn't hear the title of the reminder clearly, please try again and mentioned the reminder id";
        repromptText = "I didn't hear the title of the reminder clearly, please try again and mentioned the reminder id";
    callback(sessionAttributes, 
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}


function createMessageAttributes(message) {
    return {
        message: message
    };
}




function getDataFromHybris(startDateString,endDateString){
    
    var pathUrl = "/abcb2bcommercewebservices/v2/abcb2b/0100052423/calendarentries/get?fromDate=" + startDateString + "&toDate=" + endDateString + "&format=json";
    console.log(pathUrl);
    var options = {
    host: 'abcorderdev.amerisourcebergen.com',
    port: 443,
    path: pathUrl,
    method: 'GET'
    };

return options;

}

function getCreateDataFromHybris(){
    
    //var pathUrl = "/abcb2bcommercewebservices/v2/abcb2b/0100052423/calendarentries/orderreminders/create";
   // console.log(pathUrl);
    var options = {
    host: 'abcorderdev.amerisourcebergen.com',
    //port: 443,
    path: '/abcb2bcommercewebservices/v2/abcb2b/0100052423/calendarentries/orderreminders/create',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
    };

return options;

}

function deleteReminderFromHybris(entryId){
    
    var pathUrl = '/abcb2bcommercewebservices/v2/abcb2b/0100052423/calendarentries/remove/' + entryId;
    console.log(pathUrl);
    var options = {
    host: 'abcorderdev.amerisourcebergen.com',
    port: 443,
    path: pathUrl,
    method: 'DELETE',
    };

return options;

}



function adjustStartDate(dateString){
    var d = new Date(dateString);
    console.log(d);
    d.setDate(d.getDate()-1);
    var datestringStartDate;
    console.log(d);
    if(d.getMonth() < 10){
        datestringStartDate =  d.getFullYear() + "-" + "0" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    else{
        datestringStartDate =  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    console.log(datestringStartDate);
    return datestringStartDate;

}

function generateStartDate(dateString){
    var d = new Date(dateString);
    console.log(d);
    d.setDate(d.getDate());
    var datestringStartDate;
    console.log(d);
    if(d.getMonth() < 10){
        datestringStartDate =  d.getFullYear() + "-" + "0" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    else{
        datestringStartDate =  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    console.log(datestringStartDate);
    return datestringStartDate;

}

function adjustEndDate(dateString){
    var d = new Date(dateString);
    console.log(d);
    d.setDate(d.getDate()+1);
    console.log(d);
    var datestringEndDate;
    if(d.getMonth() < 10){
        datestringEndDate =  d.getFullYear() + "-" + "0" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    else{
        datestringEndDate =  d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate()  + "T00:00:00Z";
    }
    console.log(datestringEndDate);
    return datestringEndDate;
}



// Archive Code - can be used later on to communicate with slack channel

/*var https = require('https');
var options = {
  host: 'hooks.slack.com',
  port: 443,
  path: '/services/T1N601EMD/B1N60PNAX/qPic9VXtkJcvkDE71EySMDh8',
  method: 'POST'
};
*/


/*
    var req = https.request(options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    callback(sessionAttributes, 
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                });
            });
                req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                    context.fail(e);
                });
    req.write('{"channel": "#general", "username": "webhookbot", "text": "[via Alexa]: ' + message_cn + '", "icon_emoji": ":ghost:"}');
    req.end();*/
    
/*
function getMessageFromSession(intent, session, callback) {
    var cardTitle = intent.name;
    var message;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes) {
        message = session.attributes.message;
    }

    if(message) {
        speechOutput = "Your message is " + message + ", goodbye";
        shouldEndSession = true;
    }
    else {
        speechOutput = "I didn't hear your message clearly. As an example, you can say, My message is 'hello, team!'";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user. 
    // If the user does not respond or says something that is not understood, the app session 
    // closes.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}*/
    
        
