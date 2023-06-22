const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let database;
const app = express();
app.use(express.json());

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "twitterClone.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error is ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//api 1

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const checkUser = `select username from user where username = '${username}';`;
  const dbUser = await database.get(checkUser);
  console.log(dbUser);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const requestQuery = `insert into user(name, username, password, gender) values(
                '${name}', '${username}', '${hashedPassword}', '${gender}');`;
      await database.run(requestQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//api 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `select * from user where username = '${username}';`;
  const dbUserExist = await database.get(checkUser);
  if (dbUserExist !== undefined) {
    const checkPassword = await bcrypt.compare(password, dbUserExist.password);
    if (checkPassword === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "secret_key");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//authentication jwt token

const authenticationToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }

  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "secret_key", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//api 3

app.get(
  "/user/tweets/feed/",
  authenticationToken,
  async (request, response) => {
    let { username } = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await database.get(getUserIdQuery);

    const getFollowerIdsQuery = `select following_user_id from follower
        where follower_user_id = ${getUserId.user_id}`;
    const getFollowerIds = await database.all(getFollowerIdsQuery);

    const getFollowerIdsSimple = getFollowerIds.map((eachUser) => {
      return eachUser.following_user_id;
    });

    const getTweetQuery = `select user.username, tweet.tweet, tweet.date_time as dateTime
            from user inner join tweet
            on user.user_id = tweet.user_id where user.user_id in (${getFollowerIdsSimple})
            order by tweet.date_time desc limit 4;`;
    const responseResult = await database.all(getTweetQuery);
    response.send(responseResult);
  }
);

//api4

app.ger("/user/following/", authenticationToken, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const getUserId = await database.get(getUserIdQuery);

  const getFollowerIdsQuery = `select following_user_id from follower
    where follower_user_id = ${getUserId.user_id};`;
  const getFollowerIdsArray = await database.all(getFollowerIdsQuery);

  const getFollowerIds = getFollowerIdsArray.map((eachUser) => {
    return eachUser.following_user_id;
  });

  const getFollowersResultQuery = `select name from user where user_id in (${getFollowerIds});`;
  const responseResult = await database.all(getFollowersResultQuery);

  response.send(responseResult);
});

//api5 

api.get("/user/followers/", authenticationToken, async (request, response) => {
    let { username } = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await database.get(getUserIdQuery);

    const getFollowerIdsQuery = `select follower_user_id from follower where following_user_id = ${getUserId.user_id};`;
    const getFollowerIdsArray = await database.all(getFollowerIdsQuery);
    console.log(getFollowerIdsArray);
    const getFollowerIds = getFollowerIdsArray.map((eachUser) ={
        return eachUser.follower_user_id;
    });
    console.log(`${getFollowerIds}`);

    const getFollowersNameQuery = `select name from user where user_id in (${getFollowerIds});`;
    const getFollowersName = await database.all(getFollowersNameQuery);

    response.send(getFollowersName)
});
//api6
const api6Output = (tweetDate, likesCount, replyCount)=> {
    return {
        tweet: tweetDate.tweet,
        likes: likesCount,likes,
        replies: replyCount.replies,
        dateTime: tweetDate.date_time,
    };
};

app.get("/tweets/:tweetId/", authenticationToken, async (request, response) => {
    const {tweetId} = request.params;

    let {username} = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await database.get(getUserIdQuery);


    const getFollowingIdsQuery = `select following_user_id from follower where follower_user_id = ${getUserId.user_id;}`;
    const getFollowingIdsArray = await database.all(getFollowingIdsQuery)

    const getFollowingIds = getFollowingIdsArray.map((eachFollower) => {
        return eachFollower.following_user_id;
    });


    const getTweetIdsQuery = `select tweet_id fromm tweet where user_id in (${getFollowingIds});`;
    const getTweetIdsArray = await database.all(getTweetIdsQuery);
    const followingTweetIds = getTweetIdsArray.map((eachId) => {
        return eachId.tweet_id;
    });


    if(followingTestIds.includes(parseInt(testId))) {
        const likes_count_query = `select count(user_id) as likes from like where tweet_id = ${tweetId};`;
        const likes_count = await database.get(likes_count_query);
        
        const reply_count_query = `select count(user_id) as replies from reply where tweet_id = ${tweetId};`;
        const reply_count = await database.get(reply_count_query);

        const tweet_tweetDateQuery = `select tweet, date_time from tweet where tweet_id = ${tweetId};`;
        const tweet_tweetDate = await database.get(tweet_tweetDateQuery);

        response.send(api6Output(tweet_tweet_Date, likes_count, reply_count));
    }else{
        response.status(401);
        response.send("Invalid Request");
        console.log("Invalid Request");
    }
});

//api7

const convertLikedUserNameDBObjectToResponseObject = (dbObject) => {
    return {
        likes: dbObject,
    };
};

