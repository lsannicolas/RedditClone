"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createUpdootLoader_1 = require("./utils/createUpdootLoader");
const createUserLoader_1 = require("./utils/createUserLoader");
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const Updoot_1 = require("./entities/Updoot");
require("dotenv-safe/config");
var redis = require("redis");
const RedisStore = connect_redis_1.default(express_session_1.default);
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var cacheConnection = redis.createClient({
        url: "rediss://" + process.env.REDIS_URL + ":6380",
        password: process.env.REDIS_PASSWORD,
    });
    yield cacheConnection.connect();
    console.log(yield cacheConnection.ping());
    typeorm_1.createConnection({
        type: "postgres",
        url: process.env.DATABASE_URL,
        logging: true,
        synchronize: true,
        migrations: [__dirname + "/migrations/*.js"],
        entities: [Post_1.Post, User_1.User, Updoot_1.Updoot],
    });
    const app = express_1.default();
    console.log(process.env.CORS_ORIGIN);
    app.use(cors_1.default({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: "lax",
            secure: constants_1.__prod__,
            domain: constants_1.__prod__ ? ".lsannicolas.com" : undefined,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: createUserLoader_1.createUserLoader(),
            updootLoader: createUpdootLoader_1.createUpdootLoader(),
        }),
    });
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });
    app.listen(process.env.PORT, () => {
        console.log("server started on localhost:5000");
    });
});
main().catch((err) => {
    console.log(err);
});
//# sourceMappingURL=index.js.map