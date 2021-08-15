let socket = io();
document.querySelector(".add").addEventListener("click",(e)=>{
	e.preventDefault();
	 var selchbox =[]; 
	 var inpfields = document.querySelectorAll('.imp');
	 
	 for(var i=0; i<inpfields.length; i++) {
		 if(inpfields[i].checked == true) {
		 	let folder= inpfields[i].classList[0];
		 	
		 	selchbox.push({folder: folder, note: inpfields[i].value});
		 }
	 }
	
	 socket.emit("add-test", $(".testname").val(),$(".sub").val(),$(".date").val(), $(".month").val(),selchbox, username);
	 window.location.href= '/tests';

})
 

