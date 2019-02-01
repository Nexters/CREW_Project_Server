"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const body_parser_1 = __importDefault(require("body-parser"));
const csurf_1 = __importDefault(require("csurf"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../../app");
const middleware_1 = require("../../middleware");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express_1.default.Router();
router.use(express_1.default.json());
router.use(body_parser_1.default.urlencoded({ extended: false }));
router.use(cookie_parser_1.default(process.env.SESSION_SECRET));
router.use(express_session_1.default({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
router.use(csurf_1.default());
router.use(middleware_1.insertReq);
router.use(middleware_1.insertToken);
router.use(connect_flash_1.default());
router.use(passport_1.default.initialize());
router.use(passport_1.default.session());
passport_1.default.serializeUser((user, done) => {
    done(null, `${user.member_provider}:${user.member_provider_number}`);
});
passport_1.default.deserializeUser((str, done) => __awaiter(this, void 0, void 0, function* () {
    const [member_provider, member_provider_number] = str.split(':');
    try {
        const user = yield app_1.db.User.find({ where: { member_provider, member_provider_number } });
        if (user) {
            done(null, user);
        }
    }
    catch (error) {
        console.error(error);
    }
}));
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => __awaiter(this, void 0, void 0, function* () {
    const avatar_url = profile.photos[0] ? profile.photos[0].value : null;
    try {
        const user = yield app_1.db.User.find({ where: { member_provider: 'google', member_provider_number: profile.id } });
        if (user) {
            done(null, user);
        }
        else {
            const newUser = yield app_1.db.User.create({
                member_provider: 'google',
                member_provider_number: profile.id,
                provide_image: avatar_url,
                token: accessToken
            });
            if (newUser) {
                done(null, newUser);
            }
        }
    }
    catch (error) {
        console.error(error);
        done(error);
    }
})));
router.get('/', (req, res) => {
    res.render('auth.pug');
});
router.get('/success', middleware_1.loginRequired, (req, res) => {
    const token = jsonwebtoken_1.default.sign({ 'id': req.user.id }, `${process.env.JWT_SECRET}`);
    res.render('success.pug', {
        token,
        'origin': process.env.TARGET_ORIGIN
    });
});
router.get('/google', passport_1.default.authenticate('google', { scope: ["profile", "email"] }));
router.get('/google/callback', (req, res, next) => {
    passport_1.default.authenticate('google', (err, user) => {
        if (err) {
            // 예상치 못한 예외 발생 시
            return next(err);
        }
        if (!user) {
            // 로그인 실패 시
            return res.redirect(req.baseUrl);
        }
        req.logIn(user, err => {
            // 예상치 못한 예외 발생 시
            if (err) {
                return next(err);
            }
            // 로그인 성공
            res.redirect(`${req.baseUrl}/success`);
        });
    })(req, res, next);
});
exports.default = router;
//# sourceMappingURL=index.js.map