CREATE INDEX enum_name_index IF NOT EXISTS
FOR (e:Enum) ON (e.name)

CREATE INDEX taskField_value_index IF NOT EXISTS
FOR (f:TaskField) ON (f.value)