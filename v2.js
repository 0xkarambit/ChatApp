const http = require("http");
const ws = require("websocket").server;
const fs = require("fs");


const PORT = 8080;
let CONNECTIONS = [];
let USERNAMES = [];
let MESSAGES = [];


const server = http.createServer((req,res,err)=>{
    if(req.url == "/favicon.ico"){
        res.writeHead(103,{"content-type":"text/html"})
        res.end("");
        return 0;
    }
    else
    {
        console.log(`\x1b[91m${req.method}\x1b[0m request received from \x1b[91m${req.url}\x1b[0m`)
        
        htmlStream = fs.createReadStream(__dirname+"/index.html");
        htmlStream.on("error",(e)=>{
            console.log("\x1b[91m Error Occured",e.stack,"\n",e.message,"\x1b[0m")
        })

        res.writeHead(200, {"content-type":"text/html"});
        htmlStream.pipe(res);
    }
}).listen(PORT,()=>{
    console.log("server has been started")
})

SocketServer = new ws({httpServer:server})

SocketServer.on("request",(req)=>{
    let CONNECTION = req.accept(null, req.origin);
    
    CONNECTIONS.push(CONNECTION);
    console.log(`\x1b[92m${new Date()} \nnew connection : ${CONNECTIONS.length} socket(s) connected\x1b[0m`);
    

    // EVENT LISTENERS
    CONNECTION.on("error",(e)=>{
        console.log("\x1b[91mERROR:",e.stack,"\n",e.message,"\x1b[0m")
    })

    CONNECTION.on("close",()=>{
        let RES = {
            type:"User Leaving",
            data: "<span class='other-usernames'>" + CONNECTION.username + "</span> has left the chat"
        }
        
        for(let i in CONNECTIONS){
            if(CONNECTIONS[i].username){
                CONNECTIONS[i].send(JSON.stringify(RES));
            }
        }

        CONNECTIONS.splice(CONNECTIONS.indexOf(CONNECTION), 1);
        USERNAMES.splice(USERNAMES.indexOf(CONNECTION.username), 1);
        console.log(`\x1b[91m${new Date()} \nconnection disconnected : ${CONNECTIONS.length} socket(s) connected\x1b[0m`);    })

    CONNECTION.on("message",(m)=>{
        if(m.type == "utf8"){
            let REQ = JSON.parse(m.utf8Data);

            /* EXAMPLE OF A REQ OBJECT
            { type: 'utf8',
              utf8Data: '{"type":"message","data":"skasjdjsa\\n"}' }

            */
            if(REQ.type == "message")
            {
                console.log(CONNECTION.username," : ",REQ.data);
                MESSAGES.push(REQ.data)
                let message = CONNECTION.username + " : " + REQ.data;
                // BROADCASTING TO ALL CONNECTIONSS
                let RES ={
                    type:"message",
                    data:message
                }
                for(let i in CONNECTIONS){
                    if(CONNECTIONS[i].username){
                        CONNECTIONS[i].send(JSON.stringify(RES));
                    }
                }
            }
            else if(REQ.type == "username"){
                CONNECTION.username = REQ.data.split("");
                CONNECTION.username.splice(REQ.data.length-1, 1);
                CONNECTION.username = CONNECTION.username.join("");
                USERNAMES.push(CONNECTION.username);

                console.log("Username registered ",CONNECTION.username)

                let RES = {
                    type:"Registration Response",
                    data:CONNECTION.username
                }
                CONNECTION.send(JSON.stringify(RES));

                // another response to let everyone know that a new person has joined the chat
                RES.type = "User Joining"
                RES.data = "<span class='other-usernames'>" + RES.data + "</span> has joined the chat"
                
                for(let i in CONNECTIONS){
                    if(CONNECTIONS[i].username !== CONNECTION.username){
                        CONNECTIONS[i].send(JSON.stringify(RES));
                    }
                }
            }

        } else{
            console.log("ERROR : DATA NOT IN UTF8 FORMAT")
        }
    })
})