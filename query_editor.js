async function execute() {
    
    const editor = ace.edit("editor")

    //console.log("editor:",editor)
       
        const result=document.getElementById("result-wrapper")
        try{
            const sql=editor.getSession().getValue()
            console.log("sql",sql)
            let stmt = db.prepare(sql);

            const table=['<table class="result" style="border-spacing: 0;"><thead><tr>']

            

            // Bind new values
            stmt.bind();
            console.log("stmt", stmt)
            let columns = stmt.getColumnNames()
            
            if(columns.length===0){
                // this was an action query
                stmt.step()
                stmt = db.prepare('select changes() as "Records_affected"')
                stmt.bind();
                columns = stmt.getColumnNames()
            }

            for(const col of columns){
                table.push("<th>"+col+"</th>")
            }
            table.push("</tr></thead><tbody>")
            while(stmt.step()) { //
                const row = stmt.getAsObject()
                
                const tr=["<tr>"]
                for(col of columns){
                    if(row[col]){
                        tr.push("<td>" + row[col] + "</td>")
                    }else{
                        tr.push("<td>&nbsp;</td>")
                    }
                }
                tr.push("</tr>")
                table.push(tr.join(""))



                //console.log('Here is a row: ' + JSON.stringify(row))
            }
                        //console.log("columns",columns)
            table.push("</tr></tbody></table>")
            //console.log(table.join(""))
            result.innerHTML=table.join("")





        }catch(e){
            message({
                message:e.message,
                title:"Query Error",
                kind:"error",
                //seconds:4
            })
        }
}



