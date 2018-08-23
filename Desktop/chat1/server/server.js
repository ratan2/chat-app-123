const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const {Users}=require('./utils/users');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString}=require('./utils/validation');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var user=new Users();
app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected');


socket.on('join',(params,callback)=>{
  if(!isRealString(params.name) || !isRealString(params.room))
  {
  return   callback('eroor hai');
  }
  else{
socket.join(params.room);
user.removeUser(socket.id);
user.addUser(socket.id,params.name,params.room);
io.to(params.room).emit('updateUserList',user.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app '));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', 'New user joined  '+params.name));
    callback();
  }

});
  socket.on('createMessage', (message, callback) => {
    var use=user.getUser(socket.id);
    if(use && isRealString(message.text)){
    io.to(use.room).emit('newMessage', generateMessage(use.name, message.text));

  }callback();
  });

  socket.on('createLocationMessage', (coords) => {
    io.emit('newLocationMessage', generateLocationMessage('Admin', coords.latitude, coords.longitude));
  });

  socket.on('disconnect', () => {
var use=user.removeUser(socket.id);

if(use)
{
  io.to(use.room).emit('updateUserList',user.getUserList(use.room));

    io.to(use.room).emit('newMessage',generateMessage('Admin',`${use.name} has left`));
}

  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
