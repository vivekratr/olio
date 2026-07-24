import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { createAuthRoutes } from "./auth.routes.js";
import { AuthService } from "./auth.service.js";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export default createAuthRoutes(authController);
