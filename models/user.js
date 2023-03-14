/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");





/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    // make sure this works!
    const result = await db.query(
          `INSERT INTO users (
             username,
             password,
             first_name,
             last_name,
             phone,
             join_at,
             last_login_at)
           VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
           RETURNING username, password, first_name, last_name, phone`,
        [
          username,
          password,
          first_name,
          last_name,
          phone
        ]);

    return result.rows[0];
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      return user.password === password;
    }

    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username`,
      [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
       FROM users`
    );

    return result.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
              m.body,
              m.sent_at,
              m.read_at,
              t.username,
              t.first_name,
              t.last_name,
              t.phone
       FROM messages AS m
         JOIN users AS t ON m.to_username = t.username
       WHERE m.from_username = $1`,
      [username]
    );

    return result.rows.map(m => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
      to_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      }
    }));
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT m.id,
              m.body,
              m.sent_at,
              m.read_at,
              f.username,
              f.first_name,
              f.last_name,
              f.phone
       FROM messages AS m
         JOIN users AS f ON m.from_username = f.username
       WHERE m.to_username = $1`,
      [username]
    );

    return result.rows.map(m => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
      from_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      }
    }));
  }
}


module.exports = User;