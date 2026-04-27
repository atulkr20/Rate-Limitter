"use strict";
//  This file  creates the Express app and registers middleware and routes
// We keep this  separate from server.ts  to the app can be tested independently without actually starting a server
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const check_1 = __importDefault(require("./routes/check"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// health check endpoint 
app.get('/health', function (req, res) {
    res.status(200).json({
        status: "ok",
        service: "rate-limiter-service"
    });
});
// /check microservice endpoint 
// no rate limittig on this route this itself is the rate limitter
app.use("/", check_1.default);
// any route registered after this will be rate limited
exports.default = app;
