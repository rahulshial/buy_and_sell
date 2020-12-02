/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router  = express.Router();
const msgHelpers = require('../db/helper/conversations.js');
const userHelpers = require('../db/helper/users.js');

const assembleMessageGroups = (rows) => {
  const results = [];
  let messages;
  let itemId;
  for (const row of rows) {
    if (itemId !== row.item_id) {
      itemId = row.item_id;
      if (messages) {
        results.push(messages);
      }
      messages = [];
    }
    messages.push(row);
  }
  results.push(messages);
  return results;
};

module.exports = function(db) {
  router.get("/", (req, res) => {
    const userId = req.session[`userId`];
    userHelpers.getUserById(db, userId)
      .then(data => {
        const isAdmin = data.rows[0].is_admin;
        const userName = data.rows[0].name;
        msgHelpers.getAllConversationsByUser(db, userId, isAdmin)
          .then(data => {
            const messages = data.rows;
            const messageGroups = assembleMessageGroups(messages);
            const templateVars = {
              groups: messageGroups,
              userName: userName,
              userId,
              isAdmin };
            res.render('conversations', templateVars);
          })
          .catch(err => {
            res
              .status(500)
              .json({ error: err.message });
          });
      });
  });

  return router;
};