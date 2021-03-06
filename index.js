require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')

const app = express();

app.use(bodyParser.urlencoded({useNewUrlParser: true, extended: true}));
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

const mongoose = require('mongoose');
let uristring = process.env.MONGODB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/event_planner';

mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});

const Event = require('./models/event.model.js');
const events = require('./controllers/event.controller.js');

app.get("/", (req, res) => {
    res.json({status: "success", message: "Welcome To Testing API"});
});

app.get('/api/test', (req, res) => {

    // Generate some passwords
    const test = {test: 'test'};

    // Return them as json
    res.json(test);

    console.log(`Sent test`);
});

app.post('/api/events/save', events.save);
app.get('/api/events/all', events.findAll);

app.get('/api/events/find/:id', function (req, res) {
    console.log('ID: ' + req.params.id);
})

app.delete('/api/events/delete/:eventid', function (req, res) {
    Event.findByIdAndRemove({_id: req.params.eventid}, function (err, event) {
        if (err) {
            console.log('Error! ' + err.toString())
        } else {
            console.log('Event deleted')
        }
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local');

app.use(require('express-session')({
    name: 'session-id',
    secret: '123-456-789',
    saveUninitialized: false,
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

let User = require('./models/user.model.js');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/api/signup', (req, res, next) => {
    User.register(new User({
            username: req.body.username
        }), req.body.password, (err, user) => {
            if (err) {
                res.status(500);
                res.json({
                    err: err
                });
                console.log('err');
                console.log(JSON.stringify(err));
            } else {
                passport.authenticate('local', req, res, () => {
                    User.findOne({
                        username: req.body.username
                    }, (err, person) => {
                        if(err){
                            res.status(500);
                            res.json(err);
                        } else {
                            console.log("Succesfully created new user");
                            res.status(200);
                            res.json({
                                success: true,
                                status: 'Registration Successful!',
                            });
                        }
                    });
                })
            }
        })

});
app.post('/api/login', passport.authenticate('local'), (req, res) => {
    User.findOne({
        username: req.body.username
    }, (err, person) => {
        res.setHeader('Content-Type', 'application/json');
        if(err){
            res.status(400);
            res.json({
                success: false,
                status: "Login Failed!"
            })
        } else {
            res.status(200);
            res.json({
                success: true,
                status: 'You are successfully logged in!'
            });
        }
    })
});
app.get('/api/logout', (req, res, next) => {
    if (req.session) {
        req.logout();
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            } else {
                res.clearCookie('session-id');
                res.json({
                    message: 'You are successfully logged out!'
                });
            }
        });
    } else {
        var err = new Error('You are not logged in!');
        err.status = 403;
        res.status(403);
        next(err);
    }
});
app.get('/api/currentuser', function(req, res) {
    res.json({ username: req.user.username });
});

app.get('/api/events/all/:username', events.findAllByUser);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Server listening on ${port}`);

module.exports = app;