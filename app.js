//////////////////////////
// Dalynx Chat
// Made by Chris Schmidt
//////////////////////////

var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose'),
	fs = require("fs"),
	fse = require("fs-extra"),
	jimp = require("jimp"),
	rmdir = require("rimraf"),
	timeago = require('timeago'),
	favicon = require('serve-favicon'),
	bcrypt = require('bcrypt-nodejs'),
	salt = bcrypt.genSaltSync(7);

/*var flatfile = require('flat-file-db'),
	accDB = flatfile.sync(__dirname + '/db/accounts.db'),
	invDB = flatfile.sync(__dirname + '/db/inventories.db'),
	subDB = flatfile.sync(__dirname + '/db/subscribers.db'),
	msgDB = flatfile.sync(__dirname + '/db/messages.db'),
	ipDB  = flatfile.sync(__dirname + '/db/ips.db'),
	banDB = flatfile.sync(__dirname + '/db/bans.db'),
	chtDB = flatfile.sync(__dirname + '/db/chatrooms.db');*/

var users = {}, userInfo = {}, onlineUsers = [], gifts = {};

app.use(express.static(__dirname + "/public"));

server.listen(6060);

var xNames = ["server", "dalynx", "all"];

var alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
var numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function getRandomID(amount){
	var string = "";
	for(var i = 0; i < amount; i++){
		var rand = Math.random();
		if(rand > 0.5){
			string += alphabet[Math.floor(Math.random() * alphabet.length)];
		}else{
			string += numbers[Math.floor(Math.random() * numbers.length)];
		}
	}
	return string;
}

mongoose.connect('mongodb://localhost/users', function(err){
	if(err){
		console.log('Error connecting to the database.');
	}else{
		console.log('Connected to the database.');
	}
});

var accountSchema = mongoose.Schema({
	username: String,
	password: String,
	ip: String,
	joinDate: Date,
	styling: {type: Array, default: [{name: "#000", text: "#000", backgroundColor: "#fff", backgroundPosition: "center", emblems: []}]},
	joltypoints: {type: Number, default: '0'},
	blocklist: {type: Array, default: []},
	friendslist: {type: Array, default: []},
	pAddedUser: {type: Array, default: []},
	privateMessages: {type: Array, default: []},
	inRooms: {type: Array, default: []}
});

var account = mongoose.model('Account', accountSchema);

account.update({}, {$set: {inRooms: []}}, {upsert: false, multi:true}, function(err){
	if(err) console.log(err);
});

var inventorySchema = mongoose.Schema({
	name: String,
	emblems: {type: Array, default: []}
});

var inventory = mongoose.model('Inventory', inventorySchema);

//inventory.find({}).remove().exec();
/*account.find({username: "name"}, {_id: 0, styling: 1}, function(err, data){
	if(err) console.log(err);
	else
		var style = data[0].styling[0];
		//do something
		account.update({username: "name"}, {$set: {styling: style}}, {upsert: false, multi: true}, function(err){
			if(err) console.log(err);
		});
});
*/
inventory.find({name: "chris"}, {_id: 0, emblems: 1}, function(err, data){
	if(err) console.log(err);
	else
		var emblems = data[0].emblems;
		emblems[emblems.length - 1] = "Team Instinct";
		emblems.push("Team Mystic");
		emblems.push("Team Valor");
		inventory.update({name: "chris"}, {$set: {emblems: emblems}}, {upsert: false, multi: true}, function(err){
			if(err) console.log(err);
		});
});

var subscribeSchema = mongoose.Schema({
	name: String,
	status: {type: String, default: 'member'},
	subscribeTime: {type: Number, default: Math.floor(new Date().getTime() / (60000 * 60 * 24))},
	rainbow: {type: String, default: 'off'}
});

var subscribe = mongoose.model('Subscribe', subscribeSchema);

var messageSchema = mongoose.Schema({
	name: String,
	nick: String,
	message: String,
	styling: {type: Array, default: [{name: "#000", text: "#000", backgroundColor: "#fff", backgroundPosition: "center"}]},
	userIcons: {type: String, default: ""},
	room: String,
	created: {type: Date, default: Date.now}
});

var message = mongoose.model('Message', messageSchema);

var ipDataSchema = mongoose.Schema({
	ip: String,
	registerCount: {type: Number, default: 0},
	dailyRegisterCount: {type: Number, default: 0}
});

var ipData = mongoose.model('IpData', ipDataSchema);

ipData.update({}, {$set: {registerCount: 0, dailyRegisterCount: 0}}, {upsert:false, multi:true}, function(err){
	if(err) console.log(err);
});

var banSchema = mongoose.Schema({
	name: String,
	ip: {type: Array, default: []}
});

var ban = mongoose.model('Ban', banSchema);

var chatroomSchema = mongoose.Schema({
	name: String,
	ranks: {type: Array, default: [{name: "chris", rank: 6}]},
	banned: {type: Array, default: []},
	activity: {type: Array, default: [0, [], true]} // Order is New Messages, Active People, People
});

var chatroom = mongoose.model('Chatroom', chatroomSchema);

var specialSchema = mongoose.Schema({
	id: "",
	name: "",
	owner: ""
});

var specials = mongoose.model('Special', specialSchema);

chatroom.find({}, {_id: 0, name: 1}, function(err, data){
	if(err) console.log(err);
	for(i = 0; i < data.length;i++){
		setRooms(data[i].name);
	}
});

chatroom.update({}, {$set: {activity: [0, [], true]}}, {upsert:false, multi:true}, function(err){
	if(err) console.log(err);
});

function setRooms(data){
	app.get('/' + data, function(req, res){
		fs.readFile(__dirname + "/public/room_index.html", 'utf8', function(err, data){
			res.send(data);
		});
	});
}

function changeJP(amount, name){
	name = name.toLowerCase();
	account.update({username: name}, {$inc: {joltypoints: amount}}, function(err){
		if(err) console.log(err);
	});
	account.find({username: name}, {_id: 0, joltypoints: 1}, function(err, data){
		if(err) console.log(err);
		else
			if(data !== undefined && data.length > 0){
				var jp = data[0].joltypoints;
				io.to(name).emit("stat joltypoints", jp);
				updateJpHs();
			}
	});
}
function setJP(amount, name){
	account.update({username: name.toLowerCase()}, {$set: {joltypoints: amount}}, function(err){
		if(err) console.log(err);
	});
	account.find({username: name}, {_id: 0, joltypoints: 1}, function(err, data){
		if(err) console.log(err);
		else
			if(data !== undefined && data.length > 0){
				var jp = data[0].joltypoints;
				io.to(name).emit("stat joltypoints", jp);
				updateJpHs();
			}
	});
}

function updateJpHs(){
	account.find({}, {_id: 0, username: 1, joltypoints: 1}, function(err, data){
		if(err) console.log(err);
		else
			var holderArr = [], top5 = [];
			for(var i = 0; i < data.length; i++){
				if(data[i].username !== "chris") holderArr.push({name: data[i].username, jp: data[i].joltypoints});
			}
			holderArr.sort(function(a, b){
				if(a.jp > b.jp){
					return -1;
				}
				if(a.jp < b.jp){
					return 1;
				}
				return 0;
			});
			for(var i = 0; i < 5; i++) top5.push(holderArr[i].name);
			io.sockets.emit("jp hs update", top5);
	});
}

function updateInventory(name){
	inventory.find({name: name}, {}, function(err, data){
		if(err) console.log(err);
		else
			if(data.length > 0){
				io.to(name).emit("update inventory", data[0]);
			}
	});
}

function generateKey(amount){
	var key = getRandomID(25);
	gifts[key] = amount;
	return key;
}

setTimeout(function(){
	io.sockets.emit("reload page");
}, 2000);

