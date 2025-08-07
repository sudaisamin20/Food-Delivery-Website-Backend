import ownerModel from "../models/ownerModel.js"
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'

export const registerOwnerController = async (req, res) => {
    const { fullname, cnicno, phoneno, businessemail, password } = req.body

    try {
        const existingOwner = await ownerModel.findOne({ businessemail })
        if (existingOwner) {
            return res.status(400).json({ message: "Owner already exists", success: false })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const newOwner = new ownerModel({
            fullname,
            cnicno,
            phoneno,
            businessemail,
            password: hashedPassword,
        })

        await newOwner.save()

        const payload = {
            owner: {
                id: newOwner._id
            }
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY)
        res.status(201).json({
            id: newOwner._id,
            owner: {
                id: newOwner._id,
                fullname: newOwner.fullname,
                cnicno: newOwner.cnicno,
                phoneno: newOwner.phoneno,
                businessemail: newOwner.businessemail,
                role: newOwner.role
            }, token,
            message: "Partner Created Successfully",
            success: true
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error, message: "Something went wrong", success: false })
    }
}

export const loginOwnerController = async (req, res) => {
    try {
        const { cnicno, businessemail, password } = req.body
        if (!cnicno || !businessemail || !password) {
            return res.status(400).json({ message: "Please provide all required fields", success: false })
        }

        const existingOwner = await ownerModel.findOne({ businessemail, cnicno })
        if (!existingOwner) {
            return res.status(400).json({ message: "Invalid credentials", success: false })
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingOwner.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials", success: false })
        }

        const payload = {
            owner: {
                id: existingOwner._id
            }
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY)

        res.status(200).json({
            id: existingOwner._id,
            owner: {
                id: existingOwner._id,
                fullname: existingOwner.fullname,
                cnicno: existingOwner.cnicno,
                phoneno: existingOwner.phoneno,
                businessemail: existingOwner.businessemail,
                role: existingOwner.role,
                restaurantId: existingOwner.restaurantId
            },
            token,
            message: "Login Successful",
            success: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error, message: "Something went wrong", success: false })
    }
}


export const manageProfileController = async (req, res) => {
    const { fullname, cnicno, phoneno, businessemail } = req.body
    const { id } = req.params
    try {
        const owner = await ownerModel.findByIdAndUpdate(id, { fullname, cnicno, phoneno, businessemail }, { new: true })
        if (!owner) {
            return res.status(404).send({ success: false, message: "Owner not founded" })
        }
        return res.status(201).send({
            success: true,
            message: "Owner Info updated successfully",
            owner
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error, message: "Something went wrong", success: false })
    }
}

export const fetchOwnerController = async (req, res) => {
    try {
        const { id } = req.params
        const token = req.header("auth-token")
        const owner = await ownerModel.findById(id).select("-password")
        if (!owner) {
            return res.status(404).send({ success: false, message: "Owner not founded" })
        }
        return res.status(200).send({ success: true, message: "Owner Fetched", owner, token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error, message: "Something went wrong", success: false })
    }
}

export const fetchOwnerDataController = async (req, res) => {
    try {
        const { id } = req.params
        const owner = await ownerModel.findById(id).select("-password").populate("restaurantId")
        if (!owner) {
            return res.status(404).send({ success: false, message: "Owner not founded" })
        }
        return res.status(200).send({ success: true, message: "Owner Fetched", owner })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error, message: "Something went wrong", success: false })
    }
}