'use strict'

// Environment variables
require('dotenv').config();

// Application Dependencies
const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');

// Database Setup
if (!process.env.DATABASE_URL) {
  throw 'DATABASE_URL is missing!';
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // JSON body parser

app.use(methodOverride('_method'));

// Specify a directory for static resources
app.use(express.static('./public'));

// CORS would go here if we needed it

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
app.get('/', getTasks);
app.get('/tasks/:task_id', getOneTask);
app.get('/add', showAddTaskForm);
app.post('/add', addTask);
app.delete('/tasks/:task_id', deleteOneTask);

app.get('/tasks/:task_id/edit', editOneTask);

app.get('/books', require('./modules/books'));

app.get('*', (req, res) => res.status(404).send('This route does not exist'));

// Error Handler Middleware
app.use((err, req, res, next) => {
  handleError(err, res);
});

client.connect()
  .then(() => {
    console.log('PG is listening!');

    app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
  })
  .catch(err => { throw err; })


// Route Handlers
function getTasks(request, response) {
  const { sort_by } = request.query;
  const SQL = `
    SELECT *
    FROM Tasks
    ORDER BY $1 ASC;
  `;

  client.query(SQL, [sort_by || 'due'])
    .then(results => {
      const { rowCount, rows } = results;
      console.log('/ db result', rows);

      // response.send(rows);
      response.render('index', {
        tasks: rows
      });
    })
    .catch(err => {
      handleError(err, response);
    });
}

function getOneTask(request, response) {
  // request.params.task_id
  const { task_id } = request.params;

  const SQL = `
    SELECT *
    FROM Tasks
    WHERE id = $1
    LIMIT 1;
  `;

  client.query(SQL, [task_id])
    .then(results => {
      const { rows } = results;

      if (rows.length < 1) {
        handleError('Task Not Found', response)
      } else {
        response.render('pages/detail-view', {
          task: rows[0]
        });
      }
    })
    .catch(err => handleError(err, response))
}

function showAddTaskForm(request, response) {
  response.render('pages/add-view');
}

function addTask(request, response) {
  console.log('POST /add', request.body);
  const { title, description, category, contact, status } = request.body;

  const SQL = `
    INSERT INTO tasks (title, description, category, contact, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING Id
  `;
  const values = [title, description, category, contact, status];

  // POST - REDIRECT - GET
  client.query(SQL, values)
    .then(results => {
      let id = results.rows[0].id;
      response.redirect(`/tasks/${id}`);
    })
    .catch(err => handleError(err, response))
}

function deleteOneTask(request, response) {
  console.log('DELETE', request.params.task_id)
  const SQL = `
    DELETE FROM Tasks
    WHERE Id = $1
  `
  client.query(SQL, [request.params.task_id])
    .then(() => {
      response.redirect('/');
    })
    .catch(err => handleError(err, response));
}

function editOneTask(request, response) {
  const { task_id } = request.params;
  const SQL = `
    SELECT *
    FROM Tasks
    WHERE Id = $1
  `;
  client.query(SQL, [task_id])
    .then(results => {
      const task = results.rows[0];
      const viewModel = {
        task
      };
      response.render('pages/edit-view', viewModel);
    })
}

function handleError(err, response) {
  let viewModel = {
    error: err,
  };
  response.status(500).render('pages/error-view', viewModel);
}
