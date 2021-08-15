if(process.env.NODE_ENV!=="production"){
	require('dotenv').config();
}

const express= require('express');
let app= express();
app.set("view engine","ejs");

const { v4: uuidv4}= require('uuid');
const server= require('http').Server(app);
const io= require('socket.io')(server);
const port= process.env.PORT||5000;


const session = require('express-session')
const flash = require('connect-flash');
const passport= require('passport');
const localStrategy= require('passport-local'); 
const path = require('path')
app.use(express.static("public"));



 const sessionConfig={
	secret: 'Thisisasecret',
	resave: false,
	saveUninitialized: true,
	cookie:{
		httpOnly: true,
		expires: Date.now()+1000*60*60*24*7,
		maxAge: 1000*60*60*24*7
	}
}

const  User = require("./models/userschema");
const  Chat  = require("./models/chatschema");
const  Group = require("./models/groupschema");
const  Folder = require("./models/folderschema");
const  Notes = require("./models/noteschema");
const  Deck = require("./models/deckschema");
const  Card = require("./models/cardschema");
const  Test = require("./models/testschema");
const  Task = require("./models/taskschema");

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
//handling login
passport.serializeUser(User.serializeUser());
//handling logout
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
	//console.log(req.session);
	res.locals.currUser= req.user;
	res.locals.success=  req.flash('success');
	res.locals.error= req.flash('error');
	next();
})
const  mongoose  = require("mongoose");
//const  url  = 'mongodb://localhost:27017/notesapp';
const url='mongodb+srv://navyashirin:kXupUWLfop8HhLgr@cluster0.iwau0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const  connect  =  mongoose.connect(url, { useNewUrlParser: true  });
app.use(express.urlencoded({extended:true}));
app.set('views',path.join(__dirname,'views'));




