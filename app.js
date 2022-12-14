//This global variable defines the first two navigation items in the menu. In this app there are only two main navigation items "Home" and "Locations". These two menu items are visible regardless of login status.  
const empty_box = '<span class="material-symbols-outlined md-18 middle blink">check_box_outline_blank</span>'
const checked_box = '<span class="material-symbols-outlined md-18 middle">check_box</span>'
let tables_remaining=0
let schema=""
let db = null
const airtable = require('airtable');
const session={
    location:null,
    data:null,
    key:null
}
const connection={
    id:null,
    key:null
}
const main_menu=[
    //Note that a menu item is added by inserting an object for that menu item. The 'label' is the text that the user sees for that menu option. The function is the javascript function invoked when selecting that option. Here we insert the "home" and "locations" menu items. Both initiate a call to the navigate function which loads the appropriate page. The navigate function is used to help ensure smooth navigation. It allows the user to use the back botton in their browser when navigating between pages on the site (without navigating out ot the site). The navigate can accept parameters that can be passed to the function called by navigate.
    {label:"Home",params:{fn:'show_home',data:"api"}},    
    {panel:"connections-panel"},
    //this empty object inserts a horizontal line in the navigation menu panel
    {},
    {label:"Connection",id:"connection-menu", menu:[
        {label:"Open Session",params:{fn:'toggle_panel',panel:'open-session-panel'},panel:"open-session-panel"},
        {label:"Connect",params:{fn:'toggle_panel',panel:'unauthenticated-connection-panel'},panel:"unauthenticated-connection-panel"},
        {label:"Copy Metadata Script",params:{fn:'copy_metadata_script'}},
    ]},
    {label:"Diagram",id:"diagram-menu", menu:[
        {label:"Copy Diagram Script",params:{fn:'copy_diagram'}},
        {label:"Open dbdiagram.io",params:{fn:'open_diagram'}},
    ]},
    {},
    {label:"Reset App",params:{fn:'reset_app'}},    
]

function copy_diagram(){
  if(schema){
    copyToClipboard(schema)
    message({
        title:"Diagram Copied",
        message:`You diagram script has been copied. Now open <a href="https://dbdiagram.io/d" target="_blank">dbdiagram.io</a> and paste it over the sample script on the left side of the page.`,
        seconds:8
    })
  }else{
    message({
        title:"No Diagram",
        message:"Connect to a base to be able to load a diaram script",
        kind:"error",
        seconds:4
    })

  }
}
function open_diagram(){
    window.open("https://dbdiagram.io/d", "_blank");
}
function start(){
    //tag("api-key").innerHTML = `<input type="text" id="api_key" onchange="call({fn:'update_param',value:this.value})">`
    call({fn:"initialize_sql_engine"})


}function reset_app(){
    location.reload();    
}

