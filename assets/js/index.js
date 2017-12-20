// Initialize Firebase
var config = {
  apiKey: "AIzaSyBehS1ZkgbQu3L5DOCuK94U-XnORSAaTDM",
  authDomain: "multiplayer-rps-game.firebaseapp.com",
  databaseURL: "https://multiplayer-rps-game.firebaseio.com",
  projectId: "multiplayer-rps-game",
  storageBucket: "multiplayer-rps-game.appspot.com",
  messagingSenderId: "91957864832"
};
firebase.initializeApp(config);
var database = firebase.database();

//Define online users using gathering.js
var onlineUsers = new Gathering(firebase.database());

// Define blank global variables related to user and players
var username;
var usersArray = [];
var p1;
var p2;
var myPlayer;
var p1choice;
var p2choice;
var p1wins;
var p2wins;
var p1losses;
var p2losses;

//Handle login status
firebase.auth().onAuthStateChanged(user => {
  //If user is logged in
  if(user) {
    // Set username variable
    username = firebase.auth().currentUser.displayName;
    // Display username in navbar
    $("#user-email").text(username);
    // Join gathering with actual name (the first UID parameter ensures the user is unique)
    onlineUsers.join(firebase.auth().currentUser.uid, username);
  // If user is not logged in
  } else {
    // Redirect to login page
    window.location = 'login.html';  
  }
});

// Attach a callback function to track updates to gathering (called every time user list updated)
onlineUsers.onUpdated(function(count, users) {
  // Update the displayed user count
  $("#user-count").text(count);
  // Clear user list and save previous one for comparison
  prevUsersArray = usersArray;
  usersArray = [];
  // Populate user list
  for(var i in users) {
    usersArray.push(users[i]);
  }
  //Set player 1 and player 2
  p1=usersArray[0];
  p2=usersArray[1];
  //Check if the current user is P1 or P2
  if(username==p1){
    myPlayer="p1";
    otherPlayer="p2";
    $("#p1-choices").show();
    $("#p2-choices").hide();
  } else if(username==p2){
    myPlayer="p2";
    otherPlayer="p1";
    $("#p2-choices").show();
    $("#p1-choices").hide();
  // Log the user out if they are not P1 or P2
  } else {
    myPlayer="none";
    firebase.auth().signOut();
    window.location = 'login.html';  
  }
  otherPlayerUsername = usersArray[otherPlayer.substr(1)-1];
  if(otherPlayerUsername==undefined) {
    otherPlayerUsername = "[Waiting for another player]";
    $("#status").text("Waiting for another player");
    $("#last-game").text("");
  }
  // Reset scoreboard if the players have changed
  if (usersArray[0] != prevUsersArray[0] || usersArray[1] != prevUsersArray[1]){
    database.ref("players").update({
      [myPlayer + "/name"]: username,
      [otherPlayer + "/name"]: otherPlayerUsername,
      "p1/wins": 0,
      "p2/wins": 0,
      "p1/losses": 0,
      "p2/losses": 0,
      "p1/choice": "none",
      "p2/choice": "none"
    });
  }
});

// Child added event listener
database.ref("players").on("child_added", function updateValues (snapshot, prevChildKey) {
  if(snapshot.key=="p1"){
    $("#p1-name").text(snapshot.val().name);
    p1wins = snapshot.val().wins;
    $("#p1-wins").text(snapshot.val().wins);
    p1losses = snapshot.val().losses;
    $("#p1-losses").text(snapshot.val().losses);
    p1choice = snapshot.val().choice;
  } else if(snapshot.key=="p2"){
    $("#p2-name").text(snapshot.val().name);
    p2wins = snapshot.val().wins;
    $("#p2-wins").text(snapshot.val().wins);
    p2losses = snapshot.val().losses;
    $("#p2-losses").text(snapshot.val().losses);
    p2choice = snapshot.val().choice;
  }
});

