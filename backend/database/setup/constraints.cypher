CREATE CONSTRAINT unique_task_taskId IF NOT EXISTS
FOR (t:Task)
REQUIRE t.taskId IS UNIQUE

CREATE CONSTRAINT unique_enum_name IF NOT EXISTS
FOR (e:Enum)
REQUIRE e.name IS UNIQUE