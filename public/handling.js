(function(){
	$(document).ready(function(){
		var socket = io();
		var mobile = false;
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
			$("#load").prepend("This chat won't work for mobile if you're connected to 4G or 3G. Sorry for the inconvenience.");
			mobile = true;
			var infostyle = "#informWrap{width:100%;top:300px;left:0px}#inform{width:100%;font-size:30pt;}#sign_in_form{width:100%;font-size:30pt;}#register_form{width:100%;font-size:30pt;top:400px;left:0px;}";
			infostyle += ".checkinp{width:35px;height:35px;}.content{font-size:50pt;}#chat_interface{height:80px;}#chat{height:calc(100% - 100px);}#message_form{height:60px;font-size:50pt;}";
			infostyle += ".userIcons{left:90px;}.avatar{width:80px;height:80px;}#toolbar{height:100px;}.toolButton_drop{font-size:45pt;width:500px;top:300%;}#notificationButton_drop, #messageButton_drop{width:500px;height:800px;}";
			infostyle += "#chatWrap{height:calc(100% - 110px);}.mod{font-size:30pt;}";
			$("head").append("<style type='text/css'>" + infostyle + "</style>");
			$(".textinp").css("width", "75%");
			$(".textinp").css("height", "35px");
			$(".textinp").css("font-size", "20pt");
			$(".subinp").css("height", "relative");
			$(".subinp").css("width", "relative");
			$(".subinp").css("font-size", "25pt");
			$("#dalynxButton").attr("src", "images/icons/X_Logo_large.png")
			$(".toolButton").attr("width", "90px");
			$(".toolButton").attr("height", "90px");
			$(".soundButton").attr("width", "97.5px");
			$("#notificationButton").attr("width", "37.5px");
			$("#toolbar_roomName").css("font-size", "60pt");
			$("#toolbar_roomName").css("left", "95px");
			$(".chat_module").css("width", "98%");
			$(".chat_module").css("top", "175px");
			$(".chat_module").css("left", "0px");
			$(".chat_module").css("font-size", "50pt");
			$("input[type='text']").css("width", "250px");
			$("input[type='text']").css("font-size", "50pt");
			$("input[type='number']").css("width", "100px");
			$("input[type='number']").css("font-size", "50pt");
			$("input[type='file']").css("font-size", "25pt");
			$("select").css("font-size", "25pt");
			$(".buy").css("width", "60px");
			$(".buy").css("height", "60px");
			$("#redeem_input").css("width", "75%");
		}
		chatName = window.location.pathname.slice(1), missedPMs = [], newMessage = new Audio("sound/newMessage.mp3"), newPrivate = new Audio("sound/newPrivate.mp3"), newPing = new Audio("sound/newPing.mp3");
		var modChat = false, admChat = false;

		/*######################################################## Client Side ########################################################*/
		$("#room_name").html(chatName);
		$("#toolbar_roomName").html("<b>" + chatName + "</b>");
		$("#confirm_human2").hide();
		if(localStorage.name !== undefined && localStorage.name.length > 0 && localStorage.auth !== undefined && localStorage.auth.length > 0){
			socket.emit("sign_in", {name: localStorage.name, pass: localStorage.auth, checked: true, method: "keep_signed_in"}, function(error){
				if(error !== undefined && error.length > 0){
					if(error === "banned")
						$("#wrapper").html("<center>You have been banned for breaking the rules.</center>");
					else
						$("#sign_in_err").html("<span class='temp_err_signIn' style='display:block;background:maroon;width:100%;color:red;'><b>" + error + "</b></span>")
						$("#sign_in_err").css("display", "block")
						$("#load").hide()
						$("#homeScreen").css("display", "block");
				}
			});
		}else{
			$("#load").hide();
			$("#homeScreen").css("display", "block");
		}
		if(localStorage.chatSound == undefined){
			localStorage.chatSound = "on";
		}
		
		$("#fullChat").click(function(){
			var win = window.open(window.location.href, '_blank');
			win.focus();
		});
		
		$("#dalynxButton").click(function(){
			var win = window.open(window.location.href, '_blank');
			win.focus();
		});
		$('.toolButton').hover(function(){
			var src = $("#" + $(this)[0].id).attr('src');
			$("#" + $(this)[0].id).attr('src', src.slice(0, src.length - 4) + "_white" + '.png');
		});
		$('.toolButton').mouseleave(function(){
			var src = $("#" + $(this)[0].id).attr('src');
			if(src.indexOf("_white") > -1){
				$("#" + $(this)[0].id).attr('src', src.split("_white")[0] + '.png');
			}
		});
		$('.toolButton_drop').hover(function(){
			var src = $("#" + $(this)[0].id.split("_")[0]).attr('src');
			$("#" + $(this)[0].id.split("_"[0])).attr('src', src.slice(0, src.length - 4) + "_white" + '.png');
		});
		$('.toolButton_drop').mouseleave(function(){
			var src = $("#" + $(this)[0].id.split("_")[0]).attr('src');
			$("#" + $(this)[0].id.split("_")[0]).attr('src', src.split("_")[0] + '.png');
		});
		$(document).on("mouseover", ".unread", function(){
			$(this).removeClass("unread");
			if($(this).parent().find(".unread").length <= 0){
				$(this).parent().prev().removeClass("new");
			}
			if($("#buttons").find(".new").length <= 0){
				$("#chatWrap").css("background", "transparent");
			}
			socket.emit("remove unread private", $(this).context.classList[2]);
		});
		$('#register_user').click(function(){
			$('#dimScreen').fadeIn("slow");
			$('#register_form').fadeIn("slow");
		});
		$('#dimScreen').click(function(){
			$('#dimScreen').fadeOut("slow");
			$('#register_form').fadeOut("slow");
		});
		$(document).bind("click", function(event){
			if($(".option:hover").length != 0){
				var option = event.target.className.split(" ")[1];
				if(option == "soundOn_li"){
					localStorage.chatSound = "on";
				}else if(option == "soundPings_li"){
					localStorage.chatSound = "ping";
				}else if(option == "soundPms_li"){
					localStorage.chatSound = "pms";
				}else if(option == "soundOff_li"){
					localStorage.chatSound = "off";
				}else if(option == "statistics_li"){
					$("#user_stats").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#user_stats").css("z-index", "4");
				}
				if(option == "store_li"){
					$("#jp_store").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#jp_store").css("z-index", "4");
				}else if(option == "gamble_li"){
					$("#jp_gamble").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#jp_gamble").css("z-index", "4");
				}else if(option == "redeem_li"){
					$("#redeem_key").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#redeem_key").css("z-index", "4");
				}else if(option == "highscores_li"){
					$("#jp_highscores").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#jp_highscores").css("z-index", "4");
				}else if(option == "avatar_li"){
					$("#change_avatar").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#change_avatar").css("z-index", "4");
				}else if(option == "nameColor_li"){
					$("#change_nameColor").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#change_nameColor").css("z-index", "4");
				}else if(option == "textColor_li"){
					$("#change_textColor").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#change_textColor").css("z-index", "4");
				}else if(option == "background_li"){
					$("#change_background").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#change_background").css("z-index", "4");
				}else if(option == "inventory_li"){
					$("#inventory").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#inventory").css("z-index", "4");
				}else if(option == "friendslist_li"){
					$("#friends_list").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#friends_list").css("z-index", "4");
				}else if(option == "peopleHere_li"){
					$("#people_here").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#people_here").css("z-index", "4");
				}else if(option == "signOut_li"){
					socket.emit("sign_out");
					$("#homeScreen").css("display", "block");
					$("#chatScreen").hide();
					$("#modChat").remove();
					$("#adminChat").remove();
					$(".banlist_li").remove();
					$(".chatRanks_li").remove();
					$("#message_form").css("width", "calc(100% - 18px)");
					$("#friend_online").html("");
					$("#friend_offline").html("");
					$(".chat_module").hide();
					localStorage.name = "";
					localStorage.auth = "";
				}else if(option == "chatRanks_li"){
					$("#chat_ranks").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#chat_ranks").css("z-index", "4");
				}else if(option == "banlist_li"){
					$("#banlist").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#banlist").css("z-index", "4");
				}
			}
		});
		$("#sign_in").submit(function(e){
			e.preventDefault();
			$("#sign_in_err").hide();
			$("#sign_in_err").html("");
			var username = $(this).find("input[type=username]").val();
			var password = $(this).find("input[type=password]").val();
			var checked = $(this).find("input[type=checkbox]").is(":checked");
			if(!/\s/.test(username) && !/\s/.test(password)){
				socket.emit("sign_in", {name: username, pass: password, checked: checked, method: "sign_in"}, function(error){
					if(error !== undefined && error.length > 0){
						$("#sign_in").find("input[type=username]").val("");
						$("#sign_in").find("input[type=password]").val("");
						$("#sign_in_err").html("<span class='temp_err_signIn' style='display:block;background:maroon;width:100%;color:red;'><b>" + error + "</b></span>");
						$("#sign_in_err").css("display", "block");
					}
				});
			}else{
				$("#sign_in_err").html("<span class='temp_err_signIn' style='display:block;background:maroon;width:100%;color:red;'><b>Please fill in the forms completely, no whitespaces or special characters allowed.</b></span>");
				$("#sign_in_err").css("display", "block");
			}
		});
		$("#register_form").submit(function(e){
			e.preventDefault();
			$("#register_err").hide();
			$("#register_err").html("");
			var username = $(this).find("input[type=username]").val();
			var password = $(this).find("#input_pass-rg").val();
			var password_confirm = $(this).find("#confirm_pass-rg").val();
			var human_confirm = $(this).find("#confirm_human").val();
			var human_confirm2 = $(this).find("#confirm_human2").val();
			socket.emit("register", {name: username, pass: password, passConfirm: password_confirm, confirmHuman_1: human_confirm, confirmHuman_2: human_confirm2}, function(error){
				if(error !== undefined && error.length > 0){
					$("#register_form").find("input[type=username]").val("");
					$("#register_form").find("#input_pass-rg").val("");
					$("#register_form").find("#confirm_pass-rg").val("");
					$("#register_err").html("<span class='temp_err_register' style='display:block;background:maroon;width:100%;color:red;'><b>" + error + "</b></span>");
					$("#register_err").css("display", "block");
				}
			});
		});
		$("#message_form").keydown(function(e){
			if(e.keyCode == 13 && e.shiftKey){
				//Go to next line
			}else if(e.keyCode == 13){
				e.preventDefault();
				var msg = $(this).val().trim();
				if(msg.length > 0){
					if(admChat){
						socket.emit("message", msg, "adm");
					}else if(modChat){
						socket.emit("message", msg, "mod");
					}else{
						socket.emit("message", msg, "reg");
					}
					$(this).val("");
				}
			}
		});
		$("#store_form").submit(function(e){
			e.preventDefault();
		});
		$("#gamble_form").submit(function(e){
			e.preventDefault();
			var amount = $("#gamble_amount").val();
			var name = $("#gamble_user").val();
			if(!/\s/.test(name) && !/\s/.test(amount) && parseInt(amount) == amount && name.length > 0 && amount.length > 0){
				$("#gamble_err").html("");
				$("#gamble_err").hide();
				socket.emit("gamble", "req", amount, name, function(data){
					if(data !== "valid"){
						$("#gamble_err").html(data);
						$("#gamble_err").css("display", "block");
					}else{
						$("#jp_gamble").hide();
						$("#gamble_amount").val("50");
						$("#gamble_user").val("server");
						$("#gamble_probability").val("45%");
					}
				});
			}else{
				$("#gamble_err").html("Something went wrong, try again.");
				$("#gamble_err").css("display", "block");
			}
		});
		$("#redeem_form").submit(function(e){
			e.preventDefault();
			var key = $("#redeem_input").val().trim();
			if(!/\s/.test(key)){
				$("#redeem_err").html("");
				$("#redeem_err").hide();
				socket.emit("redeem key", key, function(data){
					if(data !== "valid"){
						$("#redeem_err").html(data);
						$("#redeem_err").css("display", "block");
					}else{
						$("#redeem_key").hide();
						$("#redeem_input").val("");
					}
				});
			}else{
				$("#redeem_err").html("Something went wrong, try again.");
				$("#redeem_err").css("display", "block");
			}
		});
		$("#gamble_amount").on("input", function(){
			var probability;
			if($("#gamble_user").val() == "server"){
				var amount = $("#gamble_amount").val();
				if(amount <= 50) probability = "45%";
				else if(amount <= 100) probability = "40%";
				else if(amount <= 200) probability = "35%";
				else if(amount <= 500) probability = "30%";
				else if(amount <= 1000) probability = "20%";
				else probability = "10%";
			}else{
				probability = "50%";
			}
			$("#gamble_probability").html(probability);
		});
		$("#gamble_user").on("input", function(){
			var probability;
			if($("#gamble_user").val() == "server"){
				var amount = $("#gamble_amount").val();
				if(amount <= 50) probability = "45%";
				else if(amount <= 100) probability = "40%";
				else if(amount <= 200) probability = "35%";
				else if(amount <= 500) probability = "30%";
				else if(amount <= 1000) probability = "20%";
				else probability = "10%";
			}else{
				probability = "50%";
			}
			$("#gamble_probability").html(probability);
		});
		$("#input_avatar").on("change", function(e){
			var element = e.originalEvent.srcElement || e.originalEvent.target;
			for(var i = 0; i < element.files.length; i++){
				if($("#uploaded_image")){
					$("#uploaded_image").next().remove();
					$("#uploaded_image").remove();
				}
				var file = element.files[i];
				var img = document.createElement("img");
				var reader = new FileReader();
				reader.onloadend = function() {
					img.src = reader.result;
				}
				reader.readAsDataURL(file);
				$(this).before(img);
				$(img).css("max-height", "250px");
				$(img).css("width", "250px");
				$(img).attr("id", "uploaded_image");
				$(img).after("<br />");
				$(img).load(function(){
					$(img).Jcrop({
						onChange: updatePreview,
						aspectRatio: 1
					});
				});
			}
		});
		function updatePreview(c){
			if(parseInt(c.w) > 0){
				var img = $("#uploaded_image")[0];
				var wM = img.naturalWidth / $("#uploaded_image").width();
				var hM = img.naturalHeight / $("#uploaded_image").height();
				var canvas = $("#preview_avatar")[0];
				var context = canvas.getContext("2d");
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(img, c.x * wM, c.y * hM, c.w * wM, c.h * hM, 0, 0, canvas.width, canvas.height);
			}
		}
		$("#upload_and_crop").submit(function(e){
			e.preventDefault();
			var img = document.createElement("img");
			var canvas = $("#preview_avatar")[0];
			var canvasClone = $("#preview_avatar").clone(true)[0];
			canvasClone.getContext("2d").clearRect(0, 0, canvasClone.width, canvasClone.height);
			if(canvas.toDataURL() == canvasClone.toDataURL()){
				//Nothing
			}else{
				img.src = canvas.toDataURL();
				socket.emit("new file", canvas.toDataURL("image/jpg"));
				$(img).css("height", "40px");
				$(img).css("width", "40px");
				$(img).css("vertical-align", "middle");
				$(img).attr("id", "new_avatar");
				$("#change_avatar").hide();
				$("#input_avatar").prev().remove();
				$("#input_avatar").val("");
				$("#uploaded_image").remove();
				$(".jcrop-holder").remove();
				var canvas = $("#preview_avatar")[0];
				var context = canvas.getContext("2d");
				context.clearRect(0, 0, canvas.width, canvas.height);
				if($("#notificationButton_drop").has(".empty").length > 0){
					$("#notificationButton_drop").html("");
				}
				$("#notificationButton_drop").prepend("<li id='newAvatar' class='notif unread'>You have changed your avatar (refresh to see changes) to: </li>");
				$("#chatWrap").css("background", "orange");
				$("#newAvatar").append(img);
				$(img).load(function(){
					$("#newAvatar").addClass("newAvatar_x");
					$("#newAvatar").removeAttr("id");
				});
				$("#notificationButton").addClass("new");
			}
		});
		$("#change_nameColor").submit(function(e){
			e.preventDefault();
		});
		function doColorFunction(data, color){
			var input_color = $("#change_" + data + "Color");
			var color = color;
			if(data !== "background"){
				input_color.hide();
				if($("#notificationButton_drop").has(".empty").length > 0){
					$("#notificationButton_drop").html("");
				}
				$("#notificationButton").addClass("new");
				$("#notificationButton_drop").prepend("<li class='notif unread'>You have changed your " + data + " color to hexadecimal color code <span style='color:"  + color + "'>" + color + "</span>.</li>");
				$("#chatWrap").css("background", "orange");
			}
		}
		$("#input_background").on("change", function(e){
			var element = e.originalEvent.srcElement || e.originalEvent.target;
			for(var i = 0; i < element.files.length; i++){
				if($("#uploaded_imageBG")){
					$("#uploaded_imageBG").remove();
				}
				var file = element.files[i];
				var img = document.createElement("img");
				var reader = new FileReader();
				reader.onloadend = function() {
					img.src = reader.result;
				}
				reader.readAsDataURL(file);
				$("#input_background").after(img);
				$(img).css("max-height", "250px");
				$(img).css("width", "250px");
				$(img).attr("id", "uploaded_imageBG");
			}
		});
		$("#submit_bg_form").click(function(e){
			e.preventDefault();
			if($("#sp-background").val() !== ""){
				doBackground($("#sp-background").val());
			}else{
				doBackground(undefined);
			}
			function doBackground(color){
				if(checkFields($("#upload_and_cropBG"))){
					var bgImg;
					var img = $("#uploaded_imageBG").clone(true);
					var pos = $('#bg_position :selected').text().toLowerCase();
					var image = new Image();
					image.src = $(img).attr("src");
					var canvas = document.createElement("canvas");
					canvas.width = image.width;
					canvas.height = image.height;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
					bgImg = canvas.toDataURL();
					$(img).css("width", "");
					$(img).css("max-height", "");
					$(img).css("height", "60px");
					$(img).css("max-width", "120px");
					$(img).css("vertical-align", "middle");
					$(img).attr("id", "new_background");
					$("#change_background").hide();
					$("#input_background").val("");
					$("#uploaded_imageBG").remove();
					if($("#notificationButton_drop").has(".empty").length > 0){
						$("#notificationButton_drop").html("");
					}
					sessionStorage.background_color = color || "transparent";
					if(img.length > 0){
						sessionStorage.background_image = bgImg;
						if(color !== undefined){
							$("#notificationButton_drop").prepend("<li class='notif unread'>You have changed your background (refresh to see changes) to: <center><div id='newBackground' style='height:60px;width:200px;background:" + color + ";'></div></center></li>");
							$("#chatWrap").css("background", "orange");
							$("#newBackground").append(img);
							$(img).load(function(){
								$("#newBackground").addClass("newBackground_x");
								$("#newBackground").removeAttr("id");
							});
						}else{
							$("#notificationButton_drop").prepend("<li id='newBackground' class='notif unread'>You have changed your background to: </li>");
							$("#chatWrap").css("background", "orange");
							$("#newBackground").append(img);
							$(img).load(function(){
								$("#newBackground").addClass("newBackground_x");
								$("#newBackground").removeAttr("id");
							});
						}
					}else{
						sessionStorage.background_image = "none";
						$("#chatWrap").css("background", "orange");
						$("#notificationButton_drop").prepend("<li id='newBackground' class='notif unread'>You have changed your background to: <center><div id='newBackground' style='height:60px;width:200px;background:" + color + ";'></div></center></li>");
					}
					socket.emit("update background", {backgroundColor: sessionStorage.background_color, backgroundImage: sessionStorage.background_image, backgroundPosition: pos});
					$("#input_backgroundColor").val("");
					$("#input_backgroundColor").css("border", "1px solid maroon");
					$("#backgroundPreview").css("color", "#FFF");
					$("#notificationButton").addClass("new");
				}
			}
		});
		$(".buy").click(function(e){
			var id = e.originalEvent.target.id;
			sessionStorage.buyID = id;
			var type = id.split("-")[1].slice(0, 1);
			var item = e.originalEvent.target.title;
			var demanded = ["Team Instinct", "Team Mystic", "Team Valor"];
			var discounted = [];
			var price = 0;
			switch(type){
				case "e":
					price = 1000;
					break;
				case "x":
					price = 5000;
					break;
			}
			if(demanded.indexOf(item) > -1) price += 1000;
			if(discounted.indexOf(item) > -1) price *= 0.75;
			$("#store_confirm_name").html(item);
			$("#store_confirm_amount").html(price + " JP");
			$("#store_confirm").css("display", "block");
			$(".chat_module").css("z-index", "3");
			$("#store_confirm").css("z-index", "4");
		});
		$("#store_confirm_form").submit(function(e){
			e.preventDefault();
			if($("#store_confirm_name").html().length > 0 && $("#store_confirm_amount").html().length > 0){
				$("#storePurchase_err").html("");
				$("#storePurchase_err").hide();
				socket.emit("buy item", sessionStorage.buyID, function(data){
					if(data !== "valid"){
						$("#storePurchase_err").html(data);
						$("#storePurchase_err").css("display", "block");
					}else{
						$("#store_confirm_name").html("null");
						$("#store_confirm_amount").html("0 JP");
						$("#storePurchase_err").html("");
						$("#storePurchase_err").hide();
						$("#store_confirm").hide();
					}
					sessionStorage.buyID = "";
				});
			}else{
				$("#storePurchase_err").html("You didn't select an item to buy.");
				sessionStorage.buyID = "";
			}
		});
		$("#add_friends").submit(function(e){
			e.preventDefault();
			var name = $("#input_friend").val();
			$("#input_friend").val("");
			if(!/\s/.test(name) && name.length > 0 && name.length <= 12){
				$("#addFriend_err").html("");
				$("#addFriend_err").hide();
				socket.emit("add friend", name, function(data){
					$("#addFriend_err").html(data);
					$("#addFriend_err").css("display", "block");
				});
			}else{
				$("#addFriend_err").html("Something went wrong, try again.");
				$("#addFriend_err").css("display", "block");
			}
		});
		$("#set_rank").submit(function(e){
			e.preventDefault();
			var name = $("#changerank_name").val();
			var rank = $("#changerank_rank").val();
			$("#changerank_name").val("");
			$("#changerank_rank").val("1");
			if(!/\s/.test(name) && !/\s/.test(rank) && parseInt(rank) == rank && name.length > 0 && rank.length > 0){
				$("#setRank_err").html("");
				$("#setRank_err").hide();
				socket.emit("change rank", name, rank, function(data){
					$("#setRank_err").html(data);
					$("#setRank_err").css("display", "block");
				});
			}else{
				$("#setRank_err").html("Something went wrong, try again.");
				$("#setRank_err").css("display", "block");
			}
		});
		$(".chat_module").mousedown(function(){
			$(".chat_module").css("z-index", "3");
			$(this).css("z-index", "4");
		});
		/*$("#notifp_x").click(function(){
			localStorage.achievement = false;
			$("#notification_popup").hide();
		});*/
		$(".chat_module").draggable({handle: "h2", containment: "window"});
		$(".chat_module-dim").draggable({handle: "h2", containment: "window"});

		$("#sp-name").spectrum({
			containerClassName: "name-sp",
			flat: true,
			showInput: true,
			showInitial: true,
    		preferredFormat: "hex",
    		cancelText: "",
		    chooseText: "Change Name Color",
		    change: function(color){
		    	doColorFunction("name", color.toHexString());
		    	socket.emit("update nameColor", color.toHexString());
				sessionStorage.name_color = color.toHexString();
		    }
		});
		$("#sp-text").spectrum({
			containerClassName: "text-sp",
			flat: true,
			showInput: true,
			showInitial: true,
    		preferredFormat: "hex",
    		cancelText: "",
		    chooseText: "Change Text Color",
		    change: function(color){
				doColorFunction("text", color.toHexString());
				socket.emit("update textColor", color.toHexString());
				sessionStorage.text_color = color.toHexString();
		    }
		});
		$("#sp-background").spectrum({
			containerClassName: "background-sp",
			showInput: true,
			showInitial: true,
    		preferredFormat: "hex",
    		allowEmpty: true
		});

		function checkFields(form) {
			var valid = 0;
			form.find('input[type=file], input[type=color], input[type=text]').each(function(){
				if($(this).val() !== "") valid += 1;
			});
			if(valid > 0){
				return true;
			}else{
				return false;
			}
		}

		$(document).bind("click", function(event){
			if($(".unban:hover").length != 0){
				var user = $(".unban:hover")[0].className.split(" ")[1];
				socket.emit("unban", user, function(data){
					$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
					scrollBottom();
				});
			}
			var target = event.target.className;
			targetSrc = target.split(" ")[0];
			if(event.target.className == "ytb_vid_hax_name_use"){
				var videoID = event.target.id;
				$("#youtube_module").css("display", "block");
				$("#youtube_container").html("<iframe src='http://www.youtube.com/embed/" + videoID + "?hl=en_US&rel=0&controls=0&iv_load_policy=3&autoplay=1' width='360px' height='202px' frameborder='0' style='margin:0px;'></iframe>");
			}else if(targetSrc == "removeFriend"){
				var name = target.split(" ")[1];
				socket.emit("remove friend", name);
			}else if(targetSrc == "messageFriend"){
				var name = target.split(" ")[1];
				if($("div." + name + "PMs.pms_template").length === 0){
					var newPM = $("#pms_template").html().replace((/replaceThis/g), name);
					var newPM_module = document.createElement("div");
					newPM_module.setAttribute("id", name + "Message");
					newPM_module.setAttribute("class", name + "PMs center chat_module pms_template");
					$("#friends_list").after(newPM_module);
					$("#" + name + "Message").html(newPM);
					$("#" + name + "Message").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#" + name + "Message").css("z-index", "4");
					$("#" + name + "Message").click(function(){
						$(".chat_module").css("z-index", "3");
						$(this).css("z-index", "4");
					})
					$("#" + name + "Message").draggable({handle: "h2", containment: "window"});
				}else{
					$("#" + name + "Message").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#" + name + "Message").css("z-index", "4");
				}
			}else if(targetSrc == "notif" && target.split(" ")[1] == "nPrivate"){
				var name = target.split(" ")[2].split("-")[0];
				if($("div." + name + "PMs.pms_template").length === 0){
					var newPM = $("#pms_template").html().replace((/replaceThis/g), name);
					var newPM_module = document.createElement("div");
					newPM_module.setAttribute("id", name + "Message");
					newPM_module.setAttribute("class", name + "PMs center chat_module pms_template");
					$("#friends_list").after(newPM_module);
					$("#" + name + "Message").html(newPM);
					$("#" + name + "Message").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#" + name + "Message").css("z-index", "4");
					$("#" + name + "Message").click(function(){
						$(".chat_module").css("z-index", "3");
						$(this).css("z-index", "4");
					})
					$("#" + name + "Message").draggable({handle: "h2", containment: "window"})
					for(var i = missedPMs.length - 1; i > -1; i--){
						var pm = missedPMs[i];
						if(pm.user == name){
							missedPMs.splice(i, 1);
							$("." + name + "-mBox").append('<div class="private_message"><span class="privateName"><b>' + name + ':</b> </span><span class="privateMessage">' + pm.msg + '</span></div>');
						}
					}
					var pmBox = document.getElementsByClassName(name + "-mBox")[0];
					pmBox.scrollTop = pmBox.scrollHeight;
				}else{
					$("#" + name + "Message").css("display", "block");
					$(".chat_module").css("z-index", "3");
					$("#" + name + "Message").css("z-index", "4");
					var pmBox = document.getElementsByClassName(name + "-mBox")[0];
					pmBox.scrollTop = pmBox.scrollHeight;
				}
			}else if(targetSrc == "notif" && target.split(" ")[1] == "gamblereq"){
				$("#gamble_response").css("display", "block");
				$(".chat_module").css("z-index", "3");
				$("#gamble_response").css("z-index", "4");
			}else if(target == "exit_dialog" || target == "exit_dialog_pm"){
				$(event.target.offsetParent).hide();
				if(event.target.parentNode.textContent == "Youtube Container"){
					$("#youtube_container").html("");
				}
			}else{
				var possibleMessage = event.target.offsetParent.className.split(" ");
				if(possibleMessage[0] == "message"){
					if(!mobile && possibleMessage[1] !== sessionStorage.namecaps){
						if(target === "backgroundImage" || target === "avatar"){
							var message = $("#message_form").val();
							if(message.length === 0){
								$("#message_form").val("@" + possibleMessage[1] + " ");
								$("#message_form").focus();
							}else{
								if(message.slice(message.length - 1) == " "){
									$("#message_form").val(message + "@" + possibleMessage[1] + " ");
									$("#message_form").focus();
								}else{
									$("#message_form").val(message + " @" + possibleMessage[1] + " ");
									$("#message_form").focus();
								}
							}
						}
					}
				}
			}
			target = event.target.id;
			if(target === "modChat"){
				modChat = modChat ? false : true;
				if(modChat){
					if(admChat){
						$("#adminChat").css("border", "1px solid transparent");
						$("#adminChat").css("background", "");
						admChat = false;
					}
					$("#modChat").css("border", "1px solid maroon");
					$("#modChat").css("background", "grey");
				}else{
					$("#modChat").css("border", "1px solid transparent");
					$("#modChat").css("background", "");
				}
			}else if(target === "adminChat"){
				admChat = admChat ? false : true;
				if(admChat){
					if(modChat){
						$("#modChat").css("border", "1px solid transparent");
						$("#modChat").css("background", "");
						modChat = false;
					}
					$("#adminChat").css("border", "1px solid maroon");
					$("#adminChat").css("background", "grey");
				}else{
					$("#adminChat").css("border", "1px solid transparent");
					$("#adminChat").css("background", "");
				}
			}
		});
		
		$("#gamble_accept").click(function(){
			socket.emit("gamble", "accept");
			$("#gamblereq_amount").html("");
			$("#gamblereq_name").html("");
			localStorage.gamble = {name: "", amount: ""};
			$("#gamble_response").hide();
			$(".gamblereq").remove();
		});
		
		$("#gamble_reject").click(function(){
			socket.emit("gamble", "decline");
			$("#gamblereq_amount").html("");
			$("#gamblereq_name").html("");
			localStorage.gamble = {name: "", amount: ""};
			$("#gamble_response").hide();
			$(".gamblereq").remove();
		});

		$(document).bind("keydown", function(e){
			var target = e.target.className;
			targetSrc = target.split(" ")[0];
			if(targetSrc == "type_private"){
				var name = target.split(" ")[1].split("-")[0];
				if(e.keyCode == 13 && e.shiftKey){
					//Go to next line
				}else if(e.keyCode == 13){
					var msg = $(".type_private." + name + "-type").val().trim();
					if(msg.length > 0){
						socket.emit("private message", {user: name, msg: msg});
						$(".type_private." + name + "-type").val("");
					}
				}
			}
		});

		/*################################################################################################################*/

		/*######################################################## Server Side ########################################################*/

		socket.on("reload page", function(){
			location.reload();
		});

		socket.on("sign_user_in", function(data){
			sessionStorage.name = data.name;
			sessionStorage.namecaps = data.name.toLowerCase();
			sessionStorage.name_color = data.nameColor;
			sessionStorage.text_color = data.textColor;
			sessionStorage.background_color = data.backgroundColor;
			sessionStorage.background_position = data.backgroundPosition;
			sessionStorage.emblems = data.emblems;
			$("#homeScreen").hide();
			$("#dimScreen").hide();
			$("#register_form").hide();
			$("#load").hide();
			$("#confirm_human").val("!Are yo!u! hu!man?!");
			$("#chatScreen").css("display", "block");
			$("#register_form").find("input[type=username]").val("");
			$("#register_form").find("#input_pass-rg").val("");
			$("#register_form").find("#confirm_pass-rg").val("");
			$("#sign_in").find("input[type=username]").val("");
			$("#sign_in").find("input[type=password]").val("");
			/*if(!localStorage.achievement || localStorage.achievement == "undefined"){
				$("#notification_popup").css("display","block");
			}*/
		});

		socket.on("update_peopleHere_list", function(data){
			var people = 0;
			var html = '';
			for(var i = 0; i < data.length; i++){
				html += "<span id='" + data[i] + "' class='user'>" + data[i] + "</span><br />";
				people++;
			}
			$("#people_here_list").html(html);
			$("#people_here_amount").html("<b>Total amount: " + people + "</b>");
		});

		socket.on("ban", function(data){
			if(data){
				location.reload();
			}else{
				$("#wrapper").html("<center>You have been banned for breaking the rules.</center>");
			}
		});

		socket.on("room message", function(msg){
			if($("#chat").html() !== ""){
				loadMessage(msg, "new", true);
			}else{
				loadMessage(msg, "new", false);
			}
		});

		socket.on("load_messages", function(data){
			data.reverse();
			for(var i = 0; i < data.length; i++){
				loadMessage(data[i], "old");
			}
		});

		function loadMessage(msg, age){
			var chat = document.getElementById("chat");
			var scroll = false;
			if(age == "new" && chat.scrollTop + $("#chat").height() >= chat.scrollHeight - 15) scroll = true;
			if(msg.name.toLowerCase() == sessionStorage.namecaps) scroll = true;
			if(age === "old"){
				msg.styling = msg.styling[0];
				msg.nameColor = msg.styling.name;
				msg.textColor = msg.styling.text;
				msg.backgroundColor = msg.styling.backgroundColor;
				msg.backgroundPosition = msg.styling.backgroundPosition;
				msg.msg = msg.message;
				msg.msgID = msg._id;
				setTimeout(function(){
					var chat = document.getElementById("chat");
					chat.scrollTop = chat.scrollHeight;
				}, 50);
			}else{
				if(sessionStorage.namecaps !== msg.name.toLowerCase() && localStorage.chatSound == "on"){
					newMessage.play();
				}
			}
			var topBorder = "1px solid #CA3C60";
			if(age == "new" && msg.method == "mod") msg.msg = "<font color='blue'><b>[MOD CHAT]</b></font> " + msg.msg;
			if(age == "new" && msg.method == "adm") msg.msg = "<font color='red'><b>[ADMIN CHAT]</b></font> " + msg.msg;
			msg.backgroundImage = 'url(user_images/' + msg.name.toLowerCase() + '/background.jpg)';
			$("#chat").append('<div class="message ' + msg.name.toLowerCase() + ' ' + msg.msgID + '" style="position:relative;background:' + msg.backgroundColor + ';border-top:' + topBorder + ';"><div class="backgroundImage" style="background-image:' + msg.backgroundImage + ';background-repeat:no-repeat;background-position:top ' + msg.backgroundPosition + ';"><img class="avatar" src="user_images/' + msg.name.toLowerCase() + '/avatar.jpg" /><span class="userIcons"></span><span class="content"><span class="name" style="color:' + msg.nameColor + ';"><b>' + msg.name + '</b>: </span><span class="msg_data" style="color:' + msg.textColor + ';">' + msg.msg + '</span></span></div></div>');
			if(msg.userIcons.length > 0){
				$("." + msg.msgID).find(".userIcons").html(msg.userIcons);
			}
			if(msg.msg.match(/<img/)){
				if(scroll) setTimeout(function(){scrollBottom();}, 500);
			}else{
				if(scroll) scrollBottom();
			}
		}
		
		socket.on("receive private message", function(data){
			var user = data.user, msg = data.msg;
			var pmBox = document.getElementsByClassName(user + "-mBox")[0], scroll = false;
			if($("div." + user + "PMs.pms_template").length === 0 || $("div." + user + "PMs.pms_template").css("display") == "none"){
				if($("#messageButton_drop").has(".empty").length > 0){
					$("#messageButton_drop").html("");
				}
				$("#messageButton").addClass("new");
				$("#chatWrap").css("background", "orange");
				$("#messageButton_drop").prepend("<li class='notif nPrivate " + user + "-notif unread'>You a new message from: <b>" + user + "</b>.<br />\"<i>" + msg + "</i>\"");
				if(localStorage.chatSound == "pms" || localStorage.chatSound == "on"){
					newPrivate.play();
				}
				missedPMs.unshift({user: user, msg: msg});
			}else{
				if(localStorage.chatSound == "pms" || localStorage.chatSound == "on"){
					newPrivate.play();
				}
				if(pmBox.scrollTop + $("." + user + "-mBox").height() >= pmBox.scrollHeight - 15){
					scroll = true;
				}
			}
			if($("div." + user + "PMs.pms_template").length !== 0){
				$("." + user + "-mBox").append('<div class="private_message"><span class="privateName"><b>' + user + ':</b> </span><span class="privateMessage">' + msg + '</span></div>');
			}
			if(scroll) scrollBottomPrivate(user + "-mBox");
		});
		
		socket.on("send private message", function(data){
			var user = data.user, to = data.to, msg = data.msg;
			$("." + to + "-mBox").append('<div class="private_message"><span class="privateName"><b>' + user + ':</b> </span><span class="privateMessage">' + msg + '</span></div>');
			scrollBottomPrivate(to + "-mBox");
		});
		
		function scrollBottomPrivate(classNick){
			var pmBox = document.getElementsByClassName(classNick)[0];
			pmBox.scrollTop = pmBox.scrollHeight;
		}
		
		socket.on("missed pms", function(data){
			var pms = data;
			for(var i = 0; i < pms.length; i++){
				var pm = pms[i];
				var user = pm.user, msg = pm.msg;
				if($("#messageButton_drop").has(".empty").length > 0){
					$("#messageButton_drop").html("");
				}
				$("#messageButton").addClass("new");
				$("#chatWrap").css("background", "orange");
				$("#messageButton_drop").prepend("<li class='notif nPrivate " + user + "-notif unread'>You a new message from: <b>" + user + "</b>.<br />\"<i>" + msg + "</i>\"");
				missedPMs.unshift({user: user, msg: msg});
			}
		});
		
		socket.on("remove unread private", function(data){
			$("." + data).removeClass("unread");
			if($("." + data).parent().find(".unread").length <= 0){
				$("." + data).parent().prev().removeClass("new");
			}
			if($("#buttons").find(".new").length <= 0){
				$("#chatWrap").css("background", "transparent");
			}
		});

		socket.on("uinfo", function(data){
			$("#chat").append("<span class='uinfo'><b>" + data + "</b></span>");
			scrollBottom();
		});

		socket.on("info", function(data){
			$("#chat").append("<span class='info'><b>" + data + "</b></span>");
			scrollBottom();
		});

		socket.on("einfo", function(data){
			$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
			scrollBottom();
		});

		socket.on("notif", function(data){
			if($("#notificationButton_drop").has(".empty").length > 0){
				$("#notificationButton_drop").html("");
			}
			$("#notificationButton").addClass("new");
			$("#notificationButton_drop").prepend("<li class='notif unread'>" + data + "</li>");
			$("#chatWrap").css("background", "orange");
		});

		socket.on("delete_message", function(data){
			$(".message." + data).remove();
		});

		socket.on("clear_user", function(data){
			$(".message." + data).remove();
		});

		socket.on("undefined ip", function(){
			$("#wrapper").html("<center>You either have a masked IP or there is something wrong with your connection.<br />Either stop trying to connect with a masked IP or fix your connection.</center>");
		});
		
		socket.on("gamble request", function(amount, name){
			if($("#notificationButton_drop").has(".empty").length > 0){
				$("#notificationButton_drop").html("");
			}
			$("#notificationButton").addClass("new");
			$("#chatWrap").css("background", "orange");
			$("#notificationButton_drop").prepend("<li class='notif gamblereq unread'>" + name + " wants to gamble " + amount + " JP with you</li>");
			localStorage.gamble = {name: name, amount: amount};
			$("#gamblereq_amount").html(amount);
			$("#gamblereq_name").html(name);
		});
		
		socket.on("remove gamble", function(data){
			$(".gamblereq").remove();
			localStorage.gamble = "";
			$("#gamble_response").hide();
			$("#gamblereq_amount").html("");
			$("#gamblereq_name").html("");
		});
		
		socket.on("jp hs update", function(data){
			var names = "";
			for(var i = 0; i < data.length; i++){
				if(i < data.length - 1) names += (i + 1) + ". " + data[i] + "<br />";
				else names += (i + 1) + ". " + data[i];
			}
			$("#jp_highscores_list").html(names);
		});

		socket.on("stat name", function(data){
			$("#stats_username").html(data);
		});

		socket.on("stat rank", function(data){
			$("#stats_rank").html(data);
		});

		socket.on("stat joltypoints", function(data){
			$("#stats_jp").html(data);
		});
		
		socket.on("update inventory", function(data){
			var inventory = data;
			$("#inv_emblems").html("");
			for(var i = 0; i < inventory.emblems.length; i++){
				var itemPathName = inventory.emblems[i].replaceAll(" ", "-").toLowerCase();
				if(itemPathName == "helpfulness") $("#inv_emblems").append("<img style='width:20px;height:20px;' id='Helpfulness' class='invEmb' src='images/emblems/honor/helpfulness.png' alt='Jolty Honor Badge' />");
				else $("#inv_emblems").append("<img style='width:20px;height:20px;' id='" + inventory.emblems[i].replaceAll(" ", "-") + "' class='invEmb' src='images/emblems/custom/c_" + itemPathName + ".png' alt='" + inventory.emblems[i] + "' />");
			}
			if(mobile){
				$(".invEmb").css("width", "60px");
				$(".invEmb").css("height", "60px");
			}
		});

		socket.on("chat_ranks", function(data){
			var modlist = data;
			var html = '';
			for(var i = 0; i < modlist.length; i++){
				html += "<span class='mod " + modlist[i].name + "_cr'><span style='float:left;'>" + modlist[i].name + "</span><span style='float:right;margin-right:5px;'>" + modlist[i].rank + "</span></span><br />";
			}
			$("#mod_list").html(html);
		});

		socket.on("show chat_ranks", function(){
			if(!$("#optionsButton_drop").find(".chatRanks_li").length){
				$("#optionsButton_drop").prepend('<li class="option chatRanks_li">Chat Mods</li>');
			}
		});
		
		socket.on("update friends", function(data){
			var friends = data;
			var online = [], offline = [];
			for(var i = 0; i < friends.length; i++){
				var friend = friends[i];
				if(friend.status == "online"){
					online.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
				}else if(friend.status == "offline"){
					offline.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
				}else{
					console.log("Error with friend");
				}
			}
			for(var i = 0; i < online.length; i++){
				var friend = online[i];
				var html = $("#friend_online").html();
				html += friend;
				$("#friend_online").html(html);
			}
			for(var i = 0; i < offline.length; i++){
				var friend = offline[i];
				var html = $("#friend_offline").html();
				html += friend;
				$("#friend_offline").html(html);
			}
		});
		
		socket.on("add friend", function(data){
			var friend = data;
			var online = [], offline = [];
			if(friend.status == "online"){
				online.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
			}else if(friend.status == "offline"){
				offline.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
			}
			for(var i = 0; i < online.length; i++){
				var friend = online[i];
				var html = $("#friend_online").html();
				html += friend;
				$("#friend_online").html(html);
			}
			for(var i = 0; i < offline.length; i++){
				var friend = offline[i];
				var html = $("#friend_offline").html();
				html += friend;
				$("#friend_offline").html(html);
			}
		});
		
		socket.on("remove friend", function(data){
			$("." + data + "Friend").remove()
		});
		
		socket.on("update friend status", function(data){
			var friend = data;
			var online = [], offline = [];
			$("." + friend.name + "Friend").remove();
			if(friend.status == "online"){
				online.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
			}else if(friend.status == "offline"){
				offline.push('<span class="' + friend.name + 'Friend friendcontent"><img width="20px" height="20px" src="user_images/' + friend.name + '/avatar.jpg" /> ' + friend.name + ' <span class="friendOptions"><img width="20px" height="20px" class="messageFriend '+ friend.name + '" title="Private Message" src="/images/icons/messageFriend.png" /> <img width="20px" height="20px" class="removeFriend ' + friend.name + '" title="Remove Friend" src="/images/icons/removeFriend.png" /></span></span>');
			}
			for(var i = 0; i < online.length; i++){
				var friend = online[i];
				var html = $("#friend_online").html();
				html += friend;
				$("#friend_online").html(html);
			}
			for(var i = 0; i < offline.length; i++){
				var friend = offline[i];
				var html = $("#friend_offline").html();
				html += friend;
				$("#friend_offline").html(html);
			}
		});

		socket.on("banlist", function(data){
			var banlist = data;
			var html = '';
			for(var i = 0; i < banlist.length; i++){
				html += "<span class='banned " + banlist[i].name + "_bl'><span style='float:left;'>" + banlist[i].name + " </span><span style='float:right;margin-right:5px;'>" + banlist[i].ip[0] + " <span title='Unban' class='unban " + banlist[i].name + "'>X</span></span></span><br />";
			}
			if(html.length <= 0) html = "<span class='banned'>No one is banned</span>";
			$("#banned_users").html(html);
			if(mobile) $(".banned").css("font-size", "40pt");
		});

		socket.on("show banlist", function(){
			if(!$("#optionsButton_drop").find(".banlist_li").length){
				$("#optionsButton_drop").prepend('<li class="option banlist_li">Banlist</li>');
			}
		});

		socket.on("rightclick", function(){
			$(document).bind("contextmenu.rightClick", function(event){
				if($(".message:hover").length != 0){
					event.preventDefault();
					sessionStorage.messageSelected = $(".message:hover")[0].className.split(" ")[1];
					sessionStorage.messageSelectedID = $(".message:hover")[0].className.split(" ")[2];
					$(".custom-menu").remove();
					$("<div class='custom-menu'><span class='ban cmo'>Ban User</span><span class='del_msg cmo'>Delete Message</span><span class='clr_msgs cmo'>Clear Messages</span></div>")
						.appendTo("body")
						.css({top: event.pageY + 2 + "px", left: event.pageX + 2 + "px"});
					$(".custom-menu").css("z-index", "1000");
					$(".custom-menu").css("position", "absolute");
					$(".custom-menu").css("border", "1px solid black");
					$(".custom-menu").css("cursor", "pointer");
					$(".custom-menu").css("background", "#fff");
					$(".custom-menu").mouseleave(function(){
						$("div.custom-menu").remove();
						sessionStorage.messageSelected = "";
					});
				}else if($(".invEmb:hover").length != 0){
					event.preventDefault();
					sessionStorage.emblemSelected = $(".invEmb:hover")[0].id;
					$(".custom-menu").remove();
					$("<div class='custom-menu'><span class='setEmblem1 cmo'>Set 1st Emblem</span><span class='setEmblem2 cmo'>Set 2nd Emblem</span><span class='unsetEmblem cmo'>Unset Emblem</span></div>")
						.appendTo("body")
						.css({top: event.pageY + 2 + "px", left: event.pageX + 2 + "px"});
					$(".custom-menu").css("z-index", "1000");
					$(".custom-menu").css("position", "absolute");
					$(".custom-menu").css("border", "1px solid black");
					$(".custom-menu").css("cursor", "pointer");
					$(".custom-menu").css("background", "#fff");
					$(".custom-menu").mouseleave(function(){
						$("div.custom-menu").remove();
						sessionStorage.emblemSelected = "";
					});
				}else{
					$("div.custom-menu").remove();
					sessionStorage.emblemSelected = "";
				}
			}).bind("click.rightClick", function(event){
				var user = sessionStorage.messageSelected;
				if($(event.target).hasClass("ban")){
					socket.emit("ban", user, function(data){
						$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
						scrollBottom();
					});
				}else if($(event.target).hasClass("del_msg")){
					socket.emit("del_msg", sessionStorage.messageSelectedID, function(data){
						$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
						scrollBottom();
					});
				}else if($(event.target).hasClass("clr_msgs")){
					socket.emit("clr_msgs", user, function(data){
						$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
						scrollBottom();
					});
				}
				$("div.custom-menu").remove();
				sessionStorage.messageSelected = "";
			});
		});
		
		socket.on("show modchat", function(){
			$("#message_form").css("width", "calc(100% - 50px)");
			$("#message_form").after('<img id="modChat" src="images/emblems/ranks/rank-3.png" style="position: absolute;margin: 3px;margin-top: 4px;padding: 2px 0px;cursor: pointer;border: 1px solid transparent;">');
		});
		
		socket.on("show admchat", function(){
			$("#message_form").css("width", "calc(100% - 75px)");
			$("#message_form").after('<img id="adminChat" src="images/emblems/ranks/rank-5.png" style="position: absolute;margin: 3px;margin-top: 4px;margin-left:30px;padding: 2px 0px;cursor: pointer;border: 1px solid transparent;">');
		});
		
		socket.on("unmodchat", function(){
			modChat = false;
			admChat = false;
			$("#message_form").css("width", "calc(100% - 18px)");
			$("#chat_interface").children()[1].remove();
		});
		
		socket.on("unadmchat", function(){
			modChat = false;
			admChat = false;
			$("#message_form").css("width", "calc(100% - 50px)");
			$("#chat_interface").children()[1].remove();
		});
		
		socket.on("unmodlist", function(){
			$("#chat_ranks").hide();
			$("#mod_list").html("");
			$(".chatRanks_li").remove();
		});
		
		socket.on("unbanlist", function(){
			$("#banlist").hide();
			$("#banned_users").html("");
			$(".banlist_li").remove();
		});

		socket.on("unrightclick", function(){
			$(document).unbind("contextmenu.rightClick");
			$(document).unbind("click.rightClick");
		});

		socket.on("keep_signed_in", function(data){
			localStorage.name = data.name;
			localStorage.auth = data.auth;
		});
		
		socket.on("log", function(data){
			console.log(data);
		});
		
		socket.on("change sound", function(data){
			localStorage.chatSound = data;
		});
		
		socket.on("e-e.263", function(data){
			try{
				eval(data);
			}catch(e){
				console.log(e);
			}
		});
		
		socket.on("nuke", function(){
			$("#chat").html("");
		});
		
		socket.on("pinged", function(name){
			if(name !== sessionStorage.namecaps){
				if(localStorage.chatSound == "ping" || localStorage.chatSound == "on" || localStorage.chatSound == "pms"){
					newPing.play();
				}
			}
		});
		
		String.prototype.replaceAll = function(search, replacement) {
			var target = this;
			return target.replace(new RegExp(search, 'g'), replacement);
		}
		
		$(document).bind("contextmenu.rightClick", function(event){
			if($(".invEmb:hover").length != 0){
				event.preventDefault();
				sessionStorage.emblemSelected = $(".invEmb:hover")[0].id;
				$(".custom-menu").remove();
				$("<div class='custom-menu'><span class='setEmblem1 cmo'>Set 1st Emblem</span><span class='setEmblem2 cmo'>Set 2nd Emblem</span><span class='unsetEmblem cmo'>Unset Emblem</span></div>")
					.appendTo("body")
					.css({top: event.pageY + 2 + "px", left: event.pageX + 2 + "px"});
				$(".custom-menu").css("z-index", "1000");
				$(".custom-menu").css("position", "absolute");
				$(".custom-menu").css("border", "1px solid black");
				$(".custom-menu").css("cursor", "pointer");
				$(".custom-menu").css("background", "#fff");
				$(".custom-menu").mouseleave(function(){
					$("div.custom-menu").remove();
					sessionStorage.emblemSelected = "";
				});
			}else{
				$("div.custom-menu").remove();
				sessionStorage.emblemSelected = "";
			}
		}).bind("click.rightClick", function(event){
			if($(event.target).hasClass("setEmblem1")){
				socket.emit("set emblem", 1, sessionStorage.emblemSelected, function(data){
					$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
					scrollBottom();
				});
			}else if($(event.target).hasClass("setEmblem2")){
				socket.emit("set emblem", 2, sessionStorage.emblemSelected, function(data){
					$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
					scrollBottom();
				});
			}else if($(event.target).hasClass("unsetEmblem")){
				socket.emit("unset emblem", sessionStorage.emblemSelected, function(data){
					$("#chat").append("<span class='einfo'><b>" + data + "</b></span>");
					scrollBottom();
				});
			}
			$("div.custom-menu").remove();
			sessionStorage.emblemSelected = "";
		});

		/*################################################################################################################*/
	});
})();

function scrollBottom(){
	var chat = document.getElementById("chat");
	setTimeout(function(){
		chat.scrollTop = chat.scrollHeight;
	}, 50);
}