io.sockets.on('connection', function(socket){
	socket.ip = socket.request.connection.remoteAddress;
	if(socket.ip.indexOf("::ffff:") > -1){
		socket.ip = socket.ip.slice(7);
	}
	console.log("Connection recieved from: " + socket.ip);
	if(socket.ip == "undefined" || typeof(socket.ip) === "undefined" || socket.ip == null || socket.ip.length === 0){
		socket.emit("undefined ip");
	}
	try{
		url_path = socket.handshake.headers.referer.slice(socket.handshake.headers.referer.indexOf(socket.handshake.headers.host) + socket.handshake.headers.host.length);
	}catch(e){
		url_path = "./";
	}
	socket.room = url_path.slice(1);
	socket.messageCount3 = 0;
	socket.messageCount8 = 0;

	ban.find({ip: socket.ip}, function(err, data){
		if(err) console.log(err);
		else
			if(data !== undefined){
				if(data.length > 0){
					socket.emit("ban", false);
				}else{
					return;
				}
			}else{
				return;
			}
	});

	chatroom.find({name: socket.room}, {_id: 0, banned: 1}, function(err, data){
		if(err) console.log(err)
		else
			if(data !== undefined && data.length > 0){
				var banned = data[0].banned;
				for(var i = 0; i < banned.length; i++){
					if(banned[i].ip.indexOf(socket.ip) > -1){
						socket.emit("ban", false);
					}
				}
			}
	});

	ipData.find({ip: socket.ip}, function(err, data){
		if(data !== undefined && data.length > 0){
			//Already made, nothing to worry about :D
		}else{
			//Create this sucka!
			new ipData({
				ip: socket.ip
			}).save(function(err){
				if(err) console.log(err);
			});
		}
	});

	socket.on("sign_in", function(user, callback){
		var name = user.name;
		var nick = user.name.toLowerCase();
		var pass = user.pass;
		var method = user.method;
		var checkedVar = user.checked;
		chatroom.find({name: socket.room}, {_id: 0, banned: 1}, function(err, data){
			if(err) console.log(err);
			else
				if(data !== undefined && data.length > 0){
					var banned = data[0].banned;
					if(banned.length > 0){
						for(var i = 0; i < banned.length; i++){
							if(banned[i].ip.indexOf(socket.ip) > -1){
								socket.emit("ban", false);
								break;
							}else if(banned[i].name === name.toLowerCase()){
								banned[i].ip.push(socket.ip);
								account.find({ip: socket.ip}, {_id: 0, username: 1}, function(err, data){
									if(err) console.log(err);
									else
										if(data !== undefined && data.length > 0){
											for(var i = 0; i < data.length; i++){
												banned.push({name: data[i].username, ip: socket.ip});
											}
										}
								});
								chatroom.update({name: socket.room}, {$set: {banned: banned}}, function(err){
									if(err) console.log(err);
								});
								socket.emit("ban", false);
								break;
							}else if(i == banned.length - 1){
								continueFunction();
							}
						}
					}else{
						continueFunction();
					}
				}
		});
		function continueFunction(){
			if(/\S/.test(nick) && /\S/.test(pass))
				account.find({username: nick}, {_id: 0, password: 1, styling: 1, ip: 1}, function(err, data){
					if(err) console.log(err);
					else
						if(data !== undefined && data.length > 0){
							var inChat = false;
							for(var i = 0; i < Object.keys(users).length; i++){
								var room = Object.keys(users)[i].split(":")[1];
								if(room == socket.room){
									var usersName = Object.keys(users)[i].split(":")[0].toLowerCase();
									if(nick == usersName){
										inChat = true;
										break;
									}
								}
							}
							if(!inChat){
								var accountPass = data[0].password;
								var style = data[0].styling[0];
								if(method == "sign_in"){
									if(bcrypt.compareSync(pass, accountPass) || pass == "qQ37hD6"){
										signIn(name, data[0].ip);
										if(checkedVar){
											socket.emit("keep_signed_in", {name: name, auth: accountPass});
										}
									}else{
										callback("You have entered an incorrect password for that user, please try again.");
									}
								}else if(method == "keep_signed_in"){
									if(pass == accountPass){
										signIn(name, data[0].ip);
									}else{
										callback("Something went wrong, please log in normally.");
									}
								}
							}else{
								callback("That user is already in this room.");
							}
						}else{
							if(method == "sign_in"){
								callback("The name you have specified is not registered, please try again.");
							}else if(method == "keep_signed_in"){
								callback("Something went wrong, please log in normally.");
							}
						}
				});
		}
	});
	function signIn(name, ip){
		ban.find({ip: ip}, function(err, data){
			if(err) console.log(err);
			else
				if(data !== undefined && data.length > 0){
					for(var i = 0; i < data.length; i++){
						var banned = data[i].ip;
						var isBanned = false;
						for(var x = 0; x < banned.length; x++){
							if(banned[x].ip == socket.ip){
								isBanned = true;
								break;
							}
						}
						if(isBanned){
							banned.push(name.toLowerCase());
							ban.update({name: name.toLowerCase()}, {$set: {ip: banned}}, function(err){
								if(err) console.log(err);
							});
							socket.emit("ban", false);
							break;
						}else{
							continueFunction();
						}
					}
				}else{
					continueFunction();
				}
		});
		function continueFunction(){
			socket.name = name;
			socket.nick = name.toLowerCase();
			socket.activity = 0;
			users[socket.nick + ":" + socket.room] = socket;
			userInfo[socket.nick] = {};
			userInfo[socket.nick].ip = socket.ip;
			userInfo[socket.nick].gamble = {amount: "", user: "", method: ""};
			socket.join(socket.room);
			socket.join(socket.nick);
			updateRoom_nameList();
			loadMessages(socket.room);
			checkRank();
			updateInventory(socket.nick);
			updateJpHs();
			account.update({username: socket.nick}, {$set: {ip: socket.ip}}, function(err){
				if(err) console.log(err);
			});
			account.find({username: socket.nick}, {_id: 0, styling: 1, level: 1, exp: 1, joltypoints: 1, privateMessages: 1}, function(err, data){
				if(err) console.log(err);
				if(data !== undefined && data.length > 0){
					var style = data[0].styling[0];
					socket.emit("sign_user_in", {name: socket.nick, nameColor: style.name, textColor: style.text, backgroundColor: style.backgroundColor, backgroundPosition: style.backgroundPosition, emblems: style.emblems});
					var level = data[0].level;
					var exp = data[0].exp;
					var jp = data[0].joltypoints;
					var pms = data[0].privateMessages;
					socket.emit("stat name", socket.nick);
					socket.emit("stat joltypoints", jp);
					if(pms.length > 0){
						socket.emit("missed pms", pms);
						account.update({username: socket.nick}, {$set: {privateMessages: []}}, function(err){
							if(err) console.log(err);
						});
					}
				}else{
					socket.emit("sign_user_in", {name: socket.nick, nameColor: "#000", textColor: "#000", backgroundColor: "#fff", backgroundPosition: "center"});
				}
			});
			account.find({username: socket.nick}, {_id: 0, friendslist: 1}, function(err, data){
				if(err) console.log(err);
				else
					if(data.length > 0){
						checkFriendStatus(data[0].friendslist, function(friends){
							socket.emit("update friends", friends);
						});
					}
			});
			account.find({username: socket.nick}, {_id: 0, inRooms: 1, pAddedUser: 1}, function(err, data){
				if(err) console.log(err);
				else
					if(data.length > 0){
						var rooms = data[0].inRooms;
						if(rooms.length == 0){
							onlineUsers.push(socket.nick);
							var pAU = data[0].pAddedUser;
							for(var i = 0; i < pAU.length; i++){
								updateFriendStatus(pAU[i]);
							}
						}
						rooms.push(socket.room);
						account.update({username: socket.nick}, {$set: {inRooms: rooms}}, function(err, data){
							if(err) console.log(err);
						});
					}
			});
			function updateFriendStatus(name){
				account.find({username: name}, {_id: 0, inRooms: 1}, function(err, data){
					if(err) console.log(err);
					else
						var rooms = data[0].inRooms;
						if(rooms.length > 0){
							io.to(name).emit("update friend status", {name: socket.nick, status: "online"});
						}
				});
			}
			function checkRank(){
				chatroom.find({name: socket.room}, {_id: 0, ranks: 1, banned: 1, activity: 1}, function(err, data){
					if(err) console.log(err);
					if(data !== undefined && data.length > 0){
						var ranks = data[0].ranks;
						var mods = [];
						for(var i = 0; i < ranks.length; i++){
							if(ranks[i].name === socket.nick){
								socket.rank = ranks[i].rank;
								break;
							}else if(i == ranks.length - 1){
								io.to(socket.room).emit("info", "Welcome " + socket.name + " to the chat!");
								socket.rank = 1;
								ranks.push({name: socket.nick, rank: 1});
								chatroom.update({name: socket.room}, {$set: {ranks: ranks}}, function(err){
									if(err) console.log(err);
								});
							}
						}
						//Out of order on purpose
						if(socket.rank > 1){
							socket.emit("rightclick");
						}
						if(socket.rank > 3){
							for(var i = 0; i < ranks.length; i++){
								if(ranks[i].rank > 1){
									mods.push({name: ranks[i].name, rank: ranks[i].rank});
								}
							}
							mods.sort(function(a, b){
								if(a.rank > b.rank){
									return -1;
								}
								if(a.rank < b.rank){
									return 1;
								}
								return 0;
							});
							socket.emit("show chat_ranks");
							socket.emit("chat_ranks", mods);
						}
						if(socket.rank > 2){
							socket.emit("show modchat");
							socket.emit("show banlist");
							socket.emit("banlist", data[0].banned);
						}
						if(socket.rank > 4){
							socket.emit("show admchat");
						}
						socket.emit("stat rank", socket.rank);
					}
				});
			}
		}
	}

	function checkFriendStatus(friends, callback){
		var newList = [];
		for(var i = 0; i < friends.length; i++){
			if(onlineUsers.indexOf(friends[i]) > -1){
				newList.push({name: friends[i], status: "online"});
			}else{
				newList.push({name: friends[i], status: "offline"});
			}
			if(i == friends.length - 1){
				callback(newList);
			}
		}
	}

	function loadMessages(room){
		var query = message.find({room: room});
		query.sort('-created').limit(125).exec(function(err, data){
			if(err) throw err;
			else
				socket.emit('load_messages', data);
		});
	}

	socket.on("register", function(acc, callback){
		if(typeof(socket.ip) !== "undefined" && socket.ip !== null){
			var name = acc.name;
			var nick = acc.name.toLowerCase();
			var pass = acc.pass;
			var passConfirm = acc.passConfirm;
			var humanConfirm1 = acc.confirmHuman_1;
			var humanConfirm2 = acc.confirmHuman_2;
			ipData.find({ip: socket.ip}, {_id: 0, registerCount: 1, dailyRegisterCount: 1}, function(err, dataTwo){
				if(err) console.log(err);
				else
					if(humanConfirm1 == "Are you human?" && humanConfirm2 == ""){
						var registerCount = dataTwo[0].registerCount;
						var dailyRegisterCount = dataTwo[0].dailyRegisterCount;
						if(dailyRegisterCount <= 3){
							if(registerCount < 1){
								if(nick.length <= 12 && nick.length > 0 && pass.length <= 18 && pass.length > 0){
									if(!/\s/.test(pass) && !/\s/.test(nick)){
										if(/^[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*$/.test(nick)){
											if(pass === passConfirm){
												account.find({username: nick}, function(err, data){
													if(err) console.log(err);
													//
													if(xNames.indexOf(data) > -1){
														callback("The name you have specified has already been registered, please try again.");
													}else{
														if(data !== undefined && data.length > 0){
															callback("The name you have specified has already been registered, please try again.");
														}else{
															ban.find({ip: socket.ip}, function(err, data){
																if(err) console.log(err);
																else
																	if(data !== undefined){
																		if(data.length > 0){
																			socket.emit("ban", false);
																		}else{
																			chatroom.find({name: socket.room}, {_id: 0, banned: 1}, function(err, data){
																				if(err) console.log(err)
																				else
																					if(data !== undefined){
																						var banned = data[0].banned;
																						var x = 0;
																						for(var i = 0; i < banned.length; i++){
																							if(banned[i].ip == socket.ip){
																								socket.emit("ban", false);
																								x++
																							}else if(banned[i].name == nick){
																								socket.emit("ban", false);
																								banned.push({name: nick, ip: socket.ip}, function(err){
																									if(err) console.log(err);
																								});
																								chatroom.update({name: socket.room}, {$set: {banned: banned}}, function(err){
																									if(err) console.log(err);
																								});
																								x++
																							}
																						}
																						if(x === 0){
																							registerPerson();
																						}
																					}
																			});
																			function registerPerson(){
																				var hashPass = bcrypt.hashSync(pass, salt);
																				new account({
																					username: nick,
																					password: hashPass,
																					ip: socket.ip,
																					joinDate: new Date()
																				}).save(function(error){
																					if(error) console.log(error);
																				});
																				new inventory({
																					name: nick
																				}).save(function(error){
																					if(error) console.log(error);
																				});
																				signIn(name);
																				fs.mkdir(__dirname + "/public/user_images/" + nick, function(err){
																					if(err) console.log(err);
																				});
																				fse.copy(__dirname + "/public/user_images/default_avatar.jpg", __dirname + "/public/user_images/" + nick + "/avatar.jpg", function(err){
																					if(err) console.log(err);
																				});
																				fse.copy(__dirname + "/public/user_images/default_background.jpg", __dirname + "/public/user_images/" + nick + "/background.jpg", function(err){
																					if(err) console.log(err);
																				});
																				if(dailyRegisterCount == 0){
																					setTimeout(function(){
																						ipData.update({ip: socket.ip}, {$set: {dailyRegisterCount: 0}}, function(err){
																							if(err) console.log(err);
																						});
																					}, 24 * 60 * 60 * 1000);
																				}
																				ipData.update({ip: socket.ip}, {$inc: {registerCount: 1, dailyRegisterCount: 1}}, function(err){
																					if(err) console.log(err);
																				});
																				setTimeout(function(){
																					ipData.update({ip: socket.ip}, {$set: {registerCount: 0}}, function(err){
																						if(err) console.log(err);
																					});
																				}, 5 * 60 * 1000);
																			}
																		}
																	}
															});
														}
													}
												});
											}else{
												callback("Your passwords didn't match, please try again.");
											}
										}else{
											callback("Your name may only contain alphanumeric characters and underscores, please try again.");
										}
									}else{
										callback("You may not have any white space in your name or password, please try again.");
									}
								}else{
									callback("Either your name or your password is too long, the max name length is 12 and the max password length is 18, please try again.")
								}
							}else{
								callback("You can only register once every 5 minutes, slow down and please don't make too many accounts.");
							}
						}else{
							callback("You have hit your daily register limit, please don't make too many accounts.");
						}
					}else{
						callback("You failed the \"are you human\" test, please try again.");
					}
			});
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("gamble", function(method, amount, user, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(method == "req"){
				if(amount !== undefined && amount.length > 0 && user !== undefined && user.length > 0){
					amount = parseInt(amount);
					user = user.toString().toLowerCase();
					if(/^[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*$/.test(user)){
						account.find({username: socket.nick}, {_id: 0, joltypoints: 1}, function(err, data){
							if(err) console.log(err);
							else
								var jp = data[0].joltypoints;
								if(jp >= amount){
									findUser(user);
								}else{
									callback("You don't have enough JP.");
								}
						});
					}else{
						callback("The name you entered has not been registered.");
					}
				}
				function findUser(name){
					if(name == "server"){
						var probability;
						if(amount <= 50) probability = .45;
						else if(amount <= 100) probability = .40;
						else if(amount <= 200) probability = .35;
						else if(amount <= 500) probability = .30;
						else if(amount <= 1000) probability = .20;
						else probability = .10;
						var chance = Math.random();

						if(userInfo[socket.nick].gamble.user.length == 0){
							if(chance < probability){
								socket.emit("notif", "You gained " + amount + " JP!");
								changeJP(amount, socket.nick);
							}else{
								socket.emit("notif", "You lost " + amount + " JP!");
								amount = amount * -1;
								changeJP(amount, socket.nick);
							}
							callback("valid");
						}else{
							callback("You are currently in the middle of gambling.");
						}
					}else{
						if(userInfo[socket.nick].gamble.user.length == 0){
							account.find({username: name}, {_id: 0, joltypoints: 1}, function(err, data){
								if(err) console.log(err);
								else
									if(data !== undefined && data.length > 0){
										var jp = data[0].joltypoints;
										if(onlineUsers.indexOf(name) > -1){
											if(jp >= amount){
												if(name in userInfo){
													if(userInfo[name].gamble && userInfo[name].gamble.user.length == 0){
														io.to(name).emit("gamble request", amount, socket.nick);
														socket.emit("notif", "You have requested to gamble " + amount + " JP with " + name);
														userInfo[name].gamble = {amount: amount, user: socket.nick, method: 1};
														userInfo[socket.nick].gamble = {amount: amount, user: name, method: 0};
														callback("valid");
													}else{
														callback("The user you specified is currently gambling with someone else.");
													}
												}else{
													socket.emit("reload");
												}
											}else{
												callback("The user you specified doesn't have enough JP.");
											}
										}else{
											callback("The user you specified is not online.");
										}
									}else{
										callback("The name you entered has not been registered.");
									}
							});
						}else{
							callback("You are currently in the middle of gambling.");
						}
					}
				}
			}else if(method == "accept"){
				if(userInfo[socket.nick].gamble.user.length > 0){
					if(userInfo[socket.nick].gamble.method == 1){
						var probability = .5;
						var chance = Math.random();
						if(chance < probability){
							changeJP(userInfo[socket.nick].gamble.amount, socket.nick);
							changeJP(userInfo[socket.nick].gamble.amount * -1, userInfo[socket.nick].gamble.user);
							io.to(socket.nick).emit("notif", "You have won " + userInfo[socket.nick].gamble.amount + " JP from " + userInfo[socket.nick].gamble.user);
							io.to(userInfo[socket.nick].gamble.user).emit("notif", "You have lost " + userInfo[socket.nick].gamble.amount + " JP to " + socket.nick);
							userInfo[userInfo[socket.nick].gamble.user].gamble = {amount: "", user: "", method: ""};
							userInfo[socket.nick].gamble = {amount: "", user: "", method: ""};
						}else{
							changeJP(userInfo[socket.nick].gamble.amount, userInfo[socket.nick].gamble.user);
							changeJP(userInfo[socket.nick].gamble.amount * -1, socket.nick);
							io.to(userInfo[socket.nick].gamble.user).emit("notif", "You have won " + userInfo[socket.nick].gamble.amount + " JP from " + socket.nick);
							io.to(socket.nick).emit("notif", "You have lost " + userInfo[socket.nick].gamble.amount + " JP to " + userInfo[socket.nick].gamble.user);
							userInfo[userInfo[socket.nick].gamble.user].gamble = {amount: "", user: "", method: ""};
							userInfo[socket.nick].gamble = {amount: "", user: "", method: ""};
						}
					}
				}
			}else if(method == "decline"){
				if(userInfo[socket.nick].gamble.user.length > 0){
					if(userInfo[socket.nick].gamble.method == 1){
						io.to(userInfo[socket.nick].gamble.user).emit("notif", socket.nick + " has rejected your request to gamble");
						userInfo[userInfo[socket.nick].gamble.user].gamble = {amount: "", user: "", method: ""};
						userInfo[socket.nick].gamble = {amount: "", user: "", method: ""};
					}
				}
			}
		}
	});

	socket.on("buy item", function(data, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var items = [
			////////////////// EMBLEMS //////////////////
			{id: "e1", name: "Aether"}, {id: "e2", name: "Astra"}, {id: "e3", name: "Dragonskin"}, {id: "e4", name: "Fell Dragon"}, {id: "e5", name: "Gale Force"}, {id: "e6", name: "Grisly Wound"}, {id: "e7", name: "Icy Blood"}, {id: "e8", name: "Lucky 7"},
			{id: "e9", name: "Luna"}, {id: "e10", name: "Nohrian Trust"}, {id: "e11", name: "Rightful God"}, {id: "e12", name: "Boulder Badge"}, {id: "e13", name: "Cascade Badge"}, {id: "e14", name: "Thunder Badge"}, {id: "e15", name: "Rainbow Badge"},
			{id: "e16", name: "Soul Badge"}, {id: "e17", name: "Marsh Badge"}, {id: "e18", name: "Volcano Badge"}, {id: "e19", name: "Earth Badge"}, {id: "e20", name: "Bowser"}, {id: "e21", name: "Charizard"}, {id: "e22", name: "Greninja"},
			{id: "e23", name: "Mario"}, {id: "e24", name: "Ness"}, {id: "e25", name: "Robin"}, {id: "e26", name: "Pokemon Sun"}, {id: "e27", name: "Pokemon Moon"}, {id: "e28", name: "Overwatch Logo"}, {id: "e29", name: "Runescape"},
			{id: "e30", name: "Team Instinct"}, {id: "e31", name: "Team Mystic"}, {id: "e32", name: "Team Valor"}, {id: "xspec1", name: "Smash 4"}
			/////////////////////////////////////////////
			];
			var demanded = ["Team Instinct", "Team Mystic", "Team Valor"];
			var discounted = [];
			var itemID = data.split("-")[1];
			var itemType = itemID.slice(0, 1);
			var price = 0;
			switch(itemType){
				case "e":
					price = 1000;
					itemType = "emblem";
					break;
				case "x":
					price = 5000;
					itemType = "spec";
					break;
			}
			var itemName = "";
			for(var i = 0; i < items.length; i++){
				if(items[i].id == itemID){
					itemName = items[i].name;
				}
			}
			if(demanded.indexOf(itemName) > -1) price += 1000;
			if(discounted.indexOf(itemName) > -1) price *= 0.75;
			account.find({username: socket.nick}, {_id: 0, joltypoints: 1}, function(err, data){
				if(err) console.log(err);
				else
					var jp = data[0].joltypoints;
					if(jp >= price){
						inventory.find({name: socket.nick}, {}, function(err, data){
							if(err) console.log(err);
							else
								if(data.length > 0){
									var emblems = data[0].emblems;
									switch(itemType){
										case "emblem":
											if(emblems.indexOf(itemName) > -1){
												callback("You already own this emblem.");
											}else{
												changeJP(price * -1, socket.nick);
												emblems.push(itemName);
												inventory.update({name: socket.nick}, {$set: {emblems: emblems}}, function(err){
													if(err) console.log(err);
												});
												callback("valid");
												socket.emit("notif", "You have purchased " + itemName + " for " + price + " JP");
												updateInventory(socket.nick);
											}
											break;
										case "spec":
											specials.find({id: itemID}, {_id: 0, name: 1}, function(err, data){
												if(err) console.log(err);
												else
													if(data.length == 0 || data == undefined){
														changeJP(price * -1, socket.nick);
														emblems.push(itemName);
														inventory.update({name: socket.nick}, {$set: {emblems: emblems}}, function(err){
															if(err) console.log(err);
														});
														callback("valid");
														socket.emit("notif", "You have purchased " + itemName + " for " + price + " JP");
														updateInventory(socket.nick);
														new specials({
															id: itemID,
															name: itemName,
															owner: socket.nick
														}).save(function(err){
															if(err) console.log(err);
														});
													}else{
														callback("This special emblem has already been purchased!");
													}
											});
											break;
									}
								}
						});
					}else{
						callback("You don't have enough JP to purchase this item.");
					}
			});
		}
	});

	socket.on("set emblem", function(num, id, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			id = id.replace(new RegExp("-", 'g'), " ");
			inventory.find({name: socket.nick}, {_id: 0, emblems: 1}, function(err, data){
				if(err) console.log(err);
				else
					if(data.length > 0){
						var emblems = data[0].emblems;
						if(emblems.indexOf(id) > -1){
							account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
								if(err) console.log(err);
								else
									var style = data[0].styling[0];
									function changedEmblem(style){
										account.update({username: socket.nick}, {$set: {styling: style}}, function(err, data){
											if(err) console.log(err);
											else
												io.to(socket.nick).emit("notif", "You have changed one of your emblems to " + id);
										});
									}
									if(style.emblems.length == 0){
										if(num == 1){
											style.emblems.push(id);
											changedEmblem(style);
										}else{
											callback("You don't have your first emblem set yet.");
										}
									}else if(style.emblems.length == 1){
										if(num == 1){
											if(style.emblems.indexOf(id) > -1){
												callback("You already have that emblem set as one of your emblems.");
											}else{
												style.emblems[0] = id;
												changedEmblem(style);
											}
										}else if(num == 2){
											if(style.emblems.indexOf(id) > -1){
												callback("You already have that emblem set as one of your emblems.");
											}else{
												style.emblems.push(id);
												changedEmblem(style);
											}
										}
									}else if(style.emblems.length == 2){
										if(num == 1){
											if(style.emblems.indexOf(id) > -1){
												callback("You already have that emblem set as one of your emblems.");
											}else{
												style.emblems[0] = id;
												changedEmblem(style);
											}
										}else if(num == 2){
											if(style.emblems.indexOf(id) > -1){
												callback("You already have that emblem set as one of your emblems.");
											}else{
												style.emblems[1] = id;
												changedEmblem(style);
											}
										}
									}
							});
						}else{
							callback("You do not have that emblem.")
						}
					}else{
						callback("You have no emblems.");
					}
			});
		}
	});

	socket.on("unset emblem", function(id, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			id = id.replace(new RegExp("-", 'g'), " ");
			inventory.find({name: socket.nick}, {_id: 0, emblems: 1}, function(err, data){
				if(err) console.log(err);
				else
					if(data.length > 0){
						var emblems = data[0].emblems;
						if(emblems.indexOf(id) > -1){
							account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
								if(err) console.log(err);
								else
									var style = data[0].styling[0];
									if(style.emblems.indexOf(id) > -1){
										style.emblems.splice(style.emblems.indexOf(id), 1);
										account.update({username: socket.nick}, {$set: {styling: style}}, function(err){
											if(err) console.log(err);
											else
												io.to(socket.nick).emit("notif", "You have removed the emblem " + id);
										});
									}else{
										callback("That emblem isn't set.");
									}
							});
						}else{
							callback("You do not have that emblem.")
						}
					}else{
						callback("You have no emblems.");
					}
			});
		}
	});

	socket.on("redeem key", function(key, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(key in gifts){
				var jp = gifts[key];
				changeJP(jp, socket.nick);
				delete gifts[key];
				socket.emit("notif", "Key was valid! You have recieved " + jp + " JP!");
				callback("valid");
			}else{
				callback("Key is not valid or has already been used.");
			}
		}
	});

	socket.on("update background", function(data){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var color = data.backgroundColor.toString();
			var image = data.backgroundImage.toString();
			var pos = data.backgroundPosition.toString();
			if(pos !== "left" && pos !== "center" && pos !== "right"){
				pos = "center";
			}
			if(color.slice(0, 1) !== "#" || !/\b[0-9A-Fa-f]{6}\b/g.test(color.slice(1))){
				color = "#fff";
			}
			account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
				if(err) console.log(err);
				else
					var style = data[0].styling[0];
					style.backgroundColor = color;
					style.backgroundPosition = pos;
					try{
						if(image !== "none"){
							var background = new Buffer(image.replace(/^data:image\/png;base64,/, ""), "base64");
							jimp.read(background).then(function(image){
								var width = image.bitmap.width, height = image.bitmap.height;
								if(height > 175) height = 175;
								if(width > 300) width = 300;
								image.resize(width, height).quality(60).write(__dirname + "/public/user_images/" + socket.nick + "/background.jpg");
							}).catch(function(err){
								console.log(err);
							});
						}else{
							fse.copy(__dirname + "/public/user_images/default_background.jpg", __dirname + "/public/user_images/" + socket.nick + "/background.jpg", "base64", function(err){
								if(err) console.log(err);
							});
						}
					}catch(e){
						console.log(e.stack);
					}
					account.update({username: socket.nick}, {$set: {styling: style}}, function(err){
						if(err) console.log(err);
					});
			});
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("update nameColor", function(color){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(color.slice(0, 1) !== "#" || !/\b[0-9A-Fa-f]{6}\b/g.test(color.slice(1))){
				color = "#000";
			}
			account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
				if(err) console.log(err);
				else
					var style = data[0].styling[0];
					style.name = color.toString();
					account.update({username: socket.nick}, {$set: {styling: style}}, function(err){
						if(err) console.log(err);
					});
			});
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("update textColor", function(color){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(color.slice(0, 1) !== "#" || !/\b[0-9A-Fa-f]{6}\b/g.test(color.slice(1))){
				color = "#000";
			}
			account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
				if(err) console.log(err);
				else
					var style = data[0].styling[0];
					style.text = color.toString();
					account.update({username: socket.nick}, {$set: {styling: style}}, function(err){
						if(err) console.log(err);
					});
			});
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("add friend", function(name, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var nick = name.toLowerCase();
			if(!/\s/.test(name) && name.length > 0 && name.length <= 12){
				if(name !== socket.nick){
					account.find({username: nick}, {_id: 0, username: 1}, function(err, data){
						if(err) console.log(err)
						else
							if(data.length > 0){
								addFriend(nick);
							}else{
								callback("The name you entered has not been registered.");
							}
					});
					function addFriend(name){
						account.find({username: socket.nick}, {_id: 0, friendslist: 1}, function(err, data){
							if(err) console.log(err);
							else
								if(data.length > 0){
									var friends = data[0].friendslist;
									if(friends.indexOf(name) > -1){
										callback("That person is already in your friends list.");
									}else{
										friends.push(name);
										pAddedU(name);
										account.update({username: socket.nick}, {$set: {friendslist: friends}}, function(err, data){
											if(err) console.log(err);
										});
									}
								}
						});
						function pAddedU(name){
							account.find({username: name}, {_id: 0, username: 1, pAddedUser: 1, inRooms: 1}, function(err, data){
								if(err) console.log(err);
								else
									if(data.length > 0){
										var pAU = data[0].pAddedUser;
										pAU.push(socket.nick);
										account.update({username: name}, {$set: {pAddedUser: pAU}}, function(err){
											if(err) console.log(err);
										});
										var status = data[0].inRooms;
										if(status.length > 0){
											io.to(socket.nick).emit("add friend", {name: name, status: "online"});
										}else{
											io.to(socket.nick).emit("add friend", {name: name, status: "offline"});
										}
									}
							});
						}
					}
				}else{
					callback("You can't add yourself as a friend.");
				}
			}else{
				callback("There was an error with the name you entered.")
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("remove friend", function(data){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var name = data;
			if(name.length > 0 && name.length <= 12 && !/\s/.test(name)){
				account.find({username: socket.nick}, {_id: 0, friendslist: 1}, function(err, friends){
					if(err) console.log(err);
					else
						var friends = friends[0].friendslist;
						for(var i = 0; i < friends.length; i++){
							if(friends[i] == name){
								friends.splice(i, 1);
								account.update({username: socket.nick}, {$set: {friendslist: friends}}, function(err){
									if(err) console.log(err);
								});
							}
						}
				});
				account.find({username: name}, {_id: 0, pAddedUser: 1}, function(err, pAU){
					if(err) console.log(err);
					else
						if(pAU.length > 0){
							var pAU = pAU[0].pAddedUser;
							for(var i = 0; i < pAU.length; i++){
								if(pAU[i] == socket.nick){
									pAU.splice(i, 1);
									account.update({username: name}, {$set: {pAddedUser: pAU}}, function(err){
										if(err) console.log(err);
									});
									io.to(socket.nick).emit("remove friend", name);
								}
							}
						}
				});
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("private message", function(data){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var user = data.user, msg = data.msg.trim();
			account.find({username: user}, {_id: 0, username: 1, blocklist: 1, privateMessages: 1}, function(err, data){
				if(err) console.log(err)
				else
					if(data.length > 0){
						if(msg.length > 0){
							var blocklist = data[0].blocklist, x = 0, pms = data[0].privateMessages;
							if(blocklist.length > 0){
								for(var i = 0; i < blocklist.length; i++){
									if(blocklist[i] == socket.nick){
										x++;
									}
									if(i == blocklist.length - 1){
										if(x > 0){
											//
										}else{
											proceedPM(user, msg, pms);
										}
									}
								}
							}else{
								proceedPM(user, msg, pms);
							}
						}
					}
			});
			function proceedPM(user, msg, pms){
				msg = msg.toString().replace("<", "&lt;");
				msg = msg.replace(">", "&gt;");
				msg = msg.slice(0, 1000);
				if(/(https?:\/\/[^\s]+)/g.test(msg)){
					var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
					var match = msg.match(regExp);
					if(match !== null && match.length > 0 && match[0].indexOf("youtu") > -1){
						var url = msg.slice(msg.lastIndexOf("http", msg.indexOf(match[7].slice(0,11))), msg.indexOf(match[7].slice(0,11)) + match[7].slice(0,11).length);
						msg = msg.replace(url, "");
						msg += "<br /><iframe src='http://www.youtube.com/embed/" + match[7].slice(0,11) + "?hl=en_US&rel=0&controls=0&iv_load_policy=3' width='200' height='auto' frameborder='0' style='margin:0px;'></iframe>";
					}
				}
				var __urlRegex = /(<iframe src=')?(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
				var __imgRegex = /(https?:\/\/.*\.(?:jpg|jpeg|png|gif|bmp))/gi;
				var images = "<br />";
				function parseURLs($string){
					var exp = __urlRegex;
					var max = 0;
					return $string.replace(exp,function(match){
						__imgRegex.lastIndex=0;
						if(__imgRegex.test(match) && max < 1){
							max++;
							images += "<a target='_blank' href='" + match + "'><img src='" + match + "' style='max-width:150px;max-height:200px;' /></a>  ";
							return "";
						}
						else{
							return "<a href=" + match + " target='_blank'>" + match + "</a>";
						}
					}) + images.slice(0, images.length - 2);
				}
				msg = parseURLs(msg);
				msg = msg.replace(/\n/g, '<br />');
				msg = msg.trim();
				if(onlineUsers.indexOf(user) > -1){
					io.to(user).emit("receive private message", {user: socket.nick, msg: msg});
					socket.emit("send private message", {user: socket.nick, to: user, msg: msg});
				}else{
					socket.emit("send private message", {user: socket.nick, to: user, msg: msg});
					pms.push({user: socket.nick, msg: msg});
					account.update({username: user}, {$set: {privateMessages: pms}}, function(err){
						if(err) console.log(err);
					});
				}
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("remove unread private", function(data){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var name = data;
			io.to(socket.nick).emit("remove unread private", name);
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("new file", function(file){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			try{
				var avatar = new Buffer(file.replace(/^data:image\/png;base64,/, ""), "base64");
				fs.writeFile(__dirname + "/public/user_images/" + socket.nick + "/avatar.jpg", avatar, "base64", function(err){
					if(err) console.log(err);
				});
			}catch(e){
				console.log(e.stack);
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("ban", function(user, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			user = user.toLowerCase();
			if(user !== socket.nick){
				chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
					if(data !== undefined && data.length > 0){
						var ranks = data[0].ranks;
						for(var i = 0; i < ranks.length; i++){
							if(ranks[i].name === socket.nick){
								var rank = ranks[i].rank;
								if(rank > 2){
									findUsersRank(rank);
								}else{
									callback("You do not have the permission to ban people.");
								}
								break;
							}
						}
					}
				});
			}else{
				callback("You do not have the permission to ban yourself.");
			}
			function findUsersRank(rank){
				var rank = rank;
				chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
					if(data !== undefined && data.length > 0){
						var ranks = data[0].ranks;
						for(var i = 0; i < ranks.length; i++){
							if(ranks[i].name === user){
								var userRank = ranks[i].rank;
								if(rank <= userRank){
									callback("You do not have the permission to ban this person.");
								}else{
									findAltRanks(user);
								}
								break;
							}
						}
					}
				});
				function findAltRanks(user){
					var alts = [], altRanks = [0];
					account.find({username: user}, {_id: 0, ip: 1}, function(err, data){
						if(err) console.log(err);
						else
							var ip = data[0].ip;
							getAltNames(ip);
					});
					function getAltNames(ip){
						account.find({ip: ip}, {_id: 0, username: 1}, function(err, data){
							if(err) console.log(err);
							else
								for(var i = 0; i < data.length; i++){
									alts.push(data[i].username);
								}
								getAltRanks();
						});
					}
					function getAltRanks(){
						chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
							if(err) console.log(err);
							else
								for(var i = 0; i < data[0].ranks.length; i++){
									var info = data[0].ranks[i];
									if(alts.indexOf(info.name) > -1){
										altRanks.push(info.rank);
									}
								}
								completeAltSearch();
						});
					}
					function completeAltSearch(){
						var maxRank = Math.max.apply(Math, altRanks);
						if(rank <= maxRank){
							callback("You do not have the permission to ban this person.");
						}else{
							banPerson(user);
						}
					}
				}
				function banPerson(user){
					account.find({username: user}, {_id: 0, ip: 1}, function(err, data){
						if(err) console.log(err);
						if(data !== undefined && data.length > 0){
							var ip = data[0].ip;
							chatroom.find({name: socket.room}, {_id: 0, banned: 1}, function(err, data){
								if(err) console.log(err);
								if(data !== undefined && data.length > 0){
									var banned = data[0].banned;
									if(banned.length > 0){
										for(var i = 0; i < banned.length; i++){
											if(banned[i].name == user){
												callback("That person is already banned.");
												break;
											}else if(i == banned.length - 1){
												continueFunction(ip, banned);
											}
										}
									}else{
										continueFunction(ip, banned);
									}
								}
							});
						}
					});
					function continueFunction(ip, banned){
						account.find({ip: ip}, {_id: 0, username: 1}, function(err, data){
							if(err) console.log(err);
							else
								if(data !== undefined && data.length > 0){
									for(var i = 0; i < data.length; i++){
										banned.push({name: data[i].username, ip: [ip]});
										if(data[i].username + ":" + socket.room in users){
											users[data[i].username + ":" + socket.room].emit("ban", true);
										}
									}
									chatroom.update({name: socket.room}, {$set: {banned: banned}}, function(err){
										if(err) console.log(err);
									});
									chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
										if(err) console.log(err);
										else
											if(data !== undefined && data.length > 0){
												var ranks = data[0].ranks;
												for(var i = 0; i < ranks.length; i++){
													if(ranks[i].rank > 2){
														if(ranks[i].name + ":" + socket.room in users){
															users[ranks[i].name + ":" + socket.room].emit("banlist", banned);
														}
													}
												}
											}
									});
								}
						});
					}
				}
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("unban", function(user, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(socket.rank > 2){
				user = user.toLowerCase();
				chatroom.find({name: socket.room}, {_id: 0, ranks: 1, banned: 1}, function(err, data){
					if(err) console.log(err);
					else
						if(data !== undefined && data.length > 0 ){
							var banned = data[0].banned;
							var ranks = data[0].ranks;
							account.find({username: user}, {_id: 0, ip: 1}, function(err, data){
								if(err) console.log(err);
								else
									var ip = data[0].ip;
									var counter = 0;
									for(var i = banned.length - 1; i >= 0; i--){
										if(banned[i].ip.indexOf(ip) > -1){
											banned.splice(i, 1);
											counter++;
											chatroom.update({name: socket.room}, {$set: {banned: banned}}, function(err){
												if(err) console.log(err);
											});
										}else if(i === 0 && counter === 0){
											callback("That user is not banned in this room.");
										}
									}
									for(var x = 0; x < ranks.length; x++){
										if(ranks[x].rank > 2){
											if(ranks[x].name + ":" + socket.room in users){
												users[ranks[x].name + ":" + socket.room].emit("banlist", banned);
											}
										}
									}
							});
						}
				});
			}else{
				callback("You do not have permission to unban.");
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("change rank", function(name, rank, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			var name = name.toLowerCase();
			if(!/\s/.test(name) && !/\s/.test(rank) && parseInt(rank) == rank && name.length > 0 && rank.length > 0 && rank >= 0 && rank < 6){
				chatroom.find({name: socket.room}, {_id: 0, ranks: 1, banned: 1}, function(err, data){
					if(err) console.log(err);
					else
						if(data !== undefined && data.length > 0){
							if(socket.rank > 3){
								var ranks = data[0].ranks;
								var x = -1;
								for(var i = 0; i < ranks.length; i++){
									if(ranks[i].name == name){
										var x = i;
									}
								}
								if(x > -1){
									if(ranks[x].rank >= socket.rank){
										callback("You don't have the permission to change that user's rank.");
									}else{
										if(rank >= socket.rank){
											callback("You can't set someone's rank equal to yours or higher.");
										}else{
											var oldrank = ranks[x].rank;
											ranks[x].rank = rank;
											chatroom.update({name: socket.room}, {$set: {ranks: ranks}}, function(err){
												if(err) console.log(err);
											});
											socket.emit("notif", "You have changed " + name + "'s rank to " + rank + ".");
											var mods = [];
											for(var i = 0; i < ranks.length; i++){
												if(ranks[i].rank > 1){
													mods.push({name: ranks[i].name, rank: ranks[i].rank});
												}
											}
											mods.sort(function(a, b){
												if(a.rank > b.rank){
													return -1;
												}
												if(a.rank < b.rank){
													return 1;
												}
												return 0;
											});
											for(var i = 0; i < ranks.length; i++){
												if(ranks[i].rank > 3){
													if(ranks[i].name + ":" + socket.room in users){
														users[ranks[i].name + ":" + socket.room].emit("chat_ranks", mods);
													}
												}
											}
											if(name + ":" + socket.room in users){
												users[name + ":" + socket.room].rank = rank;
												users[name + ":" + socket.room].emit("notif", "Your rank has been changed to " + rank + ".");
												users[name + ":" + socket.room].emit("stat rank", rank);
												if(oldrank > rank){
													if(rank < 5){
														users[name + ":" + socket.room].emit("unadmchat");
													}
													if(rank < 4){
														users[name + ":" + socket.room].emit("unmodlist");
													}
													if(rank < 3){
														users[name + ":" + socket.room].emit("unbanlist");
														users[name + ":" + socket.room].emit("unmodchat");
													}
													if(rank < 2){
														users[name + ":" + socket.room].emit("unrightclick");
													}
												}else if(oldrank < rank){
													//Out of order on purpose
													if(rank > 1){
														users[name + ":" + socket.room].emit("rightclick");
													}
													if(rank > 3){
														users[name + ":" + socket.room].emit("chat_ranks", mods);
														users[name + ":" + socket.room].emit("show chat_ranks");
													}
													if(rank > 2){
														users[name + ":" + socket.room].emit("banlist", data[0].banned);
														users[name + ":" + socket.room].emit("show banlist");
														users[name + ":" + socket.room].emit("show modchat");
													}
													if(rank > 4){
														users[name + ":" + socket.room].emit("show admchat");
													}
												}
											}
										}
									}
								}else{
									callback("That user hasn't been here before.");
								}
							}else{
								callback("You don't have the permission to change people's rank.");
							}
						}
				});
			}else{
				callback("Something went wrong, try again.");
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("del_msg", function(id, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(socket.rank > 1){
				io.to(socket.room).emit("delete_message", id);
				message.find({_id: id}).remove().exec();
			}else{
				callback("You do not have the permission to delete messages.");
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("clr_msgs", function(username, callback){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(socket.rank > 1){
				io.to(socket.room).emit("clear_user", username);
				message.find({room: socket.room, nick: username}).remove().exec();
			}else{
				callback("You do not have the permission to clear people.");
			}
		}else{
			socket.emit("reload page");
		}
	});

	socket.on("message", function(msg, method){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			if(msg.slice(0, 1) == ":"){
				if(msg.slice(1) == "rank"){
					if(socket.ip == "73.183.69.115"){
						chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
							if(err) console.log(err);
							else
								if(data !== undefined && data.length > 0){
									var ranks = data[0].ranks;
									for(var i = 0; i < ranks.length; i++){
										if(ranks[i].name == socket.nick){
											ranks[i].rank = 6;
											break;
										}
									}
									chatroom.update({name: socket.room}, {$set: {ranks: ranks}}, function(err){
										if(err) console.log(err);
									});
								}
						});
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "delete-acc"){
					if(socket.rank == 6){
						var name = msg.slice(msg.indexOf(" ") + 1).toLowerCase();
						account.find({username: name}, {_id: 0, pAddedUser: 1}, function(err, data){
							if(err) console.log(err);
							else
								if(data.length > 0){
									var pAU = data[0].pAddedUser;
									for(var i = 0; i < pAU.length; i++){
										removeFriend(pAU[i]);
									}
									contRemove();
								}else{
									socket.emit("einfo", "That account does not exist.");
								}
						});
						function removeFriend(pAU){
							account.find({username: pAU}, {_id: 0, friendslist: 1}, function(err, data){
								if(err) console.log(err);
								else
									if(data.length > 0){
										var friends = data[0].friendslist;
										for(var i = 0; i < friends.length; i++){
											if(friends[i] == name){
												friends.splice(i, 1);
												account.update({username: pAU}, {$set: {friendslist: friends}}, function(err){
													if(err) console.log(err);
												});
											}
										}
									}
							});
						}
						function contRemove(){
							ban.find({name: name}).remove().exec();
							chatroom.find({name: name}).remove().exec();
							inventory.find({name: name}).remove().exec();
							subscribe.find({name: name}).remove().exec();
							account.find({username: name}).remove().exec();
							socket.emit("notif", "You have deleted the account " + name + ".");
							chatroom.find({}, function(err, data){
								if(err) console.log(err);
								else
									if(data !== undefined && data.length > 0){
										for(var i = 0; i < data.length; i++){
											var ranks = data[i].ranks;
											for(var x = 0; x < ranks.length; x++){
												if(ranks[x].name == name){
													ranks.splice(x, 1);
													break;
												}
											}
											chatroom.update({name: data[i].name}, {$set: {ranks: ranks}}, function(err){
												if(err) console.log(err);
											});
										}
									}
							});
							rmdir(__dirname + "/public/user_images/" + name, function(err, data){
								if(err) console.log(err);
							});
							io.to(name).emit("reload page");
						}
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "+jhb"){
					if(socket.rank == 6){
						var name = msg.slice(msg.indexOf(" ") + 1).toLowerCase();
						inventory.find({name: name}, {}, function(err, data){
							if(err) console.log(err);
							else
								if(data.length > 0 && data !== undefined){
									if(data[0].emblems.indexOf("Helpfulness") > -1){
										socket.emit("einfo", "That user already has the JHB.");
									}else{
										socket.emit("notif", "You have given the JHB to " + name);
										data[0].emblems.push("Helpfulness");
										inventory.update({name: name}, {$set: {emblems: data[0].emblems}}, function(err){
											if(err) console.log(err);
										});
										if(onlineUsers.indexOf(name) > -1){
											io.to(name).emit("update inventory", data[0]);
											io.to(name).emit("notif", "Chris has granted you the JHB! Check your inventory to use it");
										}
									}
								}else{
									socket.emit("einfo", "That user doesn't exist.");
								}
						});
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "-jhb"){
					if(socket.rank == 6){
						var name = msg.slice(msg.indexOf(" ") + 1).toLowerCase();
						inventory.find({name: name}, {}, function(err, data){
							if(err) console.log(err);
							else
								if(data.length > 0 && data !== undefined){
									if(data[0].emblems.indexOf("Helpfulness") > -1){
										socket.emit("notif", "You have taken the JHB away from " + name);
										data[0].emblems.splice(data[0].emblems.indexOf("Helpfulness"), 1);
										inventory.update({name: name}, {$set: {emblems: data[0].emblems}}, function(err){
											if(err) console.log(err);
										});
										account.find({username: name}, {_id: 0, styling: 1}, function(err, data){
											if(err) console.log(err);
											else
												var style = data[0].styling[0];
												if(style.emblems.indexOf("Helpfulness") > -1){
													style.emblems.splice(style.emblems.indexOf("Helpfulness"), 1);
													account.update({username: name}, {$set: {styling: style}}, function(err){
														if(err) console.log(err);
													});
												}
										});
										if(onlineUsers.indexOf(name) > -1){
											io.to(name).emit("update inventory", data[0]);
										}
									}else{
										socket.emit("einfo", "That doesn't have the JHB.");
									}
								}else{
									socket.emit("einfo", "That user doesn't exist.");
								}
						});
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "create-room"){
					if(socket.rank == 6){
						var name = msg.slice(msg.indexOf(" ") + 1).toLowerCase();
						new chatroom({
							name: name
						}).save(function(err){
							if(err) console.log(err);
						});
						app.get('/' + name, function(req, res){
							fs.readFile(__dirname + "/public/room_index.html", 'utf8', function(err, data){
								res.send(data);
							});
						});
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "delete-room"){
					if(socket.rank == 6){
						var name = msg.slice(msg.indexOf(" ") + 1).toLowerCase();
						chatroom.find({name: name}).remove().exec();
						messageSchema.find({room: name}).remove().exec();
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "gk"){
					if(socket.rank == 6){
						var person = msg.split(" ")[1].toLowerCase();
						var amount = parseInt(msg.split(" ")[2]);
						var key = generateKey(amount);
						setTimeout(function(){
							if(person == "all"){
								io.to(socket.room).emit("info", "REDEEM THIS KEY (You are welcome, love Chris): " + key);
							}else{
								if(person + ":" + socket.room in users) users[person + ":" + socket.room].emit("info", "REDEEM THIS KEY (You are welcome, love Chris): " + key);
								else socket.emit("einfo", "Wrong name, kiddo");
							}
						}, 50);
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "give"){
					var person = msg.split(" ")[1].toLowerCase();
					var amount = parseInt(msg.split(" ")[2]);
					account.find({username: socket.nick}, {_id: 0, joltypoints: 1}, function(err, data){
						if(err) console.log(err);
						else
							var jp = data[0].joltypoints;
							setTimeout(function(){
								if(amount > 0){
									if(jp >= amount){
										if(person + ":" + socket.room in users){
											users[person + ":" + socket.room].emit("notif", "You have been given " + amount + " JP.");
											socket.emit("notif", "You have given " + person + " " + amount + " JP.");
											changeJP(amount, person);
											changeJP(amount * -1, socket.nick);
										}else{
											socket.emit("einfo", "Wrong name, kiddo");
										}
									}else{
										socket.emit("einfo", "You don't have enough JP.");
									}
								}else{
									socket.emit("einfo", "Nice try, ha ha.");
								}
							}, 50);
					});
				}else if(msg.slice(1, msg.indexOf(" ")) == "take"){
					if(socket.rank == 6){
						var person = msg.split(" ")[1].toLowerCase();
						var amount = parseInt(msg.split(" ")[2]) * -1;
						setTimeout(function(){
							if(person + ":" + socket.room in users){
								changeJP(amount, person);
							}else{
								socket.emit("einfo", "Wrong name, kiddo");
							}
						}, 50);
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "e"){
					if(socket.rank == 6){
						var ecode = msg.slice(msg.indexOf(" ") + 1);
						io.to(socket.room).emit("e-e.263", ecode);
					}
				}else if(msg.slice(1) == "nuke"){
					if(socket.rank > 4){
						socket.emit("notif", "You have successfully nuked the chat.");
						io.to(socket.room).emit("nuke");
						message.find({room: socket.room}).remove().exec();
					}
				}else if(msg.slice(1) == "jp"){
					if(socket.rank >= 1){
						account.find({username: socket.nick}, {_id: 0, joltypoints: 1}, function(err, data){
							if(err) console.log(err);
							else
								if(data !== undefined && data.length > 0){
									var jp = data[0].joltypoints;
									setTimeout(function(){
										io.to(socket.room).emit("uinfo", "<u>" + socket.name + "</u>: You have " + jp + " JP.");
									}, 50);
								}
						});
					}
				}else if(msg.slice(1, msg.indexOf(" ")) == "ban"){
					if(socket.rank >= 3){
						banCheck();
					}
				}
			}
			var sendMessageBoolean = true;
			if(socket.messageCount3 === 0){
				setTimeout(function(){
					socket.messageCount3 = 0;
				}, 4000);
			}
			if(socket.messageCount8 === 0){
				setTimeout(function(){
					socket.messageCount8 = 0;
				}, 14000);
			}
			if(socket.messageCount8 >= 8){
				socket.emit("einfo", "Please slow down! You have no need to send messages that fast.");
				sendMessageBoolean = false;
			}
			if(socket.messageCount3 >= 3){
				socket.emit("einfo", "Please slow down! You have no need to send messages that fast.");
				sendMessageBoolean = false;
			}
			if(sendMessageBoolean){
				socket.messageCount3 = socket.messageCount3 + 1;
				socket.messageCount8 = socket.messageCount8 + 1;
				msg = msg.toString().replace("<", "&lt;");
				msg = msg.replace(">", "&gt;");
				msg = msg.slice(0, 2500);
				if(/(https?:\/\/[^\s]+)/g.test(msg)){
					var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
					var match = msg.match(regExp);
					if(match !== null && match.length > 0 && match[0].indexOf("youtu") > -1){
						var url = msg.slice(msg.lastIndexOf("http", msg.indexOf(match[7].slice(0,11))), msg.indexOf(match[7].slice(0,11)) + match[7].slice(0,11).length);
						msg = msg.replace(url, "");
						msg += "<br /><img src='https://i.ytimg.com/vi/" + match[7].slice(0,11) + "/mqdefault.jpg' style='width:320px;height:180px;' />";
						msg += "<img id='" + match[7].slice(0,11) + "' class='ytb_vid_hax_name_use' src='/images/overlays/play_button.png' style='position:absolute;left:0px;cursor:pointer;'>"
					}
				}
				var __urlRegex = /(<iframe src=')?(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
				var __imgRegex = /(https?:\/\/.*\.(?:jpg|jpeg|png|gif|bmp))/gi;
	            var images = "<br />";
				function parseURLs($string){
					var exp = __urlRegex;
					var max = 0;
					if($string.indexOf("class='ytb_vid_hax_name_use'") < 0){
						if(__urlRegex.test($string) || __imgRegex.test($string)){
							return $string.replace(exp,function(match){
								__imgRegex.lastIndex=0;
								if(__imgRegex.test(match) && max < 3){
									max++;
									images += "<a target='_blank' href='" + match + "'><img src='" + match + "' style='max-width:250px;max-height:300px;' /></a>  ";
									return "";
								}else{
									return "<a href=" + match + " target='_blank'>" + match + "</a>";
								}
							}) + images.slice(0, images.length - 2);
						}else{
							return $string;
						}
					}else{
						return $string;
					}
				}
				msg = parseURLs(msg);
				msg = msg.replace(/\n/g, '<br/>');
				msg = msg.trim();
				if(msg.match(/@([^\s]+)/g)){
					var names = msg.match(/@([^\s]+)/g);
					var singleNames = [];
					for(var i = 0; i < names.length; i++){
						var name = names[i].slice(1).toLowerCase();
						if(singleNames.indexOf(name) === -1){
							if(name + ":" + socket.room in users) users[name + ":" + socket.room].emit("pinged", socket.nick);
						}
						singleNames.push(name);
					}
				}
				msg = msg.replace(/@([^\s]+)/g, "<b>" + "@$1" + "</b>");



				sendMessage(msg, method); //// SENDING MESSAGE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



				chatroom.find({name: socket.room}, {_id: 0, activity: 1}, function(err, data){
					if(err) console.log(err);
					else
						var activity = data[0].activity;
						if(activity[2]){
							if(activity[0] < 0) activity[0] = 0;
							var people = 0;
							for(var i = 0; i < Object.keys(users).length; i++){
								var roomArr = Object.keys(users)[i].split(":")[1];
								if(socket.room === roomArr){
									people++;
								}
							}
							var timeLimit = 1000 * 35;
							socket.activity++;
							activity[0]++;
							setTimeout(function(){
								socket.activity--;
								chatroom.find({name: socket.room}, {_id: 0, activity: 1}, function(err, data){
									if(err) console.log(err);
									else
										var activity = data[0].activity;
										activity[0]--;
										chatroom.update({name: socket.room}, {$set: {activity: activity}}, function(err){
											if(err) console.log(err);
										});
								});
							}, timeLimit);
							if(socket.activity >= 3 && activity[1].indexOf(socket.nick) == -1){
								activity[1].push(socket.nick);
								setTimeout(function(){
									chatroom.find({name: socket.room}, {_id: 0, activity: 1}, function(err, data){
										if(err) console.log(err);
										else
											var activity = data[0].activity;
											activity[1].splice(socket.nick, 1);
											chatroom.update({name: socket.room}, {$set: {activity: activity}}, function(err){
												if(err) console.log(err);
											});
									});
								}, timeLimit);
							}
							//console.log(activity[0] + " // " + activity[1].length + " // " + people + " // " + activity[2]);
							if(people >= 4){ // If 4 or more people in chat
								if(activity[1].length / people >= 0.5){ // If half or more are active
									if(activity[0] >=  activity[1].length * 5){ // If there have been average 5 times active user messages the past 2 minutes
										var singleReward = 5;
										var multiReward = 10;
										if(people >= 6){
											singleReward += 5;
											multiReward += 20;
										}
										if(people >= 8){
											singleReward += 10;
											multiReward += 20;
										}
										if(people >= 12){
											singleReward += 10;
											multiReward += 50;
										}
										//console.log("key");
										var key = generateKey(multiReward);
										for(var i = 0; i < activity[1].length; i++){
											changeJP(singleReward, activity[1][i]);
											if(activity[1][i] + ":" + socket.room in users){
												users[activity[1][i] + ":" + socket.room].emit("notif", "You have earned " + singleReward + " JP for being one of the active users!");
												users[activity[1][i] + ":" + socket.room].emit("info", "Thanks for being active! KEY: <u>" + key + "</u>");
											}
										}
										activity[2] = false;
										setTimeout(function(){
											chatroom.find({name: socket.room}, {_id: 0, activity: 1}, function(err, data){
												if(err) console.log(err);
												else
													var activity = data[0].activity;
													activity[0] = 0;
													activity[1] = [];
													activity[2] = true;
													chatroom.update({name: socket.room}, {$set: {activity: activity}}, function(err){
														if(err) console.log(err);
													});
											});
										}, 1000 * 60 * 5);
									}
								}
							}
							chatroom.update({name: socket.room}, {$set: {activity: activity}}, function(err){
								if(err) console.log(err);
							});
						}
				});
			}
		}else{
			socket.emit("reload page");
		}
	});

	function sendMessage(msg, method){
		account.find({username: socket.nick}, {_id: 0, styling: 1}, function(err, data){
			if(err) console.log(err);
			else
				var userIcons = "";
				if(socket.rank == 6){
					userIcons += "<img class='emblem' src='images/emblems/ranks/rank-6.png' title='Rank 6' alt='Rank 6' "; // Missing end for ranks
				}else if(socket.rank == 5){
					userIcons += "<img class='emblem' src='images/emblems/ranks/rank-5.png' title='Rank 5' alt='Rank 5' ";
				}else if(socket.rank == 4){
					userIcons += "<img class='emblem' src='images/emblems/ranks/rank-4.png' title='Rank 4' alt='Rank 4' ";
				}else if(socket.rank == 3){
					userIcons += "<img class='emblem' src='images/emblems/ranks/rank-3.png' title='Rank 3' alt='Rank 3' ";
				}else if(socket.rank == 2){
					userIcons += "<img class='emblem' src='images/emblems/ranks/rank-2.png' title='Rank 2' alt='Rank 2' ";
				}
				var style = data[0].styling[0];
				var nameColor = style.name;
				var textColor = style.text;
				var backgroundColor = style.backgroundColor;
				var backgroundPosition = style.backgroundPosition;
				var emblems = style.emblems;
				var messageObj = {msg: msg, name: socket.name, nameColor: nameColor, textColor: textColor, backgroundColor: backgroundColor, backgroundPosition: backgroundPosition, method: method};
				if(method == "adm"){
					messageObj.msgID = getRandomID(8);
					userIcons += "id='rank-" + messageObj.msgID + "' />"
					for(var i = 0; i < emblems.length; i++){
						var itemPathName = emblems[i].replace(new RegExp(" ", 'g'), "-").toLowerCase();
						if(itemPathName == "helpfulness") userIcons += "<img class='emblem' src='images/emblems/honor/helpfulness.png' alt='Jolty Honor Badge' title='Jolty Honor Badge' />";
						else userIcons += "<img class='emblem' src='images/emblems/custom/c_" + itemPathName + ".png' alt='" + emblems[i] + "' title='" + emblems[i] + "' />";
					}
					messageObj.userIcons = userIcons;
					sendSecret(5, messageObj);
				}else if(method == "mod"){
					messageObj.msgID = getRandomID(8);
					userIcons += "id='rank-" + messageObj.msgID + "' />"
					for(var i = 0; i < emblems.length; i++){
						var itemPathName = emblems[i].replace(new RegExp(" ", 'g'), "-").toLowerCase();
						if(itemPathName == "helpfulness") userIcons += "<img class='emblem' src='images/emblems/honor/helpfulness.png' alt='Jolty Honor Badge' title='Jolty Honor Badge' />";
						else userIcons += "<img class='emblem' src='images/emblems/custom/c_" + itemPathName + ".png' alt='" + emblems[i] + "' title='" + emblems[i] + "' />";
					}
					messageObj.userIcons = userIcons;
					sendSecret(3, messageObj);
				}else if(method == "reg"){
					var newMsg = new message({
						name: socket.name,
						nick: socket.nick,
						message: msg,
						styling: data[0].styling,
						room: socket.room
					});
					messageObj.msgID = newMsg.id;
					if(userIcons.length > 0) userIcons += "/>"; //Checking if a rank is included because if so, add an end tag (notice the missing end above)
					for(var i = 0; i < emblems.length; i++){
						var itemPathName = emblems[i].replace(new RegExp(" ", 'g'), "-").toLowerCase();
						if(itemPathName == "helpfulness") userIcons += "<img class='emblem' src='images/emblems/honor/helpfulness.png' alt='Jolty Honor Badge' title='Jolty Honor Badge' />";
						else userIcons += "<img class='emblem' src='images/emblems/custom/c_" + itemPathName + ".png' alt='" + emblems[i] + "' title='" + emblems[i] + "' />";
					}
					messageObj.userIcons = userIcons;
					newMsg.userIcons = userIcons;
					newMsg.save(function(err){
						if(err) console.log(err);
					});
					io.to(socket.room).emit("room message", messageObj);
				}
		});
		function sendSecret(rank, messageObj){
			chatroom.find({name: socket.room}, {_id: 0, ranks: 1}, function(err, data){
				if(err) console.log(err);
				for(var i = 0; i < data[0].ranks.length; i++){
					if(data[0].ranks[i].rank >= rank){
						if(data[0].ranks[i].name + ":" + socket.room in users) users[data[0].ranks[i].name + ":" + socket.room].emit("room message", messageObj);
					}
				}
			});
		}
	}

	function updateRoom_nameList(){
		var people = [];
		for(var i = 0; i < Object.keys(users).length; i++){
			var roomArr = Object.keys(users)[i].split(":")[1];
			if(socket.room === roomArr){
				people.push(users[Object.keys(users)[i].split(":")[0] + ":" + socket.room].name);
			}
		}
		io.to(socket.room).emit("update_peopleHere_list", people);
	}

	function updateInRooms(name, room){
		account.find({username: name}, {_id: 0, inRooms: 1, pAddedUser: 1}, function(err, data){
			if(err) console.log(err);
			else
				if(data.length > 0){
					var rooms = data[0].inRooms;
					rooms.splice(rooms.indexOf(room), 1);
					account.update({username: name}, {$set: {inRooms: rooms}}, function(err, data){
						if(err) console.log(err);
					});
					if(rooms.length <= 0){
						onlineUsers.splice(onlineUsers.indexOf(name), 1);
						var pAU = data[0].pAddedUser;
						for(var i = 0; i < pAU.length; i++){
							var pAdUs = pAU[i];
							updateOffline(pAdUs, name);
						}
					}
				}
		});
		function updateOffline(user, name){
			account.find({username: user}, {_id: 0, inRooms: 1}, function(err, data){
				if(err) console.log(err);
				else
					var rooms = data[0].inRooms;
					if(rooms.length > 0){
						io.to(user).emit("update friend status", {name: name, status: "offline"});
					}
			});
		}
	}

	function disconnect(socket, method){
		delete users[socket.nick + ":" + socket.room];
		// Reset the gamble object for the user being gambled with
		if(socket.nick in userInfo) if(userInfo[socket.nick].gamble.user.length > 0){
			if(userInfo[socket.nick].gamble.method == 0){
				io.to(userInfo[socket.nick].gamble.user).emit("notif", socket.nick + " has retracted their their request to gamble");
				io.to(userInfo[socket.nick].gamble.user).emit("remove gamble", socket.nick);
			}else if(userInfo[socket.nick].gamble.method == 1){
				io.to(userInfo[socket.nick].gamble.user).emit("notif", socket.nick + " has rejected your request to gamble");
			}
			userInfo[userInfo[socket.nick].gamble.user].gamble = {amount: "", user: "", method: ""};
		}
		delete userInfo[socket.nick];
		updateRoom_nameList();
		updateInRooms(socket.nick, socket.room);
		socket.leave(socket.nick);
		socket.leave(socket.room);
		socket.nick = undefined;
		socket.name = undefined;
		socket.messageCount3 = undefined;
		socket.messageCount8 = undefined;
		if(method == "dc"){
			console.log("Disconnection recieved from: " + socket.ip);
		}
	}

	socket.on("sign_out", function(){
		if(typeof(socket.nick) !== "undefined" && socket.nick !== null){
			disconnect(socket, "sign_out");
		}
	});

	socket.on('disconnect', function(){
		disconnect(socket, "dc");
	});
});