let grpname;
io.on("connection", (socket) => {
 socket.on("chat message", function(msg, userName, groupid) {
   		socket.join(groupid);
		io.to(groupid).emit("received", { message: msg , sender:userName});
	 	connect.then(db  =>  {
	    console.log("connected correctly to the server");
	    let  chatMessage  =  new Chat({ message: msg, sender:userName, groupid: groupid});
	   	chatMessage.save();
		});
	});


   socket.on("select",function(groupid){
   		console.log("selecting");
   		grpname=groupid;
   		socket.join(groupid);
   		var destination = '/groups';
		socket.emit('redirect', destination,groupid);
   });

   socket.on('create-group', async (group, created_by)=>{
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
		    let groupname= group+"---"+uuidv4();
		    socket.join(groupname);
		    let  grp  =  new Group({ name: groupname, created_by:created_by});
		    grp.members.push(created_by);
			grp.save();
			let usergrp= await User.findOneAndUpdate({username:created_by},{$push:{groups:[groupname]}},{upsert: true});
			let gps= await User.findOne({username: created_by});
			console.log(gps.groups);
			socket.emit('user-group',groupname);
		});
   });
   socket.on('add-member', async (grp,member)=>{
   		connect.then(async (db)  =>  {
   			let usergrp= await User.findOneAndUpdate({username:member},{$push:{groups:[grp]}});
   			await Group.findOneAndUpdate({name: grp},{$push:{members:[member]}});
  			
   		});
   })

   socket.on('leave-group',async (grp, userName)=>{
   		connect.then(async (db)=>{
   			await User.findOneAndUpdate({username:userName},{$pull:{groups:grp}});
   			await Group.findOneAndUpdate({name:grp},{$pull:{members:userName}});
   		});
   });

   socket.on('create-folder', async (folder, created_by,color)=>{
   		console.log("creating")
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
		    let foldername= folder;
		    let f  =  new Folder({ name:foldername, created_by:created_by, color: color});
			f.save();
			let userfoldrs= await User.findOneAndUpdate({username:created_by},{$push:{folders:[foldername]}},{upsert: true});
			
		});
   });

     socket.on('create-deck', async (title, created_by,color)=>{
   		connect.then(async (db)  =>  {

		    console.log("connected  to the server");
		    let d  =  new Deck({ name:title, created_by:created_by});
			d.save();
			let userdecks= await User.findOneAndUpdate({username:created_by},{$push:{decks:[title]}},{upsert: true});
			
		});
   });
     socket.on('create-card', async (parent,title, created_by,content)=>{
   		connect.then(async (db)  =>  {
   			console.log("creating card");
		  let c= new Card({parent: parent, created_by:created_by, title: title,content: content});
		  await c.save();
			await Deck.findOneAndUpdate({name: parent, created_by: created_by},{$addToSet:{cards:[title]}})
			
		});
   });

    socket.on('save-note', async (content,title,folder,username)=>{
   		console.log("creating")
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
			
			await Notes.findOneAndUpdate({folder: folder, created_by:username,name: title},{content: content},{upsert:true});
			await Folder.findOneAndUpdate({name: folder, created_by: username},{$addToSet:{notes:[title]}})
			//await Folder.findOneAndUpdate({name: folder, created_by: username},{$pull:{notes:[title]}})
		});
   });

    socket.on('save-collab', async (content,title,username)=>{
   		console.log("creating")
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
			
			await Notes.findOneAndUpdate({type: "collaborated", created_by:username,name: title},{content: content},{upsert:true});
			//await Folder.findOneAndUpdate({name: folder, created_by: username},{$pull:{notes:[title]}})
		});
   });

     socket.on('share-doc', async (share_to,title,content,username)=>{
   		console.log("creating")
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
			await Notes.findOneAndUpdate({created_by:share_to, shared_by:username, name: title,type: "shared"},{content: content},{upsert:true});
			//await Folder.findOneAndUpdate({name: folder, created_by: username},{$pull:{notes:[title]}})
		});
   });

      socket.on('add-test', async (name,sub,date,month,imp,username)=>{
   		console.log("creating")
   		connect.then(async (db)  =>  {
   			let selected=[];
   			let done=[];
   			for(let e of imp){
   				if(!done.includes(e.folder)){
   					let temp=[];
   					for(let x of imp){
   						if(x.folder===e.folder){
   							temp.push(x.note);
   						}
   					}
   					selected.push({folder: e.folder, marked: temp});
   					done.push(e.folder);
   				}
   				

   			}
   			console.log(selected);
			let test = new Test({username: username, test_name: name, subject: sub,date: date, month: month});
			await test.save();
			await Test.findOneAndUpdate({username: username, test_name: name, subject: sub,date: date, month: month},{$push:{notes: selected}});
		});

   });

      socket.on("task-dropped", async(username, task, new_status)=>{
      	console.log("drop", new_status);
      		connect.then(async (db)  =>  {
      			console.log(task); 
      			let t = await Task.findOne({username: username, task_name: task});
      			console.log(t); 
      			await Task.findOneAndUpdate({username: username, task_name: task},{status: new_status},{upsert: true});
      		});
      });
      socket.on("create-todo", async(username, task)=>{
      	connect.then(async (db)  =>  {
      	let t= new Task({username: username, task_name: task, status: "created"});
      	await t.save();
      	});
      });
       socket.on("delete-todo", async(username, task)=>{
      	connect.then(async (db)  =>  {
      		console.log("deleted");
      		console.log(task); 
      		let t = await Task.findOne({username: username, task_name: task});
      			
      	await Task.findOneAndDelete({username: username, task_name: task});
      	
      	});
      });



      socket.on('collab-doc', async (share_to,title,content,username)=>{
   		console.log("collabing")
   		connect.then(async (db)  =>  {
		    console.log("connected  to the server");
		    let existing= await Notes.findOne({created_by: username, name: title, type:"collaborated"});

		    if(!existing){
		    	let room= uuidv4();
		    	console.log(room);
				await Notes.findOneAndUpdate({created_by:username,name: title, type: "collaborated"},{content: content,type:"collaborated",roomid:room, $addToSet:{collaborators:[share_to,username]}},{upsert:true});
				await Notes.findOneAndUpdate({created_by:share_to,name: title,type: "collaborated"},{content: content,type:"collaborated",roomid:room,$addToSet:{collaborators:[username,share_to]}},{upsert:true});
		}else{
			let room= existing.roomid;
			await Notes.findOneAndUpdate({created_by:username,name: title, type: "collaborated"},{content: content,type:"collaborated",roomid:room,$addToSet:{collaborators:[share_to,username]}},{upsert:true});
			await Notes.findOneAndUpdate({created_by:share_to,name: title, type:"collaborated"},{content: content,type:"collaborated",roomid:room,$addToSet:{collaborators:[share_to,username]}},{upsert:true});
			//await Folder.findOneAndUpdate({name: folder, created_by: username},{$pull:{notes:[title]}})
		}
		});
   });

     socket.on('taking-notes', (roomid,text)=>{
     		connect.then(async (db)  =>  {
	    	let note= await Notes.updateMany({roomid: roomid},{content: text});
	    	socket.broadcast.emit("copy-notes", roomid,text);
	    	
	    	});
	    });     
});

