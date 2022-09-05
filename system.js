let current_menu=[]
const base=window.location.protocol + "//" + window.location.host + "/"
filename="system.js"// used to control logging





async function initialize_app(){ 
    build_menu(main_menu)
    call({fn:"start"})
    
}

function call(params){

    let fn=params.fn
    console.log("calling", fn, "with", params)
    if(typeof fn === "string"){
        fn=window[fn] // convert a string to function
    }
    delete(params.fn)
    if(Object.keys(params).length===0){return fn()}
    if(params.params){return fn(params.params)}
    return fn(params)
}
function build_menu(menu_data){
    current_menu.length=0 // reset the current menu
    const menu=[]
    const user_data= []
    
    menu.push(`<div><span class="material-icons"  id="menu-close" onclick="hide_menu()" style="cursor: pointer;">close</span> </div> `)
    for(const item of menu_data){
        add_menu_item(menu, item, user_data.roles)
    }
    console.log('menu_data',menu_data)
    tag("menu").innerHTML=menu.join("")
}
//used to add a menu item
function add_menu_item(menu, menu_data, roles){
    if(menu_data.menu && !menu_data.label){
        // it must be an import of another menu
        for(const item of menu_data.menu){
            add_menu_item(menu, item, roles) 
        }
        return
    }

    if(Object.keys(menu_data).length===0){
        // empty object, it's a divider
        menu.push("<div><hr></div>")
        return
    }
    if(menu_data.menu){
        // it's a submenu
        let label=menu_data.label
        
        if(typeof label==="function"){label=label()}

        menu.push(`<div class="menu-menu" onClick="toggle_sub_menu(this, 'menu-${menu_data.id}')"><span class="material-icons" style="vertical-align: middle;">expand_more</span>${label}</div><div class="sub-menu" id="menu-${menu_data.id}">`)
        for(const item of menu_data.menu){
            add_menu_item(menu, item, roles)
        }
        menu.push("</div>")
    }else{
        //this is a menu choice
        if(menu_data.params){
            current_menu.push(menu_data)
            let label=menu_data.label
            if(typeof label!=="string"){
                label=label()
            }
            console.log(menu_data.params)
            menu.push(`<div class="menu-item" onclick='call(${JSON.stringify(menu_data.params)})'>${label}</div>`)
        }else if(menu_data.label){
            menu.push(`<div class="menu-item">${menu_data.label}</div>`)
        }
        if(menu_data.panel){
            console.log("at pantel", menu_data.panel)
            menu.push(`<div  class="menu-panel" style="display:none" id="${menu_data.panel}">${call({fn:"initialize_panel",panel:menu_data.panel})}</div>`)
        }
    }
}

function show_menu(){
    //This function displays the menu
    tag("menu-button").style.display="none"
    tag("menu").style.display="block"
}
function hide_menu(){
    //Used to hide the menu (show only the parallel lines)
    tag("menu-button").style.display="block"
    tag("menu").style.display="none"
}

function toggle_sub_menu(button, id){
    //Used to expande and collapse submenus
    if(toggle(id)){
        button.getElementsByTagName("span")[0].innerHTML="expand_less"
    }else{
        button.getElementsByTagName("span")[0].innerHTML="expand_more"
    }
}

function message(parameters){
    //returns a reference to the message created
    // Example parameters{
    //     message:"Password must contain at least one Capital letter",
    //     title:"User Error",
    //     kind:"error",
    //     seconds:4
    // }
    let params
    let message_id


    if(typeof parameters==="string"){
        params={
            message:parameters
        }
    }else{
        params=parameters
    }

    if(!params.title){params.title="Message"}
    if(!params.seconds){params.seconds=0}

    if(params.seconds>0){
        message_id = setTimeout(function(){msg.remove()},params.seconds*1000)
    }

    
    let message_class="msg-head"
    if(params.kind==="error"){
        message_class += " error"
        if(params.title==="Message"){
            params.title="Error"
        }
    }else if(params.kind==="info"){
        message_class += " info"
    }
    const msg=document.createElement("div")
    msg.className="message"
    
    msg.innerHTML=`
    <div class="${message_class}" onclick="clearTimeout(${message_id})">
      ${params.title}
      <div class="msg-ctrl">
      <span class="material-icons"  id="menu-close" onclick="this.parentElement.parentElement.parentElement.remove()" style="cursor: pointer;">close</span>
      </div>
    </div>
    <div class="msg-body">
    <div class="msg-entry">${params.message}</div>
    </div>`

    tag("message-center").appendChild(msg)
    return msg.getElementsByClassName("msg-entry")[0]

}
function modify_message(params){
    console.log("message", params.message)
    const msg_body = params.message.parentElement
    console.log("line--->", params.line)
    let msg_line
    if(params.line===undefined){
        console.log("no line, we must be modifying the original text")
        // we are appending a new line
        msg_line = params.message
    }else if(params.line==="new"){
        console.log("line is new")
        // we are appending a new line
        msg_line = document.createElement("div");
        msg_line.className="msg-entry"
        msg_body.appendChild(msg_line);
    }else if(params.line==="first"){
        // we are dealing with the most recently added line
        console.log("line is 'first'")
        msg_line=msg_body.firstElementChild
    }else if(params.line==="last"){
        // we are dealing with the most recently added line
        console.log("line is 'last'")
        msg_line=msg_body.lastElementChild
        console.log("msg_line",msg_line)
        console.log("msg_line.data",msg_line.data)
    }else if(!isNaN(params.line)){
        // we have a line number, try to use it
        console.log("line is a number")
        msg_line = msg_body[params.line]
    }else{
        // not recognized, append
        msg_line = document.createElement("div");
        msg_line.className="msg-entry"
        msg_body.appendChild(msg_line);
    }

    // now msg_line is the div we are working with

    switch(params.action){
        case "append":
            console.log("att append", params.text)
            msg_line.innerHTML += params.text
            break
        case "prepend":
            msg_line.innerHTML =+ params.text
            break    
        default: // replace
            msg_line.innerHTML = params.text
    }

    if(params.close_message_in){
        //message closes in seconds
        message_id = setTimeout(function(){msg_body.parentElement.remove()},params.close_message_in*1000)
    }

    if(params.close_line_in){
        //message closes in seconds
        message_id = setTimeout(function(){msg_line.remove()},params.close_line_in*1000)
    }

    return msg_line
}