app.get(
    "/tweets/:tweetId/likes/",
    authenticationToken,
    async(request,response) => {
        const {tweetId} = request.params;
        let {username} = request;
        const getUserIdQuery = `select user_id from user where username = '${username}';`;
        const getUserId = await database.get(getUserIdQuery);

        const getFollowingIdsQuery = `select following_user_id from follower where follower_user_id = ${getUserId.user_id}`;
        const getFollowingIdsArray = await database.all(getFollowingIdsQuery);

        const getFollowingIds = getFollowingIdsArray.map((eachFollower) => {
            return eachFollower.following_user_id;
        });


        const getTweetIdsQuery = `select tweet_id from tweet where user_id in (${getFollowingIds});`;
        const getTweetIdsArray = await database.all(getTweetIdsQuery);
        const getTweetIds = getTweetIdsArray.map((eachTweet) => {
            return eachTweet.tweet_id;
        });


        if(getTweetIds.includes(parseInt(tweetId))) {
            const getLikedUsersNameQuery = `select user.username as likes from user inner join like 
            on user.user_id = like.user_id where like.tweet_id = ${tweetId};`;
            const getLikedUserNamesArray = await database.all(getLikedUsersNameQuery);

            const getLikedUserNames = getLikedUserNamesArray.map((eachUser) => {
                return eachUser.likes;
            });
            response.send(
                convertLikedUserNameDBObjectToResponseObject(getLikedUserNames)
            );
    }else{
        response.status(401);
        response.send("Invalid Request");
    }
}
);

//api 8 
const convertUserNameReplydbObjectToResponseObject = (dbObject) => {
    return {
        replies: dbObject,
    };
};
app.get(
    "/tweets/:tweetId/replies/",
    authenticationToken,
    async(request,response) => {
        
        const {tweetId} = request.params;
        console.log(tweetId);

        let {username} = request;
        const getUserIdQuery = `select user_id from user where username = '${username}';`;
        const getUserId = await database.get(getUserIdQuery);


        const getFollowingIdsQuery = `select following_user_id from follower where follower_user_id = ${getUserId.user_id}`;
        const getFollowingIdsArray = await database.all(getFollowingIdsQuery);

        const getFollowingIds = getFollowingIdsArray.map((eachFollower) => {
            return eachFollower.following_user_id;
        });
        console.log(getFollowingIds);

        const getTweetIdsQuery = `select tweet_id from tweet where user_id in (${getFollowingIds});`;
        const getTweetIdsArray = await database.all(getTweetIdsQuery);
        const getTweetIds = getTweetIdsArray.map((eachTweet) => {
            return eachTweet.tweet_id;
        });
        console.log(getTweetIds);


        if(getTweetIds.includes(parseInt(tweetId))) {

            const getUsernameReplyTweetsQuery = `select user.username, reply.reply  from user inner join reply
            on user.user_id = reply.user_id where reply.tweet_id = ${tweetId};`;
            const getUsernameReplyTweets = await database.all(getUsernameReplyTweetsQuery);            
            response.send(
               convertUserNameReplydbObjectToResponseObject(getUsernameReplyTweets)
            );
    }else{
        response.status(401);
        response.send("Invalid Request");
    }
}
);

//api9
app.get("/user/tweets", authenticationToken, async(request,response) => {
    let {username} = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await database.get(getUserIdQuery);
    console.log(getUserId);
    
    const getTweetIdsQuery = `select tweet_id from tweet where user_id = ${getUserId.user_id};`;
        const getTweetIdsArray = await database.all(getTweetIdsQuery);
        const getTweetIds = getTweetIdsArray.map((eachId) => {
            return parseInt(eachId.tweet_id);
        });
        console.log(getTweetIds);
});

//api 10

app.post("/user/tweets/", authenticationToken, async(request,response) => {
    let {username} = request;
    const getUserIdQuery = `select user_id from user where username = '${username}';`;
    const getUserId = await database.get(getUserIdQuery); 

    const {tweet} = request.body;
    
    
    const currentDate = new Date();
    console.log(currentDate.toISOString().replace("I"," "));

    const postRequestQuery = `insert into tweet(tweet,user_id, date_time) values ('${tweet}', ${getUserId.user_id}, ${currentDate};`;

    const responseResult = await database.run(postRequestQuery);
    const tweet_id = responseResult.lastID;
    response.send("Created a Tweet");
});

//api 11

app.delete(
    "/tweets/:tweetId/",
    authenticationToken,
    async(request,response) =>{
        const {tweetId} = request.params;

        let { username } = request;
        const getUserIdQuery = `select user_id from user where username = '${username}';`;
        const getUserId = await database.get(getUserIdQuery);
        
        const getUserTweetsListQuery = `select tweet_id from tweet where user_id = ${getUserId.user_id};`;
        const getUserTweetsListArray = await database.all(getUserTweetsListQuery);
        const getUserTweetsList = getUserTweetsListArray.map((eachTweetId) => {
            return eachTweetId.tweet_id;
        });
        console.log(getUserTweetsList);
        if (getUserTweetsList.includes(parseInt(tweetId))) {
            const deleteTweetQuery = `delete from tweet where tweet_id = ${tweetId};`;
            await database.run(deletedeleteTweetQuery);
            respond.send("Tweet Removed");
        }else{
            respond.status(401);
            respond.send("Invalid Request");
        }
    }
);
module.exports = app;