const isLoggedIn= async (req,res,next)=>{
	if(!req.isAuthenticated()){
		
		req.flash('error','You must be logged in');
		return res.redirect('/login');

	}
	
	next();
}

let getData= async(req,res)=>{
	const grps= await User.findOne({username:req.user.username});
 	const group= await Group.findOne({name: grpname});
 	
 	let members=[];
 
 	if(group){
		members= group.members;
	}
	
	if(req.user){
		const username= req.user.username;
		if(grps!=null){
			let curr=[];
			for(let g of grps.groups){
				const allmsgs= await Chat.find({groupid: g});
				curr[g]= allmsgs;
			}

			res.render('home.ejs', {grps: grps.groups,username, chats:curr, grpname,members});
		}else{
			res.render('home.ejs',{grps:[],username, chats:[], grpname,members});
		}
	}
}

let loginPg=(req,res)=>{
 	res.render('login.ejs');
}
let registerPg=(req,res)=>{
 	res.render('register.ejs');
}
let handleLogin=(req,res)=>{
	if(req.session.returnTo){
		res.redirect(req.session.returnTo);
		delete req.session.returnTo;
	}else{
		req.flash('success', 'Successfully logged in');
		res.redirect('/home');
	}
}
let handleRegister=async (req,res)=>{
 	const {email, username, password}= req.body;
	const nu = new User({email, username});
	const regdUser= await User.register(nu, password);
	req.flash('success','Successfully registered')
	res.redirect('/login')
}
let redirectToChat=(req,res)=>{
	res.redirect('/groups');
}


app.get('/home',isLoggedIn,(req,res)=>{
	res.render('landing.ejs');
});


app.get('/folders/:fname/create',isLoggedIn,async (req,res)=>{
	
	res.render("takenotes.ejs",{folder: req.params.fname, username: req.user.username, content:"", title:"", roomid:"null"});
});
app.get('/folders/:fname/:note',isLoggedIn,async (req,res)=>{
	let note = await Notes.findOne({created_by: req.user.username, name: req.params.note, folder: req.params.fname});
	let content="";
	let title="";
	if(note){
		content= note.content;
		title= note.name;
	}
	res.render("takenotes.ejs",{folder: req.params.fname, username: req.user.username, content, title, roomid:"null"});

});

app.get('/shared/:note',isLoggedIn,async (req,res)=>{
	let note = await Notes.findOne({created_by: req.user.username, name: req.params.note, type: "shared"});
	let content="";
	let title="";
	if(note){
		content= note.content;
		title= note.name;
	}
	res.render("takenotes.ejs",{folder: req.params.fname, username: req.user.username, content, title, roomid:"null"});

});
app.get('/shared',isLoggedIn,async (req,res)=>{
	console.log("shared files");
	let files= await Notes.find({created_by:req.user.username});
	
	let f=[];
	for(let cf of files){
		if(cf.type=="shared"){
		f.push({name: cf.name, shared_by: cf.shared_by});
	}
	}
	console.log(f);
	res.render('notes.ejs', { notes: f , username: req.user.username, folder:"shared"});
});