// Update scoreboard at end of game
function updateScoreboard (winner, loser) {
  p1choice = "none";
  p2choice = "none";
  if (winner != "none" && loser != "none") {
    console.log("non-draw");
    // In non-draw cases update wins and losses and reset the choices
    eval(winner + "wins++");
    eval(loser + "losses++");
    var package = {
      "p1/choice": p1choice,
      "p2/choice": p2choice,
      [winner + "/wins"]: eval(winner + "wins"),
      [loser + "/losses"]: eval(loser + "losses")
    };
    database.ref("players").update(package);
    $("#last-game").text(winner.toUpperCase() + " won the last game");
    // In draw cases just reset the choices
  } else {
    console.log("draw");
    database.ref("players").update({
      "p1/choice": p1choice,
      "p2/choice": p2choice
    });
    $("#last-game").text("The last game was a draw");
  }
  console.log("performed choice reset");
};

// Child changed event listener
database.ref("players").on("child_changed", function updateValues (snapshot, prevChildKey) {
  if(snapshot.key=="p1"){
    $("#p1-name").text(snapshot.val().name);
    p1wins = snapshot.val().wins;
    $("#p1-wins").text(snapshot.val().wins);
    p1losses = snapshot.val().losses;
    $("#p1-losses").text(snapshot.val().losses);
    p1choice = snapshot.val().choice;
  } else if(snapshot.key=="p2"){
    $("#p2-name").text(snapshot.val().name);
    p2wins = snapshot.val().wins;
    $("#p2-wins").text(snapshot.val().wins);
    p2losses = snapshot.val().losses;
    $("#p2-losses").text(snapshot.val().losses);
    p2choice = snapshot.val().choice;
  }
  // If both players have not chosen
  if (p1choice == "none" && p2choice == "none") {
    console.log("waiting both");
    $("#status").text("Waiting for both players to choose");
  // If P1 has not chosen
  } else if (p1choice == "none" && p2choice != "none") {
    console.log("waiting 1");
    $("#status").text("Waiting for Player 1 to choose");
  // If P2 has not chosen
  } else if (p1choice != "none" && p2choice == "none") {
    console.log("waiting 2");
    $("#status").text("Waiting for Player 2 to choose");
  // If both have chosen, evaluate outcome
  } else if (p1choice != "none" && p2choice != "none")  {
    console.log("not waiting");
    // If P1 is Rock, etc.
    if (p1choice == "rock") {
      switch (p2choice) {
        case "rock":
            updateScoreboard ("none", "none");
            break;
        case "paper":
            updateScoreboard ("p2", "p1");
            break;
        case "scissors":
            updateScoreboard ("p1", "p2");
            break;
      }
    } else if (p1choice == "paper") {
      switch (p2choice) {
        case "rock":
            updateScoreboard ("p1", "p2");
            break;
        case "paper":
            updateScoreboard ("none", "none");
            break;
        case "scissors":
            updateScoreboard ("p2", "p1");
            break;
      }
    } else if (p1choice == "scissors") {
      switch (p2choice) {
        case "rock":
            updateScoreboard ("p2", "p1");
            break;
        case "paper":
            updateScoreboard ("p1", "p2");
            break;
        case "scissors":
            updateScoreboard ("none", "none");
            break;
      }
    } else {
      console.log("uncovered case");
    }
  }
});

// Make choice
$(document).on("click", ".img-thumbnail", function() {
  // Parse the ID of the choice element
  var id = $(this).attr("id").split("-");
  var player = id[0];
  var choice = id[1];
  console.log(choice);
  if (player == "p1") {
    p1choice = choice;
  } else if (player == "p2") {
    p2choice = choice;
  }
  // Write to DB
  database.ref("players").child(player).update({
    choice: choice
  });
});

// Logout link
$(document).on("click", "#logout", function(event) {
  event.preventDefault(); 
  firebase.auth().signOut();
  window.location = 'login.html';  
});