function query(params){
    const stmt = db.prepare(params.sql);
    stmt.bind();
    while(stmt.step()) { //
      const row = stmt.getAsObject();
    //console.log('Here is a row: ' + JSON.stringify(row));
    }

}
function initialize_sql_engine(){
    // it takes a couple of seconds for initSqlJs to be available after the call to load the library.
    // this function keeps trying to load if it fails.
    try{
      initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.wasm` }).then(function(SQL){
        db = new SQL.Database();
      });
      //scan_tables()
    //  db = new SQL.Database();
    

      db.run("CREATE TABLE test (col1, col2);");
      // Insert two rows: (1,111) and (2,222)
      db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

      // Prepare a statement
      const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
      stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

      // Bind new values
      stmt.bind({$start:1, $end:2});
      while(stmt.step()) { //
        const row = stmt.getAsObject();
      //console.log('Here is a row: ' + JSON.stringify(row));
      }





    }catch(e){
      setTimeout(function() {initialize_sql_engine()}, 1000);
    }
  }



function initialize_panel(params){
    switch(params.panel){
        case "unauthenticated-connection-panel":
            return `
            <table class="menu">
            <tr><td><input type="text" id="new-api-key" placeholder="Airtable API Key" style="width:11rem"/></td><td><span class="material-icons" style="vertical-align: middle;"  onclick="call({fn:'open_url','url':'https://airtable.com/account'});call({fn:'focus',id:'new-api-key'})">key</span></td></tr>
            <tr><td><input type="text" id="new-base-id" placeholder="Airtable Base ID" style="width:11rem" /></td><td><span class="material-symbols-outlined" style="vertical-align: middle;"  onclick="call({fn:'open_url','url':'https://api.airtable.com'});call({fn:'focus',id:'new-base-id'})">database</span></td></tr>
            <tr id="connection-name-row" style="display:none"><td><input type="text" id="new-connection-name" placeholder="Connection Name (optional)" style="width:11rem" /></td><td><span class="material-symbols-outlined" style="vertical-align: middle;"  onclick="call({fn:'message',title:'Session Key', message:'Including a connection name will add this connection to the session.'})">question_mark</span></td></tr>
            <tr><td style="text-align:right"><button onclick="call({fn:'open_connection',key:tag('new-api-key').value,id:tag('new-base-id').value,name:tag('new-connection-name').value})")>Open</button></td><td></td></tr>
            </table>`
    
        case "connections-panel":
            return "I will derive"  

        case "open-session-panel":
            return `
            <table class="menu">
            <tr><td><input type="text" id="session-id" placeholder="Session Key" /></td><td><span class="material-symbols-outlined" style="vertical-align: middle;"  onclick="call({fn:'toggle_password',id:'session-id',icon:this})">visibility</span></td></tr>
            
            <tr id="session-open-row"  ><td style="text-align:right"><button onclick="call({fn:'open_session',key:tag('session-id').value})">Open</button></td><td><span class="material-symbols-outlined" style="vertical-align: middle;"  onclick="call({fn:'message',title:'Conneciton Name', seconds:4, message:'A session key is used to encrypt credentials for storage in this browswer.  It should be at least 10 charactrs and known only to you.  It will allow you to save connections you make here for future use.'})">question_mark</span></td></tr>

            <tr id="session-create-row" style="display:none"><td  style="text-align:right" colspan="2">
            <div style="text-align:left">No session found with that key.<br />Do you want to create a new one?</div>
            <button onclick="call({fn:'create_session',key:tag('session-id').value})")>Yes</button>
            <button onclick="tag('session-create-row').style.display='none';tag('session-open-row').style.display='';tag('session-id').focus()")>No</button></td></tr>
            </table>`
        default:
    }
}

function toggle_password(params){
  if(params.icon.innerHTML==="visibility"){
    tag(params.id).type="password"
    params.icon.innerHTML="visibility_off"
  }else{
    tag(params.id).type="text"
    params.icon.innerHTML="visibility"
  }
  
}



function show_home(params){
  //console.log ("showing home", params)


    //db.run('INSERT INTO employee(first_name,last_name) VALUES(?, ?)', ['randall','boggs'])

             // Prepare a statement
      const sql=tag("sql").value
    //console.log("sql",sql)
      const stmt = db.prepare(sql);

      // Bind new values
      stmt.bind();
      while(stmt.step()) { //
        const row = stmt.getAsObject();
      //console.log('Here is a row: ' + JSON.stringify(row));
      }
        

}

function toggle_panel(params){
  //console.log ("toggle_panel", params)
    toggle(params.panel)
}


function update_param(params){
  //console.log("at update param", params)
}

function create_session(params){
  //console.log("creating session", params)
    // get the cookie that holds all the sessions
    if(params.key.length===0){
        message({
                message:"A session key is required to open or create as session",
                title:"Missing Data",
                kind:"error",
                seconds:4
            })
            tag("session-id").focus()
            return
    }
    const sessions=JSON.parse(get_cookie("sessions"))
    session.location=0
    session.key=params.key.trim()
    session.data=[]
    
    sessions.unshift(CryptoJS.AES.encrypt(JSON.stringify(session.data), session.key).toString())
    set_cookie("sessions",JSON.stringify(sessions),1000)
    
    tag('session-create-row').style.display="none"
    tag('session-open-row').style.display=""
    
}

async function append_connection(params){
    if(session.data){
        // we have a session
        session.data.push({
            key:params.key,
            id:params.id,
            name:params.name
        })
        

        const opt = document.createElement('option')
        opt.value = session.data.length-1
        opt.innerHTML = params.name
        tag("connections").appendChild(opt)
        tag("connections").value=opt.value

        activate_connection({number:opt.value})
    }
}

async function open_connection(params){
    //console.log("opening session", params)
    // get the cookie that holds all the sessions
    if(!(params.key && params.id)){
        message({
                message:"The Airtable API Key and Base ID are required to connect to a specific base.",
                title:"Missing Data",
                kind:"error",
                seconds:4
            })

            if(!params.key){
                tag("new-api-key").focus()
            }else{
                tag("new-base-id").focus()
            }
            return
    }
    // try to conenct
    const api_key = params.key.trim()
    const base_id = params.id.trim().split(".").join("")
    const base = new airtable({ apiKey: api_key }).base(base_id);
    base('metadata').select({maxRecords:1}).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
          //console.log('Retrieved ', record.get('id'), record);
        });
        fetchNextPage();
    }, function done(e) {
      //console.log("e",e)
        if( e && e.error){
            airtable_error(e)
        }else{
            // no error
            connection.id=params.id
            connection.key=params.key
            if(params.name){// a connection name was provided, use it for hte connection
                message({
                    message:"Now connected to " + params.name,
                    title:"Connection",
                    seconds:4
                })
              //console.log("About to append connection")
                append_connection(params)   
                save_session()             
            }else{
                //a conn3ction without a session
                activate_connection(params)
            }
        }
    });
    

}
function airtable_error(e){
    switch(e.error){
        case "AUTHENTICATION_REQUIRED":
            message({
                title:"Authentication Error",
                message:"The Airtable API Key provided was rejected by Airtable.",
                kind:"error",
                seconds:4
            })
            break
        case "NOT_FOUND":
            if(e.message.includes("Could not find table metadata")){
                message({
                    title:"Metadata Not Found",
                    message:'The Airtable Base must first run a script to surface its metatdata.  If it has been run previously, it seem that the table created("metadta") as been deleted.',
                    kind:"error",
                    seconds:10
                    })
    
            }else{
                message({
                    title:"Base Not Found",
                    message:"The Airtable Base ID provided does not match a base available to the API Key specified.",
                    kind:"error",
                    seconds:5
                })
    
            }
            break
        default:
    }

}


function build_connections(params){
    const  html=["Connection "]
    html.push(`<select id="connections" onchange="call({fn:'activate_connection',number:this.value})">`)
  
    for(let i=0;i<session.data.length;i++){
      html.push(`<option value="${i}">${session.data[i].name}</option>`)
    }
    html.push('</select>')
    tag("connections-panel").innerHTML=html.join("")
    tag('connections-panel').style.display="block"
    call({fn:"activate_connection",number:0})
  }
  
  function save_session(params){
  //console.log("session", session)
    if(session.data){
      const sessions=JSON.parse(get_cookie("sessions"))
      sessions[session.location]=CryptoJS.AES.encrypt(JSON.stringify(session.data), "Secret Passphrase").toString()
      set_cookie("sessions",JSON.stringify(sessions),100)
    }
  
  }


function open_session(params){
    //console.log("opening session", params)
    // get the cookie that holds all the sessions
    if(params.key.length===0){
        message({
                message:"A session key is required to open or create as session",
                title:"Missing Data",
                kind:"error",
                seconds:4
            })
            tag("session-id").focus()
            return
    }
    const sessions=JSON.parse(get_cookie("sessions"))
    //console.log(sessions.length)
    let success=false
    for(let i=0; i<sessions.length; i++){
      //console.log(sessions[i],params.key.trim())
        try{
            
            session.data=JSON.parse(CryptoJS.AES.decrypt(sessions[i], params.key.trim()).toString(CryptoJS.enc.Utf8))
            // we we make it to here, we have found the session that belongs to this key
            session.location=i
            session.key=params.key.trim()
            success=true
        }catch(e){
            // could the decrypted string was not valid json, it must not have been encrypted with the key provided
            // nothing to do
        }
    }
    // if we made it here, we did not find a session built with the key
    if(success){
        tag("connection-name-row").style.display=""
        tag("open-session-panel").style.display="none"
        build_connections()

    }else{
      //console.log("No session found with this key")
    
        tag('session-create-row').style.display=""
        tag('session-open-row').style.display="none"
    
    }

}

async function activate_connection(params){
  //console.log("session",session)
  //console.log("connection",connection)
  //console.log("params",params)
    let msg // object to refer to the status message
    if(params.number!==undefined){// this is a connection from the current session
        msg=message({
            title:"Opening " + session.data[params.number].name,
            message:"Establishing connection . . .",
            //seconds:4
        })
      //console.log ("-------------- msg ----------------------")
      //console.log (msg )
      //console.log("session.data[params.number].key",session.data[params.number].key)
        connection.key=session.data[params.number].key
        connection.id=session.data[params.number].id
    }else{ // this is an unnamed connection
        msg=message({
            title:"Opening New Connection",
            message:`${empty_box}Connecting`,
            //seconds:4
        })
      //console.log ("-------------- msg ----------------------")
      //console.log (msg )
        connection.key=params.key
        connection.id=params.id
    }

    // read metadata for connection
    const all_tables={}
    const base = new airtable({ apiKey: connection.key }).base(connection.id);
        base('metadata').select().eachPage(function page(records, fetchNextPage) {
            modify_message({
                message:msg,
                text:`${checked_box}Connected`,
                line: "last"
            })

            records.forEach(function(record) {
              //console.log('Retrieved ', record.get('id'), record);
                if(record.get("select")){
                    if(!all_tables[record.get("table_id")]){
                        all_tables[record.get("table_id")]={
                            id:record.get("table_id"),
                            name:record.get("table_name"),
                            fields:[],
                            index:{}
                        }
                    }
                    
                    const field={
                        id:record.get("field_id"),
                        name:record.get("field_name"),
                        options:record.get("field_options"),
                        sequence:record.get("sequence"),
                    }
                    if(record.get("field_type")){field.type=record.get("field_type")}
                    const limits=record.get("field_value_limits")
                    if(limits && limits.startsWith("references ")){
                        field.references=limits.split(" ")[1]
                    }
                    all_tables[record.get("table_id")].fields.push(field)
                }
            });
            fetchNextPage();

        }, async function done(e) {
          //console.log("e",e)
            if( e && e.error){
                airtable_error(e)
            }else{
                // no error
                connection.id=params.id
                connection.key=params.key
                if(params.name){// a connection name was provided, use it for hte connection
                    message({
                        message:"Now connected to " + params.name,
                        title:"Connection",
                        seconds:4
                    })
                    append_connection(params)   
                    save_session()             
                }

            // organize the fields according to their sequence in the table            
            for(let i=0;i<Object.values(all_tables).length;i++){
                Object.values(all_tables)[i].fields.sort((a, b) => (a.sequence > b.sequence) ? 1 : -1)
                //build the field index
                for(let f=0; f<Object.values(all_tables)[i].fields.length; f++){
                    const field = Object.values(all_tables)[i].fields[f]
                    Object.values(all_tables)[i].index[field.id]=f
                }
            }


          //console.log("all_tables",all_tables)
            // analyze required columns and table structure
            const links={}

            for(let t=0;t<Object.keys(all_tables).length;t++){
                const table_name = Object.values(all_tables)[t].name
                for(let f=0;f<Object.values(all_tables)[t].fields.length;f++){
                    const field=Object.values(all_tables)[t].fields[f]
                    //console.log(table_name, field.name)
                    if(field.options){
                        const options=JSON.parse(field.options)
                       // console.log(options)
                        if(options.linkedTableId){
                            //console.log("$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$%$", links)
                            //console.log(field.name,"reference", all_tables[options.linkedTableId].name, options.prefersSingleRecordLink ? 1 : "*" )
                            links[field.id]={}
                            links[field.id].array=[table_name,field.name,"references", options.prefersSingleRecordLink ? 'one' : "many", all_tables[options.linkedTableId].name,options.inverseLinkFieldId]
                            links[field.id].card_1=options.prefersSingleRecordLink ? 1 : "*"
                            links[field.id].references=options.inverseLinkFieldId
                            links[field.id].table_1= Object.values(all_tables)[t].id
                            links[field.id].table_2= options.linkedTableId
                            
                     
                        }
                    }
               }
            }
            // at this point each entry has only half of the association, need to make the other half
          //console.log("links",links)
            for(let l=0;l<Object.values(links).length;l++){
              //console.log("key", Object.keys(links)[l])
                if(links[Object.values(links)[l].references]){
                    // binary relationship
                    Object.values(links)[l].card_2 =links[Object.values(links)[l].references].card_1
                }else{
                    //unary relationship (self reference)
                    Object.values(links)[l].card_2 = "*"
                }
            }


            const many2many={}
            // now each link knows about both halves of the relationship, through out the many side of all one to many relationships
            const dead_fields=[]
            for(const [field_id, link] of Object.entries(links)){
                if(link.card_1===1 && link.card_2==="*"){
                    // found the one side of a one-to-many relationship.  mark it as a foriegn key
                  //console.log(field_id, link,"------------------------------------------------------------------------------")
                    //console.log(all_tables[link.table].fields[all_tables[link.table].index[field_id]])
                    all_tables[link.table_1].fields[all_tables[link.table_1].index[field_id]].references=all_tables[link.table_2].name
                }else if(link.card_1==="*" && link.card_2===1){
                    // found the many side of a one-to-many relationship.  mark it for exclusion
                    //console.log(field_id, link)
                    //console.log(all_tables[link.table].fields[all_tables[link.table].index[field_id]])
                    dead_fields.push({table:link.table_1,field:all_tables[link.table_1].index[field_id]})
                    //all_tables[link.table_1].fields[all_tables[link.table_1].index[field_id]]=null
                }else if(link.card_1==="*" && link.card_2==="*"){
                    // found the many side of a many-to-many relationship.  
                    const tables=[]
                    const fields=[]
                    
                    tables.push(all_tables[link.table_1].name)
                    tables.push(all_tables[link.table_2].name)

                    fields.push(link.table_1 + "-" + field_id)
                    fields.push(link.table_2 + "-" + link.references)

                    tables.sort()
                    fields.sort()
                    if(!many2many[tables.join("_")]){
                        many2many[tables.join("_")]={links:{}}
                    }
                    f0=fields[0].split("-")
                    f1=fields[1].split("-")
                    many2many[tables.join("_")].links[fields.join("-")] = {
                        //name1:all_tables[f0[0]].name + "-" + all_tables[f0[0]].index[f0[1]] + "_" ,
                        name1:all_tables[f0[0]].name + "_" + all_tables[f0[0]].fields[all_tables[f0[0]].index[f0[1]]].name + "_" +  all_tables[f1[0]].name,
                        name2:all_tables[f1[0]].name + "_" + all_tables[f1[0]].fields[all_tables[f1[0]].index[f1[1]]].name + "_" +  all_tables[f0[0]].name,
                    }
                    //many2many[tables.join("-")].links[fields.join("-")].push("a")
                    // link info has been moved to the many2many array, delete it from the base tables
                    //dead_fields.push({table:link.table_1,field:all_tables[link.table_1].index[field_id]})
                    //all_tables[link.table_1].fields[all_tables[link.table_1].index[field_id]]=null
                  //console.log(tables, field_id, link.references)
                }
            }
          //console.log("dead_fields",dead_fields)

            // mark fields to be used for many-to-many associations
          //console.log("many2many",many2many)
          //console.log(Object.entries(many2many))
            for(const [name,relationship] of Object.entries(many2many)){
              //console.log("===================================")
              //console.log(name, relationship, Object.values(relationship.links).length)
                if(Object.values(relationship.links).length===1){
                    const data=Object.keys(relationship.links)[0].split("-")
                  //console.log("found a simple many-to-many relationship", data)
                    // field to keep
                    const keep = all_tables[data[0]].fields[all_tables[data[0]].index[data[1]]]
                    all_tables[data[0]].fields[all_tables[data[0]].index[data[1]]] = {table:name, name:keep.name, col1:all_tables[data[0]].name+"_id", col2:all_tables[data[2]].name+"_id"}
                    // field to forget
                  //console.log(' forget it', all_tables[data[2]].fields[all_tables[data[2]].index[data[3]]])
                    all_tables[data[2]].fields[all_tables[data[2]].index[data[3]]] = {}
                }else{
                    // we have a multiple many-to-many relationship between the same two tables.  process them all.
                  //console.log("relationship",relationship.links)
                    for(const [key,names] of Object.entries(relationship.links)){
                        //table name cannot just be the composite of the two tables.  pick the shorter table
                      //console.log("relationship.links",key, names)
                        const data=key.split("-")
                        if(names.name1.length > names.name2.length){
                            const keep=all_tables[data[0]].fields[all_tables[data[0]].index[data[1]]]
                            all_tables[data[0]].fields[all_tables[data[0]].index[data[1]]] = {table:names.name2, name:keep.name, col1:all_tables[data[0]].name+"_id", col2:all_tables[data[2]].name+"_id"}// field to keep
                            all_tables[data[2]].fields[all_tables[data[2]].index[data[3]]] = {}// field to forget
                        }else{
                            const keep=all_tables[data[2]].fields[all_tables[data[2]].index[data[3]]]
                            all_tables[data[0]].fields[all_tables[data[0]].index[data[1]]] = {}// field to forget
                            keep=all_tables[data[2]].fields[all_tables[data[2]].index[data[3]]] = {table:names.name1, name:keep.name, col1:all_tables[data[0]].name+"_id", col2:all_tables[data[2]].name+"_id"}// field to keep
                        }
                        
                    }
                    // console.log("relationship.links",relationship.links[Object.keys(relationship.links)[0]])
                    // console.log("relationship.links",relationship.links[Object.keys(relationship.links)[1]])                    
                }    


            

            }

            // mark fields for exclusion  (the many side of one to many)
            for(const field of dead_fields){
                all_tables[field.table].fields[field.field]={}
            }

            

          //console.log("many2many",many2many)
          //console.log("links",links)
          //console.log("all_tables edited",all_tables)

            
            const diagram=[] // create DBML script for diagram
            for(const [key,val]of Object.entries(all_tables)){
                diagram.push(diagram_table({table:val.name, fields:val.fields}))
            }
            schema=diagram.join("\n")

            // create and populate tables
            for(const [key,val]of Object.entries(all_tables)){
              //console.log(key,val.fields)
                const msg_line=modify_message({
                    message:msg,
                    text:empty_box + val.name,
                    line: "new"
                })
                tables_remaining++
                create_table({table:val.name, fields:val.fields, base:base, msg:msg_line})
                //break
            }
            



        }
    });
    //airtable_error({error:"METADATA_NOT_FOUND"})
    hide_menu()

}




function diagram_table(params){
//console.log("params",params)
 //console.log(params.table,params.fields)
   
   const many={}
  
    const dbml=[`Table "${params.table}"{\n  "${params.table}_id" " "`]
    for(const field of params.fields){
        if(field.table){// this is the name of the table to hold the relationship
            many[field.name]={
                table:field.table,
                field_names:[field.col1, field.col2]
            }
            dbml.unshift(`Table "${field.table}"{\n  "${field.col1}" " " [ref: > "${field.col1.slice(0, -3)}"."${field.col1}" ]\n  "${field.col2}" " " [ref: > "${field.col2.slice(0, -3)}"."${field.col2}" ]\n}`)
        }else if(field.id){// fileds that have been made null are ignored
            let references_clause=""
            if (field.references){
                references_clause=` [ref: > "${field.references}"."${field.references}_id"]`
            }
            dbml.push(`  "${field.name}" " " ${references_clause}`)
        }
    }
    dbml.push("}")
    return dbml.join("\n")
      
  
}


function create_table(params){
  //console.log("params",params)
 //console.log(params.table,params.fields)
   
   const many={}
    // loop across the fields to find the one that have many-to-many data


    try{
    db.run("commit")
    }catch(e){
      // nothing to do, we just tried a commit in case there was
      // an open transaction from a user's failed query.
      // we expect the commit to fail almost always
    }
    window.local_query_data_loded=true
  
      const create_table=['create table "']
      create_table.push(params.table)
      create_table.push(`" ("${params.table}_id",`)
      
      const fields=[]
      const q=["?"]
      const field_names=[]
      for(const field of params.fields){
        if(field.table){// this is the name of the table to hold the relationship
            many[field.name]={
                table:field.table,
                field_names:[field.col1, field.col2]
            }

            db.run("begin transaction")
            db.run(`drop table if exists "${field.table}"`)
            db.run(`create table "${field.table}" ("${field.col1}" float, "${field.col2}" float)`)
            db.run("commit")//creating table


        }else if(field.id){// fileds that have been made null are ignored
            field_names.push(`"${field.name}"`)
            q.push("?")
            fields.push(`"${field.name}" float`)
        }
        
      }
      create_table.push(fields.join(", "))
      create_table.push(")")
      //console.log(create_table.join(""))
      db.run("begin transaction")
      db.run(`drop table if exists "${params.table}"`)
    //console.log(create_table.join(""))
      db.run(create_table.join(""))
      db.run("commit")//creating table

      params.base(params.table).select().eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            
            // set up data for insert
            const one_row=[record.id]
            //console.log('Retrieved ', record.fields, field_names);
            for(const field of params.fields){
                if(field.table){// this is the name of the table to hold the relationship
                    const data=many[field.name]
                    if(record.fields[field.name]){
                        // we ahave data
                        //console.log("data",data)
                        //console.log("field.name",field.name)
                        //console.log("values", record.fields[field.name])
                        const sql=`INSERT INTO "${data.table}"("${data.field_names.join('","')}") VALUES (?, ?)`
                        for(const val of record.fields[field.name]){
                            const one_row=[record.id,val]
                            //if(data.table==="Store"||data.table==="Container"||data.table==="Inventory Item"){
                               // console.log(data.table, "sql", sql, one_row)
                            //}
                            db.run(sql, one_row);
                          //console.log("success")
                        }
                        
    
                    }
                }else if(field.id){// null fields are ignored
                    let val=record.fields[field.name]
                    if(val===undefined){
                        val=""
                    }else if(field.type==="dateTime"){
                        val=val.replace("T", " ").replace("Z", "")
                    }
                    
                    one_row.push(val)
                    // q.push("?")
                //  //console.log("one_row", one_row)
                }

            }
            const sql=`INSERT INTO "${params.table}"("${params.table}_id",${field_names.join(",")}) VALUES (${q.join(",")})`
            //console.log("sql", sql, one_row)
            db.run(sql, one_row);

            //db.run('INSERT INTO employee(first_name,last_name) VALUES(?, ?)', ['randall','boggs'])


        });
        fetchNextPage();

    }, function done(e) {      
      //console.log("done with ", params.table)
        modify_message({
            message:params.msg,
            text:checked_box + params.table,
            close_line_in:5
        })
        tables_remaining--
        check_for_done({msg:params.msg})
        
    })
      
  }

  function check_for_done(params){
    if(!tables_remaining){
        modify_message({
            line:"new",
            message:params.msg,
            text:"Success.",
            close_message_in:5
        })
    }
  }

  function copy_metadata_script(){
    copyToClipboard(`/*
    This script builds a table called "metadata" that holds 
    information about each field in each table of the base.

    If a table by that name already exists, the script checks
    its metadata to see if it was created by this script.  If
    so, it overwrites the data; if not, it alerts the user to
    rename or delete the other table and try again.
*/    
const unselected={} // used to remember which metadata records have been maked for selection on a table re-build
const structure={
    name:"metadata",
    fields:[
        {name:"id",type:"singleLineText",desc:"Combination if the table name and the field name"},
        {name:"table_id",type:"singleLineText",desc:"The internal Airtable identifier for the table in this base (" + base.id + ")"},
        {name:"table_name",type:"singleLineText",desc:"The user-readable name of the table"},
        {name:"field_id",type:"singleLineText",desc:"The internal Airtable identifier for the field"},
        {name:"field_name",type:"singleLineText",desc:"The user-readable name of the field"},
        {name:"field_description",type:"singleLineText",desc:"The short-text description of the field"},
        {name:"field_type",type:"singleLineText",desc:"The field's data type"},
        {name:"field_value_limits",type:"singleLineText",desc:"Various options that describe how field accepts data"},
        {name:"field_options",type:"singleLineText",desc:"All options of the field"},
        {name:"sequence",type:"number",desc:"The position of a field in the table",options:{precision:0}},
        {name:"select",type:"checkbox",desc:"Use this column to mark which entries are relevant for a particular operation that consumes the information in this metadata table",options:{icon:"check",color:'blueBright'}},
    ]
}

output.markdown('#### Collecting metadata from this base.');
let proceed=true
let metadata_exists = false
let table
for (table of base.tables) {
    if(table.name==="metadata"){
        metadata_exists = true
        break
    }
}

if(metadata_exists){
    // check to see if the metadata table looks like one created by this script
    let table = base.getTable("metadata")
    const fields=table.fields
    for(let x=0;x<fields.length;x++){
        if(!(fields[x].name===structure.fields[x].name && fields[x].description===structure.fields[x].desc)){
            output.markdown('This base already has a table named "metadata" and it looks as though it was not created by this script.  Please rename (or delete) that table and try again.');
            proceed=false
            break
        }
    }
    if(proceed){
        // The table already exists and we are OK to reuse it.  Let's remember the status of the "select" column
        let query = await table.selectRecordsAsync({fields: ["id","field_id","select"]});
        let filteredRecords = query.records.filter(rec => {
            const unchecked=!rec.getCellValue('select')
            if(unchecked){
                unselected[rec.getCellValue('field_id')]=true
            }
            return unchecked
        })
        
        //Let's delete the existing data
        output.markdown("Removing existing metadata information.");
        
        query = await table.selectRecordsAsync({fields: []});
        let records = query.records
        let batchMax = 50
        while (records.length > 0) {
            await table.deleteRecordsAsync(records.slice(0, batchMax))
            records = records.slice(batchMax)
        }
    }
}else{
    // the table does not yet exist, let's build it
    output.markdown("Building table **metadata**")
    const columns=[]
    for(const field of structure.fields){
        const col={
            name:field.name,
            type:field.type,
            description:field.desc
        }
        if(field.options){
            col.options=field.options
        }
        columns.push(col)
    }
    await base.createTableAsync("metadata", columns)
}

if(proceed){
    const metadata=base.getTable("metadata")   
    const results = await metadata.selectRecordsAsync();
    // filter out the metadata table from our search
    const tables = base.tables.filter((t) => {
      return t.id !== metadata.id;
    });
    // create a array to hold records to create
    var creates = [];
    // iterate through each table
    for (let t of tables) {
        let sequence=1
        output.markdown('Processing **' + t.name + "**");
        let fields = t.fields;
        for (let f of fields) {
            let options = ""
            if(f.options){options=JSON.stringify(f.options)}
            let payload = {
                fields: {
                    [structure.fields[0].name]: "["+t.name + "].[" + f.name+"]",
                    [structure.fields[1].name]: t.id,
                    [structure.fields[2].name]: t.name,
                    [structure.fields[3].name]: f.id,
                    [structure.fields[4].name]: f.name,
                    [structure.fields[5].name]: f.description,
                    [structure.fields[6].name]: f.type,
                    [structure.fields[7].name]: getFieldOptions(f),
                    [structure.fields[8].name]: options,
                    [structure.fields[9].name]: sequence++,
                    [structure.fields[10].name]: !unselected[f.id],
                },
            };
            creates.push(payload);
        }
    }

    while (creates.length > 0) {
        await metadata.createRecordsAsync(creates.slice(0, 50));
        creates = creates.slice(50);
    }
    output.markdown('**Done.**  Detailed information about the columns in each of your tables can be found in the table named "metadata"');
}

// some fields have more data about them than others
// we can use this function to extract that information
// right now, this only pulls in single/multi select options and the table that a linked record links to
// but it could be expanded to also include details about formulas and other computed fields
function getFieldOptions(field) {

if (field.type === "singleSelect" || field.type === "multipleSelects") {
return field.options.choices
  .map((i) => {
    return i.name;
  })
  .join(", ");
} else if (field.type === "multipleRecordLinks") {
return "references " + base.getTable(field.options.linkedTableId).name;
}
return null;
}`)
console.log("connection",connection)
message({
    title:"Script Copied",
    message:`You metadata script has been copied. Now open <a href="https://airtable.com/${connection.key||""}" target="_blank">airtable.com</a> and run the scrip using the Scripting Extension".`,
    seconds:10
})
  }