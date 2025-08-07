import reportModel from "../models/reportModel.js"

export const submitReportController = async (req, res) => {
    const { item, reportReason, reportDescription, user, restaurant } = req.body
    try {
        if (!reportReason) {
            return res.send({ success: false, message: "Select a reason" })
        }
        const report = new reportModel({
            reason: reportReason,
            description: reportDescription,
            item,
            user,
            restaurant
        })
        await report.save()
        return res.status(201).send({ success: true, message: "Report submitted. We'll review the item and take appropriate action.", report })
    } catch (error) {
        res.status(500).send({ message: "Failed to submit report" });
    }
}

export const getReportsController = async (req, res) => {
    try {
        const reports = await reportModel.find({ restaurant: req.params.restaurantId }).populate("user restaurant item")
        if (reports.length === 0) {
            return res.send({ success: false, message: "No report founded" })
        }
        reports.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
        return res.status(200).send({ success: true, reports })
    } catch (error) {
        res.status(500).send({ message: "Failed to submit report" });
    }
}