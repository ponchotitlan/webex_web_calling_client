/* eslint-env browser */

/* global Webex */

/* eslint-disable camelcase */
/* eslint-disable max-nested-callbacks */
/* eslint-disable no-alert */
/* eslint-disable no-console */
/* eslint-disable require-jsdoc */
/* eslint-disable arrow-body-style */

var issuer_id =
  process.env.ISSUER_ID;
var shared_secret = process.env.SHARED_SECRET;

// Declare some globals that we'll need throughout
let webex,activeMeeting,meetingid,callNow;

//Trigger connection
$(document).ready(function () {
  console.log("Site ready ...");
  document.getElementById("btn-dial").addEventListener("click",triggerCallFromDialer);
  document.getElementById("mute_voice").addEventListener("click",muteMeAudio);
  document.getElementById("mute_video").addEventListener("click",muteMeVideo);
  meetingid = queryURL("meetingid");
  callNow = queryURL("callnow");
  if(meetingid==null) {
    meetingid = ""
  }
  document.getElementById('invitee').value = meetingid;

  //Is this in autocall mode?
  if(callNow==null) {
    callNow = "no"
    dialerllStateUI();
  }else{
    autocallStateUI();
  }
  connect();
});

//JWT token Generation
//This is a unique token for each individual user
//The username is generated randomly, so user input is never required
function jwtGeneration() {
  var random_name = "Client-" + Math.random().toString(36).substr(2, 10);
  console.log(random_name);
  var oHeader = { alg: "HS256", typ: "JWT" };
  var oPayload = {};
  var tNow = KJUR.jws.IntDate.get("now");
  var tEnd = KJUR.jws.IntDate.get("now + 1hour");
  oPayload.iss = issuer_id;
  oPayload.sub = random_name;
  oPayload.name = random_name;
  oPayload.nbf = tNow;
  oPayload.iat = tNow;
  oPayload.exp = tEnd;
  var sHeader = JSON.stringify(oHeader);
  var sPayload = JSON.stringify(oPayload);
  return KJUR.jws.JWS.sign("HS256", sHeader, sPayload, { b64u: shared_secret });
}

// There's a few different events that'll let us know we should initialize
// Webex and start listening for incoming calls, so we'll wrap a few things
// up in a function.
function connect() {
  return new Promise((resolve) => {
    if (!webex) {
      // eslint-disable-next-line no-multi-assign
      webex = window.webex = Webex.init();
    }

    // Listen for added meetings
    webex.meetings.on("meeting:added", (addedMeetingEvent) => {
      if (addedMeetingEvent.type === "INCOMING") {
        const addedMeeting = addedMeetingEvent.meeting;

        // Acknowledge to the server that we received the call on our device
        addedMeeting.acknowledge(addedMeetingEvent.type).then(() => {
          if (confirm("Answer incoming call")) {
            joinMeeting(addedMeeting);
            bindMeetingEvents(addedMeeting);
          } else {
            addedMeeting.decline();
          }
        });
      }
    });

    // Register our device with Webex cloud
    if (!webex.meetings.registered) {
      webex.authorization
        .requestAccessTokenFromJwt({ jwt: jwtGeneration() })
        .then((res) => {
          //Registering to Webex Calling service
          webex.meetings
            .register()
            .then(() => webex.meetings.syncMeetings())
            .then(() => {
              
              //UI update
              registeredStateUI();

              // Our device is now connected
              resolve();

              //If AutoCall is on, let's dial now!
              if(callNow == "yes"){
                triggerCallAuto();
              }

            })
            // This is a terrible way to handle errors, but anything more specific is
            // going to depend a lot on your app
            .catch((err) => {
              console.error(err);
              // we'll rethrow here since we didn't really *handle* the error, we just
              // reported it
              throw err;
            });
        });
    } else {
      // Device was already connected
      resolve();
    }
  });
}

