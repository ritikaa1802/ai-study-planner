import express from "express"
import { protect } from "../middleware/protect"
import { isAdmin } from "../middleware/admin"

const router = express.Router()

router.get(
  "/dashboard",
  protect,
  isAdmin,
  (req, res) => {
    res.json({ message: "Welcome Admin" })
  }
)

export default router