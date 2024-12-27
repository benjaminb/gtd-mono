# Database Design

## Node labels


**System-wide**
* `Enum`: a single node representing an enum with properties:


**User-specific**
* `Task`: nodes representing tasks
* `User`: stores account information for a user

**Task-specific**
* `TaskProperty:UserTaskProperty|BaseTaskProperty|AutoTaskProperty`

## System Node Types

### `Enum`

Nodes with `Enum` label store allowable values for a particular property. 

#### `Enum` Node Properties
* `name: str`
* `values: array`

#### `Enum` Nodes In Use
* `Countries: ['United States', 'Canada', ...]`
* `Langauges: ['English']` supported languages
* `SupportedTaskPropertyDtypes: ['string', 'int', 'float', 'datetime', ...]`
* `UserRoles: ['user', 'admin']`
* `Timezones: [...]`

## User Node Types

### `Task` Nodes
`Task` nodes contain a few properties necessary for all tasks, listed below. 

#### Properties
* `id: string | int`
* `name: text`
* `done: bool`


#### Edges

`Task` nodes use `HAS_SUBTASK` edges to denote children, e.g. an individual task contributing to a project or a project contributing to a goal. Note that `Task` nodes can serve any heirarchy: a goal, a project, subproject, etc. Tasks with no `HAS_SUBTASK` relationships are therefore leaf nodes, most likely to be the next actionable items.

* `(:Task)-[:HAS_SUBTASK]->(:Task)` 
* `(:Task)-[:HAS_PROP]->[:TaskProperty]`

### `TaskProperty` Nodes
#### Sublabels `UserTaskProperty`, `BaseTaskProperty`, `AutoTaskProperty`

Each property node gets labeled `TaskProperty` and one of the sublabels, so we can query for all properties or just one of the more specific types. 

In the application and at query time, we must ensure that the `value` set for any task property matches the value stored in the user's `TaskPropertyDefinition` node. For instance, if a user intends a `priority` property to have an `int` value it would cause errors to insert the string `"high priority"`.

#### Properties
* `name: str`
* `value: any`

#### Edges
* `(:Task)-[:HAS_PROP]->[:TaskProperty]`
* `(:TaskProperty)-[:DEFINED_BY]->[:TaskPropertyDefinition]` when created, a task property should link to its defining node. This way on updates to the task property's value we can validate the data in constant time. NOTE: does creating an index on TaskPropertyDefinition.name obviate this?

#### `BaseTaskProperty` Nodes

Predefined task properties. A user may or may not wish to use these properties, but they are either exceedingly common or useful to the suggestion engine to generate quality completions and insights.

* `name: string`
* `notes: string`
* `done: bool`
* `Done At: datetime | null`
* `Created At: datetime`
* `Start After: datetime` -- user can choose to hide this task until this datetime
* `Last Modified: datetime`
* `Time Logged: duration`
* `Estimated Time Remaining: duration`
* `tags: [string]`

### `TaskPropertyDefinition` Nodes

#### Properties
`name: str`
`dtype: enum`
`createdAt: datetime`
`lastModified: datetime`

## User Node Types

### `User` node
Core data stored on the node. Preferences such as UI settings and task property visibility stored on `UserPreference` nodes.
* `userName: string`
* `firstName: string`
* `lastName: string`
* `password: string`
* `email: string`
* `phone: string` -- E.164 format
* `profileImage: string` (url)
* `createdAt: datetime`
* `lastLogin: datetime`
* `role: string` enum 
* `status: string` enum
* `address: string`
* `city: string`
* `country: string` enum
* `timezone: string` enum
* `language: string` enum


## Relations

### `HAS_PREFERENCE`
`(u:User)-[:HAS_PREFERENCE]->(p:UserPreference)`: indicates that user `u` has preference `p`

### `HAS_TASK`
`(u:User)-[:HAS_TASK]->(t:Task)`: indicates user `u` has task `t`

### `DEFINED_TASK_PROPERTY`
`(:User)-[:DEFINED_TASK_PROPERTY]->(:TaskPropertyDefinition)`: indicates user or the suggestion system has defined a task property datatype (e.g. `(d:TaskPropertyDefinition {name: deadline, dtype: datetime})`)

### `UserPreference` node
* `name: str` name of the preference setting
* `value: any` 