// Similarly, there are a few different ways we'll get a meeting Object, so let's
// put meeting handling inside its own function.
function bindMeetingEvents(meeting) {
  // call is a call instance, not a promise, so to know if things break,
  // we'll need to listen for the error event. Again, this is a rather naive
  // handler.
  meeting.on("error", (err) => {
    console.error(err);
  });

  meeting.on("meeting:stateChange", (delta) => { 

    lobbyWaitingStateUI();
    console.log("Meeting state is: " + meeting.meetingState);

    if (meeting.meetingState == "ACTIVE") {
      //UI update
      callnowStateUI();

      const constraints = {
        audio: true,
        video: true,
      };

      return meeting
        .getSupportedDevices({
          sendAudio: constraints.audio,
          sendVideo: constraints.video,
        })
        .then(({ sendAudio, sendVideo }) => {
          const mediaSettings = {
            receiveVideo: constraints.video,
            receiveAudio: constraints.audio,
            receiveShare: false,
            sendShare: false,
            sendVideo,
            sendAudio,
          };

          return meeting.getMediaStreams(mediaSettings).then((mediaStreams) => {
            const [localStream, localShare] = mediaStreams;

            meeting.addMedia({
              localShare,
              localStream,
              mediaSettings,
            });
          });
        });
    }

    //Disconnect everything when the host terminates the meeting
    if(meeting.meetingState == "INACTIVE"){
      hangupStateUI();
    }

    //Disconnect everything when the host terminates the meeting
    if(meeting.meetingState == "TERMINATING"){
      hangupStateUI();
    }
  });

  // Handle media streams changes to ready state
  meeting.on("media:ready", (media) => {
    if (!media) {
      return;
    }
    if (media.type === "local") {
      document.getElementById("self-view").srcObject = media.stream;
    }
    if (media.type === "remoteVideo") {
      document.getElementById("remote-view-video").srcObject = media.stream;
    }
    if (media.type === "remoteAudio") {
      document.getElementById("remote-view-audio").srcObject = media.stream;
    }
  });

  // Handle media streams stopping
  meeting.on("media:stopped", (media) => {
    // Remove media streams
    if (media.type === "local") {
      document.getElementById("self-view").srcObject = null;
    }
    if (media.type === "remoteVideo") {
      document.getElementById("remote-view-video").srcObject = null;
    }
    if (media.type === "remoteAudio") {
      document.getElementById("remote-view-audio").srcObject = null;
    }
  });

  // Of course, we'd also like to be able to end the call:
  document.getElementById("hangup").addEventListener("click", () => {
    hangupStateUI();
    meeting.leave();
  });
}

// Join the meeting and add media
function joinMeeting(meeting) {
  return meeting.join({ moderator: false });
}

// Button-based dialling
function triggerCallFromDialer(){
  tempdestination = document.getElementById('invitee').value;

  if (tempdestination != "") {
    //Append @webex.com suffix
    if(!tempdestination.includes("@")) {
      tempdestination = tempdestination.concat("@webex.com");
    }  
    const destination = tempdestination;
    console.log("Calling: "+destination);

    //Show-hide announcements
    callingStateUI();

    // we'll use `connect()` (even though we might already be connected or
    // connecting) to make sure we've got a functional webex instance.
    connect()
      .then(() => {
        // Create the meeting
        return webex.meetings.create(destination).then((meeting) => {
          // Call our helper function for binding events to meetings
          activeMeeting = meeting;
          bindMeetingEvents(meeting);
          return joinMeeting(meeting);
        });
      })
      .catch((error) => {
        // Report the error
        console.error(error);
        errorStateUI(str(error));        
      });
  }else{
    //Address cannot be empty
    errorStateUI("Please input a valid address in the bar above");
  }
}

// URL-based dialling
function triggerCallAuto(){
  if (meetingid != "") {
    //Append @webex.com suffix
    if(!meetingid.includes("@")) {
      meetingid = meetingid.concat("@webex.com");
    }  

    console.log("Calling: "+meetingid);

    //Show-hide announcements
    callingStateUI();

    // we'll use `connect()` (even though we might already be connected or
    // connecting) to make sure we've got a functional webex instance.
    connect()
      .then(() => {
        // Create the meeting
        return webex.meetings.create(meetingid).then((meeting) => {
          // Call our helper function for binding events to meetings
          activeMeeting = meeting;
          bindMeetingEvents(meeting);
          return joinMeeting(meeting);
        });
      })
      .catch((error) => {
        // Report the error
        console.error(error);
        errorStateUI(str(error));        
      });
  }else{
    //Address cannot be empty
    errorStateUI("Please input a valid address in the URL params");
  }
}

