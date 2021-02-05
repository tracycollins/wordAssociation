const passport = require("passport");
// var FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
// var GithubStrategy = require("passport-github2").Strategy;
// var GoogleStrategy = require("passport-google-oauth2").Strategy;
// var InstagramStrategy = require("passport-instagram").Strategy;
// var User = require("./user.js");
const config = require("./oauth.js");
const userServer = require("@threeceelabs/user-server-controller");

function jsonPrint(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
}


// module.exports = passport.use(new FacebookStrategy({
//   clientID: config.facebook.clientID,
//   clientSecret: config.facebook.clientSecret,
//   callbackURL: config.facebook.callbackURL
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOne({ oauthID: profile.id }, function(err, user) {
//       if(err) {
//         console.log(err);  // handle errors!
//       }
//       if (!err && user !== null) {
//         done(null, user);
//       } else {
//         user = new User({
//           oauthID: profile.id,
//           name: profile.displayName,
//           created: Date.now()
//         });
//         user.save(function(err) {
//           if(err) {
//             console.log(err);  // handle errors!
//           } else {
//             console.log("saving user ...");
//             done(null, user);
//           }
//         });
//       }
//     });
//   }
// ));

module.exports = passport.use(new TwitterStrategy({

  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.twitter.callbackURL

  },

  function(accessToken, refreshToken, profile, done) {
    
    console.log("+++++ AUTHENTICATION"
      + "\nACCESS TOKEN:  " + accessToken
      + "\nREFRESH TOKEN: " + refreshToken
      + "\nPROFILE\n" + jsonPrint(profile._json)
    );

// exports.convertRawUser = function (rawUser, tweetId, callback) {

    userServer.convertRawUser(profile._json, null, function(err, userObj){

      userServer.findOneUser(userObj, {setMentions: false, noInc: true}, function(err, user) {
        if(err) {
          console.log(err);  // handle errors!
        }
        if (!err && user !== null) {

          console.log("AUTH TWITTER USER\n" + jsonPrint(user));

          done(null, user);

        } 
        else {
          user = new User({
            oauthID: profile.id,
            name: profile.displayName,
            created: Date.now()
          });
          user.save(function(err) {
            if(err) {
              console.log(`AUTHENTICATION ERROR: @${userObj.screenName}`)
              console.log({err}); // handle errors!
            } else {
              console.log("saving user ...");
              done(null, user);
            }
          });
        }
      });

    });
  }
));

// passport.use(new GithubStrategy({
//   clientID: config.github.clientID,
//   clientSecret: config.github.clientSecret,
//   callbackURL: config.github.callbackURL
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOne({ oauthID: profile.id }, function(err, user) {
//       if(err) {
//         console.log(err);  // handle errors!
//       }
//       if (!err && user !== null) {
//         done(null, user);
//       } else {
//         user = new User({
//           oauthID: profile.id,
//           name: profile.displayName,
//           created: Date.now()
//         });
//         user.save(function(err) {
//           if(err) {
//             console.log(err);  // handle errors!
//           } else {
//             console.log("saving user ...");
//             done(null, user);
//           }
//         });
//       }
//     });
//   }
// ));

// passport.use(new GoogleStrategy({
//   clientID: config.google.clientID,
//   clientSecret: config.google.clientSecret,
//   callbackURL: config.google.callbackURL
//   },
//   function(request, accessToken, refreshToken, profile, done) {
//     User.findOne({ oauthID: profile.id }, function(err, user) {
//       if(err) {
//         console.log(err);  // handle errors!
//       }
//       if (!err && user !== null) {
//         done(null, user);
//       } else {
//         user = new User({
//           oauthID: profile.id,
//           name: profile.displayName,
//           created: Date.now()
//         });
//         user.save(function(err) {
//           if(err) {
//             console.log(err);  // handle errors!
//           } else {
//             console.log("saving user ...");
//             done(null, user);
//           }
//         });
//       }
//     });
//   }
// ));

// passport.use(new InstagramStrategy({
//   clientID: config.instagram.clientID,
//   clientSecret: config.instagram.clientSecret,
//   callbackURL: config.instagram.callbackURL
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOne({ oauthID: profile.id }, function(err, user) {
//       if(err) {
//         console.log(err);  // handle errors!
//       }
//       if (!err && user !== null) {
//         done(null, user);
//       } else {
//         user = new User({
//           oauthID: profile.id,
//           name: profile.displayName,
//           created: Date.now()
//         });
//         user.save(function(err) {
//           if(err) {
//             console.log(err);  // handle errors!
//           } else {
//             console.log("saving user ...");
//             done(null, user);
//           }
//         });
//       }
//     });
//   }
// ));
