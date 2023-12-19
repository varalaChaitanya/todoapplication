const express = require("express");

const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbpath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("the server running on http://localost:3000/");
    });
  } catch (e) {
    console.log(`the DB error is:${e.message}`);
    process.exit(1);
  }
};

initializeDb();

const datareturn = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  const get_query_id = `SELECT * FROM todo WHERE id=${todoId};`;
  let get_query = await db.get(get_query_id);
  response.send(datareturn(get_query));
});

app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status } = request.body;
  console.log(todo);
  const insert_query = `INSERT INTO todo(id, todo, priority, status) VALUES(${id}, "${todo}", "${priority}", "${status}");`;
  await db.run(insert_query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let update_column = "";
  const request_body = request.body;
  switch (true) {
    case request_body.todo != undefined:
      update_column = "Todo";

      break;

    case request_body.priority != undefined:
      update_column = "Priority";

      break;

    case request_body.status != undefined:
      update_column = "Status";
      break;
  }
  const prevTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  let previousTodo = await db.get(prevTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const upd_query = `UPDATE
   todo 
   SET
   todo ='${todo}',
    priority='${priority}',
   status='${status}'
    
   WHERE 
   id=${todoId};`;
  await db.run(upd_query);
  response.send(`${update_column} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const delete_query = `DELETE FROM todo WHERE id=${todoId};`;

  await db.run(delete_query);
  response.send(`Todo Deleted`);
});

module.exports = app;
