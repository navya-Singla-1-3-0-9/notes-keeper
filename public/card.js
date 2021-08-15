let socket = io();
$('.create').submit(function(e){
	e.preventDefault();
	socket.emit("create-card",deck,$(".title").val(), username,$(".content").val());
	location.reload();
});