app.get('/collab/:note/:room',isLoggedIn,async (req,res)=>{
	let note = await Notes.findOne({created_by: req.user.username, name: req.params.note, type: "collaborated"});
	let content="";
	let title="";
	if(note){
		content= note.content;
		title= note.name;
	}
	res.render("takenotes.ejs",{folder: req.params.fname, username: req.user.username, content, title, roomid: req.params.room});

});

app.get('/collab',isLoggedIn,async (req,res)=>{
	console.log("collab files");
	let files= await Notes.find({created_by:req.user.username});
	
	let f=[];
	for(let cf of files){
		if(cf.type=="collaborated"){
		f.push({name: cf.name, shared_by: cf.shared_by, roomid: cf.roomid});
	}
	}
	console.log(f);
	res.render('notes.ejs', { notes: f , username: req.user.username, folder:"collaborated"});
});

app.get('/folders/:fname',isLoggedIn,async (req,res)=>{
	
	let fname= req.params.fname;
	let fldr= await Folder.findOne({created_by: req.user.username,name:fname});
	if(fldr){
	res.render("notes.ejs",{notes: fldr.notes, folder: fname});
}else{
	return;
}
});
app.get('/:t/remove-test',isLoggedIn, async (req,res)=>{
	await Test.findOneAndDelete({username: req.user.username, test_name: req.params.t});
	res.redirect('/tests');
});

app.get('/:f/remove-folder',isLoggedIn, async (req,res)=>{
	await Folder.findOneAndDelete({created_by: req.user.username, name: req.params.f});
	await User.findOneAndUpdate({username: req.user.username},{$pull:{folders: req.params.f}});
	res.redirect('/folders');
});

app.get('/decks/:deck',isLoggedIn,async (req,res)=>{
	
	let deck= req.params.deck;
	let cd= await Deck.findOne({created_by: req.user.username,name:deck});
	console.log(cd);
	if(cd){
		let cards=[];
		
			let allcards= await Card.find({created_by: req.user.username, parent: deck});
			console.log(allcards);
			for(let c of allcards){
				cards.push({name: c.title, content: c.content});
			}
			console.log(cards);
	res.render("cards.ejs",{cards, deck,username: req.user.username});
}else{
	return;
}
});


app.get('/decks',isLoggedIn,async (req,res)=>{
	let user= await User.findOne({username: req.user.username});
	let decks= user.decks;
	res.render('decks.ejs', { decks , username: req.user.username});
});

app.get('/folders',isLoggedIn,async (req,res)=>{
	let user= await User.findOne({username: req.user.username});
	let folders= user.folders;
	res.render('folders.ejs', { folders , username: req.user.username, type: "mine"});
});

app.get('/add-test',isLoggedIn, async (req,res)=>{
	//work here
	let folders = await Folder.find({created_by: req.user.username});
	let data=[];
	for(let folder of folders){
		data.push({folder: folder.name, notes: folder.notes});
	}
	res.render('add-test',{ data , username: req.user.username});
});

app.get('/tests', isLoggedIn, async (req,res)=>{
	let tests = await Test.find({username: req.user.username});
	res.render("test.ejs", { username: req.user.username,tests});
});

app.post('/groups',isLoggedIn,redirectToChat);
app.get('/groups',isLoggedIn,getData);
app.get('/login',loginPg)
app.get('/register',registerPg)
app.post('/login',passport.authenticate('local',{failureFlash:'Invalid username or password', failureRedirect:'/login'}),handleLogin);
app.post('/register',handleRegister);

app.get('/',function(req,res){
	res.render("homepage");
})
app.get('/login',function(req,res){
	res.render('login');
})
app.get('/todo',isLoggedIn,async function(req,res){
	let in_prog= await Task.find({username: req.user.username, status:"in-progress"});
	let completed= await Task.find({username: req.user.username, status:"completed"});
	let ns= await Task.find({username: req.user.username, status:"not-started"});
	let rest=await Task.find({username: req.user.username, status:"created"});
	let nostat=await Task.find({username: req.user.username, status:"no-status"});
	res.render("todo", {username: req.user.username, in_prog,completed,ns, rest, nostat});
})
server.listen(port,(req,res)=>{
	console.log('HELLOOO!');
});
