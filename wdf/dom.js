var parse_table = (t) =>  [].map.call(t.rows,(r)=>[].map.call(r.cells, (c)=>c.textContent));