//Mute local user voice
function muteMeAudio(){
  srcAudio = require("../img/audio.svg");
  srcAudioMute = require("../img/audio-mute.svg");

  if(activeMeeting){
    if($("#mute_voice").hasClass("selected")){
      //Remove mute
      activeMeeting.unmuteAudio().then(() => {
        $("#mute_voice").removeClass("selected");
        $("#mute-voice-label").text("Mute audio");
        $("#mute-voice-icon").attr("src",srcAudio);
      });
    }else{
      //Add mute
      activeMeeting.muteAudio().then(() => {
        $("#mute_voice").addClass("selected");
        $("#mute-voice-label").text("Unmute audio");
        $("#mute-voice-icon").attr("src",srcAudioMute);
      });
    }
  }
}

//Mute local user video
function muteMeVideo(){
  srcVideo = require("../img/video.svg");
  srcVideoMute = require("../img/video-mute.svg");

  if(activeMeeting){
    if($("#mute_video").hasClass("selected")){
      //Remove mute
      activeMeeting.unmuteVideo().then(() => {
        $("#mute_video").removeClass("selected");
        $("#mute-video-label").text("Hide video");
        $("#mute-video-icon").attr("src",srcVideo);
      });
    }else{
      //Add mute
      activeMeeting.muteVideo().then(() => {
        $("#mute_video").addClass("selected");
        $("#mute-video-label").text("Show video");
        $("#mute-video-icon").attr("src",srcVideoMute);
      });
    }
  }
}

/********** INPUT URL ************/
function queryURL(ji) {
  hu = window.location.search.substring(1);
  gy = hu.split("&");
  for (i=0;i<gy.length;i++) {
    ft = gy[i].split("=");
    if (ft[0] == ji) {
      return ft[1];
    }
  }
} 

/********** UI HANDLING ************/
function hideElement(name) {
  $("#" + name).addClass("hidden");
}

function showElement(name) {
  $("#" + name).removeClass("hidden");
}

function autocallStateUI(){
  hideElement("dialer");
  showElement("header");
  $("#banner-ready").text("Thank you! Have a great day");
}

function dialerllStateUI(){
  hideElement("header");
  showElement("dialer");
  $("#banner-ready").text("Please enter an address above and click Call");
}

function registeredStateUI(){
  hideElement("error-notice");
  hideElement("status-notice");
  showElement("ready-notice");
  $("#btn-dial").removeClass("asleep");
}

function errorStateUI(text){
  hideElement("remote-view-video");
  hideElement("ready-notice");
  hideElement("buttons");
  hideElement("status-notice");
  hideElement("self-view");
  $("#banner-error").text("An error occured: "+text);
  showElement("error-notice");
}

function callingStateUI(){
  $("#btn-dial").addClass("asleep");
  hideElement("remote-view-video");
  hideElement("ready-notice");
  hideElement("error-notice");
  hideElement("buttons");
  $("#banner-status").text("Calling now. Please standby ...");
  showElement("status-notice");
  showElement("self-view");
}

function callnowStateUI(){
  hideElement("error-notice");
  hideElement("status-notice");
  showElement("self-view");
  showElement("remote-view-video");
  showElement("buttons");
}

function hangupStateUI(){
  hideElement("error-notice");
  $("#btn-dial").removeClass("asleep");
  hideElement("remote-view-video");
  hideElement("self-view");
  hideElement("buttons");
  hideElement("status-notice");
  showElement("ready-notice");
}

function lobbyWaitingStateUI(){
  $("#btn-dial").addClass("asleep");
  hideElement("self-view");
  hideElement("remote-view-video");
  hideElement("ready-notice");
  hideElement("error-notice");
  hideElement("buttons");
  $("#banner-status").text("Please wait for your meeting to begin");
  showElement("status-notice");
}