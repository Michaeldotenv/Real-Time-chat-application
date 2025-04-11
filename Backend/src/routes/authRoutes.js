import express from "express"
import { Signin, Signout, Signup, updateProfile, checkAuth} from "../controllers/authcontrollers.js"
import protectRoute from "../middleware/protectUpdateRoute.js"
const router = express.Router()


router.get('/check-auth', protectRoute, checkAuth)

router.post('/signup', Signup)

router.post('/signin', Signin)
router.post('/signout', Signout)

router.put('/update-profile', protectRoute, updateProfile)
export default router;