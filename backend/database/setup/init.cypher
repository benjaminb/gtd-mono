LOAD CSV WITH HEADERS
FROM "file:///enums.csv" AS row
MERGE (:Enum {name:row.name, values:split(row.values, "|")})

LOAD CSV WITH HEADERS
FROM "file:///tasks.csv" AS row
MERGE (:Task {
    taskId: row.taskId, 
    name: row.name, 
    done: CASE row.done WHEN 'true' THEN true ELSE false END
})