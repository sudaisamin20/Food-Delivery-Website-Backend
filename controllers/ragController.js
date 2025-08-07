import { mongodbRAG } from "../services/mongodb_rag_js.js"

export const ragApiController = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Missing 'query' in request body." });
        }
        const response = await mongodbRAG(query);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}